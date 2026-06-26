import { zipSync, unzipSync, Zip, ZipPassThrough } from 'fflate';
import { hasCbinMagic, readCbinHeader } from '../clavia/cbin';
import { patchNs4Checksum } from '../clavia/checksum';
import { streamUnzip } from '../folder/unzip-stream';
import { USER_PARTITIONS, disambiguatePath, partitionForPath, type PartitionSpec } from './ns4b';
import { PARTITION_PROGRAM } from './opcodes';
import type { ProgramEntry } from './transfer';
import type { DeviceIO } from './device-io';
import { addrKey as key, type Addr } from './reorg';

const PROGRAM_SPEC: PartitionSpec = USER_PARTITIONS.find((s) => s.partition === PARTITION_PROGRAM)!;

/** Something a streamed-in backup can be re-read from (a `File` satisfies this). */
export interface BackupSource {
  stream(): ReadableStream<Uint8Array>;
}

interface ProgramFile {
  addr: Addr;
  name: string;
  bytes: Uint8Array;
  categoryId: number;
  version: number;
  fourcc: string;
}

export interface BackupModel {
  /** Non-program entries kept verbatim for lossless re-export. Populated by the in-memory
   *  {@link loadBackup}; left empty by {@link loadBackupStreaming}, which re-reads them from
   *  `source` at export time instead of holding multi-GB samples in RAM. */
  passthrough: Map<string, Uint8Array>;
  /** Editable Program-partition files, keyed by `${bank}:${slot}`. */
  programs: Map<string, ProgramFile>;
  /** When present (streamed load), the original archive — re-streamed by {@link streamBackupTo}. */
  source?: BackupSource;
}

const toEntry = (p: ProgramFile): ProgramEntry => ({
  bank: p.addr.bank, slot: p.addr.slot, name: p.name,
  categoryId: p.categoryId, version: p.version, sizeBytes: p.bytes.length - 44, fourcc: p.fourcc,
});

/** True for a zip path that holds an editable Program-partition file (not meta.xml, not a preset). */
const isProgramEntry = (path: string) => path !== 'meta.xml' && partitionForPath(path) === PARTITION_PROGRAM;

/** Decode one Program entry into a ProgramFile, or null if the path/bytes aren't an editable program. */
function toProgramFile(path: string, bytes: Uint8Array): ProgramFile | null {
  if (!isProgramEntry(path) || !hasCbinMagic(bytes)) return null;
  const h = readCbinHeader(bytes);
  const name = path.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
  return { addr: { bank: h.bank, slot: h.location }, name, bytes, categoryId: h.category, version: h.versionRaw, fourcc: h.tag };
}

/** Parse a .ns4b into an in-memory model. Throws if it isn't a Nord backup. */
export function loadBackup(zipBytes: Uint8Array): BackupModel {
  const unzipped = unzipSync(zipBytes);
  if (!unzipped['meta.xml']) throw new Error('Not a Nord backup (no meta.xml).');
  const passthrough = new Map<string, Uint8Array>();
  const programs = new Map<string, ProgramFile>();
  for (const [path, bytes] of Object.entries(unzipped)) {
    const prog = toProgramFile(path, bytes);
    if (prog) programs.set(key(prog.addr), prog);
    else passthrough.set(path, bytes);
  }
  return { passthrough, programs };
}

/**
 * Parse a .ns4b by *streaming* it — only the (tiny) Program entries are decompressed and kept;
 * the multi-GB Piano/Sample passthrough is skipped on load and re-streamed from `source` at
 * export ({@link streamBackupTo}). This is the path for real full-device backups, which exceed
 * the browser's ~2 GiB single-`ArrayBuffer` ceiling that {@link loadBackup} would hit.
 */
export async function loadBackupStreaming(source: BackupSource): Promise<BackupModel> {
  const programs = new Map<string, ProgramFile>();
  let sawMeta = false;
  await streamUnzip(
    source.stream(),
    (entry) => {
      if (entry.path === 'meta.xml') { sawMeta = true; return; }
      const prog = toProgramFile(entry.path, entry.bytes);
      if (prog) programs.set(key(prog.addr), prog);
    },
    (path) => path === 'meta.xml' || isProgramEntry(path), // skip everything else undecompressed
  );
  if (!sawMeta) throw new Error('Not a Nord backup (no meta.xml).');
  return { passthrough: new Map(), programs, source };
}

/**
 * The final Program entries to write: each program's regenerated `<Folder>/Bank/<name>` path and
 * bytes, disambiguating only genuine same-bank-same-name duplicates. `used` is seeded with any
 * paths already claimed (passthrough), and mutated as paths are taken. Shared by both serializers.
 */
function* finalProgramFiles(model: BackupModel, used: Set<string>): Generator<[string, Uint8Array]> {
  for (const p of model.programs.values()) {
    const path = disambiguatePath(PROGRAM_SPEC, p.addr.bank, p.name, p.addr.slot, (pp) => used.has(pp));
    used.add(path);
    yield [path, p.bytes];
  }
}

export function listPrograms(model: BackupModel): ProgramEntry[] {
  return [...model.programs.values()].map(toEntry);
}

/** Patch a file's CBIN slot bytes (bank@0x0c, location@0x0e) to `addr`, then re-seal the checksum. */
function reslot(file: Uint8Array, addr: Addr): Uint8Array {
  const patched = file.slice();
  patched[0x0c] = addr.bank & 0xff;
  patched[0x0e] = addr.slot & 0xff;
  return patchNs4Checksum(patched);
}

/** A DeviceIO backed by an in-memory backup model. Moves rewrite the CBIN header slot. */
export function backupDeviceIO(model: BackupModel): DeviceIO {
  return {
    async pull(_partition, entry) {
      const p = model.programs.get(key({ bank: entry.bank, slot: entry.slot }));
      if (!p) throw new Error(`no program at ${key({ bank: entry.bank, slot: entry.slot })} in backup`);
      return p.bytes;
    },
    async info(_partition, addr) {
      const p = model.programs.get(key(addr));
      return p ? toEntry(p) : null;
    },
    async push(_partition, addr, file, name) {
      const bytes = reslot(file, addr);
      const h = readCbinHeader(bytes);
      model.programs.set(key(addr), { addr, name, bytes, categoryId: h.category, version: h.versionRaw, fourcc: h.tag });
    },
    async delete(_partition, addr) {
      if (!model.programs.has(key(addr))) throw new Error(`no program at ${key(addr)} to delete`);
      model.programs.delete(key(addr));
    },
  };
}

/** Re-zip the (possibly edited) model into a downloadable .ns4b. Program paths are regenerated
 *  from the final {bank,name}, disambiguating only genuine same-bank-same-name duplicates. */
export function serializeBackup(model: BackupModel): Uint8Array {
  const out: Record<string, Uint8Array> = {};
  for (const [path, bytes] of model.passthrough) out[path] = bytes;
  const used = new Set(Object.keys(out));
  for (const [path, bytes] of finalProgramFiles(model, used)) out[path] = bytes;
  return zipSync(out, { level: 0 });
}

/**
 * Re-export a streamed-in backup to `writable` without ever holding it whole: every non-program
 * entry is copied through from `model.source` verbatim (stored, lossless), and the edited Program
 * set is appended with regenerated paths. Peak memory is a single entry, so a 3 GB backup
 * re-zips straight to disk. Requires a model from {@link loadBackupStreaming} (has `source`).
 */
export async function streamBackupTo(model: BackupModel, writable: WritableStream<Uint8Array>): Promise<void> {
  if (!model.source) throw new Error('streamBackupTo requires a streamed-in backup (model.source).');
  const writer = writable.getWriter();
  const pending: Uint8Array[] = []; // zip output produced (synchronously) by the current entry
  const zip = new Zip((err, chunk) => { if (!err && chunk.length) pending.push(chunk); });

  const drain = async () => { for (const c of pending.splice(0)) { await writer.ready; await writer.write(c); } };
  const addStored = async (path: string, bytes: Uint8Array) => {
    const file = new ZipPassThrough(path); // stored: no recompression, byte-for-byte
    zip.add(file);
    file.push(bytes, true);
    await drain();
  };

  try {
    // 1) carry every non-program entry through untouched (meta.xml, presets, samples)
    await streamUnzip(model.source.stream(), (e) => addStored(e.path, e.bytes), (p) => !isProgramEntry(p));
    // 2) append the edited program set; Program/ never collides with the passthrough folders
    const used = new Set<string>();
    for (const [path, bytes] of finalProgramFiles(model, used)) await addStored(path, bytes);
    zip.end();
    await drain();
    await writer.close();
  } catch (e) {
    await writer.abort(e).catch(() => {});
    throw e;
  }
}
