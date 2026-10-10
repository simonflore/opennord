/**
 * Organ voice engine — public surface of the pure core (no Web Audio).
 * The browser realization is `./organ-voice` (import it lazily: it pulls in
 * the AudioWorklet module URL).
 */
export { OrganCore, renderOffline, softClip, type OrganCoreOptions } from './core';
export { organParamsFromLayer, drawbarPosition, parseDb, parseVibChorus, toOrganModel, type MorphAmounts } from './params';
export {
  DEFAULT_ORGAN_PARAMS, ORGAN_ENGINE_MODELS, VOLUME_OFF_DB,
  type OrganModel, type OrganParams, type OrganPercussion, type VibChorusType,
} from './types';
export { voicingFor, type ModelVoicing, type Tone } from './voicing';
export { tonewheelFrequency, wheelFor, drawbarGain, FOOTAGES, GEAR_TEETH } from './tonewheel';
export type { OrganMessage, OrganControl } from './messages';
