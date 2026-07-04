/**
 * Curated init defaults applied on top of the donor fixture before a
 * migration's own edits. Purpose: neutralize the donor program so nothing
 * of its sound leaks into params the emitter doesn't set for a given
 * source.
 *
 * Every name below was confirmed present via `findParam(buildParamMap(),
 * group, name)` (see src/lib/ns4/writer.ts) during Task 3 discovery — none
 * are guessed. Values traceable to:
 *   - on/off: src/lib/ns4/values.generated.ts "095-3"/"230-3"/"377-5" =>
 *     { 0: "off", 1: "on" }. 0 = off.
 *   - octave shift: offset-map param exists per group; the Stage 4 panel's
 *     init/center state is "0" (no shift). Raw 0 has no enum entry in
 *     values.generated.ts for these ids, consistent with a signed/centered
 *     raw field whose zero point is unshifted.
 *   - volume (unity 0.0 dB): src/lib/ns4/values.generated.ts ids "095-7"
 *     (organ), "230-7" (piano), "378-3" (synth) all map
 *     `{ ..., 127: "0.0 dB" }` — raw 127 is the top of the 7-bit range and
 *     reads back as unity gain. This CORRECTS the brief's provisional
 *     UNITY_VOLUME=100 guess.
 *   - drawbars: src/lib/ns4/__fixtures__/expected/regressionTest_organ.csv
 *     shows raw drawbar values as literal drawbar-length digits (0-8, e.g.
 *     "drawbar 1 ,  4,  1"); raw 0 is a fully retracted ("in") drawbar,
 *     i.e. silent/neutral.
 *   - organ percussion/vib-chorus off, synth/piano FX off: same on/off
 *     enum as above (0 = off).
 *
 * Organ FX (mod1/mod2/comp/delay/reverb/amp-sim on-off) live in group `m`
 * (master), single layer, named "organ FX ... on/off" — NOT per-layer and
 * NOT in group `o`. Confirmed via the discovery listing; see the task-3
 * report for the full recorded param list. Piano and synth FX on/off are
 * per-layer in their own groups (`p`, `y`) with plain "FX ... on/off" names
 * (no "organ"/"synth" prefix).
 */
import type { RawEdit } from '../ns4/writer';

/** Raw value for 0.0 dB (unity) on the organ/piano/synth volume params. */
const UNITY_VOLUME = 127; // src/lib/ns4/values.generated.ts "095-7"/"230-7"/"378-3"[127] === "0.0 dB"

function perLayer(group: RawEdit['group'], name: string, layers: number, value: number): RawEdit[] {
  return Array.from({ length: layers }, (_, layer) => ({ group, name, layer, value }));
}

export const MIGRATION_DEFAULTS: RawEdit[] = [
  // engines off (organ x2, piano x2, synth x3 layers)
  ...perLayer('o', 'layer on/off', 2, 0),
  ...perLayer('p', 'layer on/off', 2, 0),
  ...perLayer('y', 'layer on/off', 3, 0),
  // unity volumes
  ...perLayer('o', 'volume', 2, UNITY_VOLUME),
  ...perLayer('p', 'volume', 2, UNITY_VOLUME),
  ...perLayer('y', 'volume', 3, UNITY_VOLUME),
  // neutral octave shift
  ...perLayer('o', 'octave shift', 2, 0),
  ...perLayer('p', 'octave shift', 2, 0),
  ...perLayer('y', 'octave shift', 3, 0),
  // organ: drawbars all in (silent), percussion + vib/chorus off
  ...Array.from({ length: 9 }, (_, i) => perLayer('o', `drawbar ${i + 1}`, 2, 0)).flat(),
  ...perLayer('o', 'percussion on/off', 2, 0),
  ...perLayer('o', 'vib/chorus on/off', 2, 0),
  // organ FX: master-scoped (group m), single layer, "organ FX ..." names
  { group: 'm', name: 'organ FX mod 1 on/off', value: 0 },
  { group: 'm', name: 'organ FX mod 2 on/off', value: 0 },
  { group: 'm', name: 'organ FX comp on/off', value: 0 },
  { group: 'm', name: 'organ FX delay on/off', value: 0 },
  { group: 'm', name: 'organ FX reverb on/off', value: 0 },
  { group: 'm', name: 'organ FX amp sim/EQ on/off', value: 0 },
  // piano FX: per-layer (group p)
  ...perLayer('p', 'FX mod 1 on/off', 2, 0),
  ...perLayer('p', 'FX mod 2 on/off', 2, 0),
  ...perLayer('p', 'FX amp sim/EQ on/off', 2, 0),
  ...perLayer('p', 'FX comp on/off', 2, 0),
  ...perLayer('p', 'FX delay on/off', 2, 0),
  ...perLayer('p', 'FX reverb on/off', 2, 0),
  // synth FX: per-layer (group y)
  ...perLayer('y', 'FX mod 1 on/off', 3, 0),
  ...perLayer('y', 'FX mod 2 on/off', 3, 0),
  ...perLayer('y', 'FX amp sim/EQ on/off', 3, 0),
  ...perLayer('y', 'FX comp on/off', 3, 0),
  ...perLayer('y', 'FX delay on/off', 3, 0),
  ...perLayer('y', 'FX reverb on/off', 3, 0),
];
