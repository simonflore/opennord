import type { HeaderView } from '../../lib/clavia/engine-view';
import { Pill } from '../ui';

export function ProgramHeader({ header: h }: { header: HeaderView }) {
  return (
    <div className="ps-hd">
      <div>
        <div className="ps-nm">{h.name}</div>
        <div className="ps-meta">
          <Pill>{h.slot}</Pill>
          <Pill>{h.category}</Pill>
          <Pill>{h.version}</Pill>
          <Pill>{h.sizeBytes} B</Pill>
          <span>· {h.summary}</span>
        </div>
      </div>
      <div className="ps-logo">nord</div>
    </div>
  );
}
