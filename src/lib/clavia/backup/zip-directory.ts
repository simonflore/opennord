import { inflateSync } from 'fflate';

/** One entry from a zip's central directory — located, not yet read. */
export interface ZipEntry {
  path: string;
  size: number;            // uncompressed
  compressedSize: number;
  offset: number;          // local-header offset from file start
  method: number;          // 0 = stored, 8 = deflate
}

const EOCD_SIG = 0x06054b50;
const EOCD64_LOC_SIG = 0x07064b50;
const EOCD64_SIG = 0x06064b50;
const CD_SIG = 0x02014b50;
const U32 = 0xffffffff;

const dv = (u: Uint8Array) => new DataView(u.buffer, u.byteOffset, u.byteLength);
async function slice(file: Blob, start: number, end: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(start, end).arrayBuffer());
}

/**
 * List a zip's entries from its central directory — one tail read, no file data.
 * Handles ZIP64 (offsets/sizes ≥ 4 GiB), which a full Nord backup can hit.
 */
export async function readZipDirectory(file: Blob): Promise<ZipEntry[]> {
  // EOCD is in the last 22 + comment bytes; scan the tail for its signature.
  const tailLen = Math.min(file.size, 65557);
  const tail = await slice(file, file.size - tailLen, file.size);
  const t = dv(tail);
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (t.getUint32(i, true) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a zip (no end-of-central-directory record).');

  let cdOffset = t.getUint32(eocd + 16, true);
  let cdCount = t.getUint16(eocd + 10, true);

  // ZIP64: when the 32-bit fields are saturated, read the ZIP64 EOCD locator + record.
  if (cdOffset === U32 || cdCount === 0xffff) {
    const locAt = eocd - 20;
    if (locAt < 0 || t.getUint32(locAt, true) !== EOCD64_LOC_SIG) {
      throw new Error('Backup needs ZIP64 but the locator is missing.');
    }
    const z64Off = Number(t.getBigUint64(locAt + 8, true));
    const z64 = dv(await slice(file, z64Off, z64Off + 56));
    if (z64.byteLength < 56 || z64.getUint32(0, true) !== EOCD64_SIG) throw new Error('Bad ZIP64 end record.');
    cdCount = Number(z64.getBigUint64(32, true));
    cdOffset = Number(z64.getBigUint64(48, true));
  }

  // Read the whole central directory (small: names + headers, not file data).
  const cd = await slice(file, cdOffset, file.size);
  const c = dv(cd);
  const entries: ZipEntry[] = [];
  const truncated = new Error('Corrupt or truncated zip central directory.');
  let p = 0;
  for (let i = 0; i < cdCount; i++) {
    // Record head (46 bytes) and, once its lengths are known, the whole record
    // must fit — cdCount and the length fields come from the (possibly clipped
    // or corrupted) file, so never trust them past the directory's end.
    if (p + 46 > cd.length) throw truncated;
    if (c.getUint32(p, true) !== CD_SIG) break;
    const method = c.getUint16(p + 10, true);
    let compressedSize = c.getUint32(p + 20, true);
    let size = c.getUint32(p + 24, true);
    const nameLen = c.getUint16(p + 28, true);
    const extraLen = c.getUint16(p + 30, true);
    const commentLen = c.getUint16(p + 32, true);
    if (p + 46 + nameLen + extraLen + commentLen > cd.length) throw truncated;
    let offset = c.getUint32(p + 42, true);
    const path = new TextDecoder().decode(cd.subarray(p + 46, p + 46 + nameLen));

    // ZIP64 extra field (0x0001): override whichever 32-bit fields are saturated.
    if (size === U32 || compressedSize === U32 || offset === U32) {
      let ep = p + 46 + nameLen;
      const extraEnd = ep + extraLen;
      while (ep < extraEnd) {
        const id = c.getUint16(ep, true);
        const len = c.getUint16(ep + 2, true);
        let q = ep + 4;
        if (id === 0x0001) {
          if (size === U32) { size = Number(c.getBigUint64(q, true)); q += 8; }
          if (compressedSize === U32) { compressedSize = Number(c.getBigUint64(q, true)); q += 8; }
          if (offset === U32) { offset = Number(c.getBigUint64(q, true)); q += 8; }
        }
        ep += 4 + len;
      }
    }

    entries.push({ path, size, compressedSize, offset, method });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** Read + decompress a single entry: seek its local header, slice the data, inflate/copy. */
export async function extractZipEntry(file: Blob, entry: ZipEntry): Promise<Uint8Array> {
  // Local header is 30 bytes + name + extra; its name/extra lengths can differ from the CD.
  // A short slice means the CD's offset points past EOF (corrupted directory).
  const lh = dv(await slice(file, entry.offset, entry.offset + 30));
  if (lh.byteLength < 30 || lh.getUint32(0, true) !== 0x04034b50) throw new Error(`Bad local header for ${entry.path}.`);
  const nameLen = lh.getUint16(26, true);
  const extraLen = lh.getUint16(28, true);
  const dataStart = entry.offset + 30 + nameLen + extraLen;
  const comp = await slice(file, dataStart, dataStart + entry.compressedSize);
  if (entry.method === 0) return comp;             // stored
  if (entry.method === 8) return inflateSync(comp); // deflate (raw)
  throw new Error(`Unsupported zip method ${entry.method} for ${entry.path}.`);
}

/**
 * Read only the first `n` decompressed bytes of an entry — cheap origin/header
 * probes without pulling the whole (possibly multi-MB) file. For STORED entries
 * it slices just `n` bytes off disk; for DEFLATE it must inflate the entry (no
 * cheap partial inflate) then take the head. Backups are stored, so this stays
 * a tiny ranged read in practice.
 */
export async function extractZipEntryHead(file: Blob, entry: ZipEntry, n: number): Promise<Uint8Array> {
  const lh = dv(await slice(file, entry.offset, entry.offset + 30));
  if (lh.byteLength < 30 || lh.getUint32(0, true) !== 0x04034b50) throw new Error(`Bad local header for ${entry.path}.`);
  const dataStart = entry.offset + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
  if (entry.method === 0) return slice(file, dataStart, dataStart + Math.min(n, entry.compressedSize));
  if (entry.method === 8) return inflateSync(await slice(file, dataStart, dataStart + entry.compressedSize)).subarray(0, n);
  throw new Error(`Unsupported zip method ${entry.method} for ${entry.path}.`);
}
