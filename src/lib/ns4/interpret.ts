/**
 * Turn a raw parameter integer into its human-readable value.
 *
 * Sources, all ported from ns4decode (Randy, MIT — THIRD_PARTY_LICENSES.md)
 * and validated against the regression fixture:
 *   1. GENERATED_VALUES — exhaustive per-parameter tables (202 params).
 *   2. ENUM_TABLES/PARAM_TABLE — hand-curated enum fallback (by name).
 *   3. Computed handlers for params with formula-based or name-lookup display.
 *
 * Returns null when nothing applies (caller shows the raw integer as-is, which
 * is correct for passthrough params like checksum, extern CC values, etc.).
 */

import { ENUM_TABLES, PARAM_TABLE } from './interpret.generated';
import { GENERATED_VALUES } from './values.generated';
import { PIANO_NAMES, SAMPLE_NAMES, SAMPLE_CATEGORY } from './names.generated';

export function interpretValue(paramId: string, paramName: string, rawval: number): string | null {
  const exact = GENERATED_VALUES[paramId]?.[rawval];
  if (exact !== undefined) return exact;

  switch (paramId) {
    case '009-1':
      return interpretFileType(rawval);
    case '245-5':
      return interpretPianoModelName(rawval);
    case '408-7':
      return interpretSampleInfo(rawval);
    case '410-3':
      return interpretSampleName(rawval);
    case '433-3':
      return buildArpString(rawval, ['.', '>', '.', '.']);
    case '437-3':
      return buildArpString(rawval, ['E', 'q', 'Q', '.']);
    case '441-3':
      return buildArpString(rawval, ['C', 'L', 'R', '.']);
  }

  const table = PARAM_TABLE[paramName];
  if (table) return ENUM_TABLES[table]?.[rawval] ?? null;
  return null;
}

function interpretFileType(raw: number): string {
  const bytes = [(raw >>> 24) & 0xff, (raw >>> 16) & 0xff, (raw >>> 8) & 0xff, raw & 0xff];
  return bytes.map((b) => String.fromCharCode(b)).join('');
}

function interpretPianoModelName(raw: number): string {
  const key = String(raw).padStart(10, '0');
  const name = PIANO_NAMES[raw] ?? 'name unknown';
  return `${key} (${name})`;
}

function interpretSampleInfo(raw: number): string {
  const slotspercat = 100;
  const indexofcat = Math.floor(raw / slotspercat);
  const indexincat1 = (raw % slotspercat) + 1;
  const catname = SAMPLE_CATEGORY[indexofcat] ?? 'name unknown';
  return `slot ${String(indexincat1).padStart(3, ' ')}/${String(slotspercat).padStart(3, ' ')} in cat ${catname}`;
}

function interpretSampleName(raw: number): string {
  const key = String(raw).padStart(10, '0');
  const name = SAMPLE_NAMES[raw] ?? 'name unknown';
  return `${key} (${name})`;
}

function buildArpString(raw: number, chars: string[]): string {
  let tmp = raw;
  const parts: string[] = [];
  for (let n = 0; n < 16; n++) {
    if (n > 0 && n % 4 === 0) parts.push(' ');
    parts.push(chars[tmp % 4] ?? '.');
    tmp = Math.floor(tmp / 4);
  }
  return parts.join('');
}
