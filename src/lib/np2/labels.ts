/**
 * Piano 2 display labels, from the Piano 2 OS 1.22 display tables (high unless
 * noted). Index = stored value.
 */

/** piano.pianoType (0–5) — the piano-library type table (medium-high). */
export const NP2_PIANO_TYPES = ['Grand', 'Upright', 'EPiano1', 'EPiano2', 'Clavinet', 'Harps'] as const;
/** common.keybSplit (0–2). */
export const NP2_KEYBOARD_SPLIT = ['Off', 'Pno/Syn', 'Syn/Pno'] as const;
/** common.param4, Keyboard Touch (0–3). */
export const NP2_KEYBOARD_TOUCH = ['Off', '1', '2', '3'] as const;
/** common.param5, Sustain Pedal Mode (0–2). */
export const NP2_SUSTAIN_PEDAL_MODES = ['Both On', 'Piano Off', 'Synth Off'] as const;
/** piano.acoustics (0–3). */
export const NP2_PIANO_ACOUSTICS = ['Off', 'StrRes', 'Release', 'Str+Rls'] as const;
/** effects.effects1Type (0–7). */
export const NP2_EFFECT1_TYPES = ['Tremolo 1', 'Tremolo 2', 'Tremolo 3', 'Pan 1', 'Pan 2', 'Pan 3', 'Auto Wah 1', 'Auto Wah 2'] as const;
/** effects.effects2Type (0–8). */
export const NP2_EFFECT2_TYPES = [
  'Phaser 1', 'Phaser 2', 'Phaser 3', 'Flanger 1', 'Flanger 2', 'Flanger 3', 'Chorus 1', 'Chorus 2', 'Chorus 3',
] as const;
/** effects.ampCompType (0–4). */
export const NP2_AMP_TYPES = ['Dist', 'Small', 'JC', 'Twin', 'Compressor'] as const;
/** effects.reverbType (0–5). */
export const NP2_REVERB_TYPES = ['Room 1', 'Room 2', 'Stage 1', 'Stage 2', 'Hall 1', 'Hall 2'] as const;
