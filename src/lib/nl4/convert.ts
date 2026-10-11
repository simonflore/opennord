/**
 * Nord Lead 4 records from OS versions 6 and 7, converted the way the OS 1.32
 * load path converts them. The version objects (programs, version 8;
 * performances, version 9) step an older record up one version at a
 * time through a converter table; anything
 * older than 6 is refused. Each step applies small fix-ups to every program
 * record (a `.nl4s`, or each of a `.nl4p`'s four slots):
 *
 * - 6 → 7: with LFO1/Arp on and Arp Impsync on but Arp Mst Clk
 *   off, Arp Impsync is switched off.
 * - 7 → 8: OS version 8 put Amp Env Attack and Arp Tempo
 * on new knob curves. Each value moves through the firmware's
 *   own 128-step map, and so do its morphs: a relative morph (source 0-1) is
 *   re-aimed at the converted target (old value + delta, clamped to ±127), an
 *   absolute one (source 2-8) is mapped itself.
 * - 7 → 8, effects: OS version 8 has one Delay/Reverb Amount and
 *   a Delay / Reverb selection where version 7 kept a separate reverb amount
 *   (FX descriptor 7). With reverb selected, that amount becomes the shared one;
 *   either way the old field is cleared, and the effects morphs follow: those on
 *   the amount that isn't selected are dropped, those on the old reverb amount
 *   move to the shared one.
 * - 8 → 9, performances only: performance common setting 11
 *   (3 bits at data bit 24) := 2.
 *
 * The two curves are the firmware's maps, kept here by
 * a deliberate exception to "no firmware tables" (docs/LEGAL.md): 2 × 128 small
 * values with no formula behind them, needed to show older files the way the
 * instrument plays them.
 *
 * Pure; never throws.
 */
import { readBits, writeBits } from '../clavia/bitstream';
import { NL4_LAYOUT } from './layout.generated';

/** Amp Env Attack, OS version ≤ 7 knob value → version 8 (firmware map). */
const ATTACK_V8: readonly number[] = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 5, 6,
  7, 8, 9, 10, 10, 11, 12, 13, 14, 15, 15, 16, 17, 18, 19, 20,
  21, 21, 22, 23, 24, 25, 26, 26, 27, 28, 29, 30, 31, 31, 32, 33,
  34, 35, 36, 36, 37, 38, 39, 40, 41, 42, 42, 43, 44, 45, 46, 47,
  47, 48, 49, 50, 51, 52, 52, 53, 54, 55, 56, 57, 58, 58, 59, 60,
  61, 62, 63, 63, 64, 65, 66, 67, 68, 69, 69, 70, 71, 72, 73, 73,
  74, 75, 76, 77, 78, 79, 79, 80, 81, 82, 83, 84, 85, 85, 86, 87,
  88, 89, 90, 91, 91, 92, 93, 93, 94, 95, 96, 97, 98, 99, 100, 101,
];

/** Arp Tempo, OS version ≤ 7 knob value → version 8 (firmware map). */
const ARP_TEMPO_V8: readonly number[] = [
  11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 15, 16, 16, 17,
  17, 18, 18, 19, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 25,
  25, 26, 27, 29, 30, 31, 32, 33, 35, 36, 37, 39, 40, 41, 43, 44,
  45, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61,
  61, 63, 64, 66, 67, 68, 70, 71, 72, 73, 74, 75, 76, 76, 77, 78,
  79, 80, 81, 81, 82, 83, 84, 84, 85, 86, 86, 87, 88, 88, 89, 89,
  90, 91, 92, 93, 94, 95, 95, 96, 97, 98, 98, 99, 100, 100, 101, 101,
  102, 102, 103, 103, 104, 104, 105, 105, 105, 106, 106, 106, 107, 107, 107, 108,
];

const PROGRAM_BYTES = NL4_LAYOUT.dataBytes; // 315
/** A performance's common settings, before the four slots. */
const PERF_COMMON_BYTES = 7;

const slotList = NL4_LAYOUT.morphLists!.find((l) => l.set === 'slot')!;
const fxList = NL4_LAYOUT.morphLists!.find((l) => l.set === 'fx')!;
type MorphList = typeof slotList;

/** The low `width` bits of an integer, negatives in two's complement. */
const wrap = (v: number, width: number) => ((v % 2 ** width) + 2 ** width) % 2 ** width;
const signed = (v: number, width: number) => (v >= 2 ** (width - 1) ? v - 2 ** width : v);

/** One program record (a `.nl4s`, or one slot of a `.nl4p`) at data bit `base`. */
function recordAt(data: Uint8Array, base: number) {
  const get = (bit: number, width: number) => readBits(data, base + bit, width);
  const set = (bit: number, width: number, v: number) => writeBits(data, base + bit, width, wrap(v, width));
  return { get, set };
}

interface MorphEntry { param: number; source: number; delta: number }

function readEntries(rec: ReturnType<typeof recordAt>, list: MorphList, at: number): MorphEntry[] {
  const count = Math.min(rec.get(at + list.countBit, list.countWidth), list.maxEntries);
  const stride = list.paramBits + list.sourceBits + list.deltaBits;
  return Array.from({ length: count }, (_, i) => {
    const e = at + list.entryBit + i * stride;
    return {
      param: rec.get(e, list.paramBits),
      source: rec.get(e + list.paramBits, list.sourceBits),
      delta: signed(rec.get(e + list.paramBits + list.sourceBits, list.deltaBits), list.deltaBits),
    };
  });
}

function writeEntries(rec: ReturnType<typeof recordAt>, list: MorphList, at: number, entries: MorphEntry[]): void {
  const stride = list.paramBits + list.sourceBits + list.deltaBits;
  rec.set(at + list.countBit, list.countWidth, entries.length);
  entries.forEach((m, i) => {
    const e = at + list.entryBit + i * stride;
    rec.set(e, list.paramBits, m.param);
    rec.set(e + list.paramBits, list.sourceBits, m.source);
    rec.set(e + list.paramBits + list.sourceBits, list.deltaBits, m.delta);
  });
}

/** Move a slot parameter to its version-8 curve, its morphs with it. */
function remapWithMorphs(rec: ReturnType<typeof recordAt>, id: number, map: readonly number[]): void {
  const f = NL4_LAYOUT.fields.find((x) => x.key.startsWith('slot.') && x.id === id)!;
  const old = rec.get(f.bit, f.width);
  const now = map[old];
  rec.set(f.bit, f.width, now);
  const entries = readEntries(rec, slotList, 0);
  let changed = false;
  for (const m of entries) {
    if (m.param !== id) continue;
    if (m.source < 2) {
      // Relative: re-aim at the converted target; a negative target maps by its magnitude.
      const target = Math.max(-127, Math.min(127, old + m.delta));
      m.delta = Math.sign(target || 1) * map[Math.abs(target)] - now;
    } else if (m.source <= 8 && m.delta >= 0) {
      m.delta = map[m.delta]; // absolute target
    } else continue;
    changed = true;
  }
  if (changed) writeEntries(rec, slotList, 0, entries);
}

const field = (key: string) => NL4_LAYOUT.fields.find((f) => f.key === key)!;
const ARP_ON = field('slot.lfo1ArpOnOff');
const IMPSYNC = field('slot.arpImpsync');
const MST_CLK = field('slot.arpMstClk');
const DELAY_REVERB_AMOUNT = field('fx.delayReverbAmount');
const DELAY_REVERB_SELECTION = field('fx.delayReverbSelection');
/** Version 7's separate reverb amount: FX descriptor 7, 7 bits right after Reverb Model (gone in version 8). */
const OLD_REVERB_AMOUNT = { id: 7, bit: field('fx.reverbModel').bit + field('fx.reverbModel').width, width: 7 };

/** Step one program record from version `from` (6 or 7) to 8. */
function convertProgramRecord(data: Uint8Array, base: number, from: number): void {
  const rec = recordAt(data, base);
  if (from <= 6 && rec.get(ARP_ON.bit, 1) && rec.get(IMPSYNC.bit, 1) && !rec.get(MST_CLK.bit, 1)) {
    rec.set(IMPSYNC.bit, 1, 0);
  }
  if (from > 7) return;
  remapWithMorphs(rec, field('slot.ampEnvAttack').id, ATTACK_V8);
  remapWithMorphs(rec, field('slot.arpTempo').id, ARP_TEMPO_V8);

  const reverb = rec.get(DELAY_REVERB_SELECTION.bit, 1) === 1;
  if (reverb) rec.set(DELAY_REVERB_AMOUNT.bit, 7, rec.get(OLD_REVERB_AMOUNT.bit, 7));
  rec.set(OLD_REVERB_AMOUNT.bit, 7, 0);
  const fxEntries = readEntries(rec, fxList, 0);
  const drop = reverb ? DELAY_REVERB_AMOUNT.id : OLD_REVERB_AMOUNT.id;
  const kept = fxEntries.filter((m) => m.param !== drop)
    .map((m) => (m.param === OLD_REVERB_AMOUNT.id ? { ...m, param: DELAY_REVERB_AMOUNT.id } : m));
  if (kept.length !== fxEntries.length || kept.some((m, i) => m.param !== fxEntries[i].param)) {
    writeEntries(rec, fxList, 0, kept);
  }
}

/** Convert a `.nl4s` record's data (in place) from version 6 or 7 to 8. */
export function convertNl4Program(data: Uint8Array, from: number): void {
  if (from >= 6 && from < 8) convertProgramRecord(data, 0, from);
}

/** Convert a `.nl4p` record's data (in place) from version 6, 7 or 8 to 9. */
export function convertNl4Performance(data: Uint8Array, from: number): void {
  if (from < 6 || from >= 9) return;
  if (from < 8) {
    for (let k = 0; k < 4; k++) convertProgramRecord(data, (PERF_COMMON_BYTES + PROGRAM_BYTES * k) * 8, from);
  }
  writeBits(data, 24, 3, 2); // performance common setting 11
}
