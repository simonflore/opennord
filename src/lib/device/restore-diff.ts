import { addrKey } from './reorg';

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
