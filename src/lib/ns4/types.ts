/**
 * The OpenNord program model. A Nord Stage 4 "program" is the full patch across
 * the four engines, referencing factory samples by id (not embedding audio).
 *
 * Fields are added incrementally as the format is decoded (see docs/FORMAT.md).
 * Everything below the raw bytes is optional precisely because decoding is a
 * work in progress — a field is present only once it's verified.
 */

export type Ns4FileKind = 'program' | 'preset-synth' | 'preset-piano' | 'preset-unknown';

export interface NS4PianoSection {
  /** Factory sample/model id (resolved to a name via a separate sample map). */
  modelId?: number;
  type?: string;
}

export interface NS4SynthSection {
  /** Oscillator type/category/wave — corroborated by ns4mcp NRPN 3/1–3/3. */
  oscType?: string;
  oscCategory?: string;
  oscWaveIndex?: number;
  filterType?: string;
}

export interface NS4OrganSection {
  drawbars?: number[];
}

export interface NS4Effects {
  reverb?: { type?: string; amount?: number };
  delay?: { amount?: number };
}

export interface NS4Program {
  /** Whether structured decoding succeeded (vs. raw bytes only, format TBD). */
  parsed: boolean;
  kind: Ns4FileKind;
  /** Program name, once the name region is decoded. */
  name?: string;
  category?: string;
  piano?: NS4PianoSection;
  organ?: NS4OrganSection;
  synth?: NS4SynthSection;
  effects?: NS4Effects;
  /** The original file bytes — kept so undecoded data is never lost. */
  bytes: Uint8Array;
  /** Notes about what could not (yet) be decoded, for transparency. */
  warnings: string[];
}
