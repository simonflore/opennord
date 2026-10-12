/**
 * Whether a keydown is the letter `letter` (a–z): as typed on Latin layouts
 * (Dvorak, Colemak… put it elsewhere), or the key in its place on a non-Latin
 * layout (Cyrillic, Greek…), where nothing types a Latin letter. `key` can be
 * missing (autofill).
 */
export function isLetterKey(ev: KeyboardEvent, letter: string): boolean {
  const key = ev.key?.toLowerCase() ?? '';
  return key === letter || (!/^[a-z]$/.test(key) && ev.code === `Key${letter.toUpperCase()}`);
}
