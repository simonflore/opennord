import type { SampleHeaderView } from '../../lib/ns4/sample-view';

/** Human-friendly byte size, e.g. 2097152 → "2.0 MB". */
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function SampleHeader({ view }: { view: SampleHeaderView }) {
  return (
    <div className="ps-hd">
      <div>
        <div className="ps-nm">{view.name}</div>
        <div className="ps-meta">
          <span className="ps-pill">{view.codecLabel}</span>
          <span className="ps-pill">v{view.version}</span>
          <span className="ps-pill">{view.strokeCount} strokes</span>
          <span className="ps-pill">{formatBytes(view.sizeBytes)}</span>
          <span className="ps-pill">{view.checksumOk ? 'checksum ✓' : 'checksum ✗'}</span>
          {view.isFactory && (
            <span className="ps-pill" style={{ color: 'var(--warn)', borderColor: '#43222a' }}>factory?</span>
          )}
        </div>
      </div>
      <div className="ps-logo">nord</div>
    </div>
  );
}
