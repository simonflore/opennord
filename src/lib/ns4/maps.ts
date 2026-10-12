/**
 * Nord Stage 4 parameter offset map — types + accessor.
 *
 * The base DATA (406 parameters across master/organ/piano/synth) is generated
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
import { ns4FirmwareFixes, ns4FirmwareParams } from './firmware-params';

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
  /** Value text for a raw field, where the id-keyed value tables have no entry (firmware parameters). */
  display?: (raw: number) => string;
  /** Body format version (×100) that introduced the parameter; older files don't carry it. */
  since?: number;
  /** Identified, but not something a player sets or reads: kept out of the product's parameter lists. */
  internal?: boolean;
  /**
   * A morph row read at its full width: `layers` hold the whole delta, stored as
   * delta + `span`, of the parameter at `base` (its full-width bits, per layer). The
   * row shows what parameter `baseId` would show at (base + delta) >> `shift`.
   */
  morphOf?: { baseId: string; base: ParamLayer[]; span: number; shift: number };
}

/**
 * The full Nord Stage 4 parameter map (all four engines) — the single canonical
 * map every consumer (decoder, coverage, views) uses. Composed from three sources:
 * the generated ns4decode port (`NS4_OFFSET_MAP`, regenerable, do-not-hand-edit),
 * with what the firmware layout corrects (`ns4FirmwareFixes`); our corpus-RE'd
 * additions (`NS4_EXTRA_PARAMS`); and the parameters only the firmware layout names
 * (`ns4FirmwareParams`). Kept as separate source files for provenance + so
 * regenerating the port never clobbers the rest. Built once, shared and frozen.
 */
export function buildParamMap(): Param[] {
  return (_paramMap ??= frozen([...buildPortParamMap(), ...ns4FirmwareParams()]));
}
let _paramMap: Param[] | undefined;

/**
 * The map without the firmware-layout parameters: the port (corrected) and the
 * corpus-RE'd extras. The single-engine preset reader uses it, because its one
 * shift per engine was validated for these parameters only (ns4/preset.ts).
 */
export function buildPortParamMap(): Param[] {
  const fixes = ns4FirmwareFixes();
  // Copies: freezing must not reach into the exported generated constants.
  const copy = (p: Param): Param => ({ ...p, layers: p.layers.map((l) => ({ ...l })) });
  return (_portMap ??= frozen([
    ...NS4_OFFSET_MAP.map((p) => (p.id in fixes ? { ...p, ...fixes[p.id] } : copy(p))),
    ...NS4_EXTRA_PARAMS.map(copy),
  ]));
}
let _portMap: Param[] | undefined;

/** Freeze a shared map down to its layers, so a caller that edits it fails loudly instead of changing every reader's map. */
function frozen(map: Param[]): Param[] {
  for (const p of map) {
    for (const l of p.layers) Object.freeze(l);
    Object.freeze(p.layers);
    if (p.morphOf) {
      for (const l of p.morphOf.base) Object.freeze(l);
      Object.freeze(p.morphOf.base);
      Object.freeze(p.morphOf);
    }
    Object.freeze(p);
  }
  return Object.freeze(map) as Param[];
}
