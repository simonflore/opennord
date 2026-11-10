/** Settings and words the take tools share (the tools toolbar and the Takes overview). */

/** Normalize brings the loudest moment of a take to this peak, in dB. */
export const PEAK_DB = -1;
/** Trim silence treats anything quieter than this, in dB, as silence. */
export const SILENCE_DB = -60;

/** Below this, a loop's join is marked to check: it may click. */
export const WEAK_JOIN = 0.9;

/** How clean a join is, by its match: the bands the toolbar and the Zones overview share. */
const JOIN_BANDS: { from: number; word: string; sentence: string }[] = [
  { from: 0.98, word: 'clean join', sentence: 'a clean join' },
  { from: WEAK_JOIN, word: 'good join', sentence: 'a good join' },
  { from: 0.7, word: 'may click', sentence: 'a join you may hear: try a loop crossfade' },
  { from: -Infinity, word: 'rough join', sentence: 'a rough join: move it by ear, or add a loop crossfade' },
];
const bandOf = (match: number) => JOIN_BANDS.find((b) => match >= b.from)!;

/** A found loop's match in a player's words. */
export const matchWords = (match: number): string => bandOf(match).sentence;

/** A join's match in a word or two, for a row of the Zones overview. */
export const joinWord = (match: number): string => bandOf(match).word;

/** A signed number with a real minus sign: "+1.5", "−3", "0". */
export const signed = (n: number, digits = 0): string => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)}`;
