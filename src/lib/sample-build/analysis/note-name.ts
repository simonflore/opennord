/**
 * A recording's root from its file name (spec §6). Two forms count:
 * - a note name with an octave as its own word (`C3`, `F#2`, `Db4`, `Cs4`, `c-1`, `C#-1`);
 * - a bare number from 0 to 127, but only when the word right before it is "note", "midi" or
 *   "key" in any case (`note_048_`, `midi 100`, `Key-60`). Other numbers (`Take_001`, `Kick_010`)
 *   are sequence numbers, not roots.
 * A note name wins over a number, and the last note name wins ("Rhodes_C3" → C3). C4 = MIDI 60,
 * as the app and NSE show notes.
 */
const PITCH: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const NUMBER_CUES = new Set(['note', 'midi', 'key']);

export function rootFromFileName(fileName: string): number | undefined {
  const base = fileName.replace(/^.*[\\/]/, '').replace(/\.[A-Za-z0-9]{2,4}$/, '');
  // A "-1" right after a note name is the octave, not a separator: join it with "~" before
  // splitting on every "-", so "c-1" stays one word.
  const words = base
    .replace(/(?<![A-Za-z0-9])([A-Ga-g](?:#|b|s)?)-1(?![0-9])/g, '$1~1')
    .split(/[\s_.-]+/)
    .filter(Boolean);
  let note: number | undefined;
  let numeric: number | undefined;
  let previous = '';
  for (const w of words) {
    const m = /^([A-Ga-g])(#|b|s)?(~1|[0-9])$/.exec(w);
    if (m) {
      const octave = m[3] === '~1' ? -1 : Number(m[3]);
      const accidental = m[2] === '#' || m[2] === 's' ? 1 : m[2] === 'b' ? -1 : 0;
      const midi = (octave + 1) * 12 + PITCH[m[1].toLowerCase()] + accidental;
      if (midi >= 0 && midi <= 127) note = midi;
    } else if (NUMBER_CUES.has(previous.toLowerCase()) && /^\d+$/.test(w) && Number(w) <= 127) {
      numeric = Number(w);
    }
    previous = w;
  }
  return note ?? numeric;
}
