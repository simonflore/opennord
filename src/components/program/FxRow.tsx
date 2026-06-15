import type { NS4Program } from '../../lib/ns4/types';
import { fxChips } from '../../lib/ns4/view';
import { Chip } from './widgets';

export function FxRow({ program, scene }: { program: NS4Program; scene?: 'I' | 'II' }) {
  const chips = fxChips(program, scene);
  if (chips.length === 0) return null;
  return (
    <div className="ps-card ps-fx">
      <h4>LAYER &amp; GLOBAL FX</h4>
      <div className="ps-chips">
        {chips.map((c) => <Chip key={c.key} label={c.label} detail={c.detail} />)}
      </div>
    </div>
  );
}
