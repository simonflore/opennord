import type { FxChipModel } from '../../lib/clavia/engine-view';
import { Chip } from './widgets';

export function FxRow({ chips, title = 'LAYER & GLOBAL FX' }: { chips: FxChipModel[]; title?: string }) {
  if (chips.length === 0) return null;
  return (
    <div className="ps-card ps-fx">
      <h4>{title}</h4>
      <div className="ps-chips">
        {chips.map((c) => <Chip key={c.key} label={c.label} detail={c.detail} />)}
      </div>
    </div>
  );
}
