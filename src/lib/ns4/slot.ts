/**
 * The keyboard slot the Nord displays as `X:YY` — X = bank letter (A–H), YY =
 * two 1-based digits from the 6-bit location: digit1 = (loc/8)+1, digit2 =
 * (loc%8)+1. Ported from ns4decode's interpretBank / interpretLocnInBank.
 * Shared by the file parser and the device layer — do not duplicate.
 */
export const BANK_LETTERS = 'ABCDEFGH';

/** @example formatSlot(7, 56) // → "H:81" */
export function formatSlot(bank: number, location: number): string {
  const letter = BANK_LETTERS[bank & 0x7] ?? String(bank);
  const loc = location & 0x3f;
  return `${letter}:${Math.floor(loc / 8) + 1}${(loc % 8) + 1}`;
}
