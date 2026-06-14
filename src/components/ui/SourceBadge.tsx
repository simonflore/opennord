export type LibrarySource = 'nord' | 'local';

export function SourceBadge({ source }: { source: LibrarySource }) {
  const label = source === 'nord' ? 'On Nord' : 'Local';
  return (
    <span className={`on-badge on-badge--${source}`}>
      <span className="on-badge__dot" />
      {label}
    </span>
  );
}
