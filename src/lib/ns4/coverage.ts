/**
 * Reverse-engineering helpers: what's decoded, what's still a gap, and what
 * changed between two files. Powers the Decode Inspector.
 *
 * The gap-finding workflow: export a program, change ONE setting on the Nord,
 * export again, and `diffBytes` lights up exactly the bytes that moved — that's
 * the unknown parameter's location. `paramsCoveringByte` says whether a byte is
 * already claimed by a known parameter or is virgin territory.
 */

import { bytesToBitString, readField } from './bits';
import { interpretValue } from './interpret';
import { GENERATED_VALUES } from './values.generated';
import { MORPH_BASE, MORPH_NONE } from './morphs.generated';
import { DEP_IDS, DEP_TABLES, DEP_MORPH, DEP_DEFAULT_DEPS } from './deps.generated';
import { ANALOG_CAT_561_8, ANALOG_WAVE_562_4 } from './synth-analog.generated';
import { diffBytes } from '../clavia/diff';
import type { Param } from './maps';

// deps.generated covers osc types FM-H/FM-I/WAVE for the synth knob 2/3 params
// but not ANALOG (type 0); supplement that branch here. Keys are disjoint
// ("0:*" vs the generated "1:*"/"2:*"/"3:*"), so the merge can't collide.
const DEP_TABLES_MERGED: Record<string, Record<string, string>> = {
  ...DEP_TABLES,
  '561-8': { ...ANALOG_CAT_561_8, ...DEP_TABLES['561-8'] },
  '562-4': { ...ANALOG_WAVE_562_4, ...DEP_TABLES['562-4'] },
};

export interface DecodedParam {
  name: string;
  group: Param['group'];
  layer: number;
  begBit: number;
  endBit: number;
  value: number;
  /** Human-readable value where a table applies, else the raw integer. */
  display: string;
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Look up a dep-table entry for a base-level dependent param.
 * If the exact dep-value combo isn't in the domain, DEP_DEFAULT_DEPS provides
 * fallback values (e.g. piano model → 0 for any non-Clavinet model).
 */
function depTableLookup(pid: string, depVals: number[], raw: number): string | null {
  const table = DEP_TABLES_MERGED[pid];
  if (!table) return null;
  const key = [...depVals, raw].join(':');
  let r = table[key];
  if (r !== undefined) return r;
  const fallbacks = DEP_DEFAULT_DEPS?.[pid];
  if (fallbacks) {
    const fbVals = depVals.map((v, i) => (fallbacks[i] !== undefined ? fallbacks[i] : v));
    r = table[[...fbVals, raw].join(':')];
    if (r !== undefined) return r;
  }
  return null;
}

/**
 * Resolve the display of a base dep param or morph-of-dep-param.
 * Called after the pure interpretValue + simple morphDisplay pass.
 */
function depDisplay(
  pid: string,
  rawValue: number,
  layer: number,
  rawById: Record<string, number[]>,
): string | null {
  // Base-level dep param: direct table lookup
  if (pid in DEP_TABLES) {
    const depIds = DEP_IDS[pid] ?? [];
    const depVals = depIds.map((did) => rawById[did]?.[layer] ?? 0);
    return depTableLookup(pid, depVals, rawValue) ?? String(rawValue);
  }

  // Morph of a dep param (or osc-env-amt morph with non-127 offset)
  const morph = DEP_MORPH[pid];
  if (!morph) return null;

  const { basePid, offset, maxRaw } = morph;
  if (rawValue === offset) return MORPH_NONE;

  const baseLayer = (rawById[basePid]?.length ?? 0) > 1 ? layer : 0;
  const baseRaw = rawById[basePid]?.[baseLayer] ?? 0;
  const morphed = clamp(baseRaw + rawValue - offset, 0, maxRaw);

  if (basePid in DEP_TABLES) {
    const baseDepIds = DEP_IDS[basePid] ?? [];
    const baseDepVals = baseDepIds.map((did) => rawById[did]?.[layer] ?? 0);
    return depTableLookup(basePid, baseDepVals, morphed) ?? String(morphed);
  }
  // Base is in GENERATED_VALUES (osc env amt, etc.)
  const genDisplay = GENERATED_VALUES[basePid]?.[morphed];
  if (genDisplay !== undefined) return genDisplay;
  // Passthrough base (extern CC morphs etc.)
  return String(morphed);
}

/**
 * A morph param ("X with wheel/A.T./pedal") displays its base parameter's value
 * shifted by (raw - 127), or "none" when raw == 127. Needs the base's decoded
 * value, hence the two-pass decode. See morphs.generated.ts (validated subset).
 */
function morphDisplay(paramId: string, rawValue: number, layer: number, rawById: Record<string, number[]>): string | null {
  const baseId = MORPH_BASE[paramId];
  if (baseId === undefined) return null;
  if (rawValue === 127) return MORPH_NONE;
  const baseRaw = rawById[baseId]?.[layer];
  if (baseRaw === undefined || Number.isNaN(baseRaw)) return null;
  return GENERATED_VALUES[baseId]?.[clamp(baseRaw + rawValue - 127, 0, 127)] ?? null;
}

/** Decode every known parameter (all layers) from a file's bits. */
export function decodeAllParams(bytes: Uint8Array, map: Param[]): DecodedParam[] {
  const bits = bytesToBitString(bytes);
  // Pass 1: raw value of every param/layer (morphs need their base's value).
  const rawById: Record<string, number[]> = {};
  for (const p of map) {
    rawById[p.id] = p.layers.map((l) => (l.begBit < 0 ? NaN : readField(bits, l.begBit, l.endBit)));
  }
  // Pass 2: interpret (direct table, then morph, then raw).
  const out: DecodedParam[] = [];
  for (const p of map) {
    p.layers.forEach((layer, k) => {
      if (layer.begBit < 0) return;
      const value = rawById[p.id][k];
      let label = Number.isNaN(value) ? null : interpretValue(p.id, p.name, value);
      if (label === null && !Number.isNaN(value)) label = morphDisplay(p.id, value, k, rawById);
      if (label === null && !Number.isNaN(value)) label = depDisplay(p.id, value, k, rawById);
      out.push({
        name: p.layers.length > 1 ? `${p.name} [${'ABC'[k] ?? k}]` : p.name,
        group: p.group,
        layer: k,
        begBit: layer.begBit,
        endBit: layer.endBit,
        value,
        display: label ?? (Number.isNaN(value) ? '—' : String(value)),
      });
    });
  }
  return out;
}

/** The engine that owns a byte (first covering param), for the coverage strip. */
export function groupOfByte(map: Param[], byteIndex: number): Param['group'] | null {
  const ps = paramsCoveringByte(map, byteIndex);
  return ps.length ? ps[0].group : null;
}

/** Byte indices touched by at least one known parameter (any layer). */
export function claimedByteSet(map: Param[], byteLen: number): Set<number> {
  const claimed = new Set<number>();
  for (const p of map) {
    for (const layer of p.layers) {
      if (layer.begBit < 0) continue;
      const first = Math.floor(layer.begBit / 8);
      const last = Math.floor(layer.endBit / 8);
      for (let b = first; b <= last && b < byteLen; b++) claimed.add(b);
    }
  }
  return claimed;
}

/** Contiguous byte ranges NOT yet claimed by any known parameter — the gaps. */
export function gapRanges(map: Param[], byteLen: number): Array<{ start: number; end: number }> {
  const claimed = claimedByteSet(map, byteLen);
  const ranges: Array<{ start: number; end: number }> = [];
  let start = -1;
  for (let b = 0; b < byteLen; b++) {
    const isGap = !claimed.has(b);
    if (isGap && start < 0) start = b;
    if (!isGap && start >= 0) {
      ranges.push({ start, end: b - 1 });
      start = -1;
    }
  }
  if (start >= 0) ranges.push({ start, end: byteLen - 1 });
  return ranges;
}

/** Percentage of bytes claimed by the known map. */
export function coveragePercent(map: Param[], byteLen: number): number {
  if (byteLen === 0) return 0;
  return (claimedByteSet(map, byteLen).size / byteLen) * 100;
}

// Re-export from clavia/diff for back-compat (moved to shared layer)
export { diffBytes };

/** Which known parameters (if any) cover a given byte — names a diff for you. */
export function paramsCoveringByte(map: Param[], byteIndex: number): Param[] {
  return map.filter((p) =>
    p.layers.some(
      (l) => l.begBit >= 0 && Math.floor(l.begBit / 8) <= byteIndex && byteIndex <= Math.floor(l.endBit / 8),
    ),
  );
}
