/**
 * Pure geometry for the keyboard zone map — turns the editable zones into a
 * tiled key layout and maps MIDI keys ↔ horizontal position. No DOM, no React;
 * unit-tested. The component renders these and emits edits back.
 */
import type { EditZone } from './sample-edit';

export const KEY_MIN = 21;  // A0
export const KEY_MAX = 108; // C8 — the Stage 4's 88-key range
const KEY_SPAN = KEY_MAX - KEY_MIN;

const BLACK = new Set([1, 3, 6, 8, 10]);
export const isBlackKey = (midi: number) => BLACK.has(((midi % 12) + 12) % 12);

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Fraction 0–1 of a key's left edge across the keyboard (linear per semitone). */
export const keyFraction = (midi: number) => (clamp(midi, KEY_MIN, KEY_MAX) - KEY_MIN) / KEY_SPAN;
/** Inverse: a 0–1 fraction → nearest MIDI key. */
export const keyFromFraction = (f: number) => KEY_MIN + Math.round(clamp(f, 0, 1) * KEY_SPAN);

export interface TiledZone {
  /** Original index in the edit model (zone i ↔ stroke i) — edits map back by this. */
  index: number;
  rootKey: number;
  keyHigh: number;
  /** Bottom key of the zone — the previous zone's keyHigh + 1 (KEY_MIN for the first). */
  keyLow: number;
  velTop: number;
}

/**
 * Lay the zones out left→right by ascending top key (split point), deriving each
 * zone's bottom key from the previous boundary. Keeps the original index so a
 * drag can write back to the right edit-model entry.
 */
export function tileZones(zones: EditZone[]): TiledZone[] {
  const ordered = zones.map((z, index) => ({ ...z, index })).sort((a, b) => a.keyHigh - b.keyHigh);
  let low = KEY_MIN;
  return ordered.map((z) => {
    const tz: TiledZone = { index: z.index, rootKey: z.rootKey, keyHigh: z.keyHigh, keyLow: low, velTop: z.velTop };
    low = z.keyHigh + 1;
    return tz;
  });
}

/**
 * Clamp a proposed new top key for the tiled zone at `pos` so it stays above its
 * own bottom key and below the next zone's top (zones can't cross or invert).
 */
export function clampKeyHigh(tiled: TiledZone[], pos: number, proposed: number): number {
  const z = tiled[pos];
  const lo = z.keyLow;                                   // can't go below its own floor
  const hi = pos + 1 < tiled.length ? tiled[pos + 1].keyHigh - 1 : KEY_MAX; // leave the next zone ≥1 key
  return clamp(Math.round(proposed), lo, hi);
}
