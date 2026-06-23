import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { convertNsmp } from './nsmp-convert';
import { writeNsmpMulti } from './nsmp-write';
import { readNsmp, decodeNsmp, readNsmpZones } from './nsmp';

const eqAudio = (a: ReturnType<typeof decodeNsmp>, b: ReturnType<typeof decodeNsmp>) => {
  expect(a.length).toBe(b.length);
  for (let i = 0; i < a.length; i++) {
    expect(a[i].channels.length).toBe(b[i].channels.length);
    for (let c = 0; c < a[i].channels.length; c++) {
      expect(Array.from(a[i].channels[c])).toEqual(Array.from(b[i].channels[c]));
    }
  }
};

describe('convertNsmp — audio preserved across generations (synthetic)', () => {
  const z0 = Int32Array.from({ length: 3000 }, (_, i) => Math.round(2000 * Math.sin(i / 8)));
  const z1 = Int32Array.from({ length: 2600 }, (_, i) => Math.round(1500 * Math.cos(i / 11)));
  const src3 = writeNsmpMulti({ name: 'Src', codec: 3, zones: [
    { channels: [z0], keyHigh: 59, rootKey: 48 },
    { channels: [z1], keyHigh: 127, rootKey: 72 },
  ] });

  it('codec 3 → 4 keeps audio + zones, targets .nsmp4', () => {
    const { bytes, extension } = convertNsmp(src3, 4);
    expect(extension).toBe('.nsmp4');
    expect(readNsmp(bytes).codec).toBe(4);
    eqAudio(decodeNsmp(bytes), decodeNsmp(src3));
  });

  it('round-trips 3 → 4 → 3 with identical audio', () => {
    const back = convertNsmp(convertNsmp(src3, 4).bytes, 3).bytes;
    expect(readNsmp(back).codec).toBe(3);
    eqAudio(decodeNsmp(back), decodeNsmp(src3));
  });

  it('carries the zone map (splits/layers) across generations, both directions', () => {
    // Direct → and the codec-4 round-trip must agree on zones; before the codec-4
    // `map` fix the .nsmp4 intermediate read back as zero zones, silently dropping
    // the splits/layers.
    const z4 = readNsmpZones(convertNsmp(src3, 4).bytes);
    expect(z4.map((z) => z.keyHigh)).toEqual([59, 127]);
    expect(z4.map((z) => z.rootKey)).toEqual([48, 72]);
    const z3 = readNsmpZones(convertNsmp(convertNsmp(src3, 4).bytes, 3).bytes);
    expect(z3.map((z) => z.keyHigh)).toEqual([59, 127]);
    expect(z3.map((z) => z.rootKey)).toEqual([48, 72]);
  });

  it('conversion is path-independent: 3→4 equals 3→4→3→4 byte-for-byte', () => {
    // The user-reported asymmetry: a codec-4 intermediate that loses its zones makes
    // 3→4 and 3→4→3→4 (or 2→4 vs 2→3→4) differ by a few bytes. A faithful zone map
    // makes the target generation a pure function of the audio + zones.
    const direct4 = convertNsmp(src3, 4).bytes;
    const viaRoundTrip = convertNsmp(convertNsmp(convertNsmp(src3, 4).bytes, 3).bytes, 4).bytes;
    expect(Array.from(viaRoundTrip)).toEqual(Array.from(direct4));
  });

  it('converts from every generation to every other generation, audio preserved', () => {
    // The headline ask: any generation → any other. Build a source in each
    // generation, then convert it to all three targets and confirm the audio
    // survives and the output is the requested generation (OG/2, .nsmp3, .nsmp4).
    const gens = [
      { code: 2 as const, ext: '.nsmp', isGen: (b: Uint8Array) => readNsmp(b).legacy === true },
      { code: 3 as const, ext: '.nsmp3', isGen: (b: Uint8Array) => readNsmp(b).codec === 3 },
      { code: 4 as const, ext: '.nsmp4', isGen: (b: Uint8Array) => readNsmp(b).codec === 4 },
    ];
    const expected = decodeNsmp(src3);
    for (const from of gens) {
      const source = convertNsmp(src3, from.code).bytes;
      for (const to of gens) {
        if (to.code === from.code) continue;
        const { bytes, extension } = convertNsmp(source, to.code);
        expect(extension, `${from.ext} → ${to.ext} extension`).toBe(to.ext);
        expect(to.isGen(bytes), `${from.ext} → ${to.ext} is target generation`).toBe(true);
        eqAudio(decodeNsmp(bytes), expected);
      }
    }
  });

  it('preserves stereo channel count, incl. a near-silent stroke (header channel field)', () => {
    // A near-silent stereo stroke is indistinguishable from mono by audio alone —
    // the stroke-header channel byte is what keeps it stereo through a round-trip.
    const L = Int32Array.from({ length: 3000 }, (_, i) => Math.round(2000 * Math.sin(i / 9)));
    const R = Int32Array.from({ length: 3000 }, (_, i) => Math.round(1800 * Math.cos(i / 13)));
    const quietL = Int32Array.from({ length: 3000 }, (_, i) => (i % 2 ? -1 : 0));
    const quietR = Int32Array.from({ length: 3000 }, () => 0);
    const stereo = writeNsmpMulti({ name: 'St', codec: 3, zones: [
      { channels: [L, R], keyHigh: 59, rootKey: 48 },
      { channels: [quietL, quietR], keyHigh: 127, rootKey: 72 },
    ] });
    const got = decodeNsmp(stereo);
    expect(got.map((s) => s.channelCount)).toEqual([2, 2]);
    eqAudio(decodeNsmp(convertNsmp(stereo, 4).bytes), got); // survives 3 → 4 too
  });
});

// Real samples (gitignored). Skipped in CI.
const n3 = join(process.cwd(), 'research/nsmp/Strings.nsmp3');
const n4 = join(process.cwd(), 'research/nsmp/Strings.nsmp4');
describe.skipIf(!existsSync(n3) || !existsSync(n4))('convertNsmp — real samples', () => {
  it('upconverts .nsmp3 → .nsmp4 preserving audio', () => {
    const src = new Uint8Array(readFileSync(n3));
    const { bytes } = convertNsmp(src, 4);
    expect(readNsmp(bytes).codec).toBe(4);
    eqAudio(decodeNsmp(bytes), decodeNsmp(src));
  });

  it('DOWNconverts .nsmp4 → .nsmp3 preserving audio (the official-tool gap)', () => {
    const src = new Uint8Array(readFileSync(n4));
    const { bytes } = convertNsmp(src, 3);
    expect(readNsmp(bytes).codec).toBe(3);
    eqAudio(decodeNsmp(bytes), decodeNsmp(src));
  });
});

// OG / legacy `.nsmp` (24-bit) → modern generations. Real file, skipped in CI.
const ogFile = join(process.cwd(), 'research/nsmp/TAKE ON ME.nsmp');
describe.skipIf(!existsSync(ogFile))('convertNsmp — OG .nsmp upconversion', () => {
  const src = existsSync(ogFile) ? new Uint8Array(readFileSync(ogFile)) : new Uint8Array();
  for (const target of [3, 4] as const) {
    it(`OG → codec ${target} preserves all strokes, channels + audio`, () => {
      const { bytes, extension } = convertNsmp(src, target);
      expect(extension).toBe(target === 4 ? '.nsmp4' : '.nsmp3');
      const got = decodeNsmp(bytes);
      const orig = decodeNsmp(src);
      expect(got.map((s) => s.channelCount)).toEqual(orig.map((s) => s.channelCount));
      eqAudio(got, orig);
    });
  }
});
