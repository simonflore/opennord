/**
 * Electro 5 display labels. Index = stored value.
 *
 * From the Electro 5 OS 2.04 display tables (each parameter's display entry →
 * its label getter → the label array; high unless noted), so they read as the
 * instrument's own display does.
 */
import type { Ne5OrganType } from './types';

/** common.organModel (0–4) — display table 0x301b6f04 → labels 0x301b684c. */
export const NE5_ORGAN_MODELS = ['B3', 'B3+Bass', 'Pipe', 'Vx', 'Farf'] as const;

/** The sound set each organ model plays (B3+Bass is the B3 with its bass drawbars). */
export const NE5_ORGAN_SET: readonly Ne5OrganType[] = ['b3', 'b3', 'church', 'vox', 'farf'];

/** common.partLInstrument / partUInstrument (0–2). */
export const NE5_PART_INSTRUMENTS = ['Organ', 'Piano', 'Synth'] as const;
/** common.partLOn / partUOn. */
export const NE5_PART_STATES = ['Muted', 'Active'] as const;
/** piano.pianoType (0–5) — the piano-name display switch; the piano-library type table has the same order. */
export const NE5_PIANO_TYPES = ['Grand', 'Upright', 'EPiano1', 'EPiano2', 'Clav', 'Harpsi'] as const;
/** piano.pianoAcoustics (0–3). */
export const NE5_PIANO_ACOUSTICS = ['Off', 'StrRes', 'Release', 'Str+Rls'] as const;
/** sampleSynth.sampleSynthDynamics (0–3). */
export const NE5_SAMPLE_SYNTH_DYNAMICS = ['Off', '12dB', '24dB', '36dB'] as const;
/** effects.effects1Type (0–7). */
export const NE5_EFFECT1_TYPES = ['Tremolo 1', 'Tremolo 2', 'Tremolo 3', 'Pan 1', 'Pan 2', 'Pan 3', 'WahWah', 'RingMod'] as const;
/** effects.effects2Type (0–5). */
export const NE5_EFFECT2_TYPES = ['Small Stone', 'Mu-Tron', 'Flanger', 'Chorus 1', 'Chorus 2', 'Vibe'] as const;
/** effects.ampCompType (0–5). */
export const NE5_AMP_TYPES = ['Dist', 'Small', 'JC', 'Twin', 'Rotary', 'Compressor'] as const;
/** effects.reverbType (0–4). */
export const NE5_REVERB_TYPES = ['Room', 'Stage Soft', 'Stage', 'Hall Soft', 'Hall'] as const;
/** effects.effects1Source, effects2Source, delaySource, ampCompSource. */
export const NE5_EFFECT_SOURCES = ['Part L', 'Part U'] as const;
/** effects.equalizerSource (0–2). */
export const NE5_EQ_SOURCES = ['Part L', 'Part U', 'Part L+U'] as const;
/** b3Global.b3VibChorus (0–5). */
export const NE5_B3_VIB_CHORUS = ['V1', 'C1', 'V2', 'C2', 'V3', 'C3'] as const;
/** b3Global.b3Harmonic. */
export const NE5_B3_HARMONICS = ['2nd', '3rd'] as const;
/** b3Global.b3DecayLevel (0–3). */
export const NE5_B3_DECAY_LEVELS = ['Slow/Norm', 'Fast/Norm', 'Slow/Soft', 'Fast/Soft'] as const;
/** voxGlobal.voxVibrato (0–2). */
export const NE5_VOX_VIBRATO = ['Less', 'More', 'Original'] as const;
/** farfGlobal.farfVibrato (0–3). */
export const NE5_FARF_VIBRATO = ['Light/Slow', 'Light/Fast', 'Heavy/Slow', 'Heavy/Fast'] as const;
