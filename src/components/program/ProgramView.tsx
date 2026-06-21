import { useState } from 'react';
import '../../styles/nord.css';
import type { NS4Program } from '../../lib/ns4/types';
import { activeLayers, scenesDiffer, engineCardModel, headerView, fxChips } from '../../lib/ns4/view';
import { ProgramHeader } from './ProgramHeader';
import { ProgramZones } from './ProgramZones';
import { EngineCard } from './EngineCard';
import { FxRow } from './FxRow';
import { Morphs } from './Morphs';
import { NordFileCard } from './NordFileCard';
import { DecodedProgramView } from './DecodedProgramView';
import { decodedProgramFor } from '../../lib/presenters';
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
    // A recognized Nord file we don't fully decode here. The leaner models
    // (Stage 2/3) render through the shared decoded-program view via their
    // presenter; other recognized files show the structure card; truly
    // unrecognized files fall through.
    const decoded = decodedProgramFor(program.bytes);
    if (decoded) return <DecodedProgramView program={decoded} />;
    const info = identifyNordFile(program.bytes);
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
      <ProgramHeader header={headerView(program, scene)} />

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
            card={engineCardModel(l, program.organFx, l.kind === 'organ' && l.id === firstOrganId)}
          />
        ))}
      </div>
      <FxRow chips={fxChips(program, scene)} />
      <Morphs program={program} />
      <ProgramExtern program={program} scene={scene} />
      <SampleRefs program={program} scene={scene} />
      <AllParamsDrawer program={program} />
    </div>
  );
}
