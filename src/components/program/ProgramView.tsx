import '../../styles/nord.css';
import type { NS4Program } from '../../lib/ns4/types';
import { activeLayers } from '../../lib/ns4/view';
import { ProgramHeader } from './ProgramHeader';
import { EngineCard } from './EngineCard';
import { FxRow } from './FxRow';
import { SampleRefs } from './SampleRefs';
import { AllParamsDrawer } from './AllParamsDrawer';

/**
 * Top-level Program Studio view — a pure function of NS4Program. Composes the
 * header, one card per active engine, the FX row, referenced samples, and the
 * all-parameters drawer. Reused by the Community Library to render any patch.
 */
export function ProgramView({ program }: { program: NS4Program }) {
  if (!program.parsed) {
    return (
      <div className="ps">
        <p>Not a recognized Stage 4 program.</p>
        <ul>{program.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
      </div>
    );
  }
  const layers = activeLayers(program);
  return (
    <div className="ps">
      <ProgramHeader program={program} />
      <div className="ps-grid">
        {layers.map((l) => <EngineCard key={`${l.kind ?? 'x'}${l.id}`} layer={l} />)}
      </div>
      <FxRow program={program} />
      <SampleRefs program={program} />
      <AllParamsDrawer program={program} />
    </div>
  );
}
