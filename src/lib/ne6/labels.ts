/**
 * Electro 6 display labels — the texts the instrument itself shows, from the
 * 25-byte fixed-width label tables around c0170356 in Electro 6 OS 2.66.
 * Index = stored value.
 *
 * Each table is matched to its registry parameter (FUN_c0054b5c) by
 * cardinality: organ model 0–5, Fx1Type 0–7, Fx2Type 0–5, SpkType 0–5 and
 * RvbType 0–2 match exactly (high); piano bank → piano type is by cardinality
 * only (medium).
 */

/** Edt_Org_kModel (0–5). */
export const NE6_ORGAN_MODELS = ['B3', 'Vox', 'Farfisa', 'Pipe1', 'Pipe2', 'B3 Bass'] as const;

/** Edt_Org_kVibratoType for the B3 models (0–5). */
export const NE6_B3_VIBRATO = ['V1', 'C1', 'V2', 'C2', 'V3', 'C3'] as const;
/** Vibrato labels shown for the Vox model. */
export const NE6_VOX_VIBRATO = ['Less', 'More', 'Original'] as const;
/** Vibrato labels shown for the Farfisa model; the table holds Light/Heavy × Slow/Fast, this order is assumed (medium). */
export const NE6_FARFISA_VIBRATO = ['Light Slow', 'Light Fast', 'Heavy Slow', 'Heavy Fast'] as const;

/** Edt_Pno_kBank (0–5) — piano type (medium: matched by cardinality). */
export const NE6_PIANO_TYPES = ['Grand', 'Upright', 'Electric', 'Clav/Harps', 'Digital', 'Layer'] as const;

/** Edt_Effects_kFx1Type (0–7). */
export const NE6_FX1_TYPES = ['Tremolo 1', 'Tremolo 2', 'Tremolo 3', 'Panning 1', 'Panning 2', 'Panning 3', 'Wah-Wah', 'Ring Mod'] as const;
/** Edt_Effects_kFx2Type (0–5). */
export const NE6_FX2_TYPES = ['Phaser 1', 'Phaser 2', 'Flanger', 'Chorus 1', 'Chorus 2', 'Vibe'] as const;
/** Edt_Effects_kSpkType (0–5) — amp / speaker. */
export const NE6_AMP_TYPES = ['Clean', 'Small', 'JC', 'Twin', 'Rotary', 'Comp'] as const;
/** Edt_Effects_kRvbType (0–2); Edt_Effects_kRvbBright adds the Bright switch. */
export const NE6_REVERB_TYPES = ['Room', 'Stage', 'Hall'] as const;

/** The vibrato/chorus label for an organ model, or undefined when that model's table doesn't cover it. */
export function ne6VibratoLabel(model: number | undefined, vibratoType: number | undefined): string | undefined {
  if (vibratoType === undefined) return undefined;
  if (model === 0 || model === 5) return NE6_B3_VIBRATO[vibratoType];
  if (model === 1) return NE6_VOX_VIBRATO[vibratoType];
  if (model === 2) return NE6_FARFISA_VIBRATO[vibratoType];
  return undefined;
}
