import type { DeviceIO } from './device-io';
import { addrKey, type Addr, type Occupancy, type Plan } from './reorg';

export interface ExecProgress { opIndex: number; opCount: number; phase: 'copy' | 'delete' | 'rollback' }
export interface ExecResult { ok: boolean; completedOps: number; rolledBack: boolean; warnings: string[] }

interface JournalEntry { addr: Addr; before: { file: Uint8Array; name: string } | null }

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Execute a plan with per-plan journal rollback and verify-before-delete. */
export async function executePlan(
  io: DeviceIO,
  partition: number,
  plan: Plan,
  occ: Occupancy,
  opts: { onProgress?: (p: ExecProgress) => void; signal?: AbortSignal } = {},
): Promise<ExecResult> {
  const { onProgress, signal } = opts;

  // 1. Journal the affected slots up front (before any mutation).
  const journal: JournalEntry[] = [];
  try {
    for (const addr of plan.journalSlots) {
      const src = occ.get(addrKey(addr));
      journal.push(src ? { addr, before: { file: await io.pull(partition, src), name: src.name } } : { addr, before: null });
    }
  } catch (e) {
    return { ok: false, completedOps: 0, rolledBack: false, warnings: [`Could not read the slots before moving: ${msg(e)}`] };
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
      } else {
        onProgress?.({ opIndex: i, opCount: plan.ops.length, phase: 'delete' });
        if (signal?.aborted) throw new Error('cancelled');
        await io.delete(partition, op.at);
      }
      completed++;
    }
    return { ok: true, completedOps: completed, rolledBack: false, warnings: [] };
  } catch {
    const warnings = await rollback(io, partition, journal, onProgress);
    return { ok: false, completedOps: completed, rolledBack: true, warnings };
  }
}

/** Restore every journaled slot to its captured state. Best-effort; returns residual warnings. */
async function rollback(
  io: DeviceIO,
  partition: number,
  journal: JournalEntry[],
  onProgress?: (p: ExecProgress) => void,
): Promise<string[]> {
  const warnings: string[] = [];
  for (const j of journal) {
    onProgress?.({ opIndex: 0, opCount: journal.length, phase: 'rollback' });
    try {
      if (j.before) {
        await io.push(partition, j.addr, j.before.file, j.before.name);
      } else if (await io.info(partition, j.addr)) {
        await io.delete(partition, j.addr);
      }
    } catch (e) {
      warnings.push(`Could not restore ${addrKey(j.addr)}: ${msg(e)}`);
    }
  }
  return warnings;
}
