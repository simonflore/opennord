/**
 * Human → raw inversion over the generated Stage 4 interpret tables.
 * The forward direction lives in ns4/interpret.ts (read-only); migration
 * needs the inverse: given a target label or physical value, find the raw
 * integer whose interpretation matches. Enum params invert by table lookup;
 * continuous params invert by scanning the field's raw range and picking
 * the nearest interpreted value (log-distance for times/frequencies).
 */
import { ENUM_TABLES, PARAM_TABLE } from '../ns4/interpret.generated';
import { interpretValue } from '../ns4/interpret';
import type { Param } from '../ns4/maps';

export function invertEnum(paramName: string, label: string): number | null {
  const tableName = PARAM_TABLE[paramName];
  if (!tableName) return null;
  const table = ENUM_TABLES[tableName];
  if (!table) return null;
  const want = label.trim().toLowerCase();
  for (const [raw, lab] of Object.entries(table)) {
    if (lab.toLowerCase() === want) return Number(raw);
  }
  return null;
}

export function paramWidthBits(p: Param): number {
  const L = p.layers[0];
  return L.endBit - L.begBit + 1;
}

/** Cap scans so 32-bit id fields can never be brute-forced by mistake. */
const MAX_SCAN = 512;

export function nearestRawByInterpretation(
  p: Param,
  target: number,
  parse: (s: string) => number | null,
  opts: { log?: boolean } = {},
): number | null {
  const width = paramWidthBits(p);
  const count = 1 << Math.min(width, 30);
  if (count > MAX_SCAN) return null;
  let best: number | null = null;
  let bestDist = Infinity;
  for (let raw = 0; raw < count; raw++) {
    const s = interpretValue(p.id, p.name, raw);
    if (s == null) continue;
    const v = parse(s);
    if (v == null || (v <= 0 && opts.log)) continue;
    const dist = opts.log
      ? Math.abs(Math.log(Math.max(v, 1e-6)) - Math.log(Math.max(target, 1e-6)))
      : Math.abs(v - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = raw;
    }
  }
  return best;
}
