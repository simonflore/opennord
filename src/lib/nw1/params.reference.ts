/**
 * Nord Wave (original, `.nwp`) parameter reference — the panel parameter and
 * value vocabulary transcribed from the instrument firmware's UI/LCD label
 * strings. This is an ORACLE for reverse-engineering the bit-packed `.nwp`
 * body, NOT a decode map: it names the parameters that must be present and, for
 * the enum parameters, the value labels the firmware displays.
 *
 * How to use it: when the minimal-pair miner (scripts/minimal-pairs.test.ts,
 * MP_MODEL=wave) isolates a byte-aligned field over the 1,018-file corpus,
 * match its cardinality/behaviour against this list to name it, then land it in
 * decode.ts with a citation to both the mined pair and the firmware label.
 *
 * Unlike the Lead 4 manual (which carries CC numbers + ranges), the firmware
 * labels give parameter NAMES and enum value lists but not CC numbers or numeric
 * ranges — so this is a naming/structure oracle, not a value map. Enum orderings
 * are as the labels appear in the firmware string pool; treat the index→label
 * mapping as tentative until a mined field confirms the order.
 *
 * Source: research/nwe/os.cab (Nord Wave OS v2.14 firmware, Zevs CBinFile) —
 * parameter label pool at file offset ~0x147800–0x148200. Local RE material
 * (Clavia IP, gitignored under research/nwe/; docs/LEGAL.md).
 */

export interface Nw1ParameterRef {
  /** Parameter name as the firmware displays it. */
  readonly name: string;
  /** Front-panel section the parameter belongs to. */
  readonly section: 'osc' | 'filter' | 'env' | 'lfo' | 'amp' | 'fx' | 'voice';
  /** Ordered enum value labels (firmware order, tentative); omitted for knobs. */
  readonly values?: readonly string[];
}

/**
 * Nord Wave panel parameters, from the firmware label pool. Enum value lists are
 * included where the firmware exposes them (LFO waveform, reverb model, mono
 * mode). Knob/continuous parameters carry no `values`.
 */
export const NW1_PARAMETERS: readonly Nw1ParameterRef[] = [
  // ── Oscillator ────────────────────────────────────────────────────────────
  { name: 'Oscillator 1', section: 'osc' },
  { name: 'Model', section: 'osc' },        // wavetable / sample model selector
  { name: 'Semi Tones', section: 'osc' },
  { name: 'Fine Tune', section: 'osc' },
  { name: 'Sync', section: 'osc' },
  { name: 'Mix', section: 'osc' },
  { name: 'Shape', section: 'osc' },
  { name: 'Skip Attack', section: 'osc' },
  { name: 'Smp Dec', section: 'osc' },      // sample decay
  // ── Filter ────────────────────────────────────────────────────────────────
  { name: 'Filter', section: 'filter' },
  { name: 'Freq', section: 'filter' },
  { name: 'Resonance', section: 'filter' },
  { name: 'Env Amount', section: 'filter' },
  { name: 'Velocity', section: 'filter' },
  { name: 'Kb Track', section: 'filter' },
  { name: 'dB/oct', section: 'filter' },    // slope
  // ── Envelopes ─────────────────────────────────────────────────────────────
  { name: 'Mod Envelope', section: 'env' },
  // ── LFO ───────────────────────────────────────────────────────────────────
  { name: 'LFO 1', section: 'lfo' },
  { name: 'LFO 2', section: 'lfo' },
  { name: 'Waveform', section: 'lfo', values: ['Saw Inv', 'Square', 'S&H', 'Random'] },
  { name: 'Dest', section: 'lfo' },         // destination
  // ── Amplifier ─────────────────────────────────────────────────────────────
  { name: 'Level', section: 'amp' },
  { name: 'Output', section: 'amp' },
  // ── Effects ───────────────────────────────────────────────────────────────
  { name: 'Drive', section: 'fx' },
  { name: 'Tube Amp', section: 'fx' },
  { name: 'Chorus', section: 'fx' },
  { name: 'Delay', section: 'fx' },
  { name: 'Feedback', section: 'fx' },
  { name: 'Tempo', section: 'fx' },
  { name: 'Reverb', section: 'fx', values: ['Room', 'Stage Soft', 'Hall'] },
  { name: 'Dry/Wet', section: 'fx' },
  { name: 'Treble', section: 'fx' },
  { name: 'Bass', section: 'fx' },
  // ── Voice / global ────────────────────────────────────────────────────────
  { name: 'Octave Shift', section: 'voice' },
  { name: 'Glide', section: 'voice' },
  { name: 'Vibrato', section: 'voice' },
  { name: 'Mono Mode', section: 'voice', values: ['Polyphonic', 'Single', 'Legato'] },
  { name: 'Sustain', section: 'voice' },
  { name: 'Morph Velocity', section: 'voice' },
];

/**
 * Sample-category labels the Nord Wave firmware uses for its sample library
 * (the `.nwp` oscillator can load a Nord Sample). Ordering is the firmware
 * string-pool order; useful for labelling an oscillator sample-category field.
 * Source: same label pool (research/nwe/os.cab).
 */
export const NW1_SAMPLE_CATEGORIES: readonly string[] = [
  'Acoustic', 'Drum', 'Fantasy', 'Lead', 'Piano', 'Pluck', 'Strings', 'Vocal',
  'Wind', 'User1', 'Accordion/Harmonica', 'Guitar/Ethnic', 'Percussion', 'Voice',
  'Orchestral', 'Misc', 'Electric', 'Pipe', 'Transistor', 'Tonewheel',
  'Traditional', 'Solo', 'Ensemble', 'Analog', 'Loops',
];
