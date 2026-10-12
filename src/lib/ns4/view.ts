/**
 * Program Studio view-model — pure derivations from NS4Program to display data.
 *
 * No React, no I/O. Components render these plain objects; the Community Library
 * will reuse the same derivations to render any shared patch. Everything here is
 * unit-testable against the regression fixture.
 */
import type { NS4Program, NS4Layer, Morphable, Ns4OrganFx } from './types';
import { decodeAllParams } from './coverage';
import { collapseMorphs, type ParamRow } from './params-view';
import { buildParamMap, type Param } from './maps';
import { readFieldBytes } from './bits';
import { interpretValue } from './interpret';
import { LIBRARY_ENGINES, type EngineKind } from '../clavia/engines';
import { organModelSpec, ORGAN_MODELS } from './organ-models';
import { ns4Engines } from './engines';
import type {
  MorphMarkView, DrawbarView, OrganPanelModel, PianoCardModel, SynthCardModel,
  EnvCurveView, Stat, FxChipModel, FxSlotModel, HeaderView, VolumeView, EngineCardModel, LfoView, ArpView, ArpStepView,
} from '../clavia/engine-view';
import { volumeFill, envCurve } from '../clavia/engine-view';
import { parseHz, waveShapeOf, type WaveShape } from '../clavia/curves';
import { cutoffRaw } from './synth-scaling';
import { fxTypeName, noteValueName } from './fx-names';

export type {
  MorphMarkView, DrawbarView, OrganPanelModel, PianoCardModel, SynthCardModel,
  EnvCurveView, Stat, FxChipModel, HeaderView, VolumeView, EngineCardModel,
} from '../clavia/engine-view';
export { volumeFill, envCurve } from '../clavia/engine-view';

/** Assigned morph targets of a value (wheel / aftertouch / pedal), or undefined
 *  when nothing is assigned — lets a card flag a control that moves in performance. */
export function morphMarks(m?: Morphable<string>): MorphMarkView | undefined {
  if (!m || (!m.wheel && !m.aftertouch && !m.pedal)) return undefined;
  return { wheel: m.wheel, at: m.aftertouch, pedal: m.pedal };
}


/**
 * Layers switched on in the given scene (defaults to the program's saved active
 * scene). A Layer Scene only changes which layers are muted — every sound
 * parameter is shared — so this is just an `enabled` vs `enabledSceneII` filter.
 */
export function activeLayers(p: NS4Program, scene?: 'I' | 'II'): NS4Layer[] {
  const useSceneII = (scene ?? p.activeScene) === 'II';
  return (p.layers ?? []).filter((l) => (useSceneII ? l.enabledSceneII : l.enabled));
}

/** Organ drawbar positions as integers 0–8, for the LED ladder. Non-numeric (e.g. VOX combos) or missing → 0. */
export function drawbarLevels(layer: NS4Layer): number[] {
  return (layer.drawbars ?? []).map((d) => {
    if (!d) return 0;
    const n = parseInt(d.value, 10);
    return Number.isNaN(n) ? 0 : Math.max(0, Math.min(8, n));
  });
}

/** True when Scene I and Scene II enable a different set of layers (a toggle helps). */
export function scenesDiffer(p: NS4Program): boolean {
  return (p.layers ?? []).some((l) => !!l.enabled !== !!l.enabledSceneII);
}

export function headerView(p: NS4Program, scene?: 'I' | 'II'): HeaderView {
  return {
    name: p.name ?? 'Unnamed',
    slot: p.slot ?? '—',
    category: p.category ?? (p.categoryId != null ? `#${p.categoryId}` : '—'),
    version: p.programVersion ? `v${p.programVersion}` : '—',
    sizeBytes: p.bytes.length,
    engines: ns4Engines(p, scene),
  };
}

export interface ProgramZonesView {
  hasSplit: boolean;
  /** Four keyboard zones, left→right; each lists the active layers that sound there. */
  zones: { layers: { kind: string; id: string }[] }[];
  /** Split-point note at each of the three boundaries, or null when that split is off. */
  boundaries: (string | null)[];
  /** Split-point crossfade at each boundary, or null when none / not split. */
  xfade: (string | null)[];
  /** Program transpose amount, or null when off. */
  transpose: string | null;
  /** Program-wide keyboard/performance flags, aggregated over active layers. */
  performance: { pitchStick?: string; sustain: boolean; kbHold: boolean };
}

let _paramMap: ReturnType<typeof buildParamMap> | null = null;
function paramMap() { return (_paramMap ??= buildParamMap()); }

/** Decoded program-level params by display name — the ones not on the typed model. */
function paramLookup(p: NS4Program): Map<string, string> {
  const m = new Map<string, string>();
  for (const d of decodeAllParams(p.bytes, paramMap())) m.set(d.name, d.display);
  return m;
}

/**
 * Which active layers sound in each of the four keyboard zones, from each
 * layer's `kbZones` "[1o]{4}" string. Cheap (no parameter decode), so a library
 * row can use it; `programZones` builds the full split view on top of it.
 */
export function layerZones(p: NS4Program, scene?: 'I' | 'II'): ProgramZonesView['zones'] {
  const active = activeLayers(p, scene);
  return [0, 1, 2, 3].map((z) => ({
    layers: active
      .filter((l) => (l.kbZones ?? '')[z] === '1')
      .map((l) => ({ kind: l.kind ?? '?', id: l.id })),
  }));
}

/** The program's Split switch, read from its one bit (no full parameter decode). */
let _splitSwitch: Param | undefined;
function splitOn(p: NS4Program): boolean {
  const param = (_splitSwitch ??= paramMap().find((q) => q.name === 'split on/off')!);
  const { begBit, endBit } = param.layers[0];
  return interpretValue(param.id, param.name, readFieldBytes(p.bytes, begBit, endBit)) === 'on';
}

export type EngineZones = { kind: EngineKind; cells: boolean[] }[];

/**
 * Per engine, in the Library's piano/organ/synth order, which of the four zones
 * it plays; an engine that plays nowhere is left out. A layer's zones only count
 * with the Split switch on; off, every active engine plays the whole keyboard.
 * Reads the zone flags and that one bit (no parameter decode), so it stays
 * cheap enough for every row of a long list.
 */
export function engineZones(p: NS4Program): EngineZones {
  if (!splitOn(p)) {
    const kinds = new Set(activeLayers(p).map((l) => l.kind));
    return LIBRARY_ENGINES.filter(({ kind }) => kinds.has(kind)).map(({ kind }) => ({ kind, cells: [true, true, true, true] }));
  }
  const zones = layerZones(p);
  return LIBRARY_ENGINES
    .map(({ kind }) => ({ kind, cells: zones.map((z) => z.layers.some((l) => l.kind === kind)) }))
    .filter((r) => r.cells.some(Boolean));
}

/** Whether a zone grid splits the keyboard: some engine plays only part of it. */
export function gridSplits(grid: EngineZones): boolean {
  return grid.some((r) => !r.cells.every(Boolean));
}

/** Whether a program splits the keyboard (see gridSplits). */
export function isSplit(p: NS4Program): boolean {
  return gridSplits(engineZones(p));
}

/**
 * Keyboard split / zone layout: which active layers sound in each of the four
 * zones, the split-point note at each active boundary, and program transpose.
 * Drives the ProgramZones strip.
 */
export function programZones(p: NS4Program, scene?: 'I' | 'II'): ProgramZonesView {
  const active = activeLayers(p, scene);
  const zones = layerZones(p, scene);
  const lut = paramLookup(p);
  const hasSplit = splitOn(p);
  const boundary = (i: number): string | null =>
    hasSplit && lut.get(`KB zones ${i}-${i + 1} split point on/off`) === 'on'
      ? (lut.get(`KB zones ${i}-${i + 1} split point`) ?? null)
      : null;
  const xfade = (i: number): string | null => {
    if (!hasSplit) return null;
    const x = lut.get(`KB zones ${i}-${i + 1} split point Xfade`);
    return x && x !== 'none' ? x : null;
  };
  // Transpose switched on at 0 semitones changes nothing, so it reads as off.
  const amount = lut.get('program transpose amount');
  const transpose = lut.get('program transpose on/off') === 'on' && amount && parseInt(amount, 10) !== 0
    ? amount
    : null;
  const pitchStickLayer = active.find((l) => l.pitchStick?.on);
  const performance = {
    pitchStick: pitchStickLayer ? (pitchStickLayer.pitchStick?.range ?? 'on') : undefined,
    sustain: active.some((l) => l.sustainPedal),
    kbHold: active.some((l) => l.arp?.kbHold),
  };
  return {
    hasSplit, zones,
    boundaries: [boundary(1), boundary(2), boundary(3)],
    xfade: [xfade(1), xfade(2), xfade(3)],
    transpose, performance,
  };
}

/**
 * Pick the vib/chorus type for a model out of the global organFx map, which the
 * decoder stores as one string like "B3->C1; VOX->V2; FARF->C3; PIPE->C1".
 */
export function vibChorusTypeFor(organFx: Ns4OrganFx | undefined, model: string | undefined): string | undefined {
  const raw = organFx?.rotary?.vibChorusType;
  if (!raw || !model) return undefined;
  for (const part of raw.split(';')) {
    const [k, v] = part.split('->').map((s) => s.trim());
    // Use startsWith (not ===): pipe models decode as "PIPE1"/"PIPE2" but the map key is "PIPE".
    if (k && v && model.toUpperCase().startsWith(k.toUpperCase())) return v;
  }
  return undefined;
}

/**
 * Full faithful organ-panel view-model. `isFirstOrgan` controls the shared rotary:
 * it appears only on the first active organ layer, never duplicated.
 */
export function organPanel(l: NS4Layer, organFx: Ns4OrganFx | undefined, isFirstOrgan: boolean): OrganPanelModel {
  const model = l.organModel ?? '—';
  const spec = organModelSpec(l.organModel);
  const isB3 = !!spec;
  const drawbars: DrawbarView[] = (l.drawbars ?? []).map((d, i) => {
    const label = d?.value ?? '0';
    const n = parseInt(label, 10);
    return {
      level: Number.isNaN(n) ? 0 : Math.max(0, Math.min(8, n)),
      label,
      footage: spec?.footages[i],
      color: spec ? spec.colors[i] : 'default',
      morph: morphMarks(d),
    };
  });
  const perc = l.percussion ?? {};
  const r = isFirstOrgan ? organFx?.rotary : undefined;
  return {
    id: l.id,
    model,
    models: ORGAN_MODELS,
    isB3,
    drawbars,
    vibChorus: { on: !!l.vibChorus, type: vibChorusTypeFor(organFx, l.organModel) },
    percussion: {
      applicable: isB3,
      on: !!perc.on,
      harm3rd: !!perc.harm3rd,
      decayFast: !!perc.decayFast,
      volSoft: !!perc.volSoft,
    },
    preset: !!l.organPreset,
    octave: l.octaveShift ?? 0,
    sustain: !!l.organSustain,
    rotary: r ? { on: !!r.on, fast: !!r.fast, drive: r.drive, stop: !!r.stop } : undefined,
  };
}

export function pianoCard(l: NS4Layer): PianoCardModel {
  return {
    id: l.id,
    type: l.pianoType ?? '—',
    model: l.pianoModelName ?? '—',
    timbre: l.timbre ?? '—',
    touch: l.touch ?? '—',
  };
}

const LFO_SHAPES: readonly WaveShape[] = ['triangle', 'square', 'S/H', 'saw', 'inv saw'];
const defined = <T,>(v: T | undefined): v is T => v !== undefined;
/** The values a control morphs to (wheel, aftertouch, pedal), as printed. */
const morphTargets = (m?: Morphable<string>) => [m?.wheel, m?.aftertouch, m?.pedal].filter(defined);

/** The LFO, when it is routed somewhere with a non-zero amount. */
function lfoView(l: NS4Layer): LfoView | undefined {
  const { shape, target, rate, amount } = l.lfo ?? {};
  const wave = LFO_SHAPES.find((s) => s === shape);
  // The amount prints in the target's unit ("0.0", "0 cent"): zero is zero in any of them.
  if (!wave || !target || target === 'nothing' || !rate || !amount || parseFloat(amount.value) === 0) return undefined;
  // Either control may be morphed; the mark names both (the amount's wins a shared source).
  const a = morphMarks(amount), r = morphMarks(rate);
  const morph = a && r ? { wheel: a.wheel ?? r.wheel, at: a.at ?? r.at, pedal: a.pedal ?? r.pedal } : a ?? r;
  return { shape: wave, rate: rate.value, target, amount: amount.value, morph };
}

/** The arpeggiator, when it is running; the step pattern only when the pattern is on. */
function arpView(l: NS4Layer): ArpView | undefined {
  const a = l.arp;
  if (!a?.run) return undefined;
  // Step strings print in groups of four (".>.. ...."), up to 16 steps.
  const accent = (a.accent ?? '').replace(/ /g, ''), pan = (a.pan ?? '').replace(/ /g, '');
  const steps = a.pattern
    ? Array.from({ length: Math.min(a.patternLength ?? 16, accent.length) }, (_, i): ArpStepView => ({
        accent: accent[i] === '>',
        pan: pan[i] === 'L' || pan[i] === 'R' ? pan[i] as 'L' | 'R' : 'C',
      }))
    : undefined;
  // "N.A." is the decoder's placeholder for a rate that doesn't apply in this mode.
  const rate = a.rate?.value === 'N.A.' ? undefined : noteValueName(a.rate?.value);
  return { mode: a.mode, direction: a.direction, rate, range: a.range?.value, steps };
}

/** Where a printed cutoff frequency sits on its knob, 0–100. */
const cutoffFill = (hz: number) => Math.round((cutoffRaw(hz) / 127) * 100);

export function synthCard(l: NS4Layer): SynthCardModel {
  const osc = l.source === 'analog' ? (l.oscType ?? 'analog') : (l.sample?.name ?? 'sample');
  const oscDetail = l.oscWave ? `wave ${l.oscWave}` : (l.oscCategory ? `cat ${l.oscCategory}` : '');
  const f = l.filter;
  const cutoffHz = parseHz(f?.freq?.value);
  // In LP+HP the second knob is the high-pass corner (a frequency), not resonance (0–10).
  const lpHp = f?.type === 'LPHP';
  const secondFill = (v: string | undefined): number | undefined => {
    const n = lpHp ? parseHz(v) : parseFloat(v ?? '');
    if (n === undefined || Number.isNaN(n)) return undefined;
    return lpHp ? cutoffFill(n) : Math.round(n * 10);
  };
  const morphHz = morphTargets(f?.freq).map(parseHz).filter(defined);
  return {
    id: l.id,
    source: l.source ?? 'samples',
    osc,
    oscDetail,
    filterType: f?.type ?? '—',
    cutoff: f?.freq?.value ?? '—',
    res: f?.resonance?.value ?? '—',
    cutoffMorph: morphMarks(f?.freq),
    resMorph: morphMarks(f?.resonance),
    cutoffFill: cutoffHz !== undefined ? cutoffFill(cutoffHz) : undefined,
    resFill: secondFill(f?.resonance?.value),
    cutoffMorphFill: morphHz.map(cutoffFill),
    resMorphFill: morphTargets(f?.resonance).map(secondFill).filter(defined),
    resCaption: lpHp ? 'HP freq' : undefined,
    filter: f?.on && f.type && cutoffHz !== undefined
      ? {
          type: f.type, cutoffHz, morphHz,
          ...(lpHp ? { hpHz: parseHz(f.resonance?.value) } : { res: (secondFill(f.resonance?.value) ?? 0) / 100 }),
        }
      : undefined,
    wave: l.source === 'analog' && l.oscType?.includes('ANALOG') ? waveShapeOf(l.oscWave) : undefined,
    lfo: lfoView(l),
    arp: arpView(l),
  };
}

/** Amp envelope as a curve view, or null when there's no envelope data. */
export function ampEnvCurve(l: NS4Layer): EnvCurveView | null {
  return envCurve(l.ampEnv);
}

/** Assemble the neutral EngineCardModel for one NS4 layer. */
export function engineCardModel(l: NS4Layer, organFx: Ns4OrganFx | undefined, isFirstOrgan: boolean): EngineCardModel {
  const title = `${(l.kind ?? '?').toUpperCase()} · ${l.id}`;
  const volume: VolumeView = {
    value: l.volume?.value ?? '—',
    fill: volumeFill(l.volume?.value),
    morph: morphMarks(l.volume),
  };
  if (l.kind === 'organ') return { kind: 'organ', title, volume, organ: organPanel(l, organFx, isFirstOrgan) };
  if (l.kind === 'piano') return { kind: 'piano', title, volume, piano: pianoCard(l), stats: pianoStats(l) };
  return {
    kind: 'synth', title, volume, synth: synthCard(l), env: ampEnvCurve(l),
    filterEnv: envCurve(l.filter?.env) ?? undefined, stats: synthStats(l),
  };
}

/**
 * Secondary synth parameters worth surfacing on the card, present-only: skips
 * undefined / empty / "off" / "none" / zero so a card stays calm (balanced).
 */
export function synthStats(l: NS4Layer): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const add = (label: string, value?: string | number) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'number' && value === 0) return;
    const v = String(value).trim();
    if (v === '' || v === 'off' || v === 'none' || v === '—' || v === '0.0') return;
    out.push({ label, value: v });
  };
  add('amp A', l.ampEnv?.attack);
  add('amp D', l.ampEnv?.decay);
  add('amp R', l.ampEnv?.release);
  add('flt env', l.filter?.envAmount?.value);
  add('keytrack', l.filter?.track);
  add('drive', l.filter?.drive);
  add('unison', l.unison);
  add('glide', l.glide);
  return out;
}

/** A present-only stat cell: drops undefined/false/0/off/none/empty so cards stay calm. */
function stat(label: string, value: string | number | boolean | undefined): Stat | null {
  if (value === undefined || value === null || value === false) return null;
  if (typeof value === 'number' && value === 0) return null;
  const v = value === true ? 'on' : String(value).trim();
  if (v === '' || v === 'off' || v === 'none' || v === '—' || v === '0.0') return null;
  return { label, value: v };
}
const statList = (...items: (Stat | null)[]): Stat[] => items.filter((s): s is Stat => s !== null);

/** Secondary piano params: string resonance, pedal noise, dynamics, octave, variation. */
export function pianoStats(l: NS4Layer): Stat[] {
  return statList(
    stat('string res', l.stringResonance),
    stat('pedal noise', l.pedalNoise),
    stat('soft release', l.softRelease),
    stat('dynamics', l.dynComp),
    stat('unison', l.unisonLevel),
    stat('octave', l.octaveShift),
    stat('variation', l.pianoModelVariation),
  );
}

// Each chip's detail comes from the effect's real params, not just its name.
const j = (...parts: (string | undefined | false)[]) => parts.filter(Boolean).join(' · ');
const modD = (m: NS4Layer['fxMod1']) => j(fxTypeName(m?.mode), m?.rate?.value, m?.amount?.value && `amt ${m.amount.value}`) || 'on';
// Amp model "off" leaves the slot as an EQ: say that instead of printing "off" on a lit effect.
const ampD = (a: NS4Layer['ampSimEq']) => (a?.mode === 'off' ? 'EQ only' : j(fxTypeName(a?.mode), a?.drive?.value && `drv ${a.drive.value}`) || 'on');
const compD = (c: NS4Layer['comp']) => j(c?.amount && `${c.amount}`, c?.response) || 'on';
const delayD = (d: NS4Layer['delay']) => j(noteValueName(d?.tempo?.value), d?.mix?.value && `mix ${d.mix.value}`, d?.feedback?.value && `fb ${d.feedback.value}`) || 'on';
const revD = (r: NS4Layer['reverb']) => j(fxTypeName(r?.type), r?.amount?.value && `amt ${r.amount.value}`) || 'on';

const db = (s?: string) => parseFloat(s ?? '') || 0;

/** A piano/synth layer's whole effect chain in signal order, on or off. */
export function layerFxChain(l: NS4Layer): FxSlotModel[] {
  const tag = `${l.kind ?? 'x'}${l.id}`;
  const eq = l.ampSimEq;
  const midHz = parseHz(eq?.freq?.value);
  const slot = (key: string, label: string, on: boolean | undefined, detail: string): FxSlotModel =>
    ({ key: `${tag}-${key}`, label, on: !!on, detail });
  return [
    slot('mod1', 'Mod 1', l.fxMod1?.on, modD(l.fxMod1)),
    slot('mod2', 'Mod 2', l.fxMod2?.on, modD(l.fxMod2)),
    {
      ...slot('amp', 'Amp/EQ', eq?.on, ampD(eq)),
      eq: eq && midHz !== undefined ? { bassDb: db(eq.bass), midDb: db(eq.mid), trebDb: db(eq.treb), midHz } : undefined,
    },
    slot('comp', 'Comp', l.comp?.on, compD(l.comp)),
    slot('delay', 'Delay', l.delay?.on, delayD(l.delay)),
    slot('reverb', 'Reverb', l.reverb?.on, revD(l.reverb)),
  ];
}

/**
 * The effects switched on for one piano/synth layer. `engine` prefixes each
 * label ("Synth Reverb") where several engines share a row; omit it when the
 * layer stands alone (a preset).
 */
export function layerFxChips(l: NS4Layer, engine?: string): FxChipModel[] {
  return layerFxChain(l).filter((fx) => fx.on)
    .map(({ key, label, detail }) => ({ key, label: engine ? `${engine} ${label}` : label, detail }));
}

/**
 * Compact list of effects that are switched on. Per-layer FX come from each
 * active piano/synth layer; organ FX is a single global set (Ns4OrganFx).
 */
export function fxChips(p: NS4Program, scene?: 'I' | 'II'): FxChipModel[] {
  const chips: FxChipModel[] = [];
  const push = (key: string, label: string, on: boolean | undefined, detail: string) => {
    if (on) chips.push({ key, label, detail });
  };

  // Each NS4 engine has its own FX chain, so prefix every chip with the engine
  // it belongs to (e.g. "Piano Reverb" vs "Synth Reverb") — without this, two
  // reverbs from different engines are indistinguishable. When more than one
  // layer of the same engine is active, also tag the layer letter (A/B/C).
  const fxLayers = activeLayers(p, scene).filter((l) => l.kind !== 'organ');
  const kindCount = new Map<string, number>();
  for (const l of fxLayers) kindCount.set(l.kind ?? 'x', (kindCount.get(l.kind ?? 'x') ?? 0) + 1);
  const engineName = (l: NS4Layer): string => {
    const kind = (l.kind ?? 'x').charAt(0).toUpperCase() + (l.kind ?? 'x').slice(1);
    const letter = (kindCount.get(l.kind ?? 'x') ?? 0) > 1 ? ` ${l.id}` : '';
    return `${kind}${letter}`;
  };
  for (const l of fxLayers) chips.push(...layerFxChips(l, engineName(l)));

  const o = p.organFx;
  if (o) {
    push('org-mod1', 'Organ Mod 1', o.mod1?.on, modD(o.mod1));
    push('org-mod2', 'Organ Mod 2', o.mod2?.on, modD(o.mod2));
    push('org-amp', 'Organ Amp/EQ', o.ampSimEq?.on, ampD(o.ampSimEq));
    push('org-comp', 'Organ Comp', o.comp?.on, compD(o.comp));
    push('org-delay', 'Organ Delay', o.delay?.on, delayD(o.delay));
    push('org-reverb', 'Organ Reverb', o.reverb?.on, revD(o.reverb));
    push('org-rotary', 'Rotary', o.rotary?.on, j(o.rotary?.fast ? 'fast' : 'slow', o.rotary?.drive && `drv ${o.rotary.drive}`) || 'on');
  }

  return chips;
}

export interface MorphSummaryRow {
  /** Section label — Organ / Piano / Synth / Global. */
  section: string;
  /** Decoded parameter name (carries the layer letter, e.g. "cutoff [A]", when per-layer). */
  name: string;
  /** Target value the source morphs this parameter toward, when assigned. */
  wheel?: string;
  at?: string;
  pedal?: string;
}

const MORPH_SECTION: Record<string, string> = { o: 'Organ', p: 'Piano', y: 'Synth', m: 'Global' };

/**
 * Every parameter that morphs in performance, with its source → target value.
 * The engine cards flag morph-assigned controls with a small ✎, but FX morphs
 * (and anything not on a card) are otherwise invisible — this is the at-a-glance
 * list so morphing is discoverable without hunting. Derived from the same
 * decoded params as the all-parameters drawer.
 */
export function morphSummary(p: NS4Program): MorphSummaryRow[] {
  return morphRows(collapseMorphs(decodeAllParams(p.bytes, paramMap())));
}

/** The morph-assigned rows out of any decoded parameter rows; `section` overrides the engine name. */
export function morphRows(rows: ParamRow[], section?: string): MorphSummaryRow[] {
  return rows
    .filter((r) => r.morphs.wheel || r.morphs.at || r.morphs.pedal)
    .map((r) => ({
      section: section ?? MORPH_SECTION[r.group] ?? r.group,
      name: r.name,
      wheel: r.morphs.wheel,
      at: r.morphs.at,
      pedal: r.morphs.pedal,
    }));
}

export interface SampleRefView { name: string; categoryName: string; id: number; }

/**
 * Samples the patch actually plays — the "you need these" list for sharing.
 * Only enabled, samples-mode layers count: the Nord binary keeps a stored sample
 * slot even on analog-mode or disabled layers, so `programSampleRefs` (every
 * stored ref) would list samples the patch never loads. Names by name (raw id
 * when unnamed). Safe to share — never audio.
 */
export function sampleRefViews(p: NS4Program, scene?: 'I' | 'II'): SampleRefView[] {
  return activeLayers(p, scene)
    .filter((l) => l.source === 'samples' && l.sample)
    .map((l) => {
      const s = l.sample!;
      return { name: s.name || `#${s.id}`, categoryName: s.categoryName, id: s.id };
    });
}

export interface ExternView { id: string; kind: string; program?: string; cc1?: string; cc2?: string; }

/**
 * Layers driving external MIDI gear (the External section): the program-change
 * they send plus two CC values. Only layers with External switched on, in the
 * given scene. CC values are the morph base (assignments show in the drawer).
 */
export function externViews(p: NS4Program, scene?: 'I' | 'II'): ExternView[] {
  return activeLayers(p, scene)
    .filter((l) => l.extern?.on)
    .map((l) => ({
      id: l.id,
      kind: l.kind ?? '?',
      program: l.extern?.program,
      cc1: l.extern?.cc1?.value,
      cc2: l.extern?.cc2?.value,
    }));
}
