/**
 * Stage 2 view-model — pure derivations from a decoded Ns2Slot (+ program globalFx)
 * to the shared EngineCardModel / FxChipModel contract. No React, no I/O. Mirrors
 * ns3/view.ts. Sample names are injected (resolved lazily by the shell) via the
 * optional `names` map keyed by ns2SampleKey().
 */
import type {
  EngineCardModel, OrganPanelModel, PianoCardModel, SynthCardModel,
  FxChipModel, HeaderView, Stat, VolumeView,
} from '../clavia/engine-view';
import { volumeFill, envCurve } from '../clavia/engine-view';
import { drawbarViews, b3DrawbarViews } from '../clavia/drawbars';
import { identifyNordFile } from '../clavia/nord-file';
import { ORGAN_TYPE, type Ns2Slot, type Ns2Fx } from './decode';

export function ns2SampleKey(slotId: string, kind: 'Piano' | 'Synth'): string {
  return `${slotId}-${kind}`;
}

function stat(label: string, value: string | number | boolean | undefined): Stat | null {
  if (value === undefined || value === null || value === false) return null;
  if (typeof value === 'number' && value === 0) return null;
  const v = value === true ? 'on' : String(value).trim();
  if (v === '' || v === 'off' || v === 'none' || v === '—' || v === '0.0') return null;
  return { label, value: v };
}
const statList = (...items: (Stat | null)[]): Stat[] => items.filter((s): s is Stat => s !== null);

function volume(value: string): VolumeView { return { value, fill: volumeFill(value) }; }

/** 7-bit MIDI → 0–10 string, matching the synth knob style. */
function lin10(midi: number): string { return (midi / 12.7).toFixed(1); }

function organCard(slot: Ns2Slot): OrganPanelModel {
  const o = slot.organ;
  const isB3 = o.type === 'B3';
  const active = o.preset2 ? o.drawbars2 : o.drawbars;
  // Drawbar ladder only for B3/Vox (4-bit). Farfisa drawbars are 1-bit → no ladder.
  const drawbars = isB3 ? b3DrawbarViews(active) : o.type === 'Vox' ? drawbarViews(active) : [];
  return {
    id: slot.id,
    model: o.type,
    models: ORGAN_TYPE,
    isB3,
    drawbars,
    vibChorus: { on: o.vibChorus.on, type: o.vibChorus.mode || undefined },
    percussion: {
      applicable: isB3,
      on: o.percussion.on,
      harm3rd: o.percussion.third,
      decayFast: o.percussion.fast,
      volSoft: o.percussion.soft,
    },
    octave: o.octaveShift,
    // preset/sustain/rotary omitted: preset2 is a preset selector (not on/off);
    // rotary is an FX.
  };
}

function pianoCardNs2(slot: Ns2Slot, names?: Record<string, string>): PianoCardModel {
  const p = slot.piano;
  return {
    id: slot.id,
    type: p.type,
    model: names?.[ns2SampleKey(slot.id, 'Piano')] ?? p.type,
    // timbre/touch omitted: ns2 piano has neither knob.
  };
}

function pianoStatsNs2(slot: Ns2Slot): Stat[] {
  const p = slot.piano;
  return statList(
    stat('dynamics', p.dynamics),
    stat('string res', p.stringResonance),
    stat('pedal noise', p.pedalNoise),
    stat('long release', p.longRelease),
    stat('clav model', p.clavinetModel),
    stat('clav EQ', p.clavinetEq),
    stat('octave', p.octaveShift),
  );
}

function synthCardNs2(slot: Ns2Slot, names?: Record<string, string>): SynthCardModel {
  const s = slot.synth;
  const isSample = s.osc === 'SAMPLE';
  const osc = isSample ? (names?.[ns2SampleKey(slot.id, 'Synth')] ?? 'Sample') : s.osc;
  return {
    id: slot.id,
    source: isSample ? 'sample' : 'analog',
    osc,
    oscDetail: '',
    filterType: s.filter.type,
    cutoff: s.filter.freq,
    res: lin10(s.filter.resonanceMidi),
  };
}

function synthStatsNs2(slot: Ns2Slot): Stat[] {
  const s = slot.synth;
  const lfo = [s.lfoWave, s.lfoRate].filter(Boolean).join(' · ');
  return statList(
    stat('voice', s.voice),
    stat('glide', s.glide),
    stat('unison', s.unison),
    stat('vibrato', s.vibrato),
    stat('keytrack', s.filter.kbTrack),
    stat('LFO', lfo),
    s.arpEnabled ? stat('arp', [s.arpRange, s.arpPattern, s.arpRate].filter(Boolean).join(' · ') || 'on') : null,
  );
}

/** One EngineCardModel per active engine in the slot (organ, piano, synth order). */
export function ns2EngineCards(slot: Ns2Slot, names?: Record<string, string>): EngineCardModel[] {
  const cards: EngineCardModel[] = [];
  if (slot.organ.on) {
    cards.push({ kind: 'organ', title: 'ORGAN', volume: volume(slot.organ.volume), organ: organCard(slot) });
  }
  if (slot.piano.on) {
    cards.push({
      kind: 'piano', title: 'PIANO', volume: volume(slot.piano.volume),
      piano: pianoCardNs2(slot, names), stats: pianoStatsNs2(slot),
    });
  }
  if (slot.synth.on) {
    cards.push({
      kind: 'synth', title: 'SYNTH', volume: volume(slot.synth.volume),
      synth: synthCardNs2(slot, names),
      env: envCurve(slot.synth.ampEnv),
      modEnv: envCurve(slot.synth.modEnv) ?? undefined,
      stats: synthStatsNs2(slot),
    });
  }
  return cards;
}

/** Chip detail: type first, then any present amount/rate/mix/feedback param. */
function fxDetail(fx: Ns2Fx): string {
  const parts: string[] = [];
  if (fx.type) parts.push(fx.type);
  const p = fx.params ?? {};
  if (p.amount !== undefined) parts.push(`amt ${p.amount}`);
  if (p.rate !== undefined) parts.push(`rate ${p.rate}`);
  if (p.mix !== undefined) parts.push(`mix ${p.mix}`);
  if (p.feedback !== undefined) parts.push(`fb ${p.feedback}`);
  return parts.join(' · ') || 'on';
}

export function ns2SlotFxChips(slot: Ns2Slot): FxChipModel[] {
  return slot.fx.map((fx) => ({ key: `${slot.id}-${fx.name}`, label: fx.name, detail: fxDetail(fx) }));
}

export function ns2GlobalFxChips(globalFx: Ns2Fx[]): FxChipModel[] {
  return globalFx.map((fx) => ({ key: `g-${fx.name}`, label: fx.name, detail: fxDetail(fx) }));
}

export function ns2SampleRefs(slots: Ns2Slot[], names: Record<string, string>): { key: string; label: string }[] {
  const refs: { key: string; label: string }[] = [];
  for (const s of slots) {
    const piano = names[ns2SampleKey(s.id, 'Piano')];
    if (s.piano.on && piano) refs.push({ key: `${s.id}-pno`, label: piano });
    const synth = names[ns2SampleKey(s.id, 'Synth')];
    if (s.synth.on && s.synth.osc === 'SAMPLE' && synth) refs.push({ key: `${s.id}-syn`, label: synth });
  }
  return refs;
}

const KIND_ORDER = ['organ', 'piano', 'synth'] as const;

export function ns2HeaderView(bytes: Uint8Array, slots: Ns2Slot[]): HeaderView {
  const info = identifyNordFile(bytes);
  const summary = slots.map((s) => {
    const kinds = KIND_ORDER.filter((k) =>
      (k === 'organ' && s.organ.on) || (k === 'piano' && s.piano.on) || (k === 'synth' && s.synth.on));
    return `Slot ${s.id}: ${kinds.length ? kinds.join(' + ') : 'empty'}`;
  }).join(' · ');
  return {
    name: info.slot ?? 'Unnamed',
    slot: info.slot ?? '—',
    category: info.categoryName ?? '—',
    version: info.version ? `v${info.version}` : '—',
    sizeBytes: bytes.length,
    summary,
  };
}
