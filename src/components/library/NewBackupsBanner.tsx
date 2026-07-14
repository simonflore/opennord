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
    <div className="new-backups" role="status">
      <span>{label}</span>
      <Button variant="ghost" onClick={onReview}>Review</Button>
    </div>
  );
}
