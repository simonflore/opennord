export type LibrarySource = 'nord' | 'local' | 'backup';

export function SourceBadge({ source }: { source: LibrarySource }) {
  const label = source === 'nord' ? 'On Nord' : source === 'backup' ? 'Backup' : 'Local';
  return (
    <span className={`on-badge on-badge--${source}`}>
      <span className="on-badge__dot" />
      {label}
    </span>
  );
}
