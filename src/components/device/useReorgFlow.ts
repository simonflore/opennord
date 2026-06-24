import { useState } from 'react';
import type { NordSession } from '../../lib/device/session';
import { PARTITION_PROGRAM } from '../../lib/device/opcodes';
import { sessionDeviceIO } from '../../lib/device/device-io';
import { executePlan, type ExecResult, type ExecProgress } from '../../lib/device/execute';
import { buildOccupancy, type Plan } from '../../lib/device/reorg';
import type { ProgramEntry } from '../../lib/device/transfer';

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Reorg flow: hold a pending plan, take a one-time session backup, execute with
 * journal rollback, and surface progress/result. `entries` is the current
 * program occupancy; `backupOnce` runs the full .ns4b backup the first time only.
 */
export function useReorgFlow(
  session: NordSession | null,
  refresh: (s: NordSession) => Promise<void>,
  backupOnce: () => Promise<void>,
  entries: ProgramEntry[] = [],
) {
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ExecResult | null>(null);
  const [progress, setProgress] = useState<ExecProgress | null>(null);

  function clearResult() { setResult(null); }

  async function confirmReorg() {
    if (!session || !pendingPlan || busy) return;
    setError(''); setBusy(true); setProgress(null);
    const plan = pendingPlan;
    try {
      await backupOnce();
      const occ = buildOccupancy(entries);
      const res = await session.withSession(PARTITION_PROGRAM, () =>
        executePlan(sessionDeviceIO(session), PARTITION_PROGRAM, plan, occ, { onProgress: setProgress }));
      setResult(res);
      if (res.ok) await refresh(session);
      setPendingPlan(null);
    } catch (e) {
      setError(`Could not complete the move: ${msg(e)}`);
    } finally {
      setBusy(false); setProgress(null);
    }
  }

  return { pendingPlan, setPendingPlan, busy, error, result, progress, confirmReorg, clearResult };
}
