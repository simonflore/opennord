/**
 * Wave 2 display labels, from the label tables in Wave 2 OS 1.24. Index =
 * stored value. Each table is matched to its registry parameter (FUN_c01106b8)
 * by cardinality.
 */

/** Edt_Syn_kFltType (0–5). */
export const NW2_FILTER_TYPES = ['LP12', 'LP24', 'Mini Moog', 'LP+HP', 'BP24', 'HP24'] as const;
/** Edt_Effects_kRvbType (0–4). */
export const NW2_REVERB_TYPES = ['Booth', 'Room', 'Stage', 'Hall', 'Cathedral'] as const;
/** Edt_Effects_kFxType (0–6); the 7th entry is not resolved yet. */
export const NW2_FX_TYPES = ['Tremolo', 'Ring Mod', 'Phaser', 'Chorus', 'Ensemble', 'Vibe'] as const;
