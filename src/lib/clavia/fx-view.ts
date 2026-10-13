/**
 * The shared, model-agnostic effects view model. An effect *unit* is one block
 * of an instrument's effect section (Effect 1, Delay, Amp/EQ, Reverb …); a
 * *group* is a row of units that belong together (one layer's chain, one rack).
 * Every Nord model's view builder produces this shape and the shared FxPanel
 * draws it. Pure types and helpers: no React, no model imports.
 */
import type { EqShape } from './curves';
import type { KeyItem, MorphMarkView } from './engine-view';

/** One knob or readout on an effect block. */
export interface FxParamView {
  label: string;
  /** Display text, or the raw number as text when the model has no label for it. */
  value: string;
  /** Knob position 0–100; omitted when the value's range is not known. */
  fill?: number;
  morph?: MorphMarkView;
}

/** One block of the instrument's effect section, on or off. */
export interface FxUnitView {
  key: string;
  label: string;
  on: boolean;
  /** The selected type, when the block has a type selector. */
  type?: string;
  params: FxParamView[];
  /** The block's own switches (Ping Pong, Bright, Mst Clk …), lit when on. */
  switches?: KeyItem[];
  eq?: EqShape;
  /** The source selector: one LED per engine the effect can act on. */
  source?: KeyItem[];
}

/** A row of units that belong together. */
export interface FxGroupView {
  key: string;
  /** Row label ("Piano A·B", "Global"); empty for a lone rack. */
  label: string;
  kind?: 'organ' | 'piano' | 'synth';
  units: FxUnitView[];
}

export interface FxPanelView { groups: FxGroupView[] }

/**
 * What "the same chain" compares: what the panel draws. A switched-on unit is
 * all its settings; a switched-off one is drawn as its name only, so the
 * settings it still stores do not keep two rows apart.
 */
const chainOf = (g: FxGroupView): string =>
  JSON.stringify(g.units.map(({ key: _key, ...rest }) => (rest.on ? rest : { label: rest.label, on: false })));

/** "Synth A" + "Synth B" → "Synth A·B"; labels with different names join whole. */
function joinLabels(a: string, b: string): string {
  const cut = a.lastIndexOf(' ');
  const name = cut < 0 ? '' : a.slice(0, cut);
  const bCut = b.lastIndexOf(' ');
  if (name && bCut >= 0 && b.slice(0, bCut) === name) return `${a}·${b.slice(bCut + 1)}`;
  return `${a} / ${b}`;
}

/**
 * Merge neighbouring groups of one engine kind whose chains look the same on
 * the panel, so three identical synth layers read as one row.
 * The merged row keeps the first group's key and units.
 */
export function mergeEqualChains(groups: FxGroupView[]): FxGroupView[] {
  const out: FxGroupView[] = [];
  let lastChain: string | undefined;
  for (const g of groups) {
    const chain = chainOf(g);
    const last = out[out.length - 1];
    if (last && last.kind !== undefined && last.kind === g.kind && lastChain === chain) {
      out[out.length - 1] = { ...last, label: joinLabels(last.label, g.label) };
      continue;
    }
    out.push(g);
    lastChain = chain;
  }
  return out;
}

/** How many units are switched on across these rows. Count unmerged rows: merging folds layers that look alike into one. */
export function unitsOn(groups: FxGroupView[]): number {
  return groups.reduce((n, g) => n + g.units.filter((u) => u.on).length, 0);
}
