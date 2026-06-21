import type {
  EngineCardModel, OrganPanelModel, PianoCardModel, SynthCardModel, EnvCurveView, Stat,
} from '../../lib/clavia/engine-view';
import { DrawbarStack, ModelSelector, ToggleGroup, Knob, Lcd, Meter, StatGrid, EnvCurve } from './widgets';
import { resolveFactory } from '../../lib/device/factory';

/**
 * One card per active engine. Pure renderer of the model-agnostic EngineCardModel —
 * the per-model view-models (ns4/view.ts, ns3/view.ts) build the model; this file
 * only renders it.
 */
export function EngineCard({ card }: { card: EngineCardModel }) {
  return (
    <div className="ps-card">
      <h4>{card.title}</h4>
      {card.kind === 'organ' && <OrganPanel m={card.organ} />}
      {card.kind === 'piano' && <PianoBody m={card.piano} stats={card.stats} />}
      {card.kind === 'synth' && <SynthBody m={card.synth} env={card.env} modEnv={card.modEnv} stats={card.stats} />}
      <Meter label="vol" value={card.volume.value} fill={card.volume.fill} morph={card.volume.morph} />
    </div>
  );
}

function OrganPanel({ m }: { m: OrganPanelModel }) {
  const vc = m.vibChorus;
  const p = m.percussion;
  return (
    <>
      <div className="ps-organ-head">
        <ModelSelector models={m.models} active={m.model} />
      </div>
      <DrawbarStack drawbars={m.drawbars} />

      <ToggleGroup label="Vibrato / Chorus" items={[
        { label: 'On', on: vc.on },
        { label: vc.type ?? '—', on: vc.on && !!vc.type },
      ]} />

      <ToggleGroup label="Percussion" groupDim={!p.applicable} items={[
        { label: 'On', on: p.on },
        { label: '2nd', on: p.on && !p.harm3rd },
        { label: '3rd', on: p.on && p.harm3rd },
        { label: 'Fast', on: p.on && p.decayFast },
        { label: 'Soft', on: p.on && p.volSoft },
      ]} />

      {m.preset !== undefined && <ToggleGroup label="Preset" items={[{ label: 'On', on: m.preset }]} />}

      <ToggleGroup label="Octave" items={[{ label: m.octave > 0 ? `+${m.octave}` : `${m.octave}`, on: m.octave !== 0 }]} />
      {m.sustain !== undefined && <ToggleGroup label="Sustain" items={[{ label: 'On', on: m.sustain }]} />}

      {m.rotary && (
        <ToggleGroup label={<>Rotary <span className="shared">· shared FX</span></>} items={[
          { label: 'On', on: m.rotary.on },
          { label: m.rotary.fast ? 'Fast' : 'Slow', on: m.rotary.on },
          { label: 'Stop', on: m.rotary.stop },
          ...(m.rotary.drive ? [{ label: `Drive ${m.rotary.drive}`, on: m.rotary.on }] : []),
        ]} />
      )}
    </>
  );
}

function PianoBody({ m, stats }: { m: PianoCardModel; stats: Stat[] }) {
  const match = resolveFactory(m.model, 'npno');
  const knobs = [
    m.timbre !== undefined && <Knob key="timbre" value={m.timbre} caption="timbre" />,
    m.touch !== undefined && <Knob key="touch" value={m.touch} caption="KB touch" />,
  ].filter(Boolean);
  return (
    <>
      <div className="ps-sub">
        {m.type} ·{' '}
        {match
          ? <a href={match.url} target="_blank" rel="noreferrer" title="Official Nord download" style={{ color: 'inherit' }}>{m.model}</a>
          : m.model}
      </div>
      {knobs.length > 0 && <div className="ps-knobs">{knobs}</div>}
      <StatGrid stats={stats} />
    </>
  );
}

function SynthBody({ m, env, modEnv, stats }: { m: SynthCardModel; env: EnvCurveView | null; modEnv?: EnvCurveView; stats: Stat[] }) {
  const filterType = m.filterType !== '—' ? m.filterType : '';
  const secondary = [m.oscDetail, filterType].filter(Boolean).join(' · ');
  return (
    <>
      <div className="ps-sub">{m.source} oscillator</div>
      <Lcd primary={m.osc} secondary={secondary} />
      <div className="ps-knobs">
        <Knob value={m.cutoff} caption="cutoff" morph={m.cutoffMorph} />
        <Knob value={m.res} caption="res" morph={m.resMorph} />
      </div>
      {env && <EnvCurve a={env.a} d={env.d} s={env.s} r={env.r} caption="amp env" />}
      {modEnv && <EnvCurve a={modEnv.a} d={modEnv.d} s={modEnv.s} r={modEnv.r} caption="mod env" />}
      <StatGrid stats={stats} />
    </>
  );
}
