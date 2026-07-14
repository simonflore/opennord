/**
 * Shared organ-drawbar helpers — both the binary nibble decoder (used by the
 * Electro/Wave decoders) and the Hammond-standard presentation legend/colors
 * (the same nine pipe lengths/colors on every B3-style organ across the Nord
 * line), so they live here, not per-model.
 */
import type { DrawbarView, DrawbarColor } from './engine-view';

/**
 * Decoded organ drawbars: nine 0–8 levels plus a trailing 4-bit value. Each model
 * keeps its own `*Drawbars` wrapper type for traceability and assigns this result.
 */
export interface Drawbars {
  bars: number[];
  _trailing: number;
}

/**
 * Decode 9 nibble-packed drawbar values from 5 bytes of `body` at `offset` — the
 * NE6 encoding shared by NE4/NE5/NE6/NW2: 9 drawbars as high-nibble-first 4-bit
 * values; bytes 0–3 hold drawbars 1–8 (two per byte), byte 4's high nibble is
 * drawbar 9, its low nibble is `_trailing` (≈always 0 in corpora).
 */
export function readDrawbars(body: Uint8Array, offset: number): Drawbars {
  const bars: number[] = [];
  for (let i = 0; i < 4; i++) {
    const byte = body[offset + i] ?? 0;
    bars.push((byte >>> 4) & 0xf);
    bars.push(byte & 0xf);
  }
  const last = body[offset + 4] ?? 0;
  bars.push((last >>> 4) & 0xf);
  return { bars, _trailing: last & 0xf };
}

/** B3 drawbar footage labels, 16′ down to 1′. Vox/Farfisa relabel for display. */
export const B3_FOOTAGE = ['16′', '5⅓′', '8′', '4′', '2⅔′', '2′', '1⅗′', '1⅓′', '1′'];

/** Classic Hammond drawbar tab colors, left→right. */
export const B3_COLORS: DrawbarColor[] = [
  'brown', 'brown', 'white', 'white', 'black', 'white', 'black', 'black', 'white',
];

/** Build a DrawbarStack view from raw 0-8 levels, with optional footage labels. */
export function drawbarViews(levels: number[], footage?: readonly (string | undefined)[]): DrawbarView[] {
  return levels.map((level, i) => ({
    level,
    label: String(level),
    color: 'default',
    footage: footage?.[i],
  }));
}

/** B3 drawbars with footage + Hammond colors (no morph — for models without morph, e.g. ns3). */
export function b3DrawbarViews(levels: number[]): DrawbarView[] {
  return levels.map((level, i) => ({
    level,
    label: String(level),
    color: B3_COLORS[i] ?? 'default',
    footage: B3_FOOTAGE[i],
  }));
}
