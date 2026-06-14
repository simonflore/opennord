import type { SampleHeaderView } from '../../lib/ns4/sample-view';

export function SampleHeader({ view }: { view: SampleHeaderView }) {
  return (
    <div className="ps-hd">
      <div>
        <div className="ps-nm">{view.name}</div>
        <div className="ps-meta">
          <span className="ps-pill">{view.codecLabel}</span>
          <span className="ps-pill">v{view.version}</span>
          <span className="ps-pill">{view.strokeCount} strokes</span>
          <span className="ps-pill">{view.sizeBytes} B</span>
          <span className="ps-pill">{view.checksumOk ? 'checksum ✓' : 'checksum ✗'}</span>
          {view.isFactory && (
            <span className="ps-pill" style={{ color: '#ffb454', borderColor: '#43222a' }}>factory?</span>
          )}
        </div>
      </div>
      <div className="ps-logo">nord</div>
    </div>
  );
}
