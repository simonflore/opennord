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

/**
 * The same address, written out for prose ("Write to Slot A:26"). Use this in
 * sentences; keep {@link formatSlot} for dense grid cells where space is tight.
 * @example slotLabel(0, 21) // → "Slot A:36"
 */
export function slotLabel(bank: number, location: number): string {
  return `Slot ${formatSlot(bank, location)}`;
}

/**
 * Electro 5 program-slot display: `X:NN` where X is the bank letter and NN is
 * the 1-based sequential slot number within the bank (zero-padded to 2 digits).
 *
 * The Electro 5 has up to 50 slots per bank (location 0–49). Unlike Stage
 * models (which use an 8-column grid yielding `X:d1d2`), the Electro 5 maps
 * location directly to a 1-based index — so location 0 → slot 01, location 49
 * → slot 50. This is derived from `CElectro5::ConvertLocation` returning 1
 * (unhandled) for the program partition, meaning the base class applies the
 * simple sequential scheme, not the Stage 4 8-col grid.
 *
 * Source: `CElectro5::ConvertLocation @0x0000000100194844` (NSM decompile,
 * `nsm_decomp/`). The piano partition's special remapping (banks 1–2, locs
 * 1–14 via `DAT_10074ed28`) is internal to `SPartitionPianoV5` and does not
 * affect program slots.
 *
 * @example electro5Slot(2, 20) // → "C:21"
 * @example electro5Slot(0, 0)  // → "A:01"
 */
export function electro5Slot(bank: number, location: number): string {
  // CElectro5::ConvertLocation @0x0000000100194844: programs use default display
  const letter = BANK_LETTERS[bank & 0x7] ?? String(bank);
  const slot = (location & 0xff) + 1;
  return `${letter}:${String(slot).padStart(2, '0')}`;
}
