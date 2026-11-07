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
 * The letter of a bank the Nord itself listed. Past H the alphabet goes on: the
 * Electro 6 has 26 program banks and the Electro 7 / Wave 2 sample libraries 26
 * banks, so masking to A–H would give banks 0 and 8
 * the same letter. Whether those panels letter their banks this way is not
 * confirmed; that each bank gets its own letter is what matters here.
 */
export function bankLetter(bank: number): string {
  return DEVICE_BANK_LETTERS[bank] ?? String(bank);
}
const DEVICE_BANK_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * The label of a slot the Nord itself listed. Unlike {@link formatSlot}, which reads
 * a file header's 6-bit location, it keeps the whole location and bank: a Stage 2
 * bank holds 100 slots, and masking gave slots 0 and 64 the same label, so two
 * programs shared a Library id (the wrong one opened, and its read never finished).
 * Slots 0–63 of banks A–H read exactly as {@link formatSlot} reads them; past that
 * the pages keep counting (slot 64 is "A:91"), so every slot has a label of its own.
 * That grid label is the Library id of a slot on every model; what the views show
 * a Stage 2 player is its panel's `A:PP:S` (`scheme` 'pages', {@link programSlotScheme}).
 * Every label the device views show, and every Library id of a Nord slot, comes
 * from here: a slot address is unique, so its label must be too.
 * @example formatDeviceSlot(0, 64) // → "A:91"
 */
export function formatDeviceSlot(bank: number, location: number, scheme: SlotScheme = 'grid'): string {
  if (scheme === 'pages') {
    // A Stage 2 panel: bank, page 01–20, program 1–5 (confirmed on a Stage 2 EX: the
    // last slot of a bank reads "B:20:5", the 40th "B:08:5").
    const page = Math.floor(location / 5) + 1;
    return `${bankLetter(bank)}:${String(page).padStart(2, '0')}:${(location % 5) + 1}`;
  }
  if (scheme === 'number') return String(location + 1);
  return `${bankLetter(bank)}:${Math.floor(location / 8) + 1}${(location % 8) + 1}`;
}

/**
 * How a Nord labels its slots on the panel. `grid` is the Stage 3/4 `X:YY` grid;
 * `pages` the Stage 2 family's `X:PP:S` (bank, page of five, program); `number` a
 * plain 1-based number, as a Stage 2 shows its sample slots.
 */
export type SlotScheme = 'grid' | 'pages' | 'number';

/** The models whose program slots read bank : page : program (a Stage 2 / 2 EX). */
const PAGED_MODELS = new Set(['stage-2', 'stage-2-ex']);

/** A model, its id, or a program file type, as the key the scheme tables use. */
function modelKey(model?: { id: string } | string | null): string | undefined {
  return typeof model === 'string' ? model : model?.id;
}

/**
 * The scheme a Nord's program slots are labelled in, from its model id or a
 * listed program's file type (`ns2p` is a Stage 2 program).
 */
export function programSlotScheme(model?: { id: string } | string | null): SlotScheme {
  const key = modelKey(model);
  if (!key) return 'grid';
  return PAGED_MODELS.has(key) || key === 'ns2p' ? 'pages' : 'grid';
}

/**
 * The scheme a Nord's sample (or piano) slots are labelled in: a Stage 2 numbers
 * its samples 1, 2, 3…; every other model keeps the program grid.
 */
export function sampleSlotScheme(model?: { id: string } | string | null): SlotScheme {
  const key = modelKey(model);
  return key && PAGED_MODELS.has(key) ? 'number' : 'grid';
}

/**
 * A slot on the Nord, written out for prose ("Write to Slot A:26"): what a send
 * or a delete asks the player to confirm, so it must name the slot it acts on
 * (the device label, never the 6-bit file-header one).
 * @example slotLabel(0, 21) // → "Slot A:36"
 */
export function slotLabel(bank: number, location: number, scheme: SlotScheme = 'grid'): string {
  return `Slot ${formatDeviceSlot(bank, location, scheme)}`;
}

/**
 * Nord Lead 4 program-slot display: `X:NN` where X is the bank letter (A or B)
 * and NN is the 1-based sequential slot within the bank (zero-padded to 2 digits).
 *
 * The Lead 4 has two performance banks (A and B), each holding 50 slots (0–49).
 * Lead 4 location conversion checks the file type matches
 * `nl4p` then normalises bank 0/1 against a 50-slot stride (0x32). The base-class
 * display scheme is sequential: bank letter from {@link BANK_LETTERS}, slot = loc + 1.
 * This matches the Electro 5 sequential pattern — ConvertLocation handles bank
 * switching (the "two-bank" fold), not a new display encoding.
 *
 *
 * @example lead4Slot(0, 0)  // → "A:01"
 * @example lead4Slot(1, 41) // → "B:42"  (fixture: "Duo Arp Nord Stage Samples.nl4p")
 */
export function lead4Slot(bank: number, location: number): string {
  // Lead 4 location conversion: nl4p programs use sequential
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
 * Wave 2 location conversion handles only the NSMP sample
 * partition (checks `s_kNSMP` type; programs are a different type). For program
 * files (tag `nw2p`, formatType 1), ConvertLocation returns 1 (unhandled) and
 * the base class applies the **NSM-era grid display** — the same `formatSlot`
 * encoding used by Stage 3/4. This is confirmed by 26 real `.nw2p` fixtures
 * (all carry formatType = 1, i.e. the NSM-era envelope, not the OG legacy
 * format). The function delegates directly to `formatSlot`.
 *
 * Confirmed vs 26 real .nw2p fixtures, not HW-tested.
 *
 * @example wave2Slot(2, 1) // → "C:12"  (One Vision Queen.nw2p: bank=2, loc=1)
 * @example wave2Slot(14, 0) // → "O:11" (EF bank O, loc 0)
 */
export function wave2Slot(bank: number, location: number): string {
  // Wave 2 location conversion: programs → unhandled (returns 1);
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
 * → slot 50. This is because Electro 5 location conversion returns 1
 * (unhandled) for the program partition, meaning the base class applies the
 * simple sequential scheme, not the Stage 4 8-col grid.
 *
 * The piano partition's special remapping (banks 1–2, locs
 * 1–14 via) is internal to `SPartitionPianoV5` and does not
 * affect program slots.
 *
 * @example electro5Slot(2, 20) // → "C:21"
 * @example electro5Slot(0, 0)  // → "A:01"
 */
export function electro5Slot(bank: number, location: number): string {
  // Electro 5 location conversion: programs use default display
  const letter = BANK_LETTERS[bank & 0x7] ?? String(bank);
  const slot = (location & 0xff) + 1;
  return `${letter}:${String(slot).padStart(2, '0')}`;
}
