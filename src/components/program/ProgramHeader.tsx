import type { NS4Program } from '../../lib/ns4/types';
import { headerView } from '../../lib/ns4/view';

export function ProgramHeader({ program, scene }: { program: NS4Program; scene?: 'I' | 'II' }) {
  const h = headerView(program, scene);
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
