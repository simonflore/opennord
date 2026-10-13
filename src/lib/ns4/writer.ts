/**
 * The `.ns4p` write path — editing programs and emitting valid files.
 *
 * Why edit-in-place instead of serializing the model: the decoder is *lossy*
 * (only part of the 406 params are interpreted, and ~20% of the bytes aren't
 * mapped yet). Rebuilding a whole file from `NS4Program` would corrupt every
 * byte we haven't decoded. So the write path starts from the original file
 * bytes — preserving everything untouched — applies the specific raw-value
 * edits the user made (at the bit level, the exact inverse of the decoder),
 * and recomputes the checksum. Output is byte-perfect everywhere the user
 * didn't change, which is exactly what the Nord (and Nord Sound Manager)
 * require to accept the file. See the maintainers’ notes and the maintainers’ notes.
 */

import { readFieldBytes, writeField } from './bits';
import { buildParamMap, type Param, type Ns4Group } from './maps';
import { patchNs4Checksum } from '../clavia/checksum';

/** A single raw-value edit: set `group:name` (layer `layer`) to `value`. */
export interface RawEdit {
  group: Ns4Group;
  /** Parameter base name as in the offset map, e.g. "volume", "octave shift". */
  name: string;
  /** Layer index (0=A, 1=B, 2=C). Defaults to 0. */
  layer?: number;
  /** New raw (uninterpreted) integer value. */
  value: number;
}

/** Resolve a parameter by group + base name (offset-map naming, no [A]/[B] suffix). */
export function findParam(map: Param[], group: Ns4Group, name: string): Param | undefined {
  return map.find((p) => p.group === group && p.name === name);
}

/** Read the current raw value of a single parameter/layer from `bytes`. */
export function getRawParam(
  bytes: Uint8Array,
  group: Ns4Group,
  name: string,
  layer = 0,
  map: Param[] = buildParamMap(),
): number {
  const p = findParam(map, group, name);
  if (!p) throw new Error(`unknown param ${group}:${name}`);
  const L = p.layers[layer];
  if (!L || L.begBit < 0) throw new Error(`param ${group}:${name} has no layer ${layer}`);
  return readFieldBytes(bytes, L.begBit, L.endBit);
}

/** Set one parameter/layer to a raw value, mutating `bytes`. Does NOT re-checksum. */
export function setRawParam(
  bytes: Uint8Array,
  group: Ns4Group,
  name: string,
  layer: number,
  value: number,
  map: Param[] = buildParamMap(),
): void {
  const p = findParam(map, group, name);
  if (!p) throw new Error(`unknown param ${group}:${name}`);
  const L = p.layers[layer];
  if (!L || L.begBit < 0) throw new Error(`param ${group}:${name} has no layer ${layer}`);
  writeField(bytes, L.begBit, L.endBit, value);
}

/**
 * Apply raw edits to a program and return a new, valid `.ns4p` buffer.
 *
 * The input is never mutated. With an empty edit list this returns a byte-for-byte
 * copy (the checksum is recomputed but already matches), so it round-trips cleanly.
 */
export function editNs4Program(original: Uint8Array, edits: RawEdit[] = []): Uint8Array {
  const out = new Uint8Array(original);
  const map = buildParamMap();
  for (const e of edits) {
    setRawParam(out, e.group, e.name, e.layer ?? 0, e.value, map);
  }
  return patchNs4Checksum(out);
}

/**
 * Every mapped setting of a program (each layer it has) as an edit that holds the value the
 * file has now. Applying them all must give the same file back: the write-back the corpus
 * scan runs on real programs. Settings that lie beyond the end of a short file are left out.
 */
export function currentRawEdits(bytes: Uint8Array, map: Param[] = buildParamMap()): RawEdit[] {
  const edits: RawEdit[] = [];
  for (const p of map) {
    p.layers.forEach((l, layer) => {
      if (l.begBit < 0 || (l.endBit >>> 3) >= bytes.length) return;
      edits.push({ group: p.group, name: p.name, layer, value: readFieldBytes(bytes, l.begBit, l.endBit) });
    });
  }
  return edits;
}

/**
 * Write a changed value into each mapped setting in turn and read it back. Each write must
 * read back as written, touch no byte outside the setting's own, and leave the file as it
 * was once the old value is restored. Returns what went wrong for the first setting that
 * fails, or null. The input is not changed.
 */
export function checkFieldWrites(bytes: Uint8Array, map: Param[] = buildParamMap()): string | null {
  const work = bytes.slice();
  for (const p of map) {
    for (const [layer, l] of p.layers.entries()) {
      if (l.begBit < 0 || (l.endBit >>> 3) >= bytes.length) continue;
      const was = readFieldBytes(work, l.begBit, l.endBit);
      const changed = (was ^ 1) >>> 0; // the lowest bit flipped: always inside the field's width
      writeField(work, l.begBit, l.endBit, changed);
      const where = `${p.group}:${p.name}${p.layers.length > 1 ? ` layer ${layer}` : ''}`;
      if (readFieldBytes(work, l.begBit, l.endBit) !== changed) return `${where}: a written value does not read back`;
      for (let i = 0; i < bytes.length; i++) {
        if (work[i] !== bytes[i] && (i < l.begBit >>> 3 || i > l.endBit >>> 3)) return `${where}: writing it changed byte ${i}, outside the setting`;
      }
      writeField(work, l.begBit, l.endBit, was);
    }
  }
  for (let i = 0; i < bytes.length; i++) if (work[i] !== bytes[i]) return `byte ${i} did not come back after every setting was restored`;
  return null;
}

