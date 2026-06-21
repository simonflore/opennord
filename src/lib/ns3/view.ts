/**
 * Stage 3 view-model — pure derivations from a decoded Ns3Panel to the shared
 * EngineCardModel / FxChipModel contract (clavia/engine-view.ts). No React, no I/O.
 * Mirrors ns4/view.ts for Stage 4. Sample names are injected (resolved lazily by
 * the shell) via the optional `names` map keyed by ns3SampleKey().
 */
import type {
  EngineCardModel, OrganPanelModel, PianoCardModel, SynthCardModel,
  FxChipModel, HeaderView, Stat, VolumeView,
} from '../clavia/engine-view';
import { volumeFill, envCurve } from '../clavia/engine-view';
import { drawbarViews, b3DrawbarViews } from '../clavia/drawbars';
import { identifyNordFile } from '../clavia/nord-file';
import { ORGAN_TYPE, type Ns3Panel, type Ns3Fx } from './decode';

// The model-selector options ARE the decoder's organ-type table — sourced from it
// so a future decoder relabel can't silently desync the selector.
const ORGAN_MODELS = ORGAN_TYPE;

/** Key convention for an injected, lazily-resolved factory sample name. */
export function ns3SampleKey(panelId: string, kind: 'Piano' | 'Synth'): string {
  return `${panelId}-${kind}`;
}

/** A present-only stat cell: drops empty / "off" / "none" / "0.0" so cards stay calm. */
function stat(label: string, value: string | number | boolean | undefined): Stat | null {
  if (value === undefined || value === null || value === false) return null;
  if (typeof value === 'number' && value === 0) return null;
  const v = value === true ? 'on' : String(value).trim();
  if (v === '' || v === 'off' || v === 'none' || v === '—' || v === '0.0') return null;
  return { label, value: v };
}
const statList = (...items: (Stat | null)[]): Stat[] => items.filter((s): s is Stat => s !== null);

function volume(value: string): VolumeView {
  return { value, fill: volumeFill(value) };
}

function organCard(panel: Ns3Panel): OrganPanelModel {
  const o = panel.organ;
  const isB3 = o.type === 'B3';
  return {
    id: panel.id,
    model: o.type,
    models: ORGAN_MODELS,
    isB3,
    drawbars: isB3 ? b3DrawbarViews(o.drawbars) : drawbarViews(o.drawbars),
    vibChorus: { on: o.vibChorus.on, type: o.vibChorus.mode || undefined },
    percussion: {
      applicable: isB3,
      on: o.percussion.on,
      harm3rd: o.percussion.third,
      decayFast: o.percussion.fast,
      volSoft: o.percussion.soft,
    },
    octave: o.octaveShift,
    // preset / sustain / rotary intentionally omitted: ns3 has no organ-panel
    // preset or sustain control, and rotary is rendered in the FX row.
  };
}

function pianoCardNs3(panel: Ns3Panel, names?: Record<string, string>): PianoCardModel {
  const p = panel.piano;
  return {
    id: panel.id,
    type: p.type,
    model: names?.[ns3SampleKey(panel.id, 'Piano')] ?? p.type,
    timbre: p.timbre,
    // touch omitted: ns3 piano has no keyboard-touch knob.
  };
}

function pianoStatsNs3(panel: Ns3Panel): Stat[] {
  return statList(stat('octave', panel.piano.octaveShift));
}

function synthCardNs3(panel: Ns3Panel, names?: Record<string, string>): SynthCardModel {
  const s = panel.synth;
  const isSample = s.oscillator.type === 'Sample';
  const osc = isSample
    ? (names?.[ns3SampleKey(panel.id, 'Synth')] ?? 'Sample')
    : (s.oscillator.waveform || s.oscillator.type);
  const oscDetail = [s.oscillator.config !== 'None' ? s.oscillator.config : '', s.oscillator.pitch]
    .filter((x) => x && x !== '0 semi').join(' · ');
  return {
    id: panel.id,
    source: isSample ? 'sample' : 'analog',
    osc,
    oscDetail,
    filterType: s.filter.type,
    cutoff: s.filter.cutoff,
    res: s.filter.resonance,
  };
}

function synthStatsNs3(panel: Ns3Panel): Stat[] {
  const s = panel.synth;
  const lfo = [s.lfo.wave, s.lfo.rate].filter(Boolean).join(' · ');
  return statList(
    stat('voice', s.voice),
    stat('glide', s.glide),
    stat('unison', s.unison),
    stat('vibrato', s.vibrato),
    stat('keytrack', s.filter.kbTrack),
    stat('drive', s.filter.drive),
    stat('LFO', lfo),
    s.arp.on ? stat('arp', [s.arp.range, s.arp.pattern, s.arp.rate].filter(Boolean).join(' · ') || 'on') : null,
  );
}

/** One EngineCardModel per active engine in the panel (organ, piano, synth order). */
export function ns3EngineCards(panel: Ns3Panel, names?: Record<string, string>): EngineCardModel[] {
  const cards: EngineCardModel[] = [];
  if (panel.organ.on) {
    cards.push({ kind: 'organ', title: 'ORGAN', volume: volume(panel.organ.volume), organ: organCard(panel) });
  }
  if (panel.piano.on) {
    cards.push({
      kind: 'piano', title: 'PIANO', volume: volume(panel.piano.volume),
      piano: pianoCardNs3(panel, names), stats: pianoStatsNs3(panel),
    });
  }
  if (panel.synth.on) {
    cards.push({
      kind: 'synth', title: 'SYNTH', volume: volume(panel.synth.volume),
      synth: synthCardNs3(panel, names),
      env: envCurve(panel.synth.envAmp),
      modEnv: envCurve(panel.synth.envMod) ?? undefined,
      stats: synthStatsNs3(panel),
    });
  }
  return cards;
}

/** Build the chip detail from an FX's decoded params (type first, then named params). */
function fxDetail(fx: Ns3Fx): string {
  const parts: string[] = [];
  if (fx.type) parts.push(fx.type);
  const p = fx.params ?? {};
  if (p.speed !== undefined) parts.push(String(p.speed));
  if (p.rate !== undefined) parts.push(`rate ${p.rate}`);
  if (p.amount !== undefined) parts.push(`amt ${p.amount}`);
  if (p.mix !== undefined) parts.push(`mix ${p.mix}`);
  if (p.feedback !== undefined) parts.push(`fb ${p.feedback}`);
  return parts.join(' · ') || 'on';
}

/** Chips for the FX switched on in this panel. */
export function ns3FxChips(panel: Ns3Panel): FxChipModel[] {
  return panel.fx.map((fx) => ({ key: `${panel.id}-${fx.name}`, label: fx.name, detail: fxDetail(fx) }));
}

/** Referenced factory samples (resolved names) for the sample strip — piano + Sample-osc synth. */
export function ns3SampleRefs(panels: Ns3Panel[], names: Record<string, string>): { key: string; label: string }[] {
  const refs: { key: string; label: string }[] = [];
  for (const p of panels) {
    const piano = names[ns3SampleKey(p.id, 'Piano')];
    if (p.piano.on && piano) refs.push({ key: `${p.id}-pno`, label: piano });
    const synth = names[ns3SampleKey(p.id, 'Synth')];
    if (p.synth.on && p.synth.oscillator.type === 'Sample' && synth) refs.push({ key: `${p.id}-syn`, label: synth });
  }
  return refs;
}

const KIND_ORDER = ['organ', 'piano', 'synth'] as const;

/** Program header: CBIN slot/category/version + a per-panel engine summary. */
export function ns3HeaderView(bytes: Uint8Array, name: string | undefined, panels: Ns3Panel[]): HeaderView {
  const info = identifyNordFile(bytes);
  const summary = panels.map((p) => {
    const kinds = KIND_ORDER.filter((k) =>
      (k === 'organ' && p.organ.on) || (k === 'piano' && p.piano.on) || (k === 'synth' && p.synth.on));
    return `Panel ${p.id}: ${kinds.length ? kinds.join(' + ') : 'empty'}`;
  }).join(' · ');
  return {
    name: name ?? 'Unnamed',
    slot: info.slot ?? '—',
    category: info.categoryName ?? '—',
    version: info.version ? `v${info.version}` : '—',
    sizeBytes: bytes.length,
    summary,
  };
}
