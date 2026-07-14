import { Button } from '../ui';

export interface NewBackupsBannerProps {
  count: number;
  onReview: () => void;
}

/** Quiet, non-modal nudge when a rescan finds backups the user hasn't decided on. */
export function NewBackupsBanner({ count, onReview }: NewBackupsBannerProps) {
  if (count <= 0) return null;
  const label = count === 1 ? '1 new backup found' : `${count} new backups found`;
  return (
    <div className="mb-3 flex items-center gap-2 rounded-sm border border-line bg-surface-2 px-3 py-2 text-[11px] text-ink" role="status">
      <span className="flex-1">{label}</span>
      <Button variant="ghost" onClick={onReview}>Review</Button>
    </div>
  );
}
