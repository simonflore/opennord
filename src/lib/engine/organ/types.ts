/**
 * Plain engine parameter types for the organ voice. Kept free of any decoder
 * import so the audio-thread bundle (AudioWorklet) stays small.
 */

/** Organ models the engine voices. `B3 BASS` is the Stage 4's tonewheel bass. */
export type OrganModel = 'B3' | 'B3 BASS' | 'VOX' | 'FARF' | 'PIPE1' | 'PIPE2';
export const ORGAN_ENGINE_MODELS: readonly OrganModel[] = ['B3', 'B3 BASS', 'VOX', 'FARF', 'PIPE1', 'PIPE2'];

/** Scanner vibrato (V1–V3) or chorus (C1–C3), depth 1–3. */
export type VibChorusType = 'V1' | 'V2' | 'V3' | 'C1' | 'C2' | 'C3';

export interface OrganPercussion {
  on: boolean;
  /** Third harmonic (2⅔′) instead of second (4′). */
  harm3rd: boolean;
  decayFast: boolean;
  /** Soft volume (and no drawbar volume drop). */
  volSoft: boolean;
}

export interface OrganParams {
  model: OrganModel;
  /** Nine drawbar positions, 0..8 (fractional while a morph moves them). */
  drawbars: number[];
  percussion: OrganPercussion;
  vibrato: { on: boolean; type: VibChorusType };
  /** Layer volume in dB (0 = unity); {@link VOLUME_OFF_DB} or below is silent. */
  volumeDb: number;
  /** Octaves the layer is shifted (−2..+2 on the panel). */
  octaveShift: number;
  /** Organ sustain: notes fade out instead of stopping at once. */
  sustain: boolean;
  /** Key click amount, 0..1 (tonewheel models). */
  keyClick: number;
}

/**
 * Layer volume floor: "volume off" maps here (a finite value, so morphs and
 * meters never meet −Infinity), and the engine treats it and anything below as
 * silent. The quietest real step on the instrument is −84.2 dB.
 */
export const VOLUME_OFF_DB = -120;

export const DEFAULT_ORGAN_PARAMS: OrganParams = {
  model: 'B3',
  drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0],
  percussion: { on: false, harm3rd: false, decayFast: true, volSoft: false },
  vibrato: { on: false, type: 'C3' },
  volumeDb: 0,
  octaveShift: 0,
  sustain: false,
  keyClick: 0.5,
};

