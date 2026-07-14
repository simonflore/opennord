import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bytesToBitString, readField, readFieldBytes, writeField } from './bits';
import { buildParamMap } from './maps';
import { editNs4Program, getRawParam, setRawParam } from './writer';
import { verifyNs4Checksum } from '../clavia/checksum';
import { parseNs4Program } from './parse';

const fixture = new Uint8Array(
  readFileSync(fileURLToPath(new URL('./__fixtures__/regressionTest.ns4p', import.meta.url))),
);

describe('writeField / readFieldBytes', () => {
  it('round-trips values across widths and bit offsets', () => {
    for (const [beg, end, val] of [
      [0, 0, 1],
      [3, 9, 0b1010101],
      [8, 15, 0xff],
      [5, 36, 0xdeadbeef], // 32-bit field straddling byte boundaries
      [100, 106, 0],
    ] as const) {
      const buf = new Uint8Array(16);
      writeField(buf, beg, end, val);
      expect(readFieldBytes(buf, beg, end)).toBe(val);
    }
  });

  it('matches the decoder bit-string reader on the real fixture (all params)', () => {
    const bits = bytesToBitString(fixture);
    for (const p of buildParamMap()) {
      for (const L of p.layers) {
        if (L.begBit < 0) continue;
        expect(readFieldBytes(fixture, L.begBit, L.endBit)).toBe(readField(bits, L.begBit, L.endBit));
      }
    }
  });

  it('only touches its own bits, leaving neighbours intact', () => {
    const buf = new Uint8Array([0xff, 0xff, 0xff]);
    writeField(buf, 8, 11, 0b0000); // clear high nibble of byte 1
    expect([...buf]).toEqual([0xff, 0x0f, 0xff]);
  });

  it('rejects out-of-range values and bad ranges', () => {
    const buf = new Uint8Array(4);
    expect(() => writeField(buf, 0, 2, 8)).toThrow(/out of range/); // 3-bit max is 7
    expect(() => writeField(buf, 0, 2, -1)).toThrow(/out of range/);
    expect(() => writeField(buf, 5, 2, 0)).toThrow(/bad bit range/);
  });
});

describe('exact inverse across the whole map', () => {
  it('re-writing every param with its own raw value reproduces the file byte-for-byte', () => {
    const out = new Uint8Array(fixture);
    const map = buildParamMap();
    for (const p of map) {
      p.layers.forEach((L) => {
        if (L.begBit < 0) return;
        writeField(out, L.begBit, L.endBit, readFieldBytes(out, L.begBit, L.endBit));
      });
    }
    expect(out).toEqual(fixture);
  });
});

describe('editNs4Program', () => {
  it('with no edits returns a byte-identical, still-valid file', () => {
    const out = editNs4Program(fixture);
    expect(out).toEqual(fixture);
    expect(verifyNs4Checksum(out)).toBe(true);
  });

  it('does not mutate the input buffer', () => {
    const snapshot = fixture.slice();
    editNs4Program(fixture, []);
    expect(fixture).toEqual(snapshot);
  });

  it('applies a raw edit: reads back the new value, keeps a valid checksum, re-parses', () => {
    // Pick a deterministic, modest-width param/layer to flip to a new valid value.
    const map = buildParamMap();
    const p = map.find((q) => q.layers.some((L) => L.begBit >= 0 && L.endBit - L.begBit + 1 >= 2 && L.endBit - L.begBit + 1 <= 7))!;
    const layerIdx = p.layers.findIndex((L) => L.begBit >= 0 && L.endBit - L.begBit + 1 >= 2 && L.endBit - L.begBit + 1 <= 7);
    const L = p.layers[layerIdx];
    const width = L.endBit - L.begBit + 1;
    const cur = getRawParam(fixture, p.group, p.name, layerIdx, map);
    const next = (cur + 1) % (1 << width);

    const out = editNs4Program(fixture, [{ group: p.group, name: p.name, layer: layerIdx, value: next }]);

    expect(getRawParam(out, p.group, p.name, layerIdx, map)).toBe(next);
    expect(verifyNs4Checksum(out)).toBe(true);
    const reparsed = parseNs4Program(out);
    expect(reparsed.parsed).toBe(true);
    expect(reparsed.kind).toBe('program');
    // Every OTHER param is unchanged from the original.
    for (const q of map) {
      q.layers.forEach((QL, k) => {
        if (QL.begBit < 0) return;
        if (q === p && k === layerIdx) return;
        expect(readFieldBytes(out, QL.begBit, QL.endBit)).toBe(readFieldBytes(fixture, QL.begBit, QL.endBit));
      });
    }
  });

  it('setRawParam to the current value leaves the buffer byte-identical', () => {
    const out = new Uint8Array(fixture);
    const cur = getRawParam(out, 'm', buildParamMap().find((p) => p.group === 'm' && p.layers[0]?.begBit >= 0)!.name, 0);
    const p = buildParamMap().find((q) => q.group === 'm' && q.layers[0]?.begBit >= 0)!;
    setRawParam(out, 'm', p.name, 0, cur);
    expect(out).toEqual(fixture);
  });
});
