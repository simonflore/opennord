import { useState } from 'react';
import '../../styles/nord.css';
import { isNs4Program, type NordProgram } from '../../lib/formats';
import { activeLayers, scenesDiffer, engineCardModel, headerView, fxChips } from '../../lib/ns4/view';
import { ProgramHeader } from './ProgramHeader';
import { ProgramZones } from './ProgramZones';
import { EngineCard } from './EngineCard';
import { LedSwitch } from './widgets';
import { OrganPlay } from './OrganPlay';
import { FxRow } from './FxRow';
import { Morphs } from './Morphs';
import { NordFileCard } from './NordFileCard';
import { DecodedProgramView } from './DecodedProgramView';
import { Ns3ProgramView } from './Ns3ProgramView';
import { Ns2ProgramView } from './Ns2ProgramView';
import { ConvertToStage4 } from './ConvertToStage4';
import { decodedProgramFor } from '../../lib/presenters';
import { identifyNordFile } from '../../lib/clavia/nord-file';
import { ProgramExtern } from './ProgramExtern';
import { SampleRefs } from './SampleRefs';
import { AllParamsDrawer } from './AllParamsDrawer';
import { useFileReadReport } from '../../lib/diagnostics/useFileReadReport';

/**
 * Top-level Program Studio view — a pure function of NS4Program. Composes the
 * header, one card per active engine, the FX row, External/MIDI, referenced
 * samples, and the all-parameters drawer. When the two Layer Scenes enable
 * different layers, a Scene I/II toggle re-renders the whole view for the chosen
 * scene (a scene only changes which layers are muted, never the sound).
 */
export function ProgramView({ program }: { program: NordProgram }) {
  const [scene, setScene] = useState<'I' | 'II'>(
    isNs4Program(program) ? (program.activeScene ?? 'I') : 'I'
  );
  // Every opened program — Library (imported, folder, backup) and device — comes
  // through here, so this is the one place the opt-in file-support report fires.
  useFileReadReport(program.bytes);

  // Non-NS4 models (Electro/Piano/Grand/Wave/Lead) render through the shared
  // decoded-program view via their presenter — the Stage-oracle-confirmed fields
  // (piano core, organ drawbars, sound-id fingerprints) shown with musician labels.
  if (!isNs4Program(program)) {
    const decoded = decodedProgramFor(program.bytes);
    if (decoded) return <DecodedProgramView program={decoded} />;
    return (
      <div className="ps">
        <p style={{ color: 'var(--ink-dim)' }}>Recognized Nord file · v{program.version}</p>
        {program.warnings.length > 0 && <ul>{program.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
      </div>
    );
  }

  if (!program.parsed) {
    // A recognized Nord file we don't fully decode here. The leaner models
    // (Stage 2/3) render through the shared decoded-program view via their
    // presenter; other recognized files show the structure card; truly
    // unrecognized files fall through.
    const info = identifyNordFile(program.bytes);
    // Stage 3 & Stage 2 graduate to the rich per-engine view; other leaner models
    // (future: Electro/Lead/Wave) stay on the shared decoded-program view via their presenter.
    if (info.generation === 'Stage 3' && info.kind === 'performance') {
      return (
        <>
          <ConvertToStage4 bytes={program.bytes} name={program.name} />
          <Ns3ProgramView bytes={program.bytes} name={program.name} />
        </>
      );
    }
    if (info.generation === 'Stage 2' && info.kind === 'program') {
      return (
        <>
          <ConvertToStage4 bytes={program.bytes} name={program.name} />
          <Ns2ProgramView bytes={program.bytes} />
        </>
      );
    }
    const decoded = decodedProgramFor(program.bytes);
    if (decoded) return <DecodedProgramView program={decoded} />;
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

  // The two Layer Scenes, as the panel's scene buttons: lit = the one shown here;
  // "saved" marks the scene the program was stored with.
  const sceneSwitch = canToggle && (
    <LedSwitch
      className="ps-scene"
      label="Layer scene"
      value={scene}
      onChange={setScene}
      options={(['I', 'II'] as const).map((s) => ({
        value: s, label: `Scene ${s}`, note: program.activeScene === s ? 'saved' : undefined,
      }))}
    />
  );

  return (
    <div className="ps">
      <ProgramHeader header={headerView(program, scene)} aside={sceneSwitch} />

      <ProgramZones program={program} scene={scene} />
      <div className="ps-grid">
        {layers.map((l) => (
          <EngineCard
            key={`${l.kind ?? 'x'}${l.id}`}
            card={engineCardModel(l, program.organFx, l.kind === 'organ' && l.id === firstOrganId)}
          >
            {l.kind === 'organ' && <OrganPlay layer={l} organFx={program.organFx} />}
          </EngineCard>
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
