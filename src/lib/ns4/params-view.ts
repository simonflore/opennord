/**
 * Reorganizes the flat decoded-parameter dump into a navigable reference:
 * collapses the "X with wheel/A.T./ctrlped" morph rows into their base row (the
 * thing that makes the 883 count so large), groups by section, and supports
 * search. Pure derivations from DecodedParam[] — unit-tested against the fixture.
 */
import type { DecodedParam } from './coverage';

export interface ParamRow {
  name: string;
  display: string;
  group: DecodedParam['group'];
  layer: number;
  /** Assigned morph targets only (unassigned "none" rows are dropped). */
  morphs: { wheel?: string; at?: string; pedal?: string };
}

const MORPH_SUFFIX: Array<[RegExp, keyof ParamRow['morphs']]> = [
  [/ with wheel$/, 'wheel'],
  [/ with A\.T\.$/, 'at'],
  [/ with ctrlped$/, 'pedal'],
];

const isMorph = (name: string) => MORPH_SUFFIX.find(([re]) => re.test(name));
const key = (name: string, layer: number, group: string) => `${group}:${layer}:${name}`;

/** Collapse the three morph variants of each param into one base row with badges. */
export function collapseMorphs(params: DecodedParam[]): ParamRow[] {
  const base = new Map<string, ParamRow>();
  for (const p of params) {
    if (isMorph(p.name)) continue;
    base.set(key(p.name, p.layer, p.group), {
      name: p.name, display: p.display, group: p.group, layer: p.layer, morphs: {},
    });
  }
  for (const p of params) {
    const hit = isMorph(p.name);
    if (!hit) continue;
    if (p.display === 'none' || p.display.trim() === '') continue; // unassigned
    const row = base.get(key(p.name.replace(hit[0], ''), p.layer, p.group));
    if (row) row.morphs[hit[1]] = p.display;
  }
  return [...base.values()];
}

const META = new Set(['file type', 'file version', 'file version again', 'bank', 'location in bank', 'checksum']);
const GROUP_LABEL: Record<string, string> = { file: 'File', m: 'Master / Global', o: 'Organ', p: 'Piano', y: 'Synth' };
const GROUP_ORDER = ['file', 'm', 'o', 'p', 'y'];

export interface ParamGroup { key: string; label: string; rows: ParamRow[]; }

const groupKey = (r: ParamRow) => (META.has(r.name) ? 'file' : r.group);

/** Bucket rows into ordered sections (File, Master, Organ, Piano, Synth). */
export function groupParams(rows: ParamRow[]): ParamGroup[] {
  const by = new Map<string, ParamRow[]>();
  for (const r of rows) {
    const g = groupKey(r);
    (by.get(g) ?? by.set(g, []).get(g)!).push(r);
  }
  const ordered = GROUP_ORDER.filter((g) => by.has(g));
  const extras = [...by.keys()].filter((g) => !GROUP_ORDER.includes(g));
  return [...ordered, ...extras].map((g) => ({ key: g, label: GROUP_LABEL[g] ?? g, rows: by.get(g)! }));
}

/** Case-insensitive filter over name + value. */
export function filterRows(rows: ParamRow[], query: string): ParamRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => r.name.toLowerCase().includes(q) || r.display.toLowerCase().includes(q));
}

/** Layer index → keyboard letter (A/B/C); empty for master (single layer). */
export function layerLetter(n: number): string {
  return n >= 0 && n <= 2 ? ['A', 'B', 'C'][n] : '';
}
