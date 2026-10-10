import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { decodeNspStroke, findCnsp, readNspDirectory, strokeFor } from './nsp-audio';
import { NSP_ROOT_OFFSET, readNsp, readNspIdentity } from './nsp';
import { checkNpnoAcceptance } from './nsp-check';
import { tone } from './nsp-synth.testing';
import {
  blockLevel, buildNpno, defaultDecayCoefficient, encodeNpnoStroke, NPNO_HEADER_SIZE, NPNO_PEAK,
  NPNO_RECORD_SIZE, readNpnoImage, writeNpnoImage, type NpnoInput,
} from './nsp-write';
import { identifyNsmp } from '../clavia/sample-identify';
import { auditionKeys } from '@/components/piano/auditionKeys';

const toneI = (frames: number, f: number, amp: number, seed: number) => Int32Array.from(tone(frames, f, amp, seed));

/** A small two-zone, two-layer piano (loudest layer first); the upper zone's soft layer loops. */
function piano(channels: 1 | 2): NpnoInput {
  const ch = (f: number, a: number, s: number, n = 24000) => Array.from({ length: channels }, (_, c) => toneI(n, f, a * (1 - 0.2 * c), s + c));
  return {
    name: 'Test Upright', variant: 'Home', minor: 1, pianoType: 2, channels,
    zones: [
      { rootNote: 48, lowNote: 21, highNote: 59, layers: [
        { pcm: ch(0.01, 3000, 1), floorDb: 0 },
        { pcm: ch(0.01, 12000, 2), floorDb: 12.8 },
      ] },
      { rootNote: 72, lowNote: 60, highNote: 108, layers: [
        { pcm: ch(0.02, 2000, 3), floorDb: 0 },
        { pcm: ch(0.02, 20000, 4, 30000), floorDb: 16, loop: { start: 12000, length: 9000 } },
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
      // The key map stores each recorded note 4 semitones lower (NSP_ROOT_OFFSET).
      expect(f.zones).toEqual([
        { rootNote: 44, lowNote: 21, highNote: 59 },
        { rootNote: 68, lowNote: 60, highNote: 108 },
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
      // Zone 1 switches layers at 8 dB (halfway to the 16 dB floor).
      expect(strokeFor(dir, 1, 127)?.index).toBe(2);
      expect(strokeFor(dir, 1, 40)?.index).toBe(3);
    });
  }

  it('fills the record fields: loop block, floor copy, switch point, coefficients', () => {
    const { bytes } = buildNpno(piano(1));
    const base = 0x2c;
    const rec = (i: number) => bytes.subarray(base + NPNO_HEADER_SIZE + i * NPNO_RECORD_SIZE);
    const u16 = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
    const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
    // layers-per-root table, at the stored roots (recorded note − 4)
    expect(u16(bytes, base + 0x622 + 44 * 2)).toBe(2);
    expect(u16(bytes, base + 0x622 + 68 * 2)).toBe(2);
    expect(u16(bytes, base + 0x622 + 48 * 2)).toBe(0);
    expect(u16(bytes, base + 0x622 + 72 * 2)).toBe(0);
    const r3 = rec(3);
    expect(r3[0x05]).toBe(80);
    expect(r3[0x33]).toBe(80);
    expect(r3[0x74]).toBe(80 - 40); // midway from the louder layer's floor (0)
    expect(rec(1)[0x74]).toBe(64 - 32);
    expect(rec(0)[0x74]).toBe(0);
    expect(u32(r3, 0x2e)).toBe(defaultDecayCoefficient(68));
    for (let k = 0; k < 13; k++) expect(u32(r3, 0x36 + k * 4)).toBe(0x800000);
    // loop-start block: it contains the loop start, and the next block starts after it
    const lbFirst = u32(r3, 0x24); const lbNext = u32(r3, 0x28);
    expect(lbFirst).toBeLessThanOrEqual(12000);
    expect(lbNext).toBeGreaterThan(12000);
    // the first block sits on the factory grid (≡ 830 mod 1022)
    expect((u32(rec(0), 0) - 830) % 1022).toBe(0);
  });

  it('rejects overlapping zones, a loudest layer not at 0 dB and a bad name', () => {
    const p = piano(1);
    expect(() => buildNpno({ ...p, zones: [p.zones[0], { ...p.zones[1], lowNote: 50 }] })).toThrow(/Key 50/);
    expect(() => buildNpno({ ...p, zones: [{ ...p.zones[0], layers: [{ ...p.zones[0].layers[1] }] }] })).toThrow(/loudest/);
    expect(() => buildNpno({ ...p, name: 'Bad#Name' })).toThrow(/ASCII/);
  });

  it('plays a zone recorded at C4 at its recorded pitch', () => {
    const p = piano(1);
    const zones = [p.zones[0], { ...p.zones[1], rootNote: 60 }]; // recorded at C3 and C4
    const { bytes } = buildNpno({ ...p, zones });
    const f = readNsp(bytes);
    expect(f.zones!.map((z) => z.rootNote)).toEqual([48 - NSP_ROOT_OFFSET, 60 - NSP_ROOT_OFFSET]);
    const keys = auditionKeys(f.zones!, readNspDirectory(bytes)!.strokes.at(-1)!.zone + 1);
    expect(keys.find((k) => k.label === 'C4')).toMatchObject({ zone: 1, semitones: 0 });
    expect(keys.find((k) => k.label === 'C3')).toMatchObject({ zone: 0, semitones: 0 });
    expect(keys.find((k) => k.label === 'C5')).toMatchObject({ zone: 1, semitones: 12 });
  });

  it('rejects recorded notes the key map cannot store', () => {
    const p = piano(1);
    const at = (rootNote: number) => buildNpno({ ...p, zones: [{ ...p.zones[0], rootNote }, p.zones[1]] });
    expect(() => at(NSP_ROOT_OFFSET)).toThrow(/recorded note must be a MIDI note from 5 to 127/);
    expect(() => at(128)).toThrow(/recorded note/);
    expect(() => at(47.5)).toThrow(/recorded note/);
    expect(() => at(NSP_ROOT_OFFSET + 1)).not.toThrow();
  });

  it('rejects loops that are fractional, too short, negative or past the end', () => {
    const p = piano(1);
    const withLoop = (loop: { start: number; length: number }) => {
      const z = p.zones[1];
      return buildNpno({ ...p, zones: [p.zones[0], { ...z, layers: [z.layers[0], { ...z.layers[1], loop }] }] });
    };
    expect(() => withLoop({ start: 5424.3, length: 9000 })).toThrow(/Zone 1 layer 1: the loop must start and end on whole frames/);
    expect(() => withLoop({ start: 12000, length: 9000.5 })).toThrow(/whole frames/);
    expect(() => withLoop({ start: 12000, length: 2 })).toThrow(/at least 4 frames/);
    expect(() => withLoop({ start: 12000, length: 0 })).toThrow(/at least 4 frames/);
    expect(() => withLoop({ start: 12000, length: -5 })).toThrow(/at least 4 frames/);
    expect(() => withLoop({ start: -1, length: 9000 })).toThrow(/before the sound/);
    expect(() => withLoop({ start: 25000, length: 5001 })).toThrow(/past the end of the recording \(30000 frames\)/);
    expect(() => withLoop({ start: 25000, length: 5000 })).not.toThrow();
    expect(() => withLoop({ start: 12000, length: 4 })).not.toThrow();
  });

  it('rejects a layer whose channels have different lengths', () => {
    const p = piano(2);
    const z = p.zones[0];
    const short = [z.layers[0].pcm[0], Array.from(z.layers[0].pcm[1]).slice(0, 1000)];
    expect(() => buildNpno({ ...p, zones: [{ ...z, layers: [{ ...z.layers[0], pcm: short }] }, p.zones[1]] }))
      .toThrow(/Zone 0 layer 0: the channels have different lengths \(24000 \/ 1000 frames\)/);
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

  it('refuses an image stroke with a fractional loop or uneven channels, naming the stroke', () => {
    const img = readNpnoImage(buildNpno(piano(2)).bytes);
    img.strokes[3].loop = { start: 12000.5, length: 9000 };
    expect(() => writeNpnoImage(img)).toThrow(/Stroke 3: the loop must start and end on whole frames/);
    img.strokes[3].loop = { start: 12000, length: 9000 };
    img.strokes[1].pcm = [img.strokes[1].pcm[0], Array.from(img.strokes[1].pcm[1]).slice(1)];
    expect(() => writeNpnoImage(img)).toThrow(/Stroke 1: the channels have different lengths/);
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

  it('refuses loops it cannot seam and channels of different lengths', () => {
    const stroke = (loop: { start: number; length: number }, pcm = [new Int32Array(20000)]) =>
      encodeNpnoStroke({ rootNote: 60, pcm, preroll: [[0, 0, 0, 0]], loop, record: new Uint8Array(NPNO_RECORD_SIZE) }, pcm.length as 1 | 2);
    expect(() => stroke({ start: 5424.3, length: 1000 })).toThrow(/whole frames/);
    expect(() => stroke({ start: 5000, length: 3 })).toThrow(/at least 4 frames/);
    expect(() => stroke({ start: 5000, length: -5 })).toThrow(/at least 4 frames/);
    expect(() => stroke({ start: 19000, length: 1001 })).toThrow(/past the end/);
    expect(() => stroke({ start: 0, length: 0 })).not.toThrow(); // 0 = no loop
    expect(() => stroke({ start: 0, length: 0 }, [new Int32Array(20000), new Int32Array(19999)])).toThrow(/different lengths/);
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
