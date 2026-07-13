/**
 * Stage 4 *preset* decoder — organ (`.ns4o`), piano (`.ns4n`) and synth
 * (`.ns4y`) presets.
 *
 * A Stage 4 preset is a single engine voice: a 49-byte CBIN preamble followed by
 * that engine's **layer-A parameter block, byte-for-byte identical to the layout
 * inside a full `.ns4p` program** — just relocated to a lower base. So we decode
 * a preset by reusing the program parameter map ({@link buildParamMap}), keeping
 * only the target engine group's params, shifting each param's layer-A bit
 * location down by the engine's fixed offset, and running the same
 * decode+interpret pipeline the Program view uses.
 *
 * The shifts equal `(program group start) − 49` — every engine block relocates
 * to byte 49 in the preset. They were reverse-engineered against the factory
 * preset fixtures and validated by ground truth: organ drawbar registrations +
 * model (B3), piano model names (Amber Upright XL, Wurlitzer 1…), and synth
 * oscillator/filter (Pure Saw, LP12…). See docs/FORMAT.md and preset.test.ts.
 */
import { buildParamMap, type Param } from './maps';
import { decodeAllParams } from './coverage';
import { collapseMorphs, groupParams, type ParamRow, type ParamGroup } from './params-view';
import { identifyNordFile } from '../clavia/nord-file';

export type PresetEngine = 'organ' | 'piano' | 'synth';

/** Tag → engine group + byte shift (program group start − 49). Layer A only:
 *  a preset is a single voice, so the map's B/C layers don't apply. */
const PRESET_SPEC: Record<string, { engine: PresetEngine; group: 'o' | 'p' | 'y'; shift: number }> = {
  ns4o: { engine: 'organ', group: 'o', shift: 45 },  // organ block:  program byte 94  → 49
  ns4n: { engine: 'piano', group: 'p', shift: 180 }, // piano block:  program byte 229 → 49
  ns4y: { engine: 'synth', group: 'y', shift: 327 }, // synth block:  program byte 376 → 49
};

export interface Ns4Preset {
  engine: PresetEngine;
  /** A short musician-facing summary (model / registration), when derivable. */
  headline?: string;
  /** Layer-A parameters, morph variants collapsed into ✎ badges. */
  rows: ParamRow[];
  /** The single engine section, ready to render as a table. */
  groups: ParamGroup[];
}

/** The parenthesized human label from an interpreted value like
 *  "0320440865 (Amber Upright XL)" → "Amber Upright XL"; else the raw display. */
function label(display: string | undefined): string | undefined {
  if (!display) return undefined;
  return display.match(/\(([^)]+)\)/)?.[1] ?? display;
}

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
  // synth: oscillator + filter give the clearest at-a-glance identity.
  return [label(find('analog wave/partial (knob 3)')), find('filter type')].filter(Boolean).join(' · ') || undefined;
}

/**
 * Decode a Stage 4 organ/piano/synth preset. Returns null when the file isn't a
 * Stage 4 preset (a program, a sample, or an older ns3y/ns2y preset we don't
 * decode yet) — callers fall back to the metadata-only view.
 */
export function parseNs4Preset(bytes: Uint8Array): Ns4Preset | null {
  const spec = PRESET_SPEC[identifyNordFile(bytes).tag];
  if (!spec) return null;

  const db = spec.shift * 8;
  const maxBit = bytes.length * 8;
  const shifted: Param[] = buildParamMap()
    .filter((p) => p.group === spec.group)
    .map((p) => {
      const a = p.layers[0]; // layer A — the preset's single voice
      return { ...p, layers: [{ ...a, begBit: a.begBit - db, endBit: a.endBit - db }] };
    })
    .filter((p) => p.layers[0].begBit >= 0 && p.layers[0].endBit < maxBit);

  const rows = collapseMorphs(decodeAllParams(bytes, shifted));
  return { engine: spec.engine, headline: headlineFor(spec.engine, rows), rows, groups: groupParams(rows) };
}
