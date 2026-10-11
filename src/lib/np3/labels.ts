/**
 * Piano 3 display labels, from the Piano 3 OS 2.04 display tables (high).
 * Index = stored value.
 */

/** piano.pianoType (0–5) — display table 0x300dafb0. */
export const NP3_PIANO_TYPES = ['Grand', 'Upright', 'E-Piano1', 'E-Piano2', 'Clavinet', 'Harpsichord'] as const;
/** piano.pianoAcoustics (0–3). */
export const NP3_PIANO_ACOUSTICS = ['Off', 'StrRes', 'Release', 'Str+Rls'] as const;
/** piano.pianoKbdTouch (0–2). */
export const NP3_KBD_TOUCH = ['1', '2', '3'] as const;
/** piano.pianoPedals / synth.sampleSynthSynthPedals (0–3). */
export const NP3_PEDALS = ['Off', 'Sustain', 'Volume', 'Vol & Sust'] as const;
/** synth.sampleSynthDynamics (0–3). */
export const NP3_SAMPLE_SYNTH_DYNAMICS = ['Off', 'Amp', 'Filter', 'Amp & Filt'] as const;
/** effects.effects1Fx1Type (0–7). */
export const NP3_EFFECT1_TYPES = ['Tremolo 1', 'Tremolo 2', 'Tremolo 3', 'Pan 1', 'Pan 2', 'Pan 3', 'WahWah', 'RingMod'] as const;
/** effects.effects2Fx2Type (0–5). */
export const NP3_EFFECT2_TYPES = ['Small Stone', 'Mu-Tron', 'Flanger', 'Chorus 1', 'Chorus 2', 'Vibe'] as const;
/** effects.ampCompACType (0–4). */
export const NP3_AMP_TYPES = ['Small', 'JC', 'Twin', 'Dist', 'Compressor'] as const;
/** effects.reverbType (0–2); Bright is a separate switch. */
export const NP3_REVERB_TYPES = ['Room', 'Stage', 'Hall'] as const;
/** The effect sources (effects1Fx1Src, …). */
export const NP3_EFFECT_SOURCES = ['Piano', 'Synth'] as const;
/** effects.equalizerEqSrc (0–2). */
export const NP3_EQ_SOURCES = ['Piano', 'Synth', 'Piano&Synth'] as const;
