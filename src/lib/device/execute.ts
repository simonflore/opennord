import type { DeviceIO } from './device-io';
import { addrKey, type Addr, type Occupancy, type Plan } from './reorg';
import { getErrorMessage } from '../errors';
import { WRITE_BLOCKED_MESSAGE } from './write-guard';

export interface ExecProgress { opIndex: number; opCount: number; phase: 'copy' | 'delete' | 'rollback' }
/** A file a failed plan displaced and the rollback could not put back on the device. */
export interface UnrestoredFile { addr: Addr; name: string; ext: string; file: Uint8Array }
export interface ExecResult {
  ok: boolean;
  completedOps: number;
  /** True only when every journaled slot is back as it was. */
  rolledBack: boolean;
  /** True when a failed plan left the device as it found it: refused or stopped
   *  before the first write, or rolled back in full. */
  deviceUnchanged?: boolean;
  warnings: string[];
  /** Set when the rollback itself failed: what was in those slots, for the caller to save. */
  unrestored?: UnrestoredFile[];
}

interface JournalEntry { addr: Addr; before: { file: Uint8Array; name: string; ext: string } | null }

const CBIN_HEADER = 44;

/** Byte-compare two full CBIN files past the header. */
function bodiesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = CBIN_HEADER; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** Execute a plan with per-plan journal rollback and verify-before-delete. */
export async function executePlan(
  io: DeviceIO,
  partition: number,
  plan: Plan,
  occ: Occupancy,
  opts: { onProgress?: (p: ExecProgress) => void; signal?: AbortSignal } = {},
): Promise<ExecResult> {
  const { onProgress, signal } = opts;

  // 0. Refuse up front on an unconfirmed partition — before journaling, so there
  //    is nothing to roll back (the writes themselves are also gated in pushFile).
  if (io.canWrite?.(partition) === false) {
    return { ok: false, completedOps: 0, rolledBack: false, deviceUnchanged: true, warnings: [WRITE_BLOCKED_MESSAGE] };
  }

  // 1. Journal the affected slots up front (before any mutation).
  const journal: JournalEntry[] = [];
  try {
    for (const addr of plan.journalSlots) {
      const src = occ.get(addrKey(addr));
      journal.push(src ? { addr, before: { file: await io.pull(partition, src), name: src.name, ext: src.fourcc } } : { addr, before: null });
    }
  } catch (e) {
    return { ok: false, completedOps: 0, rolledBack: false, deviceUnchanged: true, warnings: [`Could not read the slots before moving: ${getErrorMessage(e)}`] };
  }

  // 2. Run ops in order, each copy verified. Any failure → rollback.
  //    The Nord keeps one file per name and never overwrites
  //, so a program cannot be copied while its source
  //    still exists: the slot holding that name, and whatever is in the target,
  //    are cleared before the write. Between the two the program lives only in
  //    the journal, which is why a failed rollback hands back `unrestored`.
  let completed = 0;
  // Slots a write was sent to (it may have landed even when it reported failure).
  // Only these are put back: a slot nothing wrote to is still as it was.
  const touched = new Set<string>();
  // Journaled slots that still hold the file they started with.
  const original = new Map(journal.filter((j) => j.before).map((j) => [addrKey(j.addr), j]));
  const clear = async (addr: Addr) => {
    touched.add(addrKey(addr));
    await io.delete(partition, addr);
    original.delete(addrKey(addr));
  };
  try {
    for (let i = 0; i < plan.ops.length; i++) {
      if (signal?.aborted) throw new Error('cancelled');
      const op = plan.ops[i];
      if (op.kind === 'copy') {
        onProgress?.({ opIndex: i, opCount: plan.ops.length, phase: 'copy' });
        const j = journal.find((x) => addrKey(x.addr) === addrKey(op.from));
        if (!j?.before) throw new Error('source bytes were not journaled');
        if (signal?.aborted) throw new Error('cancelled');
        for (const [key, o] of [...original]) {
          if (key === addrKey(op.to) || o.before?.name === j.before.name) await clear(o.addr);
        }
        touched.add(addrKey(op.to));
        await io.push(partition, op.to, j.before.file, j.before.name);
        const landed = await io.info(partition, op.to);
        if (!landed || landed.sizeBytes !== j.before.file.length - 44) {
          throw new Error(`copy to ${addrKey(op.to)} did not verify`);
        }
        // Size alone would pass a same-size corruption — and a move then deletes
        // the good source. Re-pull and compare the body (the CBIN header carries
        // the new bank/slot, so only bytes past it are copy-invariant).
        const landedBytes = await io.pull(partition, landed);
        if (!bodiesEqual(landedBytes, j.before.file)) {
          throw new Error(`copy to ${addrKey(op.to)} did not verify (content mismatch)`);
        }
      } else {
        onProgress?.({ opIndex: i, opCount: plan.ops.length, phase: 'delete' });
        if (signal?.aborted) throw new Error('cancelled');
        // Already gone when it was the source of a copy above.
        if (original.has(addrKey(op.at))) await clear(op.at);
        else if (await io.info(partition, op.at)) { touched.add(addrKey(op.at)); await io.delete(partition, op.at); }
      }
      completed++;
    }
    return { ok: true, completedOps: completed, rolledBack: false, warnings: [] };
  } catch (e) {
    const { warnings, unrestored } = await rollback(io, partition, journal.filter((j) => touched.has(addrKey(j.addr))), onProgress);
    const rolledBack = warnings.length === 0;
    return {
      ok: false, completedOps: completed, rolledBack, deviceUnchanged: rolledBack,
      warnings: [getErrorMessage(e), ...warnings],
      ...(unrestored.length ? { unrestored } : {}),
    };
  }
}

/** Restore each given journaled slot to its captured state. Best-effort; returns residual
 *  warnings and the files it could not put back. Two passes, because the Nord
 *  refuses a name another slot holds: first clear every slot that no longer
 *  holds its own file, then write the files back. */
async function rollback(
  io: DeviceIO,
  partition: number,
  journal: JournalEntry[],
  onProgress?: (p: ExecProgress) => void,
): Promise<{ warnings: string[]; unrestored: UnrestoredFile[] }> {
  const warnings: string[] = [];
  const unrestored: UnrestoredFile[] = [];
  let ri = 0;
  const toWrite: JournalEntry[] = [];
  for (const j of journal) {
    onProgress?.({ opIndex: ri++, opCount: journal.length * 2, phase: 'rollback' });
    try {
      const now = await io.info(partition, j.addr);
      const intact = !!now && !!j.before && now.name === j.before.name
        && bodiesEqual(await io.pull(partition, now), j.before.file);
      if (intact) continue;
      if (now) await io.delete(partition, j.addr);
    } catch {
      // the write below reports this slot if it really can't be restored
    }
    if (j.before) toWrite.push(j);
  }
  for (const j of toWrite) {
    onProgress?.({ opIndex: ri++, opCount: journal.length * 2, phase: 'rollback' });
    if (!j.before) continue;
    try {
      await io.push(partition, j.addr, j.before.file, j.before.name);
    } catch (e) {
      warnings.push(`Could not restore ${addrKey(j.addr)}: ${getErrorMessage(e)}`);
      unrestored.push({ addr: j.addr, ...j.before });
    }
  }
  return { warnings, unrestored };
}
