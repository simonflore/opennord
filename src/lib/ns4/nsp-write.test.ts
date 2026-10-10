import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { decodeNspStroke, findCnsp, readNspDirectory, strokeFor } from './nsp-audio';
import { readNsp, readNspIdentity } from './nsp';
import { checkNpnoAcceptance } from './nsp-check';
import { tone } from './nsp-synth.testing';
import {
  blockLevel, buildNpno, defaultDecayCoefficient, encodeNpnoStroke, NPNO_HEADER_SIZE, NPNO_PEAK,
  NPNO_RECORD_SIZE, readNpnoImage, writeNpnoImage, type NpnoInput,
} from './nsp-write';
import { identifyNsmp } from '../clavia/sample-identify';

const toneI = (frames: number, f: number, amp: number, seed: number) => Int32Array.from(tone(frames, f, amp, seed));

/** A small two-zone, two-layer piano; the upper zone's loud layer loops. */
function piano(channels: 1 | 2): NpnoInput {
  const ch = (f: number, a: number, s: number, n = 24000) => Array.from({ length: channels }, (_, c) => toneI(n, f, a * (1 - 0.2 * c), s + c));
  return {
    name: 'Test Upright', variant: 'Home', minor: 1, pianoType: 2, channels,
    zones: [
      { rootNote: 48, lowNote: 21, highNote: 59, layers: [
        { pcm: ch(0.01, 3000, 1), velocityFrom: 0 },
        { pcm: ch(0.01, 12000, 2), velocityFrom: 64 },
      ] },
      { rootNote: 72, lowNote: 60, highNote: 108, layers: [
        { pcm: ch(0.02, 2000, 3), velocityFrom: 0 },
        { pcm: ch(0.02, 20000, 4, 30000), velocityFrom: 80, loop: { start: 12000, length: 9000 } },
      ] },
    ],
  };
}

describe('buildNpno', () => {
  for (const channels of [1, 2] as const) {
    it(`writes a ${channels === 1 ? 'mono' : 'stereo'} piano every reader accepts and decodes bit-exactly`, () => {
      const input = piano(channels);
      const { bytes, fileName } = buildNpno(input);
      expect(fileName).toBe('Test_Upright_6.1.npno');

      // Container + header readers.
      const f = readNsp(bytes);
      expect(f.recognized).toBe(true);
      expect(f.hasChecksum).toBe(true);
      expect(f.checksumValid).toBe(true);
      expect(f.version).toBe('6.10');
      expect(f.zones).toEqual([
        { rootNote: 48, lowNote: 21, highNote: 59 },
        { rootNote: 72, lowNote: 60, highNote: 108 },
      ]);
      expect(readNspIdentity(bytes)).toMatchObject({ name: 'Test Upright', variant: 'Home' });
      expect(identifyNsmp(bytes)).toMatchObject({ recognized: true, pianoLibrary: true });
      const acc = checkNpnoAcceptance(bytes, { deep: true });
      expect(acc.checks.filter((c) => !c.ok)).toEqual([]);
      expect(acc.nsmVersion).toBe(610);

      // Audio: every stroke decodes to the normalized input, bit-exactly.
      const dir = readNspDirectory(bytes)!;
      expect(dir.channels).toBe(channels);
      expect(dir.strokes.map((s) => [s.zone, s.velocityFrom])).toEqual([[0, 0], [0, 64], [1, 0], [1, 80]]);
      const layers = input.zones.flatMap((z) => z.layers);
      dir.strokes.forEach((s, i) => {
        const l = layers[i];
        const pcm = decodeNspStroke(bytes, dir, s);
        const end = l.loop ? l.loop.start + l.loop.length : l.pcm[0].length;
        let peak = 0;
        for (const c of l.pcm) for (let n = 0; n < end; n++) peak = Math.max(peak, Math.abs(c[n]));
        const g = NPNO_PEAK / peak;
        for (let c = 0; c < channels; c++) {
          const want = Array.from(l.pcm[c], (v) => Math.round(v * g) + 0); // + 0: no -0
          if (l.loop) {
            // the 4 frames before the loop end are forced to match those before the loop start
            for (let k = 1; k <= 4; k++) want[end - k] = want[l.loop.start - k];
            expect(Array.from(pcm[c].subarray(0, end))).toEqual(want.slice(0, end));
            // after the loop end: the loop again, to the end of the block
            for (let n = end; n < s.frames; n++) expect(pcm[c][n]).toBe(pcm[c][n - l.loop.length]);
          } else {
            expect(Array.from(pcm[c].subarray(0, want.length))).toEqual(want);
            expect(pcm[c].subarray(want.length).every((v) => v === 0)).toBe(true);
          }
        }
        let got = 0;
        for (const c of pcm) for (let n = 0; n < end; n++) got = Math.max(got, Math.abs(c[n]));
        expect(got).toBeLessThanOrEqual(NPNO_PEAK + 1);
      });
      expect(dir.strokes[3].loop).toEqual({ start: 12000, length: 9000 });
      expect(strokeFor(dir, 1, 100)?.index).toBe(3);
    });
  }

  it('fills the record fields: loop block, velocity copy, crossfade, coefficients', () => {
    const { bytes } = buildNpno(piano(1));
    const base = 0x2c;
    const rec = (i: number) => bytes.subarray(base + NPNO_HEADER_SIZE + i * NPNO_RECORD_SIZE);
    const u16 = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
    const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
    // layers-per-root table
    expect(u16(bytes, base + 0x622 + 48 * 2)).toBe(2);
    expect(u16(bytes, base + 0x622 + 72 * 2)).toBe(2);
    const r3 = rec(3);
    expect(r3[0x05]).toBe(80);
    expect(r3[0x33]).toBe(80);
    expect(r3[0x74]).toBe(80 - 40); // midway from the previous layer (0)
    expect(rec(1)[0x74]).toBe(64 - 32);
    expect(rec(0)[0x74]).toBe(0);
    expect(u32(r3, 0x2e)).toBe(defaultDecayCoefficient(72));
    for (let k = 0; k < 13; k++) expect(u32(r3, 0x36 + k * 4)).toBe(0x800000);
    // loop-start block: it contains the loop start, and the next block starts after it
    const lbFirst = u32(r3, 0x24); const lbNext = u32(r3, 0x28);
    expect(lbFirst).toBeLessThanOrEqual(12000);
    expect(lbNext).toBeGreaterThan(12000);
    // the first block sits on the factory grid (≡ 830 mod 1022)
    expect((u32(rec(0), 0) - 830) % 1022).toBe(0);
  });

  it('rejects overlapping zones, a non-zero softest layer and a bad name', () => {
    const p = piano(1);
    expect(() => buildNpno({ ...p, zones: [p.zones[0], { ...p.zones[1], lowNote: 50 }] })).toThrow(/Key 50/);
    expect(() => buildNpno({ ...p, zones: [{ ...p.zones[0], layers: [{ ...p.zones[0].layers[1] }] }] })).toThrow(/softest/);
    expect(() => buildNpno({ ...p, name: 'Bad#Name' })).toThrow(/ASCII/);
  });
});

describe('writeNpnoImage / readNpnoImage', () => {
  it('re-encodes a written piano to the same audio and the same header', () => {
    const first = buildNpno(piano(2)).bytes;
    const img = readNpnoImage(first);
    const again = writeNpnoImage(img).bytes;
    expect(again).toEqual(first);
  });

  it('writes the legacy v5 envelope with its CRC-16 trailer', () => {
    const img = readNpnoImage(buildNpno(piano(1)).bytes);
    img.envelope = 'v5';
    img.cbinVersion = 530;
    img.header[0x04] = 0x04; img.header[0x05] = 0x50; // CNSP v5
    img.header[0x16] = 0x04; img.header[0x17] = 0x50;
    img.header[0x1a] = 3;
    const { bytes } = writeNpnoImage(img);
    expect(String.fromCharCode(...bytes.subarray(0x18, 0x1c))).toBe('CNSP');
    const acc = checkNpnoAcceptance(bytes, { deep: true });
    expect(acc.checks.filter((c) => !c.ok)).toEqual([]);
    expect(acc.nsmVersion).toBe(530);
  });

  it('flags a corrupted byte through the CNSP byte sum and the CRC', () => {
    const { bytes } = buildNpno(piano(1));
    bytes[bytes.length - 100] ^= 1;
    const failed = checkNpnoAcceptance(bytes).checks.filter((c) => !c.ok).map((c) => c.id);
    expect(failed).toEqual(['cbin-crc32', 'cnsp-checksum']);
  });
});

describe('encodeNpnoStroke', () => {
  it('codes silence as 1-bit, order-0 blocks at level 100', () => {
    const e = encodeNpnoStroke({ rootNote: 60, pcm: [new Int32Array(20000)], preroll: [[0, 0, 0, 0]], record: new Uint8Array(NPNO_RECORD_SIZE) }, 1);
    expect(e.widths.every((w) => w === 1)).toBe(true);
    expect(e.orders.every((o) => o === 0)).toBe(true);
    expect(e.data[0]).toBe(100);
  });

  it('computes the block level byte like the factory encoder', () => {
    expect(blockLevel(7782)).toBe(0);
    expect(blockLevel(6182)).toBe(2);
    expect(blockLevel(1)).toBe(78);
    expect(blockLevel(0)).toBe(100);
  });

  it('refuses samples outside int16', () => {
    expect(() => encodeNpnoStroke({ rootNote: 60, pcm: [Int32Array.of(40000)], preroll: [[0, 0, 0, 0]], record: new Uint8Array(NPNO_RECORD_SIZE) }, 1)).toThrow(/int16/);
  });
});

// Real factory pianos (local only, never committed): NPNO_DIR=<folder of .npno>. Decode →
// re-encode → decode must reproduce every stroke; the report lands in the test log.
const npnoDir = process.env.NPNO_DIR;
const realFiles = npnoDir && existsSync(npnoDir) ? readdirSync(npnoDir).filter((f) => f.endsWith('.npno')) : [];
describe.skipIf(realFiles.length === 0)('re-encode real pianos in $NPNO_DIR', () => {
  for (const name of realFiles) {
    it(`${name}: byte-identical re-encode; our own levels change only level bytes`, () => {
      const orig = new Uint8Array(readFileSync(join(npnoDir!, name)));
      expect(checkNpnoAcceptance(orig, { deep: true }).checks.filter((c) => !c.ok)).toEqual([]);
      expect(readNsp(orig)).toMatchObject({ hasChecksum: true, checksumValid: true });
      const img = readNpnoImage(orig);

      // 1. With the original level bytes kept: the whole file comes back identical.
      const same = writeNpnoImage(img).bytes;
      expect(same.length).toBe(orig.length);
      let firstDiff = -1;
      for (let i = 0; i < orig.length && firstDiff < 0; i++) if (orig[i] !== same[i]) firstDiff = i;
      expect(firstDiff).toBe(-1);

      // 2. With our own measured levels: same audio, same layout; count what differs.
      for (const s of img.strokes) s.levels = undefined;
      const { bytes, stats } = writeNpnoImage(img);
      expect(checkNpnoAcceptance(bytes, { deep: true }).checks.filter((c) => !c.ok)).toEqual([]);
      expect(readNsp(bytes).checksumValid).toBe(true);
      const a = readNspDirectory(orig)!;
      const b = readNspDirectory(bytes)!;
      const levelBytes = new Set<number>();
      for (const s of a.strokes) for (let k = 0; k < s.blocks; k++) levelBytes.add(s.offset + k * a.blockWords * 2);
      const cnsp = findCnsp(orig);
      const checksumBytes = new Set([0x18, 0x19, 0x1a, 0x1b, orig.length - 2, orig.length - 1, cnsp + 6, cnsp + 7, cnsp + 8, cnsp + 9]);
      let levelDiffs = 0;
      for (let i = 0; i < orig.length; i++) {
        if (orig[i] === bytes[i]) continue;
        if (levelBytes.has(i)) {
          levelDiffs++;
          // ±1 dB of rounding; very quiet blocks (peak of a few LSB) can differ more
          expect(Math.abs(orig[i] - bytes[i]) <= 1 || Math.min(orig[i], bytes[i]) >= 50).toBe(true);
          continue;
        }
        expect(checksumBytes.has(i), `unexpected difference at 0x${i.toString(16)}`).toBe(true);
      }
      for (let i = 0; i < a.strokes.length; i++) {
        const pa = decodeNspStroke(orig, a, a.strokes[i]);
        const pb = decodeNspStroke(bytes, b, b.strokes[i]);
        for (let c = 0; c < a.channels; c++) expect(pb[c]).toEqual(pa[c]);
      }
      const blocks = stats.reduce((n, x) => n + x.blocks, 0);
      console.log(`[npno-write] ${name}: ${a.strokes.length} strokes, ${blocks} blocks, ${orig.length} bytes; ` +
        `own levels: size ratio ${(bytes.length / orig.length).toFixed(4)}, ${levelDiffs}/${blocks} level bytes differ`);
    }, 300_000);
  }
});
