/** Settings the take tools share (Zone panel and All takes). */

/** Normalize brings the loudest moment of a take to this peak, in dB. */
export const PEAK_DB = -1;
/** Trim silence treats anything quieter than this, in dB, as silence. */
export const SILENCE_DB = -60;

/** A found loop's match in a player's words. */
export function matchWords(match: number): string {
  if (match >= 0.98) return 'a clean join';
  if (match >= 0.9) return 'a good join';
  if (match >= 0.7) return 'a join you may hear: try a loop crossfade';
  return 'a rough join: move it by ear, or add a loop crossfade';
}
