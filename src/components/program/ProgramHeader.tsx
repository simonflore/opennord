import type { HeaderView } from '../../lib/clavia/engine-view';

export function ProgramHeader({ header: h }: { header: HeaderView }) {
  return (
    <div className="ps-hd">
      <div>
        <div className="ps-nm">{h.name}</div>
        <div className="ps-meta">
          <span className="ps-pill">{h.slot}</span>
          <span className="ps-pill">{h.category}</span>
          <span className="ps-pill">{h.version}</span>
          <span className="ps-pill">{h.sizeBytes} B</span>
          <span>· {h.summary}</span>
        </div>
      </div>
      <div className="ps-logo">nord</div>
    </div>
  );
}
