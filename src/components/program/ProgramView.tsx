import { useState } from 'react';
import '../../styles/nord.css';
import type { NS4Program } from '../../lib/ns4/types';
import { activeLayers, scenesDiffer } from '../../lib/ns4/view';
import { ProgramHeader } from './ProgramHeader';
import { ProgramZones } from './ProgramZones';
import { EngineCard } from './EngineCard';
import { FxRow } from './FxRow';
import { ProgramExtern } from './ProgramExtern';
import { SampleRefs } from './SampleRefs';
import { AllParamsDrawer } from './AllParamsDrawer';

/**
 * Top-level Program Studio view — a pure function of NS4Program. Composes the
 * header, one card per active engine, the FX row, External/MIDI, referenced
 * samples, and the all-parameters drawer. When the two Layer Scenes enable
 * different layers, a Scene I/II toggle re-renders the whole view for the chosen
 * scene (a scene only changes which layers are muted, never the sound).
 */
export function ProgramView({ program }: { program: NS4Program }) {
  const [scene, setScene] = useState<'I' | 'II'>(program.activeScene ?? 'I');

  if (!program.parsed) {
    return (
      <div className="ps">
        <p>Not a recognized Stage 4 program.</p>
        <ul>{program.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
      </div>
    );
  }

  const layers = activeLayers(program, scene);
  const canToggle = scenesDiffer(program);

  return (
    <div className="ps">
      <ProgramHeader program={program} scene={scene} />

      {canToggle && (
        <div className="ps-scene">
          <span className="ps-scene-l">LAYER SCENE</span>
          {(['I', 'II'] as const).map((s) => (
            <button
              key={s}
              className={`ps-scene-btn${scene === s ? ' on' : ''}`.trim()}
              onClick={() => setScene(s)}
              aria-pressed={scene === s}
              title={program.activeScene === s ? 'Saved active scene' : undefined}
            >
              {s}{program.activeScene === s ? ' ●' : ''}
            </button>
          ))}
        </div>
      )}

      <ProgramZones program={program} scene={scene} />
      <div className="ps-grid">
        {layers.map((l) => <EngineCard key={`${l.kind ?? 'x'}${l.id}`} layer={l} />)}
      </div>
      <FxRow program={program} scene={scene} />
      <ProgramExtern program={program} scene={scene} />
      <SampleRefs program={program} scene={scene} />
      <AllParamsDrawer program={program} />
    </div>
  );
}
