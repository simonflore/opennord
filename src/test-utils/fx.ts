/** Test-only views of an effect block's settings as records, so a test can pin one aspect at a time. */
import type { FxBlock } from '../lib/clavia/fx-block';
import type { MorphMarkView } from '../lib/clavia/engine-view';

/** Display text by setting id, in panel order. */
export const texts = (b: FxBlock): Record<string, string> =>
  Object.fromEntries(b.settings.map((s) => [s.id, s.text]));

/** Stored knob position by setting id, for the settings that have one. */
export const midis = (b: FxBlock): Record<string, number> =>
  Object.fromEntries(b.settings.filter((s) => s.midi !== undefined).map((s) => [s.id, s.midi as number]));

/** Morph targets by setting id, or undefined when nothing is morphed. */
export function morphsOf(b: FxBlock): Record<string, MorphMarkView> | undefined {
  const set = b.settings.filter((s) => s.morph).map((s) => [s.id, s.morph as MorphMarkView] as const);
  return set.length ? Object.fromEntries(set) : undefined;
}

/**
 * A block with its settings also read back as the three records the decoders
 * used to emit (`params`, `midi`, `morphs`), so a decoder test can pin every
 * text, stored position and morph target at once.
 */
export const flat = (b: FxBlock) => ({ ...b, params: texts(b), midi: midis(b), morphs: morphsOf(b) });
