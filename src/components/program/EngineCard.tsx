import type { NS4Layer, Ns4OrganFx } from '../../lib/ns4/types';
import { organPanel, pianoCard, synthCard, synthStats, pianoStats, ampEnvCurve, volumeFill, morphMarks } from '../../lib/ns4/view';
import { DrawbarStack, ModelSelector, ToggleGroup, Knob, Lcd, Meter, StatGrid, EnvCurve } from './widgets';
import { resolveFactory } from '../../lib/device/factory';

/**
 * One card per active layer. Declarative per-kind layout: each engine renders
 * its signature widgets from the matching view-model card object.
 */
export function EngineCard({ layer, organFx, isFirstOrgan = false }: { layer: NS4Layer; organFx?: Ns4OrganFx; isFirstOrgan?: boolean }) {
  return (
    <div className="ps-card">
      <h4>{(layer.kind ?? '?').toUpperCase()} · {layer.id}</h4>
      {layer.kind === 'organ' && <OrganPanel layer={layer} organFx={organFx} isFirstOrgan={isFirstOrgan} />}
      {layer.kind === 'piano' && <PianoBody layer={layer} />}
      {layer.kind === 'synth' && <SynthBody layer={layer} />}
      <Meter label="vol" value={layer.volume?.value ?? '—'} fill={volumeFill(layer.volume?.value)} morph={morphMarks(layer.volume)} />
    </div>
  );
}

function OrganPanel({ layer, organFx, isFirstOrgan }: { layer: NS4Layer; organFx?: Ns4OrganFx; isFirstOrgan: boolean }) {
  const m = organPanel(layer, organFx, isFirstOrgan);
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

      <ToggleGroup label="Preset" items={[{ label: 'On', on: m.preset }]} />

      <ToggleGroup label="Octave" items={[{ label: m.octave > 0 ? `+${m.octave}` : `${m.octave}`, on: m.octave !== 0 }]} />
      <ToggleGroup label="Sustain" items={[{ label: 'On', on: m.sustain }]} />

      {m.rotary && (
        <ToggleGroup label={<>Rotary <span className="shared">· shared FX</span></>} items={[
          { label: 'On', on: m.rotary.on },
          { label: m.rotary.fast ? 'Fast' : 'Slow', on: m.rotary.on },
          ...(m.rotary.drive ? [{ label: `Drive ${m.rotary.drive}`, on: m.rotary.on }] : []),
        ]} />
      )}
    </>
  );
}

function PianoBody({ layer }: { layer: NS4Layer }) {
  const c = pianoCard(layer);
  const match = resolveFactory(c.model, 'npno');
  return (
    <>
      <div className="ps-sub">
        {c.type} ·{' '}
        {match
          ? <a href={match.url} target="_blank" rel="noreferrer" title="Official Nord download" style={{ color: 'inherit' }}>{c.model}</a>
          : c.model}
      </div>
      <div className="ps-knobs">
        <Knob value={c.timbre} caption="timbre" />
        <Knob value={c.touch} caption="KB touch" />
      </div>
      <StatGrid stats={pianoStats(layer)} />
    </>
  );
}

function SynthBody({ layer }: { layer: NS4Layer }) {
  const c = synthCard(layer);
  // LCD gives the compact overview (osc + filter type); the numeric cutoff/res
  // live on the knobs below, so we don't repeat the value here.
  const filterType = c.filterType !== '—' ? c.filterType : '';
  const secondary = [c.oscDetail, filterType].filter(Boolean).join(' · ');
  const env = ampEnvCurve(layer);
  const stats = synthStats(layer);
  return (
    <>
      <div className="ps-sub">{c.source} oscillator</div>
      <Lcd primary={c.osc} secondary={secondary} />
      <div className="ps-knobs">
        <Knob value={c.cutoff} caption="cutoff" morph={morphMarks(layer.filter?.freq)} />
        <Knob value={c.res} caption="res" morph={morphMarks(layer.filter?.resonance)} />
      </div>
      {env && <EnvCurve a={env.a} d={env.d} s={env.s} r={env.r} caption="amp env" />}
      <StatGrid stats={stats} />
    </>
  );
}
