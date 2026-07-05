/**
 * CommonProgram — the generation-neutral semantic intermediate for
 * cross-generation migration (spec: docs/superpowers/specs/
 * 2026-07-04-cross-gen-migration-design.md). Every field is optional:
 * absent means "the source didn't have it or we couldn't decode it".
 * Units are normalized: volumes as MIDI 0–127, times in ms, rates in Hz.
 */

export interface CommonOrgan {
  on: boolean;
  /** 'B3' | 'Vox' | 'Farfisa' — the intersection of ns2/ns3/ns4 organ models. */
  type: string;
  /** 9 drawbar values 0–8, manual 1 (lower/only). */
  drawbars: number[];
  /** Optional second manual (ns2 preset2 / ns3 panel B usage). */
  drawbars2?: number[];
  vibChorus?: { on: boolean; mode: string };
  percussion?: { on: boolean; third: boolean; fast: boolean; soft: boolean };
  volumeMidi?: number;
  octaveShift?: number;
}

export interface CommonPiano {
  on: boolean;
  /** Source sound name when resolvable (e.g. "Silver Grand"). */
  soundName?: string;
  /** Instrument-ish type name straight from the source decoder (e.g. 'Grand',
   *  'E Piano 1', 'Wurl') — NOT a clean ns4 category. The emitter keyword-maps
   *  it to an ns4 PianoType label (pianoTypeLabel in to-ns4.ts). */
  typeName?: string;
  volumeMidi?: number;
  octaveShift?: number;
  /** Source dynamics/touch label, informational for the report. */
  dynamics?: string;
}

export interface CommonEnv {
  attackMs?: number;
  decayMs?: number;
  releaseMs?: number;
  velocity?: boolean;
}

export interface CommonSynth {
  on: boolean;
  mode: 'sample' | 'analog';
  /** Resolved factory sample name when mode==='sample'. */
  sampleName?: string;
  /** Source waveform/osc label when mode==='analog' (e.g. "Saw", "Pulse"). */
  waveform?: string;
  filter?: { type?: string; cutoffMidi?: number; resonanceMidi?: number };
  /** Cutoff carried in Hz (display value) for the emitter's nearest-match scan. */
  cutoffHz?: number;
  /** Resonance normalized 0-1 from the source's 0-10 display value (e.g. ns3 "2.0" -> 0.2). */
  resonance01?: number;
  ampEnv?: CommonEnv;
  modEnv?: CommonEnv;
  lfo?: { wave?: string; rateHz?: number; rateMidi?: number };
  unison?: string;
  volumeMidi?: number;
  octaveShift?: number;
}

export type CommonFxSlot = 'mod1' | 'mod2' | 'delay' | 'reverb' | 'comp' | 'ampsim';

export interface CommonFxUnit {
  slot: CommonFxSlot;
  on: boolean;
  /** Source type label ("Phaser", "Flanger", "Hall"...). */
  type?: string;
  /**
   * Which engine the source routed this FX unit through, when the source
   * carries it (ns2's per-effect source select — 'Organ'|'Piano'|'Synth').
   * The ns4 emitter prefers this host when picking the FX group, falling back
   * to the synth→piano→organ priority when it's absent (ns3 panel FX are
   * panel-wide, so ns3 leaves this unset).
   */
  host?: 'organ' | 'piano' | 'synth';
  amountMidi?: number;
  rateMidi?: number;
}

export interface CommonProgram {
  sourceModel: 'ns2' | 'ns3';
  name?: string;
  /** Clavia category name if the source had one. */
  category?: string;
  organ?: CommonOrgan;
  piano?: CommonPiano;
  synth?: CommonSynth;
  fx?: CommonFxUnit[];
  transpose?: number;
}

// ---- report ----

export type MigrationStatus = 'mapped' | 'approximated' | 'defaulted' | 'not-migratable';

export interface MigrationNote {
  /** Musician-facing field label, e.g. "Organ drawbars", "Piano sound". */
  field: string;
  status: MigrationStatus;
  /** Musician-language sentence. Never protocol vocabulary. */
  note: string;
  /** Advisor's one-line rationale when an AI/heuristic choice was made. */
  rationale?: string;
}

export interface MigrationReport {
  source: 'ns2' | 'ns3';
  notes: MigrationNote[];
  /** One-time global caveats (e.g. unmapped-byte disclaimer). */
  globalNotes: string[];
}

/** Result of lifting a source-generation program into CommonProgram. */
export interface LiftResult {
  common: CommonProgram;
  /** Musician-language names of source features that were ON but can't carry. */
  dropped: string[];
}
