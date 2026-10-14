/**
 * Stage 4 *preset* decoder — organ (`.ns4o`), piano (`.ns4n`) and synth
 * (`.ns4y`) presets.
 *
 * A Stage 4 preset is a single engine voice: a 49-byte CBIN preamble followed by
 * that engine's **layer-A parameter block, byte-for-byte identical to the layout
 * inside a full `.ns4p` program** — just relocated to a lower base. So we decode
 * a preset by reusing the program parameter map ({@link buildPortParamMap}), keeping
 * only the target engine group's params, shifting each param's layer-A bit
 * location down by the engine's fixed offset, and running the same
 * decode+interpret pipeline the Program view uses.
 *
 * The shifts equal `(program group start) − 49` — every engine block relocates
 * to byte 49 in the preset. They were reverse-engineered against the factory
 * preset fixtures and validated by ground truth: organ drawbar registrations +
 * model (B3), piano model names (Amber Upright XL, Wurlitzer 1…), and synth
 * oscillator/filter (Pure Saw, LP12…). See the maintainers’ notes and preset.test.ts.
 */
import { buildPortParamMap, type Param, type ParamLayer } from './maps';
import { decodeAllParams } from './coverage';
import { collapseMorphs, type ParamRow } from './params-view';
import { identifyNordFile } from '../clavia/nord-file';
import { decodeNs4Engines } from './parse';
import type { NS4Layer } from './types';

const LETTERS = ['A', 'B', 'C'] as const;

export type PresetEngine = 'organ' | 'piano' | 'synth';

/** Tag → engine group + byte shift (program group start − 49). Layer A only:
 *  a preset is a single voice, so the map's B/C layers don't apply. */
const PRESET_SPEC: Record<string, { engine: PresetEngine; group: 'o' | 'p' | 'y'; shift: number }> = {
  ns4o: { engine: 'organ', group: 'o', shift: 45 },  // organ block:  program byte 94  → 49
  ns4n: { engine: 'piano', group: 'p', shift: 180 }, // piano block:  program byte 229 → 49
  ns4y: { engine: 'synth', group: 'y', shift: 327 }, // synth block:  program byte 376 → 49
};

/** One enabled voice inside a preset. A Stage 4 synth preset stacks 1–3 layers
 *  (a "single" vs a "section" sound); organ up to 2. Only enabled layers appear. */
export interface PresetLayer {
  letter: 'A' | 'B' | 'C';
  /** Per-voice summary (osc/filter, model, registration…). */
  headline?: string;
  /** This layer's parameters, morph variants collapsed into ✎ badges. */
  rows: ParamRow[];
  /** The same voice in the Program model, so the Program cards can render it. */
  model?: NS4Layer;
}

export interface Ns4Preset {
  engine: PresetEngine;
  /** The enabled voices (1–3). */
  layers: PresetLayer[];
}

/** The parenthesized human label from an interpreted value like
 *  "0320440865 (Amber Upright XL)" → "Amber Upright XL"; else the raw display. */
function label(display: string | undefined): string | undefined {
  return named(display) ?? display;
}

/** Only the parenthesized label, or undefined when the value carries none. */
const named = (display: string | undefined) => display?.match(/\(([^)]+)\)/)?.[1];

function headlineFor(engine: PresetEngine, rows: ParamRow[]): string | undefined {
  const find = (name: string) => rows.find((r) => r.name === name)?.display;
  if (engine === 'organ') {
    const model = find('organ model');
    const bars = Array.from({ length: 9 }, (_, i) => find(`drawbar ${i + 1}`) ?? '–').join('');
    return model ? `${model} · ${bars}` : undefined;
  }
  if (engine === 'piano') {
    return [find('piano type'), label(find('piano model ID/name'))].filter(Boolean).join(' · ') || undefined;
  }
  // synth: sound source + filter give the clearest at-a-glance identity. The
  // source is the sample, the analog wave, or — when the wave has no name (FM,
  // wavetable) — the oscillator type; never the bare wave number.
  const source = find('samples/analog') === 'analog'
    ? named(find('analog wave/partial (knob 3)')) ?? named(find('analog type (knob 1)'))
    : named(find('sample ID/name'));
  return [source, find('filter type')].filter(Boolean).join(' · ') || undefined;
}

/**
 * Decode a Stage 4 organ/piano/synth preset. Returns null when the file isn't a
 * Stage 4 preset (a program, a sample, or an older ns3y/ns2s preset we don't
 * decode yet) — callers fall back to the metadata-only view.
 */
export function parseNs4Preset(bytes: Uint8Array): Ns4Preset | null {
  const spec = PRESET_SPEC[identifyNordFile(bytes).tag];
  if (!spec) return null;

  const db = spec.shift * 8;
  const maxBit = bytes.length * 8;
  // Relocate the engine block, every layer at once. A layer that falls outside
  // the file is marked absent (begBit -1) rather than dropped, so the remaining
  // ones keep their letters. The firmware-layout parameters are left out: the single
  // shift per engine was validated for the ported map only.
  const move = (a: ParamLayer): ParamLayer => {
    const begBit = a.begBit - db, endBit = a.endBit - db;
    return begBit >= 0 && endBit < maxBit ? { ...a, begBit, endBit } : { ...a, begBit: -1 };
  };
  const relocated: Param[] = buildPortParamMap().filter((p) => p.group === spec.group).map((p) => ({
    ...p,
    layers: p.layers.map(move),
    ...(p.morphOf ? { morphOf: { ...p.morphOf, base: p.morphOf.base.map(move) } } : {}),
  }));
  const layerCount = relocated.reduce((n, p) => Math.max(n, p.layers.length), 1);
  const decoded = decodeAllParams(bytes, relocated);

  // One decode feeds both views of a voice: the Program layer model (its builder
  // looks params up by their "[A]/[B]" names) and the flat rows, where that
  // suffix is dropped so names read clean and morph variants collapse.
  const models = decodeNs4Engines(decoded).layers;
  const modelFor = (letter: string) => models.find((m) => m.id === letter);
  const decodeLayer = (L: number): ParamRow[] => collapseMorphs(
    decoded.filter((d) => d.layer === L).map((d) => ({ ...d, name: d.baseName, layer: 0 })),
  );

  const layers: PresetLayer[] = [];
  for (let L = 0; L < layerCount; L++) {
    const rows = decodeLayer(L);
    const on = rows.find((r) => r.name === 'layer on/off')?.display;
    // Include an enabled layer; always keep A if the file carries no on/off flag.
    if (on === 'on' || (L === 0 && on === undefined)) {
      layers.push({ letter: LETTERS[L], headline: headlineFor(spec.engine, rows), rows, model: modelFor(LETTERS[L]) });
    }
  }
  // Defensive: if nothing reported enabled, still show layer A.
  if (layers.length === 0) {
    const rows = decodeLayer(0);
    layers.push({ letter: 'A', headline: headlineFor(spec.engine, rows), rows, model: modelFor('A') });
  }

  return { engine: spec.engine, layers };
}
