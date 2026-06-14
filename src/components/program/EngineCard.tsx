import type { NS4Layer } from '../../lib/ns4/types';
import { organCard, pianoCard, synthCard, volumeFill } from '../../lib/ns4/view';
import { DrawbarLadder, Knob, Lcd, Meter } from './widgets';
import { resolveFactory } from '../../lib/device/factory';

/**
 * One card per active layer. Declarative per-kind layout: each engine renders
 * its signature widgets from the matching view-model card object.
 */
export function EngineCard({ layer }: { layer: NS4Layer }) {
  return (
    <div className="ps-card">
      <h4>{(layer.kind ?? '?').toUpperCase()} · {layer.id}</h4>
      {layer.kind === 'organ' && <OrganBody layer={layer} />}
      {layer.kind === 'piano' && <PianoBody layer={layer} />}
      {layer.kind === 'synth' && <SynthBody layer={layer} />}
      <Meter label="vol" value={layer.volume?.value ?? '—'} fill={volumeFill(layer.volume?.value)} />
    </div>
  );
}

function OrganBody({ layer }: { layer: NS4Layer }) {
  const c = organCard(layer);
  const tags = [c.model, c.vibChorus ? 'Vib' : null, c.perc ? 'Perc' : null].filter(Boolean).join(' · ');
  return (
    <>
      <div className="ps-sub">{tags}</div>
      <DrawbarLadder values={c.drawbars} />
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
    </>
  );
}

function SynthBody({ layer }: { layer: NS4Layer }) {
  const c = synthCard(layer);
  // LCD gives the compact overview (osc + filter type); the numeric cutoff/res
  // live on the knobs below, so we don't repeat the value here.
  const filterType = c.filterType !== '—' ? c.filterType : '';
  const secondary = [c.oscDetail, filterType].filter(Boolean).join(' · ');
  return (
    <>
      <div className="ps-sub">{c.source} oscillator</div>
      <Lcd primary={c.osc} secondary={secondary} />
      <div className="ps-knobs">
        <Knob value={c.cutoff} caption="cutoff" />
        <Knob value={c.res} caption="res" />
      </div>
    </>
  );
}
