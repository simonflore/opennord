import { enumerateFiles, pullFile, type ProgramEntry } from './transfer';
import type { NordSession } from './session';
import type { ModelInfo } from '../clavia/partitions';
import type { PresetKind } from '../clavia/preset-kind';

const PRESET_KINDS: PresetKind[] = ['organ-preset', 'piano-preset', 'synth-preset'];

export interface PresetGroup { kind: PresetKind; partition: number; entries: ProgramEntry[] }

/** Enumerate every preset partition the model defines (by registry index), tagging
 *  each group's kind+partition. Best-effort: a partition that fails (older firmware,
 *  absent) is skipped, not thrown. Recognition only — names/slots, no byte pull. */
export async function enumeratePresets(session: NordSession, model: ModelInfo): Promise<PresetGroup[]> {
  const targets = model.partitions
    .filter((p): p is typeof p & { index: number } =>
      typeof p.index === 'number' && PRESET_KINDS.includes(p.kind as PresetKind));
  const groups: PresetGroup[] = [];
  for (const p of targets) {
    try {
      const entries = await session.withSession(p.index, () => enumerateFiles(session));
      if (entries.length) groups.push({ kind: p.kind as PresetKind, partition: p.index, entries });
    } catch { /* partition absent/unsupported — skip */ }
  }
  return groups;
}

/** Pull one preset off the board (full CBIN bytes), scoped to its partition. */
export function pullPreset(session: NordSession, entry: ProgramEntry, partition: number): Promise<Uint8Array> {
  return session.withSession(partition, () => pullFile(session, entry));
}
