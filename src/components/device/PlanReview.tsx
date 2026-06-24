import type { Plan } from '../../lib/device/reorg';
import { ConfirmPanel } from './ConfirmPanel';

interface Props {
  plan: Plan;
  backup: boolean;
  onBackupChange(v: boolean): void;
  busy: boolean;
  onConfirm(): void;
  onCancel(): void;
}

/** Confirms a reorg plan before any device write; offers a one-time safety backup. */
export function PlanReview({ plan, backup, onBackupChange, busy, onConfirm, onCancel }: Props) {
  return (
    <ConfirmPanel
      title="Move program"
      message={plan.summary}
      confirmLabel="Move"
      busy={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <label>
        <input type="checkbox" checked={backup} onChange={(e) => onBackupChange(e.target.checked)} />
        {' '}Back up my Nord first
      </label>
    </ConfirmPanel>
  );
}
