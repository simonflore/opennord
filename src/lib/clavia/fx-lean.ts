/**
 * Effect units for the firmware field families several models share. A family
 * is a set of registry field names (`effects.fx1Rate`, `effects.dlyMix` …) that
 * appears unchanged in more than one model's layout; each model supplies only
 * its own display-text tables. Values with no table are the stored numbers, on
 * knobs placed by the registry's range. Pure: takes a field reader, no model
 * imports.
 */
import type { KeyItem } from './engine-view';
import { fxKnobs, fxParam, fxStored, fxType, sourceLeds } from './fw-present';
import { mergeEqualChains, type FxGroupView, type FxParamView, type FxUnitView } from './fx-view';

/** Reads one decoded field by its layout key; undefined when the file does not have it. */
export type FieldGet = (key: string) => number | undefined;

/** A model's display texts for the shared rack family. */
export interface RackTables {
  fx1: readonly string[];
  fx2: readonly string[];
  speaker: readonly string[];
  reverb: readonly string[];
  /** The source selector's engine by stored value; a gap is a value the model does not use. Omit when the values are not named. */
  sources?: readonly (string | undefined)[];
  /** The reverb's colour by stored value, for the models that have one in place of the Bright switch. */
  reverbColor?: readonly string[];
}

const sw = (label: string, v: number | undefined): KeyItem[] => (v === undefined ? [] : [{ label, on: v === 1 }]);
const some = <T,>(xs: T[]): T[] | undefined => (xs.length > 0 ? xs : undefined);

/** A block's source: LEDs when the model names its values, else the stored number as a readout. */
function sourceOf(t: RackTables, v: number | undefined): { source?: KeyItem[]; readout?: FxParamView } {
  return t.sources ? { source: sourceLeds(t.sources, v) } : { readout: fxStored('Source', v) };
}

/**
 * The one effect rack of the Electro 6, Piano 4, Piano 5 and Grand: Effect 1,
 * Effect 2, Delay, Speaker/Comp, EQ, Reverb, in panel order. Ranges are the
 * registry's: rates and amounts 0–127, delay rate 0–16383, delay feedback 0–3,
 * EQ bands −60…60.
 */
export function rackUnits(get: FieldGet, t: RackTables): FxUnitView[] {
  const e = (k: string) => get(`effects.${k}`);
  const unit = (
    key: string, label: string, type: string | undefined, params: (FxParamView | undefined)[], switches: KeyItem[], src?: string,
  ): FxUnitView => {
    const s = src ? sourceOf(t, e(src)) : {};
    return {
      key, label, on: e(`${key}Enable`) === 1,
      type,
      params: fxKnobs(...params, s.readout),
      switches: some(switches),
      source: s.source,
    };
  };
  const color = t.reverbColor && e('rvbColor') !== undefined
    ? { label: 'Color', value: fxType(t.reverbColor, e('rvbColor')) ?? '' } : undefined;
  return [
    unit('fx1', 'Effect 1', fxType(t.fx1, e('fx1Type')), [fxParam('Rate', e('fx1Rate'), 0, 127)], sw('Ped Ctrl', e('fx1PedCtrl')), 'fx1Src'),
    unit('fx2', 'Effect 2', fxType(t.fx2, e('fx2Type')), [fxParam('Rate', e('fx2Rate'), 0, 127)], sw('Deep', e('fx2Deep')), 'fx2Src'),
    unit('dly', 'Delay', undefined, [
      fxParam('Rate', e('dlyRate'), 0, 16383), fxParam('Mix', e('dlyMix'), 0, 127), fxParam('Feedback', e('dlyFeedback'), 0, 3),
    ], sw('Ping Pong', e('dlyPingPong')), 'dlySrc'),
    unit('spk', 'Speaker/Comp', fxType(t.speaker, e('spkType')), [fxParam('Amount', e('spkAmt'), 0, 127)], [], 'spkSrc'),
    unit('eql', 'EQ', undefined, [
      fxParam('Bass', e('eqlBass'), -60, 60), fxParam('Mid', e('eqlMid') ?? e('eqlMidGain'), -60, 60),
      fxParam('Mid Freq', e('eqlMidFreq'), 0, 127), fxParam('Treble', e('eqlTreble'), -60, 60),
    ], [], 'eqlSrc'),
    unit('rvb', 'Reverb', fxType(t.reverb, e('rvbType')), [fxParam('Amount', e('rvbAmt'), 0, 127), color],
      [...sw('Bright', e('rvbBright')), ...sw('Chorale', e('rvbChorale'))]),
  ];
}

/** A model's display texts for the shared layer-chain family. */
export interface ChainTables {
  fx1: readonly string[];
  fx2: readonly string[];
  amp: readonly string[];
  delayFilter: readonly string[];
  reverb: readonly string[];
  reverbColor: readonly string[];
}

/** The program's one reverb (the `common.effectsRvb*` fields); `amount` is a layer's own send, when drawn for a layer. */
function chainReverb(get: FieldGet, t: ChainTables, key: string, amount?: FxParamView): FxUnitView {
  const c = (k: string) => get(`common.effectsRvb${k}`);
  const color = c('Color') === undefined ? undefined : { label: 'Color', value: fxType(t.reverbColor, c('Color')) ?? '' };
  const type = fxType(t.reverb, c('Type'));
  const switches = [...sw('Chorale', c('Chorale')), ...sw('Pre-Delay', c('PreDelay'))];
  return {
    key, label: 'Reverb', on: c('Enable') === 1,
    type,
    params: fxKnobs(amount, color),
    switches: some(switches),
  };
}

/**
 * One layer's chain on the Piano 6 and Grand 2: Effect 1, Effect 2, Delay, Amp,
 * Comp, EQ, and the program's reverb with the layer's own amount. `blk` is the
 * layer's block (`pianoFxA` …). Ranges are the registry's: rates, amounts and
 * delay feedback 0–127, delay rate 0–16383, EQ bands −60…60.
 */
export function layerChainUnits(get: FieldGet, blk: string, t: ChainTables): FxUnitView[] {
  const e = (k: string) => get(`${blk}.${k}`);
  const unit = (key: string, label: string, type: string | undefined, params: (FxParamView | undefined)[], switches: KeyItem[]): FxUnitView => ({
    key: `${blk}-${key}`, label, on: e(`${key}Enable`) === 1,
    type,
    params: fxKnobs(...params),
    switches: some(switches),
  });
  const readout = (label: string, text: string | undefined): FxParamView | undefined => (text === undefined ? undefined : { label, value: text });
  return [
    unit('fx1', 'Effect 1', fxType(t.fx1, e('fx1Type')),
      [fxParam('Rate', e('fx1Rate'), 0, 127), fxParam('Amount', e('fx1Amt'), 0, 127)], sw('Pedal', e('fx1PedalEnable'))),
    unit('fx2', 'Effect 2', fxType(t.fx2, e('fx2Type')),
      [fxParam('Rate', e('fx2Rate'), 0, 127), fxParam('Amount', e('fx2Amt'), 0, 127)], sw('Mono', e('fx2Mono'))),
    unit('dly', 'Delay', undefined, [
      fxParam('Rate', e('dlyRate'), 0, 16383), fxParam('Mix', e('dlyMix'), 0, 127), fxParam('Feedback', e('dlyFeedback'), 0, 127),
      readout('Filter', fxType(t.delayFilter, e('dlyFltType'))),
      // Ping pong has four stored settings (0–3) that are not named yet.
      fxStored('Ping Pong', e('dlyPingPong')),
    ], sw('Flam', e('dlyFlam'))),
    unit('amp', 'Amp', fxType(t.amp, e('ampType')), [fxParam('Drive', e('ampDrive'), 0, 127)], sw('Alt Tone', e('ampAltTone'))),
    unit('cmp', 'Comp', undefined, [fxParam('Amount', e('cmpAmt'), 0, 127)], []),
    unit('eq', 'EQ', undefined, [
      fxParam('Bass', e('eqBass'), -60, 60), fxParam('Mid', e('eqMid'), -60, 60),
      fxParam('Mid Freq', e('eqMidFreq'), 0, 127), fxParam('Treble', e('eqTreble'), -60, 60),
    ], []),
    chainReverb(get, t, `${blk}-rvb`, fxParam('Amount', e('rvbAmt'), 0, 127)),
  ];
}

/**
 * The rows of a Piano 6 / Grand 2 program: one per layer that plays, layers that
 * look alike merged. With no layer playing, the reverb still gets a row.
 */
export function layerChainGroups(
  get: FieldGet, layers: { blk: string; label: string; kind: 'piano' | 'synth'; on: boolean }[], t: ChainTables,
): FxGroupView[] {
  const rows: FxGroupView[] = layers.filter((l) => l.on)
    .map((l) => ({ key: l.blk, label: l.label, kind: l.kind, units: layerChainUnits(get, l.blk, t) }));
  if (rows.length === 0) return [{ key: 'reverb', label: 'Reverb', units: [chainReverb(get, t, 'rvb')] }];
  return mergeEqualChains(rows);
}
