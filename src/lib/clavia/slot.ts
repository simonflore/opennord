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
 * Nord Lead 4 program-slot display: `X:NN` where X is the bank letter (A or B)
 * and NN is the 1-based sequential slot within the bank (zero-padded to 2 digits).
 *
 * The Lead 4 has two performance banks (A and B), each holding 50 slots (0–49).
 * `CLead4Base::ConvertLocation @0x00000001000ddcf8` checks the file type matches
 * `nl4p` then normalises bank 0/1 against a 50-slot stride (0x32). The base-class
 * display scheme is sequential: bank letter from {@link BANK_LETTERS}, slot = loc + 1.
 * This matches the Electro 5 sequential pattern — ConvertLocation handles bank
 * switching (the "two-bank" fold), not a new display encoding.
 *
 * Source: `CLead4Base::ConvertLocation @0x00000001000ddcf8` (NSM decompile,
 * `nsm_decomp/`).
 *
 * @example lead4Slot(0, 0)  // → "A:01"
 * @example lead4Slot(1, 41) // → "B:42"  (fixture: "Duo Arp Nord Stage Samples.nl4p")
 */
export function lead4Slot(bank: number, location: number): string {
  // CLead4Base::ConvertLocation @0x00000001000ddcf8: nl4p programs use sequential
  // display — bank letter + 1-based loc within the 50-slot bank (same as Electro 5).
  const letter = BANK_LETTERS[bank & 0x7] ?? String(bank);
  const slot = (location & 0xff) + 1;
  return `${letter}:${String(slot).padStart(2, '0')}`;
}

/**
 * Nord Wave 2 program-slot display: `X:d1d2` using the shared NSM-era grid
 * (the same 8-column encoding as Stage 3/4/Electro 6 — bank letter + two grid
 * digits from location).
 *
 * `CWave2::ConvertLocation @0x0000000100034508` handles only the NSMP sample
 * partition (checks `s_kNSMP` type; programs are a different type). For program
 * files (tag `nw2p`, formatType 1), ConvertLocation returns 1 (unhandled) and
 * the base class applies the **NSM-era grid display** — the same `formatSlot`
 * encoding used by Stage 3/4. This is confirmed by 26 real `.nw2p` fixtures
 * (all carry formatType = 1, i.e. the NSM-era envelope, not the OG legacy
 * format). The function delegates directly to `formatSlot`.
 *
 * Source: `CWave2::ConvertLocation @0x0000000100034508` (NSM decompile,
 * `nsm_decomp/`); confirmed vs 26 real .nw2p fixtures, not HW-tested.
 *
 * @example wave2Slot(2, 1) // → "C:12"  (One Vision Queen.nw2p: bank=2, loc=1)
 * @example wave2Slot(14, 0) // → "O:11" (EF bank O, loc 0)
 */
export function wave2Slot(bank: number, location: number): string {
  // CWave2::ConvertLocation @0x0000000100034508: programs → unhandled (returns 1);
  // base class applies NSM-era grid display — delegate to formatSlot.
  return formatSlot(bank, location);
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
