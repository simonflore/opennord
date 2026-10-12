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

  // 2. Run ops in order, copy-then-verify-then-delete. Any failure → rollback.
  let completed = 0;
  try {
    for (let i = 0; i < plan.ops.length; i++) {
      if (signal?.aborted) throw new Error('cancelled');
      const op = plan.ops[i];
      if (op.kind === 'copy') {
        onProgress?.({ opIndex: i, opCount: plan.ops.length, phase: 'copy' });
        const j = journal.find((x) => addrKey(x.addr) === addrKey(op.from));
        if (!j?.before) throw new Error('source bytes were not journaled');
        if (signal?.aborted) throw new Error('cancelled');
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
        await io.delete(partition, op.at);
      }
      completed++;
    }
    return { ok: true, completedOps: completed, rolledBack: false, warnings: [] };
  } catch (e) {
    const { warnings, unrestored } = await rollback(io, partition, journal, onProgress);
    const rolledBack = warnings.length === 0;
    return {
      ok: false, completedOps: completed, rolledBack, deviceUnchanged: rolledBack,
      warnings: [getErrorMessage(e), ...warnings],
      ...(unrestored.length ? { unrestored } : {}),
    };
  }
}

/** Restore every journaled slot to its captured state. Best-effort; returns residual
 *  warnings and the files it could not put back. */
async function rollback(
  io: DeviceIO,
  partition: number,
  journal: JournalEntry[],
  onProgress?: (p: ExecProgress) => void,
): Promise<{ warnings: string[]; unrestored: UnrestoredFile[] }> {
  const warnings: string[] = [];
  const unrestored: UnrestoredFile[] = [];
  let ri = 0;
  for (const j of journal) {
    onProgress?.({ opIndex: ri++, opCount: journal.length, phase: 'rollback' });
    try {
      if (j.before) {
        await io.push(partition, j.addr, j.before.file, j.before.name);
      } else if (await io.info(partition, j.addr)) {
        await io.delete(partition, j.addr);
      }
    } catch (e) {
      warnings.push(`Could not restore ${addrKey(j.addr)}: ${getErrorMessage(e)}`);
      if (j.before) unrestored.push({ addr: j.addr, ...j.before });
    }
  }
  return { warnings, unrestored };
}
