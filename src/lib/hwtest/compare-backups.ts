/**
 * Compare two `.ns4b` backups entry by entry (hardware session W6): the same bytes,
 * the same sound at another place (the record matches, the header doesn't), changed,
 * or in one only. Ranged reads: an entry is read only when its size or CRC differ.
 * Node-safe (Blob + fflate only): the hw:compare-backups script runs it.
 */
import { extractZipEntry, readZipDirectory, type ZipEntry } from '../clavia/backup/zip-directory';
import { cbinRecord, hasCbinMagic } from '../clavia/cbin';

export interface BackupComparison { same: number; moved: string[]; changed: string[]; onlyInFirst: string[]; onlyInSecond: string[] }

const isFile = (e: ZipEntry) => e.path !== 'meta.xml' && !e.path.endsWith('/');
const equal = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

export async function compareBackups(first: Blob, second: Blob): Promise<BackupComparison> {
  const [a, b] = await Promise.all([readZipDirectory(first), readZipDirectory(second)]);
  const inSecond = new Map(b.filter(isFile).map((e) => [e.path, e] as const));
  const out: BackupComparison = { same: 0, moved: [], changed: [], onlyInFirst: [], onlyInSecond: [] };
  for (const ea of a.filter(isFile)) {
    const eb = inSecond.get(ea.path);
    inSecond.delete(ea.path);
    if (!eb) { out.onlyInFirst.push(ea.path); continue; }
    if (ea.size === eb.size && ea.crc32 !== undefined && ea.crc32 === eb.crc32) { out.same++; continue; }
    const [xa, xb] = await Promise.all([extractZipEntry(first, ea), extractZipEntry(second, eb)]);
    if (equal(xa, xb)) out.same++;
    else if (hasCbinMagic(xa) && hasCbinMagic(xb) && equal(cbinRecord(xa), cbinRecord(xb))) out.moved.push(ea.path);
    else out.changed.push(ea.path);
  }
  out.onlyInSecond = [...inSecond.keys()];
  return out;
}
