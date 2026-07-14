import type { LibrarySource } from '@/lib/library/types';

export function SourceBadge({ source }: { source: LibrarySource }) {
  const label =
    source === 'nord' ? 'On Nord' :
    source === 'backup' ? 'Backup' :
    source === 'cloud' ? 'Cloud' :
    'Local';
  return (
    <span className={`on-badge on-badge--${source}`}>
      <span className="on-badge__dot" />
      {label}
    </span>
  );
}
