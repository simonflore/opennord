import { addrKey } from './reorg';
import { enumerateFiles } from './transfer';
import type { NordSession } from './session';
import { indexBackup } from '../clavia/backup/backup-index';
import { extractZipEntry, type ZipEntry } from '../clavia/backup/zip-directory';
import { readCbinHeader, hasCbinMagic } from '../clavia/cbin';

/** One program's identity for the restore diff: where it lives + its name. */
export interface ProgramSlot { bank: number; slot: number; name: string }

export interface RestoreDiff {
  /** Device slot occupied; the backup writes a DIFFERENT program → its MIDI Program Change target shifts. */
  changed: number;
  /** Device slot empty; the backup writes a program into it. */
  added: number;
  /** The same program name is already at that slot. */
  unchanged: number;
  /** Device programs in slots the backup does NOT write — restore leaves them in place. */
  untouched: number;
}

export interface RestoreImpact extends RestoreDiff {
  pianos: number;
  samples: number;
  presets: number;
  /** Identity is by program name, not bytes — the summary is an estimate. */
  estimated: true;
}

/** Compare the device's current programs against what a backup would write, by
 *  name at each {bank,slot}. Pure. See the plan's Global Constraints for why
 *  identity is name-based (size/bytes are unreliable / impractical here). */
export function diffPrograms(device: ProgramSlot[], backup: ProgramSlot[]): RestoreDiff {
  const deviceBySlot = new Map(device.map((d) => [addrKey(d), d]));
  const backupKeys = new Set(backup.map((b) => addrKey(b)));
  let changed = 0, added = 0, unchanged = 0;
  for (const b of backup) {
    const d = deviceBySlot.get(addrKey(b));
    if (!d) added++;
    else if (d.name === b.name) unchanged++;
    else changed++;
  }
  const untouched = device.filter((d) => !backupKeys.has(addrKey(d))).length;
  return { changed, added, unchanged, untouched };
}

const basename = (path: string) => path.replace(/^.*\//, '').replace(/\.[^.]+$/, '');

/** Resolve each backup program ZipEntry to its {bank, slot, name}. Decompresses
 *  only the (small) program files; reads {bank, location} from the CBIN header,
 *  name from the entry path (as restore() names them). Unreadable files are skipped. */
async function programSlotsFrom(file: Blob, programs: ZipEntry[]): Promise<ProgramSlot[]> {
  const out: ProgramSlot[] = [];
  for (const entry of programs) {
    try {
      const bytes = await extractZipEntry(file, entry);
      if (!hasCbinMagic(bytes)) continue;
      const h = readCbinHeader(bytes);
      out.push({ bank: h.bank, slot: h.location, name: basename(entry.path) });
    } catch {
      // skip a program file we can't read — best-effort estimate
    }
  }
  return out;
}

/** The backup's program slots, read seekably (central directory + per-program
 *  extract). Multi-GB-safe: only program files are decompressed. */
export async function listBackupProgramSlots(file: Blob, bundlePath = 'backup'): Promise<ProgramSlot[]> {
  const contents = await indexBackup(file, bundlePath);
  return programSlotsFrom(file, contents.programs);
}

/** Full restore impact: device programs vs the backup's, plus content counts. */
export async function analyzeRestore(session: NordSession, file: File): Promise<RestoreImpact> {
  const contents = await indexBackup(file, file.name);
  const backup = await programSlotsFrom(file, contents.programs);
  const device = (await session.withSession(session.programPartition, () => enumerateFiles(session)))
    .map((e) => ({ bank: e.bank, slot: e.slot, name: e.name }));
  return {
    ...diffPrograms(device, backup),
    pianos: contents.pianos.length,
    samples: contents.samples.length,
    presets: contents.presets.length,
    estimated: true,
  };
}
