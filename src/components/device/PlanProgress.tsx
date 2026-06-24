import type { ExecProgress } from '../../lib/device/execute';

/** Inline progress line while a reorg plan runs. */
export function PlanProgress({ progress }: { progress: ExecProgress | null }) {
  if (!progress) return null;
  const label = progress.phase === 'rollback' ? 'Restoring…' : progress.phase === 'copy' ? 'Copying…' : 'Removing old slot…';
  return (
    <p role="status" aria-live="polite">
      {label} (step {progress.opIndex + 1} of {progress.opCount})
    </p>
  );
}
