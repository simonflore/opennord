import { useState } from 'react';
import '../../styles/nord.css';
import type { NS4Program } from '../../lib/ns4/types';
import { activeLayers, scenesDiffer } from '../../lib/ns4/view';
import { ProgramHeader } from './ProgramHeader';
import { ProgramZones } from './ProgramZones';
import { EngineCard } from './EngineCard';
import { FxRow } from './FxRow';
import { Morphs } from './Morphs';
import { NordFileCard } from './NordFileCard';
import { Ns3View } from './Ns3View';
import { identifyNordFile } from '../../lib/clavia/nord-file';
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
    // A recognized Nord file we don't fully decode here. Stage 3 gets its own
    // decoded engine view (Tier 2); other recognized files (Stage 2, presets)
    // show the structure card. Truly unrecognized files fall through.
    const info = identifyNordFile(program.bytes);
    if (info.generation === 'Stage 3' && info.kind === 'performance') return <Ns3View bytes={program.bytes} />;
    if (info.recognized) return <NordFileCard bytes={program.bytes} />;
    return (
      <div className="ps">
        <p>Not a recognized Nord file.</p>
        <ul>{program.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
      </div>
    );
  }

  const layers = activeLayers(program, scene);
  const canToggle = scenesDiffer(program);
  const firstOrganId = layers.find((l) => l.kind === 'organ')?.id;

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
        {layers.map((l) => (
          <EngineCard
            key={`${l.kind ?? 'x'}${l.id}`}
            layer={l}
            organFx={program.organFx}
            isFirstOrgan={l.kind === 'organ' && l.id === firstOrganId}
          />
        ))}
      </div>
      <FxRow program={program} scene={scene} />
      <Morphs program={program} />
      <ProgramExtern program={program} scene={scene} />
      <SampleRefs program={program} scene={scene} />
      <AllParamsDrawer program={program} />
    </div>
  );
}
