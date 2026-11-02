import { addrKey } from './reorg';
import { nameFromPath, partitionForPath } from './ns4b';
import { enumerateFiles } from './transfer';
import type { NordSession } from './session';
import { indexBackup, type BackupRef } from '../clavia/backup/backup-index';
import { extractZipEntry, type ZipEntry } from '../clavia/backup/zip-directory';
import { readCbinHeader, hasCbinMagic } from '../clavia/cbin';
import { LIBRARY_PARTITION } from './library-file';
import { planLibraryRestore, readBackupLibraryFile, type BackupLibraryFile } from './library-restore';
import { libraryWritesNow, type LibraryKind } from './write-guard';

/** Why a restore leaves a library's files out: its writes are off, or it isn't confirmed writable on this keyboard. */
export type LibraryLeftOutWhy = 'not-yet-tried' | 'stage4-only' | 'read-only';

/** Each {@link LibraryLeftOutWhy} in a musician's words, after "won't be restored: ". */
export const LEFT_OUT_REASON: Readonly<Record<LibraryLeftOutWhy, string>> = {
  'not-yet-tried': 'not yet tried on a Nord',
  'stage4-only': 'restoring them works with a Nord Stage 4 for now',
  'read-only': 'OpenNord couldn’t confirm where this keyboard keeps them',
};

/**
 * Why a restore leaves `kind` out on this keyboard, or null when it writes it: its
 * gate (`writesOn`) is off, else its library isn't confirmed writable here. The one
 * rule the restore, its preview and the Restore panel all follow.
 */
export function libraryLeftOutWhy(
  session: Pick<NordSession, 'canWrite' | 'stage4Layout'>, kind: LibraryKind, writesOn: boolean,
): LibraryLeftOutWhy | null {
  if (!writesOn) return 'not-yet-tried';
  if (!session.stage4Layout) return 'stage4-only'; // the library writer is tried on a Stage 4 only, as Send (STAGE4_ONLY)
  return session.canWrite(LIBRARY_PARTITION[kind]) ? null : 'read-only';
}

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
  /** Whether this restore writes the backup's samples / pianos (their hardware gate, on a library confirmed writable here). */
  writesSamples: boolean;
  writesPianos: boolean;
  /** Why a kind isn't written (as the restore's `leftOut` will say); null when it is. */
  leftOutWhy: Record<LibraryKind, LibraryLeftOutWhy | null>;
  /** Samples / pianos on the Nord that the restore removes or replaces (by name). */
  removesSamples: number;
  removesPianos: number;
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
      out.push({ bank: h.bank, slot: h.location, name: nameFromPath(entry.path) });
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

/**
 * Full restore impact: device programs vs the backup's, plus content counts and, for
 * the samples and pianos the restore writes, how many on the Nord it removes or
 * replaces (by name, as the restore plans them). A library with a backup file the
 * restore would refuse or can't read is left untouched by the restore, so it counts 0;
 * so does one the restore leaves out (gate off, or not `session.canWrite`).
 */
export async function analyzeRestore(
  session: NordSession,
  file: File,
  writes: Record<LibraryKind, boolean> = libraryWritesNow(),
): Promise<RestoreImpact> {
  const contents = await indexBackup(file, file.name);
  const backup = await programSlotsFrom(file, contents.programs);
  const device = (await session.withSession(session.programPartition, () => enumerateFiles(session)))
    .map((e) => ({ bank: e.bank, slot: e.slot, name: e.name }));
  const leftOutWhy = {
    sample: libraryLeftOutWhy(session, 'sample', writes.sample),
    piano: libraryLeftOutWhy(session, 'piano', writes.piano),
  };
  const removals = async (kind: LibraryKind, refs: BackupRef[]): Promise<number> => {
    const partition = LIBRARY_PARTITION[kind];
    const mine = refs.filter((r) => partitionForPath(r.entry.path) === partition);
    if (leftOutWhy[kind] !== null || mine.length === 0) return 0;
    const files: BackupLibraryFile[] = [];
    for (const r of mine) {
      try {
        const f = await readBackupLibraryFile(file, r.entry.path, r.entry, kind);
        if (f.refusal !== undefined) return 0;
        files.push(f);
      } catch {
        return 0;
      }
    }
    const onNord = await session.withSession(partition, () => enumerateFiles(session));
    return planLibraryRestore(onNord, files).remove.length;
  };
  return {
    ...diffPrograms(device, backup),
    pianos: contents.pianos.length,
    samples: contents.samples.length,
    presets: contents.presets.length,
    writesSamples: leftOutWhy.sample === null,
    writesPianos: leftOutWhy.piano === null,
    leftOutWhy,
    removesSamples: await removals('sample', contents.samples),
    removesPianos: await removals('piano', contents.pianos),
    estimated: true,
  };
}
