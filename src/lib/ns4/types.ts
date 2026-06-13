/**
 * The OpenNord program model.
 *
 * Shaped from ns4decode's decoded output (see docs/FORMAT.md), which reveals the
 * Nord Stage 4 program's *logical* schema: up to three synth/sample LAYERS
 * (A/B/C), a pervasive MORPH system (every continuous value can be modulated by
 * wheel / aftertouch / control pedal), and samples referenced by ID (no audio).
 *
 * Fields are filled incrementally as the binary parser decodes them. This file
 * is the target schema; `parse.ts` populates as much as it can and records the
 * rest in `warnings`.
 */

export type Ns4FileKind =
  | 'program'
  | 'preset-synth'
  | 'preset-piano'
  /** A Nord Sample (`.nsmp4`) — factory/library *audio* content, not a program. */
  | 'sample'
  | 'preset-unknown';

/** A value plus its three Nord morph assignments. Units are field-specific. */
export interface Morphable<T = number> {
  value: T;
  /** Modulation applied by the mod wheel, if assigned. */
  wheel?: T;
  /** Modulation applied by aftertouch (A.T.), if assigned. */
  aftertouch?: T;
  /** Modulation applied by the control pedal, if assigned. */
  pedal?: T;
}

/**
 * Reference to a factory sample used by a layer in 'samples' mode. Programs
 * reference samples by ID/slot/name — they never embed audio, which is what
 * makes program sharing safe and small (the recipient already owns the
 * factory library). See docs/LEGAL.md.
 */
export interface Ns4SampleRef {
  slot: number;
  /** Bank size, e.g. 100 in "slot 2/100". */
  bankSize: number;
  /** Category label, e.g. "Strings Solo". */
  categoryName: string;
  /** 32-bit factory sample id, e.g. 2768936524 — the stable key for sharing. */
  id: number;
  /** Human name, e.g. "Strings Multi FastAtk_ST 4.1". */
  name: string;
  /** e.g. "FAST ATK" | "NATURAL". */
  options?: string;
  bright?: boolean;
}

export interface Ns4Arp {
  run?: boolean;
  mode?: string;            // Arp | Poly | ...
  direction?: string;       // UP | RANDOM | UP/DOWN | ...
  range?: Morphable<string>;
  rate?: Morphable<string>; // "1/2" | "62 bpm" | ...
  masterClock?: boolean;
  patternLength?: number;
  zigzag?: boolean;
  pattern?: boolean;
  kbSync?: boolean;
  kbHold?: boolean;
  /** Step strings as Nord shows them (accent/gate/pan), e.g. ".>.. .... ...". */
  accent?: string;
  gate?: string;
  pan?: string;
}

export interface Ns4FxMod {
  on?: boolean;
  masterClock?: boolean;
  rate?: Morphable<string>;   // e.g. "3.2" | "1/4T"
  amount?: Morphable<string>; // e.g. "6.9"
  mode?: string;              // RM | WAH | FLANG | ENS | ...
}

export interface Ns4Filter {
  on?: boolean;
  type?: string;            // LP24 | BP | LPHP | ...
  freq?: Morphable<string>;
  /** Resonance, or HP freq in the LPHP/combo modes. */
  resonance?: Morphable<string>;
  track?: string;           // "2/3" | "off" | ...
  drive?: string;
  envAmount?: Morphable<string>;
  env?: { attack?: string; decay?: string; release?: string };
  velocity?: boolean;
}

/** One voice layer — piano, organ, or synth. A program stacks up to 2 piano, 2 organ, 3 synth. */
export interface NS4Layer {
  id: 'A' | 'B' | 'C';
  /** Which engine this layer belongs to. */
  kind?: 'piano' | 'organ' | 'synth';
  enabled?: boolean;
  enabledSceneII?: boolean;
  /** Volume with optional morph assignments, e.g. "-2.2 dB". */
  volume?: Morphable<string>;
  /** Pan value, e.g. "L  4.7" | "0.0". */
  pan?: Morphable<string>;

  // ── Organ-specific (when kind === 'organ') ───────────────────────────────
  /** "B3" | "VOX" | "FARF" | "PIPE" */
  organModel?: string;
  organPreset?: boolean;
  organSustain?: boolean;
  vibChorus?: boolean;
  percussion?: { on?: boolean; harm3rd?: boolean; decayFast?: boolean; volSoft?: boolean };
  /**
   * Nine drawbars (indices 0–8), each morphable. Display value is the drawbar
   * position string (e.g. "4", "0") or a special VOX string (e.g. "4+5").
   * Undefined entries mean the drawbar morph data was unavailable.
   */
  drawbars?: (Morphable<string> | undefined)[];

  // ── Piano-specific (when kind === 'piano') ───────────────────────────────
  pianoType?: string;            // "Grand" | "Electric" | "Clav" | "Digital" | ...
  pianoModelId?: number;         // 32-bit hash
  pianoModelName?: string;       // e.g. "Clavinet D6 6.1"
  pianoModelSlot?: number;       // raw slot index within model bank
  pianoModelVariation?: string;  // e.g. "CB"
  timbre?: string;               // "SOFT+BRIGHT" | "MID" | ...
  touch?: string;                // "heavy" | "med" | "light"
  unisonLevel?: number;
  dynComp?: number;
  softRelease?: boolean;
  stringResonance?: boolean;
  pedalNoise?: boolean;

  // ── Synth oscillator ─────────────────────────────────────────────────────
  source?: 'samples' | 'analog';
  sample?: Ns4SampleRef;
  oscType?: string;         // ANALOG | FM-H | FM-I | WAVE
  oscCategory?: string;
  oscWave?: string;
  oscCtrl?: Morphable<string>;
  pitchFine?: string;
  pitchCoarse?: string;
  oscEnv?: { attack?: string; decay?: string; release?: string; amount?: Morphable<string>; toPitch?: boolean; velocity?: boolean };

  lfo?: { target?: string; shape?: string; rate?: Morphable<string>; amount?: Morphable<string>; masterClock?: boolean };
  ampEnv?: { attack?: string; decay?: string; release?: string; velocity?: string };
  filter?: Ns4Filter;
  unison?: string;

  // ── Performance / voicing ────────────────────────────────────────────────
  octaveShift?: number;
  kbZones?: string;         // "oo1o" | "1111" | ...
  pitchStick?: { on?: boolean; range?: string };
  sustainPedal?: boolean;
  vibrato?: { mode?: string; delay?: number; rate?: number; amount?: number };
  mono?: boolean;
  legato?: boolean;
  voicePriority?: string;
  glide?: number;
  arp?: Ns4Arp;
  extern?: { on?: boolean; program?: string; cc1?: Morphable<string>; cc2?: Morphable<string> };

  // ── Per-layer effects ─────────────────────────────────────────────────────
  fxMod1?: Ns4FxMod;
  fxMod2?: Ns4FxMod;
  ampSimEq?: { on?: boolean; treb?: string; mid?: string; bass?: string; freq?: Morphable<string>; drive?: Morphable<string>; mode?: string };
  comp?: { on?: boolean; amount?: string; response?: string };
  delay?: { on?: boolean; masterClock?: boolean; tempo?: Morphable<string>; mix?: Morphable<string>; analog?: boolean; pingPong?: boolean; filterType?: string; feedback?: Morphable<string>; effects?: string };
  reverb?: { on?: boolean; amount?: Morphable<string>; tone?: string; type?: string };
}

/** Global organ FX (master group 'm') — single set shared across both organ layers. */
export interface Ns4OrganFx {
  mod1?: Ns4FxMod;
  mod2?: Ns4FxMod;
  ampSimEq?: { on?: boolean; treb?: string; mid?: string; bass?: string; freq?: Morphable<string>; drive?: Morphable<string>; mode?: string };
  comp?: { on?: boolean; amount?: string; response?: string };
  delay?: { on?: boolean; masterClock?: boolean; tempo?: Morphable<string>; mix?: Morphable<string>; analog?: boolean; pingPong?: boolean; filterType?: string; feedback?: Morphable<string>; effects?: string };
  reverb?: { on?: boolean; amount?: Morphable<string>; tone?: string; type?: string };
  rotary?: { on?: boolean; drive?: string; stopPosition?: string; stop?: boolean; fast?: boolean; vibChorusType?: string };
}

export interface NS4Program {
  /** Whether structured decoding succeeded (vs. raw bytes only, format TBD). */
  parsed: boolean;
  kind: Ns4FileKind;
  /** Program name. NOT stored in the file — derived from the filename on import. */
  name?: string;
  /** Resolved program category name (CBIN 0x10), e.g. "Organ". Undefined when the
   * id isn't in the partial category table yet — see {@link categoryId}. */
  category?: string;
  /** Raw program category id (CBIN header byte 0x10), present once parsed. */
  categoryId?: number;
  /** Keyboard bank index (CBIN header byte 0x0C). */
  bank?: number;
  /** Location within the bank (CBIN header byte 0x0E). */
  location?: number;
  /** Program version string, e.g. "3.13" (CBIN header byte 0x14, raw ×100). */
  programVersion?: string;
  /** Up to seven voice layers: 2 organ, 2 piano, 3 synth. */
  layers?: NS4Layer[];
  /** Global organ effects (rotary speaker, FX chain) — master group, not per-layer. */
  organFx?: Ns4OrganFx;
  /** Original file bytes — kept so undecoded data is never lost. */
  bytes: Uint8Array;
  /** Notes about what could not (yet) be decoded, for transparency. */
  warnings: string[];
}

/** All factory sample references in a program — the "you need these" list for sharing. */
export function programSampleRefs(p: NS4Program): Ns4SampleRef[] {
  return (p.layers ?? []).flatMap((l) => (l.sample ? [l.sample] : []));
}
