import { useEffect, useState } from 'react';
import type { NordSession } from '../../lib/device/session';
import { findUnusedSamples, findUnusedPianos } from '../../lib/device/dependencies';
import { getErrorMessage } from '../../lib/errors';
import type { ReclaimState } from './MemoryBudget';

/** Total bytes of the unused (safe-to-remove) files in a usage scan. */
const unusedBytes = (u: { unused: { sizeBytes: number }[] }): number =>
  u.unused.reduce((n, e) => n + (e.sizeBytes || 0), 0);

/**
 * On-demand "how much can I reclaim?" scan for the memory-budget panel. Reconciles
 * every program's sample/piano dependencies against what's installed and sums the
 * bytes of the unused (safe-to-delete) files. Heavy — one round-trip per program,
 * twice (samples + pianos) — so it's user-initiated and reports progress. Resets
 * when the session changes.
 */
export function useReclaimScan(session: NordSession | null) {
  const [state, setState] = useState<ReclaimState>({ status: 'idle' });

  useEffect(() => { setState({ status: 'idle' }); }, [session]);

  async function scan() {
    if (!session) return;
    setState({ status: 'scanning', pct: null });
    try {
      const onPct = (done: number, total: number) =>
        setState({ status: 'scanning', pct: total ? Math.round((done / total) * 100) : null });
      const samples = await findUnusedSamples(session, onPct);
      const pianos = await findUnusedPianos(session, onPct);
      setState({ status: 'done', bytes: unusedBytes(samples) + unusedBytes(pianos) });
    } catch (e) {
      setState({ status: 'error', message: `Couldn’t scan for reclaimable space: ${getErrorMessage(e)}` });
    }
  }

  return { state, scan };
}
