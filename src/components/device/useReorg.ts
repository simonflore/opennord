import { useRef, useState } from 'react';
import type { DeviceIO } from '../../lib/device/device-io';
import { executePlan, type ExecProgress, type ExecResult } from '../../lib/device/execute';
import { planReorg, buildOccupancy, isPlanError, type Addr, type Occupancy, type Plan } from '../../lib/device/reorg';
import type { ProgramEntry } from '../../lib/device/transfer';
import { getErrorMessage } from '../../lib/errors';
import { useAsyncAction } from '../../hooks/useAsyncAction';

export interface UseReorgOpts {
  /** Where ops run — backupDeviceIO(model) offline, or sessionDeviceIO(session) live. */
  io: DeviceIO;
  partition: number;
  /** Current occupancy. Frozen at gesture time so the plan + execution agree. */
  entries: ProgramEntry[];
  /** Re-list (backup) / re-enumerate (live) after a successful op. */
  refresh: () => void | Promise<void>;
  /** Live only: session-start safety backup, run once before the first write. */
  backupOnce?: () => Promise<void>;
  /** Live only: wrap the execute in a device session, e.g. session.withSession(partition, fn). */
  run?: <T>(fn: () => Promise<T>) => Promise<T>;
}

export interface ReorgApi {
  pendingPlan: Plan | null;
  busy: boolean;
  progress: ExecProgress | null;
  error: string;
  result: ExecResult | null;
  onGesture(g: { kind: 'move'; from: Addr; to: Addr }): void;
  confirm(): Promise<void>;
  cancel(): void;
}

/** The one reorg flow: gesture → plan (move|swap) → confirm → execute (journal
 *  rollback) → refresh. Shared by the live-device Organize mode and the backup
 *  organizer; they differ only in io / refresh / backupOnce / run. */
export function useReorg({ io, partition, entries, refresh, backupOnce, run }: UseReorgOpts): ReorgApi {
  const { busy, error, setError, run: runAction } = useAsyncAction();
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [progress, setProgress] = useState<ExecProgress | null>(null);
  const [result, setResult] = useState<ExecResult | null>(null);
  const occRef = useRef<Occupancy>(new Map());
  const wrap = run ?? (<T,>(fn: () => Promise<T>) => fn());

  function onGesture(g: { kind: 'move'; from: Addr; to: Addr }) {
    setError('');
    setResult(null);
    const occ = buildOccupancy(entries);
    const plan = planReorg(occ, g.from, g.to);
    if (isPlanError(plan)) { setError(plan.error); return; }
    occRef.current = occ; // freeze the exact occupancy the plan was validated against
    setPendingPlan(plan);
  }

  async function confirm() {
    if (!pendingPlan || busy) return;
    const plan = pendingPlan;
    setProgress(null);
    await runAction(async () => {
      if (backupOnce) await backupOnce();
      const res = await wrap(() => executePlan(io, partition, plan, occRef.current, { onProgress: setProgress }));
      setResult(res);
      setPendingPlan(null);
      if (res.ok) {
        await refresh();
      } else {
        setError(`${plan.title} failed; nothing was changed.${res.warnings.length ? ` (${res.warnings.join('; ')})` : ''}`);
      }
    }, (e) => `${plan.title} failed: ${getErrorMessage(e)}`);
    setProgress(null);
  }

  return { pendingPlan, busy, progress, error, result, onGesture, confirm, cancel: () => setPendingPlan(null) };
}
