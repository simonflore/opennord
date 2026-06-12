/**
 * Reverse-engineering helpers: what's decoded, what's still a gap, and what
 * changed between two files. This is the engine behind the Decode Inspector.
 *
 * The gap-finding workflow: export a program, change ONE setting on the Nord,
 * export again, and `diffBytes` lights up exactly the bytes that moved — that's
 * the unknown parameter's location. `paramsCoveringByte` says whether a byte is
 * already claimed by a known parameter or is virgin territory.
 */

import { bytesToBitString, readField } from './bits';
import { interpretValue } from './interpret';
import type { Param } from './maps';

export interface DecodedParam {
  name: string;
  group: Param['group'];
  layer: number;
  begBit: number;
  endBit: number;
  value: number;
  /** Human-readable value where a table applies, else the raw integer. */
  display: string;
}

/** Decode every known parameter (all layers) from a file's bits. */
export function decodeAllParams(bytes: Uint8Array, map: Param[]): DecodedParam[] {
  const bits = bytesToBitString(bytes);
  const out: DecodedParam[] = [];
  for (const p of map) {
    p.layers.forEach((layer, k) => {
      if (layer.begBit < 0) return;
      const value = readField(bits, layer.begBit, layer.endBit);
      const label = Number.isNaN(value) ? null : interpretValue(p.name, value);
      out.push({
        name: p.layers.length > 1 ? `${p.name} [${'ABC'[k] ?? k}]` : p.name,
        group: p.group,
        layer: k,
        begBit: layer.begBit,
        endBit: layer.endBit,
        value,
        display: label ?? (Number.isNaN(value) ? '—' : String(value)),
      });
    });
  }
  return out;
}

/** The engine that owns a byte (first covering param), for the coverage strip. */
export function groupOfByte(map: Param[], byteIndex: number): Param['group'] | null {
  const ps = paramsCoveringByte(map, byteIndex);
  return ps.length ? ps[0].group : null;
}

/** Byte indices touched by at least one known parameter (any layer). */
export function claimedByteSet(map: Param[], byteLen: number): Set<number> {
  const claimed = new Set<number>();
  for (const p of map) {
    for (const layer of p.layers) {
      if (layer.begBit < 0) continue;
      const first = Math.floor(layer.begBit / 8);
      const last = Math.floor(layer.endBit / 8);
      for (let b = first; b <= last && b < byteLen; b++) claimed.add(b);
    }
  }
  return claimed;
}

/** Contiguous byte ranges NOT yet claimed by any known parameter — the gaps. */
export function gapRanges(map: Param[], byteLen: number): Array<{ start: number; end: number }> {
  const claimed = claimedByteSet(map, byteLen);
  const ranges: Array<{ start: number; end: number }> = [];
  let start = -1;
  for (let b = 0; b < byteLen; b++) {
    const isGap = !claimed.has(b);
    if (isGap && start < 0) start = b;
    if (!isGap && start >= 0) {
      ranges.push({ start, end: b - 1 });
      start = -1;
    }
  }
  if (start >= 0) ranges.push({ start, end: byteLen - 1 });
  return ranges;
}

/** Percentage of bytes claimed by the known map. */
export function coveragePercent(map: Param[], byteLen: number): number {
  if (byteLen === 0) return 0;
  return (claimedByteSet(map, byteLen).size / byteLen) * 100;
}

/** Byte indices where two files differ — the heart of one-knob-apart diffing. */
export function diffBytes(a: Uint8Array, b: Uint8Array): number[] {
  const len = Math.max(a.length, b.length);
  const diff: number[] = [];
  for (let i = 0; i < len; i++) {
    if ((a[i] ?? -1) !== (b[i] ?? -1)) diff.push(i);
  }
  return diff;
}

/** Which known parameters (if any) cover a given byte — names a diff for you. */
export function paramsCoveringByte(map: Param[], byteIndex: number): Param[] {
  return map.filter((p) =>
    p.layers.some(
      (l) => l.begBit >= 0 && Math.floor(l.begBit / 8) <= byteIndex && byteIndex <= Math.floor(l.endBit / 8),
    ),
  );
}
