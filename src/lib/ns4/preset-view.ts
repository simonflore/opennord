/**
 * Preset → Program-view models. A Stage 4 preset is one engine's block out of a
 * program (see preset.ts), so it renders with the same cards and FX chips the
 * Program view uses — this file only adapts a decoded preset to those shapes.
 */
import type { EngineCardModel, FxChipModel } from '../clavia/engine-view';
import { envCurve } from '../clavia/engine-view';
import type { NS4Program } from './types';
import type { Ns4Preset } from './preset';
import type { ParamRow } from './params-view';
import { engineCardModel, fxChips } from './view';

export interface PresetVoiceView {
  letter: 'A' | 'B' | 'C';
  card: EngineCardModel;
  /** Effects switched on for this voice. Organ presets carry none: the organ's
   *  effects are program-wide, outside the preset's block. */
  fxChips: FxChipModel[];
}

/** One card + FX row per enabled voice of the preset. */
export function presetVoices(preset: Ns4Preset): PresetVoiceView[] {
  const single = preset.layers.length === 1;
  const out: PresetVoiceView[] = [];
  for (const layer of preset.layers) {
    const l = layer.model;
    if (!l) continue;
    // Rotary and vib/chorus type are program-wide organ settings — not in a preset.
    const base = engineCardModel(l, undefined, false);
    const title = single ? preset.engine.toUpperCase() : `${preset.engine.toUpperCase()} · ${layer.letter}`;
    const card: EngineCardModel = base.kind === 'synth'
      ? { ...base, title, filterEnv: envCurve(l.filter?.env) ?? undefined }
      : { ...base, title };
    // fxChips reads a program; hand it this one voice, switched on. Its labels
    // name the engine ("Synth Reverb") to tell a program's engines apart — a
    // preset has one engine, so drop that word.
    const one: NS4Program = { parsed: true, kind: 'program', layers: [{ ...l, enabled: true }], bytes: new Uint8Array(0), warnings: [] };
    const chips = fxChips(one, 'I').map((c) => ({ ...c, label: c.label.replace(/^\S+ /, '') }));
    out.push({ letter: layer.letter, card, fxChips: chips });
  }
  return out;
}

export interface PresetParamSection { key: string; label: string; rows: ParamRow[]; }

/** Panel sections, in the order they read on the instrument; first match wins. */
const SECTIONS: Array<[key: string, label: string, match: RegExp]> = [
  ['fx', 'Effects', /^FX /],
  ['drawbars', 'Drawbars', /^drawbar /],
  ['perc', 'Percussion & vibrato', /^(perc|vib\/chorus)/],
  ['filter', 'Filter', /^filter /],
  ['env', 'Envelopes', /^(amp env|osc env)/],
  ['lfo', 'LFO & vibrato', /^(LFO|vibrato)/],
  ['arp', 'Arpeggiator', /^(arp|KB sync|KB hold)/],
  ['extern', 'Extern', /^extern /],
];
const ORDER = ['sound', 'drawbars', 'perc', 'filter', 'env', 'lfo', 'arp', 'fx', 'extern'];
const LABEL: Record<string, string> = { sound: 'Sound', ...Object.fromEntries(SECTIONS.map(([k, l]) => [k, l])) };

/** Split a voice's parameters into panel sections for the full reference list. */
export function presetParamSections(rows: ParamRow[]): PresetParamSection[] {
  const by = new Map<string, ParamRow[]>();
  for (const r of rows) {
    const key = SECTIONS.find(([, , re]) => re.test(r.name))?.[0] ?? 'sound';
    (by.get(key) ?? by.set(key, []).get(key)!).push(r);
  }
  return ORDER.filter((k) => by.has(k)).map((k) => ({ key: k, label: LABEL[k], rows: by.get(k)! }));
}
