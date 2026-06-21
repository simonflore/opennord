/**
 * Program Studio view-model — pure derivations from NS4Program to display data.
 *
 * No React, no I/O. Components render these plain objects; the Community Library
 * will reuse the same derivations to render any shared patch. Everything here is
 * unit-testable against the regression fixture.
 */
import type { NS4Program, NS4Layer, Morphable, Ns4OrganFx } from './types';
import { decodeAllParams } from './coverage';
import { collapseMorphs } from './params-view';
import { buildParamMap } from './maps';
import { organModelSpec, ORGAN_MODELS } from './organ-models';
import type {
  MorphMarkView, DrawbarView, OrganPanelModel, PianoCardModel, SynthCardModel,
  EnvCurveView, Stat, FxChipModel, HeaderView, VolumeView, EngineCardModel,
} from '../clavia/engine-view';
import { volumeFill, envCurve } from '../clavia/engine-view';

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

const KIND_ORDER: NonNullable<NS4Layer['kind']>[] = ['organ', 'piano', 'synth'];

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
  const active = activeLayers(p, scene);
  const kinds = KIND_ORDER.filter((k) => active.some((l) => l.kind === k));
  const summary = `${kinds.join(' + ')} · ${active.length} layer${active.length === 1 ? '' : 's'}`;
  return {
    name: p.name ?? 'Unnamed',
    slot: p.slot ?? '—',
    category: p.category ?? (p.categoryId != null ? `#${p.categoryId}` : '—'),
    version: p.programVersion ? `v${p.programVersion}` : '—',
    sizeBytes: p.bytes.length,
    summary,
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
 * Keyboard split / zone layout: which active layers sound in each of the four
 * zones (from each layer's `kbZones` "[1o]{4}" string), the split-point note at
 * each active boundary, and program transpose. Drives the ProgramZones strip.
 */
export function programZones(p: NS4Program, scene?: 'I' | 'II'): ProgramZonesView {
  const active = activeLayers(p, scene);
  const zones = [0, 1, 2, 3].map((z) => ({
    layers: active
      .filter((l) => (l.kbZones ?? '')[z] === '1')
      .map((l) => ({ kind: l.kind ?? '?', id: l.id })),
  }));
  const lut = paramLookup(p);
  const hasSplit = lut.get('split on/off') === 'on';
  const boundary = (i: number): string | null =>
    hasSplit && lut.get(`KB zones ${i}-${i + 1} split point on/off`) === 'on'
      ? (lut.get(`KB zones ${i}-${i + 1} split point`) ?? null)
      : null;
  const xfade = (i: number): string | null => {
    if (!hasSplit) return null;
    const x = lut.get(`KB zones ${i}-${i + 1} split point Xfade`);
    return x && x !== 'none' ? x : null;
  };
  const transpose = lut.get('program transpose on/off') === 'on'
    ? (lut.get('program transpose amount') ?? null)
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

export function synthCard(l: NS4Layer): SynthCardModel {
  const osc = l.source === 'analog' ? (l.oscType ?? 'analog') : (l.sample?.name ?? 'sample');
  const oscDetail = l.oscWave ? `wave ${l.oscWave}` : (l.oscCategory ? `cat ${l.oscCategory}` : '');
  return {
    id: l.id,
    source: l.source ?? 'samples',
    osc,
    oscDetail,
    filterType: l.filter?.type ?? '—',
    cutoff: l.filter?.freq?.value ?? '—',
    res: l.filter?.resonance?.value ?? '—',
    cutoffMorph: morphMarks(l.filter?.freq),
    resMorph: morphMarks(l.filter?.resonance),
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
  return { kind: 'synth', title, volume, synth: synthCard(l), env: ampEnvCurve(l), stats: synthStats(l) };
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
  const lfo = [l.lfo?.shape, l.lfo?.rate?.value].filter(Boolean).join(' · ');
  if (lfo) add('LFO', lfo);
  add('LFO amt', l.lfo?.amount?.value);
  add('unison', l.unison);
  add('glide', l.glide);
  if (l.arp?.run) add('arp', [l.arp?.rate?.value, l.arp?.range?.value].filter(Boolean).join(' · ') || 'on');
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

/**
 * Compact list of effects that are switched on. Per-layer FX come from each
 * active piano/synth layer; organ FX is a single global set (Ns4OrganFx).
 */
export function fxChips(p: NS4Program, scene?: 'I' | 'II'): FxChipModel[] {
  const chips: FxChipModel[] = [];
  const push = (key: string, label: string, on: boolean | undefined, detail: string) => {
    if (on) chips.push({ key, label, detail });
  };

  // Build each chip's detail from the effect's real params, not just its name.
  const j = (...parts: (string | undefined | false)[]) => parts.filter(Boolean).join(' · ');
  type Mod = NS4Layer['fxMod1'];
  type Delay = NS4Layer['delay'];
  type Reverb = NS4Layer['reverb'];
  type Amp = NS4Layer['ampSimEq'];
  type Comp = NS4Layer['comp'];
  const modD = (m: Mod) => j(m?.mode, m?.rate?.value, m?.amount?.value && `amt ${m.amount.value}`) || 'on';
  const ampD = (a: Amp) => j(a?.mode, a?.drive?.value && `drv ${a.drive.value}`) || 'on';
  const compD = (c: Comp) => j(c?.amount && `${c.amount}`, c?.response) || 'on';
  const delayD = (d: Delay) => j(d?.tempo?.value, d?.mix?.value && `mix ${d.mix.value}`, d?.feedback?.value && `fb ${d.feedback.value}`) || 'on';
  const revD = (r: Reverb) => j(r?.type, r?.amount?.value && `amt ${r.amount.value}`) || 'on';

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
  for (const l of fxLayers) {
    const tag = `${l.kind ?? 'x'}${l.id}`;
    const eng = engineName(l);
    push(`${tag}-mod1`, `${eng} Mod 1`, l.fxMod1?.on, modD(l.fxMod1));
    push(`${tag}-mod2`, `${eng} Mod 2`, l.fxMod2?.on, modD(l.fxMod2));
    push(`${tag}-amp`, `${eng} Amp/EQ`, l.ampSimEq?.on, ampD(l.ampSimEq));
    push(`${tag}-comp`, `${eng} Comp`, l.comp?.on, compD(l.comp));
    push(`${tag}-delay`, `${eng} Delay`, l.delay?.on, delayD(l.delay));
    push(`${tag}-reverb`, `${eng} Reverb`, l.reverb?.on, revD(l.reverb));
  }

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
  return collapseMorphs(decodeAllParams(p.bytes, paramMap()))
    .filter((r) => r.morphs.wheel || r.morphs.at || r.morphs.pedal)
    .map((r) => ({
      section: MORPH_SECTION[r.group] ?? r.group,
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
