/**
 * Unified NordProgram — generation-agnostic semantic model.
 *
 * Pure types; no model deps (same purity rule as decoded.ts). Every NS2/NS3/NS4
 * body decoder emits this shape so that search / AI / dedup / the community
 * platform can treat any generation uniformly.
 *
 * NS4 is the superset: morph fields, layered engines, deep FX. NS2/NS3 populate
 * the common core and leave generation-specific fields `undefined`.
 *
 * Distinct from `decoded.ts` (presentation/display cards): this is the semantic
 * model for indexing, search, and AI; `decoded.ts` is the display model.
 *
 * See docs/superpowers/specs/2026-06-21-unified-nordprogram-model.md.
 */
import type { NordModelId } from './partitions';

/** A value that can carry NS4 morph assignments. Generalizes NS4's Morphable<T>. */
export interface Param<T = number> {
  value: T;
  /** NS4 morph assignments; undefined in NS2/NS3. */
  morph?: { wheel?: T; aftertouch?: T; pedal?: T };
}

/** Reference to a factory sample (no audio — programs are safe to share). */
export interface SampleRef {
  id: number;
  name: string;
  categoryName: string;
  slot?: number;
}

/** Program-level identity and provenance. */
export interface NordMeta {
  model: NordModelId;
  generation: 'OG' | 'v3' | 'v4';
  name: string;
  category?: string;
  slot?: string;
  version?: string;
}

/**
 * The unified program model.
 * `engines` is a flat list tagged by `kind` + `id` — handles NS4's engine-typed
 * layers (A/B/C per engine group) and NS2/NS3's panel-grouped engines (A/B).
 */
export interface NordProgram {
  meta: NordMeta;
  engines: NordEngine[];
  fx: NordFx[];
  master?: NordMaster;
}

interface EngineBase {
  /** Stable id within the program, e.g. 'A' | 'B' | 'C'. */
  id: string;
  enabled: boolean;
  volume?: Param<number>;
  octaveShift?: number;
}

export type NordEngine = OrganEngine | PianoEngine | SynthEngine;

export interface OrganEngine extends EngineBase {
  kind: 'organ';
  /** 'B3' | 'VOX' | 'FARF' | 'PIPE' */
  model: string;
  /** Nine drawbar positions (0–8). */
  drawbars?: number[];
  vibChorus?: { on: boolean; mode: string };
  percussion?: { on: boolean; third: boolean; fast: boolean; soft: boolean };
}

export interface PianoEngine extends EngineBase {
  kind: 'piano';
  /** 'Grand' | 'Electric' | 'Clav' | 'Digital' | ... */
  type: string;
  sample?: SampleRef;
  timbre?: string;
  dynamics?: string;
}

export interface SynthEngine extends EngineBase {
  kind: 'synth';
  osc: {
    type: string;
    wave?: string;
    config?: string;
    pitch?: Param<number>;
  };
  filter: {
    type: string;
    cutoff: Param<number>;
    resonance?: Param<number>;
    drive?: string;
    kbTrack?: string;
  };
  ampEnv?: ADSR;
  modEnv?: ADSR;
  lfo?: { wave: string; rate: Param<string> };
  voice?: string;
  unison?: string;
  glide?: Param<number>;
  arp?: { on: boolean; range?: string; pattern?: string; rate?: Param<string> };
  sample?: SampleRef;
}

export type ADSR = {
  attack: string;
  decay: string;
  sustain: string;
  release: string;
};

/** A program-level effect slot. */
export interface NordFx {
  name: string;
  on: boolean;
  type?: string;
  params?: Record<string, Param<number> | string>;
}

export interface NordMaster {
  transpose?: number;
  fineTune?: number;
  splitPoints?: number[];
}
