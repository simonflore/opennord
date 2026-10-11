/**
 * Preset → Program-view models. A Stage 4 preset is one engine's block out of a
 * program (see preset.ts), so it renders with the same cards and FX chips the
 * Program view uses — this file only adapts a decoded preset to those shapes.
 */
import type { EngineCardModel, FxSlotModel } from '../clavia/engine-view';
import type { Ns4Preset } from './preset';
import type { ParamGroup, ParamRow } from './params-view';
import { engineCardModel, layerFxChain, morphRows, type MorphSummaryRow } from './view';

export interface PresetVoiceView {
  letter: 'A' | 'B' | 'C';
  card: EngineCardModel;
  /** This voice's effect chain, on and off. Empty for an organ preset: the
   *  organ's effects are program-wide, outside the preset's block. */
  fx: FxSlotModel[];
  /** Controls the wheel, aftertouch or pedal moves, with where each one lands. */
  morphs: MorphSummaryRow[];
}

/** One card + FX row per enabled voice of the preset. */
export function presetVoices(preset: Ns4Preset): PresetVoiceView[] {
  const engine = preset.engine.toUpperCase();
  const single = preset.layers.length === 1;
  return preset.layers.flatMap((layer) => {
    const l = layer.model;
    if (!l) return [];
    // Rotary and vib/chorus type are program-wide organ settings — not in a preset.
    const card: EngineCardModel = {
      ...engineCardModel(l, undefined, false),
      title: single ? engine : `${engine} · ${layer.letter}`,
    };
    return [{
      letter: layer.letter,
      card,
      fx: l.kind === 'organ' ? [] : layerFxChain(l),
      morphs: morphRows(layer.rows, single ? undefined : `Layer ${layer.letter}`),
    }];
  });
}

/** Panel sections in the order they read on the instrument. A row goes to the
 *  first section whose pattern matches its name; unmatched rows are "Sound". */
const SECTIONS: Array<{ key: string; label: string; match?: RegExp }> = [
  { key: 'sound', label: 'Sound' },
  { key: 'drawbars', label: 'Drawbars', match: /^drawbar / },
  { key: 'perc', label: 'Percussion & vibrato', match: /^(perc|vib\/chorus)/ },
  { key: 'filter', label: 'Filter', match: /^filter / },
  { key: 'env', label: 'Envelopes', match: /^(amp env|osc env)/ },
  { key: 'lfo', label: 'LFO & vibrato', match: /^(LFO|vibrato)/ },
  { key: 'arp', label: 'Arpeggiator', match: /^(arp|KB sync|KB hold)/ },
  { key: 'fx', label: 'Effects', match: /^FX / },
  { key: 'extern', label: 'Extern', match: /^extern / },
];

/** Split a voice's parameters into panel sections for the full reference list. */
export function presetParamSections(rows: ParamRow[]): ParamGroup[] {
  const sectionOf = (r: ParamRow) => SECTIONS.find((s) => s.match?.test(r.name))?.key ?? 'sound';
  return SECTIONS
    .map(({ key, label }) => ({ key, label, rows: rows.filter((r) => sectionOf(r) === key) }))
    .filter((g) => g.rows.length > 0);
}
