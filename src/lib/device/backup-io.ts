import { zipSync, unzipSync } from 'fflate';
import { hasCbinMagic, readCbinHeader } from '../clavia/cbin';
import { patchNs4Checksum } from '../clavia/checksum';
import { USER_PARTITIONS, backupPath, partitionForPath, type PartitionSpec } from './ns4b';
import { PARTITION_PROGRAM } from './opcodes';
import type { ProgramEntry } from './transfer';
import type { DeviceIO } from './device-io';
import type { Addr } from './reorg';

const PROGRAM_SPEC: PartitionSpec = USER_PARTITIONS.find((s) => s.partition === PARTITION_PROGRAM)!;
const key = (a: Addr) => `${a.bank}:${a.slot}`;

interface ProgramFile {
  addr: Addr;
  name: string;
  bytes: Uint8Array;
  categoryId: number;
  version: number;
  fourcc: string;
}

export interface BackupModel {
  /** meta.xml + every non-program entry, kept verbatim for lossless re-export. */
  passthrough: Map<string, Uint8Array>;
  /** Editable Program-partition files, keyed by `${bank}:${slot}`. */
  programs: Map<string, ProgramFile>;
}

const toEntry = (p: ProgramFile): ProgramEntry => ({
  bank: p.addr.bank, slot: p.addr.slot, name: p.name,
  categoryId: p.categoryId, version: p.version, sizeBytes: p.bytes.length - 44, fourcc: p.fourcc,
});

/** Parse a .ns4b into an in-memory model. Throws if it isn't a Nord backup. */
export function loadBackup(zipBytes: Uint8Array): BackupModel {
  const unzipped = unzipSync(zipBytes);
  if (!unzipped['meta.xml']) throw new Error('Not a Nord backup (no meta.xml).');
  const passthrough = new Map<string, Uint8Array>();
  const programs = new Map<string, ProgramFile>();
  for (const [path, bytes] of Object.entries(unzipped)) {
    if (path !== 'meta.xml' && partitionForPath(path) === PARTITION_PROGRAM && hasCbinMagic(bytes)) {
      const h = readCbinHeader(bytes);
      const addr = { bank: h.bank, slot: h.location };
      const name = path.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
      programs.set(key(addr), { addr, name, bytes, categoryId: h.category, version: h.versionRaw, fourcc: h.tag });
    } else {
      passthrough.set(path, bytes);
    }
  }
  return { passthrough, programs };
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
  for (const p of model.programs.values()) {
    let path = backupPath(PROGRAM_SPEC, p.addr.bank, p.name);
    if (used.has(path)) path = backupPath(PROGRAM_SPEC, p.addr.bank, `${p.name} (slot ${p.addr.slot})`);
    used.add(path);
    out[path] = p.bytes;
  }
  return zipSync(out, { level: 0 });
}
