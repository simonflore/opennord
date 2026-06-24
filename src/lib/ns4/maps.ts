/**
 * Nord Stage 4 parameter offset map — types + accessor.
 *
 * The DATA (all 406 parameters across master/organ/piano/synth) is generated
 * from ns4decode's bitmaps (Randy, MIT — see offset-map.generated.ts and
 * THIRD_PARTY_LICENSES.md). This file owns the types and the public accessor.
 *
 * Each parameter is a name + a bit range per layer (master=1 layer, organ/piano=2,
 * synth=3). The Decode Inspector overlays these on the raw file to show what's
 * decoded vs. still a gap. The remaining work is the *interpretation* layer
 * (raw integer → "Grand", "3.7 kHz", …), ported from ns4names.py.
 */

import { NS4_OFFSET_MAP } from './offset-map.generated';
import { NS4_EXTRA_PARAMS } from './extra-params';

export type Ns4Group = 'm' | 'o' | 'p' | 'y';

export interface ParamLayer {
  begBit: number;
  endBit: number;
}

export interface Param {
  /** Stable id = layer-A location string (ns4maps convention, e.g. "230-7"). */
  id: string;
  name: string;
  group: Ns4Group;
  layers: ParamLayer[];
}

/**
 * The full Nord Stage 4 parameter map (all four engines) — the single canonical
 * map every consumer (decoder, coverage, views) uses. Composed from two sources:
 * the generated ns4decode port (`NS4_OFFSET_MAP`, regenerable, do-not-hand-edit)
 * plus our corpus-RE'd additions (`NS4_EXTRA_PARAMS`). Kept as separate source
 * files for provenance + so regenerating the port never clobbers our RE.
 */
export function buildParamMap(): Param[] {
  return [...NS4_OFFSET_MAP, ...NS4_EXTRA_PARAMS];
}
