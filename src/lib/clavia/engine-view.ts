/**
 * Model-agnostic Program-view contract. These are the plain display shapes every
 * Nord model's view-model produces and the shared EngineCard / FxRow / ProgramHeader
 * components render. Dependency direction is model → clavia: nothing here imports
 * from ns4/ or ns3/. Producers (organPanel, synthCard, …) live per-model in
 * <model>/view.ts and return these types.
 */

export type DrawbarColor = 'brown' | 'white' | 'black';

export interface MorphMarkView { wheel?: string; at?: string; pedal?: string }

export interface DrawbarView {
  /** Position 0–8, drives the tab height. */
  level: number;
  /** Raw position label, e.g. "4", "0", or a VOX combo like "4+5". */
  label: string;
  /** Footage label (B3 only), e.g. "16′"; undefined for generic models. */
  footage?: string;
  /** Tab color; 'default' = the single Nord-red fill for non-B3 models. */
  color: DrawbarColor | 'default';
  /** Morph targets when this drawbar is morph-assigned (ns4 only). */
  morph?: MorphMarkView;
}

export interface OrganPanelModel {
  id: string;
  /** Decoded model, e.g. "B3" | "VOX". */
  model: string;
  /** Canonical selector options to render (highlight the active `model`). */
  models: readonly string[];
  isB3: boolean;
  drawbars: DrawbarView[];
  vibChorus: { on: boolean; type?: string };
  percussion: { applicable: boolean; on: boolean; harm3rd: boolean; decayFast: boolean; volSoft: boolean };
  octave: number;
  /** Organ preset on/off — undefined on models without a panel preset control (ns3). */
  preset?: boolean;
  /** Organ sustain — undefined on models without a panel sustain control (ns3). */
  sustain?: boolean;
  /** Shared rotary — present only on the first organ layer (ns4); ns3 routes rotary through FX. */
  rotary?: { on: boolean; fast: boolean; drive?: string; stop: boolean };
}

export interface PianoCardModel {
  id: string;
  type: string;
  model: string;
  /** Timbre knob — undefined on models without it (ns2). */
  timbre?: string;
  /** Keyboard-touch knob — undefined on models without it (ns3, ns2). */
  touch?: string;
}

export interface SynthCardModel {
  id: string;
  source: string;
  osc: string;
  oscDetail: string;
  filterType: string;
  cutoff: string;
  res: string;
  cutoffMorph?: MorphMarkView;
  resMorph?: MorphMarkView;
}

export interface EnvCurveView { a: number; d: number; s: number; r: number; }

export interface Stat { label: string; value: string; }

export interface FxChipModel { key: string; label: string; detail: string; }

export interface HeaderView {
  name: string;
  slot: string;
  category: string;
  version: string;
  sizeBytes: number;
  /** e.g. "organ + piano + synth · 6 layers" or "Panel A: organ + synth · Panel B: piano". */
  summary: string;
}

export interface VolumeView { value: string; fill: number; morph?: MorphMarkView; }

/** The neutral per-engine card. ns4 and ns3 both build arrays of these. */
export type EngineCardModel =
  | { kind: 'organ'; title: string; volume: VolumeView; organ: OrganPanelModel }
  | { kind: 'piano'; title: string; volume: VolumeView; piano: PianoCardModel; stats: Stat[] }
  | {
      kind: 'synth'; title: string; volume: VolumeView; synth: SynthCardModel;
      env: EnvCurveView | null; modEnv?: EnvCurveView; stats: Stat[];
    };

/** Map a "-4.7 dB" style volume to a 0–100 meter fill, clamped to a -40..+6 dB window. */
export function volumeFill(volume?: string): number {
  if (!volume) return 0;
  const db = parseFloat(volume);
  if (Number.isNaN(db)) return 0;
  const lo = -40, hi = 6;
  const pct = ((db - lo) / (hi - lo)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** Parse a Nord envelope time string ("8 ms" | "1.2 s") to milliseconds; 0 if unparseable. */
function envMs(t?: string): number {
  if (!t) return 0;
  const m = /([\d.]+)\s*(ms|s)?/i.exec(t);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return (m[2] ?? '').toLowerCase() === 's' ? n * 1000 : n;
}

/**
 * Envelope as 0–1 segment proportions for the EnvCurve glyph, or null when there's
 * no data. Widths come from the real A/D/R times (sqrt-weighted so a 1 ms and a 2 s
 * segment are both visible). Sustain level is schematic (0.7); exact times show as
 * stats beside the curve. Model-agnostic: ns4 amp env and ns3 amp/mod env all use it.
 */
export function envCurve(times?: { attack?: string; decay?: string; release?: string }): EnvCurveView | null {
  if (!times) return null;
  const a = Math.sqrt(envMs(times.attack)), d = Math.sqrt(envMs(times.decay)), r = Math.sqrt(envMs(times.release));
  const tot = a + d + r;
  if (tot === 0) return null;
  return { a: a / tot, d: d / tot, s: 0.7, r: r / tot };
}
