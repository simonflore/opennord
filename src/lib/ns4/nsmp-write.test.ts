import { describe, it, expect } from 'vitest';
import { writeNsmp, writeNsmpMulti } from './nsmp-write';
import { readNsmp, decodeNsmp, readNsmpZones } from './nsmp';
import { editModel, patchEditedNsmp } from './sample-edit';

describe('writeNsmp → readNsmp/decodeNsmp round-trip', () => {
  const L = Int32Array.from({ length: 4000 }, (_, i) => (i < 80 ? 0 : Math.round(2000 * Math.sin(i / 9))));
  const R = Int32Array.from({ length: 4000 }, (_, i) => (i < 80 ? 0 : Math.round(1500 * Math.sin(i / 13))));

  it('produces a recognizable, checksum-valid codec-3 sample with the given name', () => {
    const bytes = writeNsmp({ name: 'My Sample', channels: [L, R] });
    const f = readNsmp(bytes);
    expect(f.recognized).toBe(true);
    expect(f.version).toBe('3.00');
    expect(f.codec).toBe(3);
    expect(f.checksumValid).toBe(true);
    expect(f.name).toBe('My Sample');
    expect(f.strokeCount).toBe(1);
    expect(f.sections.map((s) => s.tag)).toEqual(
      ['NSMP', '.hdr', '.cat', '.map', '.stk', '.sty', 'meta'],
    );
  });

  it('round-trips the PCM exactly through decodeNsmp', () => {
    const bytes = writeNsmp({ name: 'RT', channels: [L, R] });
    const strokes = decodeNsmp(bytes);
    expect(strokes.length).toBe(1);
    expect(strokes[0].channelCount).toBe(2);
    expect(Array.from(strokes[0].channels[0])).toEqual(Array.from(L));
    expect(Array.from(strokes[0].channels[1])).toEqual(Array.from(R));
  });

  it('writes a multisample with splits/layers and round-trips zones + audio', () => {
    const z0 = Int32Array.from({ length: 1500 }, (_, i) => Math.round(1000 * Math.sin(i / 8)));
    const z1 = Int32Array.from({ length: 1800 }, (_, i) => Math.round(800 * Math.sin(i / 12)));
    const z2 = Int32Array.from({ length: 1200 }, (_, i) => i - 600); // ramp
    const bytes = writeNsmpMulti({
      name: 'Multi',
      zones: [
        { channels: [z0], keyHigh: 47, rootKey: 43, velTop: 127 }, // low split
        { channels: [z1], keyHigh: 71, rootKey: 60, velTop: 127 }, // mid split
        { channels: [z2], keyHigh: 127, rootKey: 84, velTop: 64 }, // high split, soft layer
      ],
    });
    const f = readNsmp(bytes);
    expect(f.strokeCount).toBe(3);

    const zones = readNsmpZones(bytes);
    expect(zones.map((z) => z.keyHigh)).toEqual([47, 71, 108]); // 127 capped at root 84 + 24
    expect(zones.map((z) => z.rootKey)).toEqual([43, 60, 84]);
    expect(zones.map((z) => z.globalID)).toEqual([1, 2, 3]);
    expect(zones[2].velTop).toBe(64);

    const strokes = decodeNsmp(bytes);
    expect(strokes.length).toBe(3);
    expect(Array.from(strokes[0].channels[0])).toEqual(Array.from(z0));
    expect(Array.from(strokes[1].channels[0])).toEqual(Array.from(z1));
    expect(Array.from(strokes[2].channels[0])).toEqual(Array.from(z2));
  });

  it('writes a codec-4 (.nsmp4) file that round-trips (word-interleaved)', () => {
    const bytes = writeNsmp({ name: 'NSMP4', channels: [L, R], codec: 4 });
    const f = readNsmp(bytes);
    expect(f.codec).toBe(4);
    expect(f.version).toBe('4.00');
    expect(f.checksumValid).toBe(true);
    const strokes = decodeNsmp(bytes);
    expect(strokes.length).toBe(1);
    expect(strokes[0].channelCount).toBe(2);
    expect(Array.from(strokes[0].channels[0])).toEqual(Array.from(L));
    expect(Array.from(strokes[0].channels[1])).toEqual(Array.from(R));
  });

  it('writes a codec-4 multisample (splits/layers) that round-trips audio AND zones', () => {
    const z0 = Int32Array.from({ length: 1600 }, (_, i) => Math.round(900 * Math.sin(i / 6)));
    const z1 = Int32Array.from({ length: 1400 }, (_, i) => Math.round(700 * Math.cos(i / 9)));
    const bytes = writeNsmpMulti({
      name: 'M4',
      codec: 4,
      zones: [
        { channels: [z0], keyHigh: 59, rootKey: 48, velTop: 100 },
        { channels: [z1], keyHigh: 127, rootKey: 72, velTop: 64 },
      ],
    });
    expect(readNsmp(bytes).codec).toBe(4);

    // The codec-4 `map` must be written in the codec-4 layout (10-byte per-note rows
    // + 32-byte header + root-aligned records), not the codec-3 shape — else the
    // version-21 reader can't find the zones and `.nsmp4` conversion loses its splits.
    const zones = readNsmpZones(bytes);
    expect(zones.map((z) => z.keyHigh)).toEqual([59, 96]); // 127 capped at root 72 + 24
    expect(zones.map((z) => z.rootKey)).toEqual([48, 72]);
    expect(zones.map((z) => z.velTop)).toEqual([100, 64]);
    expect(zones.map((z) => z.globalID)).toEqual([1, 2]);

    const strokes = decodeNsmp(bytes);
    expect(strokes.length).toBe(2);
    expect(Array.from(strokes[0].channels[0])).toEqual(Array.from(z0));
    expect(Array.from(strokes[1].channels[0])).toEqual(Array.from(z1));
  });

  it('works for mono too', () => {
    const mono = Int32Array.from({ length: 2500 }, (_, i) => i - 1250);
    const strokes = decodeNsmp(writeNsmp({ name: 'mono', channels: [mono] }));
    expect(strokes.length).toBe(1);
    expect(strokes[0].channelCount).toBe(1);
    expect(Array.from(strokes[0].channels[0])).toEqual(Array.from(mono));
  });
});

// Nord Sound Manager 9.03 decodes a stroke from its header's region pointers. A stroke written
// from PCM alone once had all four at zero, and NSM crashed reading it
// (hardware test 2026-10-14).
describe('a zone reaches at most 24 semitones above its root', () => {
  const tone = Int32Array.from({ length: 2000 }, (_, i) => Math.round(3000 * Math.sin(i / 7)));
  it.each([3, 4] as const)('codec %i caps keyHigh; writeNsmp starts at key 0', (codec) => {
    const multi = writeNsmpMulti({ name: 'cap', codec, zones: [{ channels: [tone], rootKey: 69, keyLow: 0, keyHigh: 127 }] });
    expect(readNsmpZones(multi).map((z) => [z.keyLow, z.keyHigh])).toEqual([[0, 93]]);
    const single = writeNsmp({ name: 'one', codec, channels: [tone] });
    expect(readNsmpZones(single).map((z) => [z.keyLow, z.rootKey, z.keyHigh])).toEqual([[0, 60, 84]]);
  });
});

describe('every written stroke has a real header', () => {
  const tone = (n: number, p: number) => Int32Array.from({ length: n }, (_, i) => Math.round(3000 * Math.sin(i / p)));
  const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
  const BODY = 0x2c; // pointers count 32-bit words from the file body

  const cases: [string, Uint8Array, number[]][] = [
    ['writeNsmp, codec 3', writeNsmp({ name: 'one', channels: [tone(3000, 7)] }), [60]],
    ['writeNsmpMulti, codec 4 stereo, two zones', writeNsmpMulti({
      name: 'two', codec: 4, zones: [
        { channels: [tone(2500, 5), tone(2500, 6)], rootKey: 57, keyLow: 0, keyHigh: 68 },
        { channels: [tone(2000, 3), tone(2000, 4)], rootKey: 69, keyLow: 69, keyHigh: 127 },
      ],
    }), [57, 69]],
  ];

  it.each(cases)('%s: pointers land on its own stream, root key set', (_, bytes, roots) => {
    const stks = readNsmp(bytes).sections.filter((s) => s.tag === '.stk');
    expect(stks.length).toBe(roots.length);
    stks.forEach((s, i) => {
      const h = bytes.subarray(s.payloadOffset, s.endOffset);
      const [start, alt, loop, end] = [0x12, 0x1b, 0x24, 0x2d].map((o) => u32(h, o));
      const at = (w: number) => BODY + w * 4;
      // The stream starts after the fixed 0x60-byte header and its zero padding.
      expect(at(start)).toBeGreaterThanOrEqual(s.payloadOffset + 0x60);
      expect(h.subarray(0x60, at(start) - s.payloadOffset).every((b) => b === 0)).toBe(true);
      // A one-shot: no alternate start (= start), loop begin = end, end inside this section.
      expect(alt).toBe(start);
      expect(loop).toBe(end);
      expect(end).toBeGreaterThan(start);
      expect(at(end)).toBeLessThan(s.endOffset);
      expect([h[0x16], h[0x1f]]).toEqual([0x80, 0x80]);
      expect(h[5]).toBe(roots[i]);
      expect((h[6] << 8) | h[7]).toBe(0x88ba);
      // Unity gain, exponent 10, the peak field = half the loudest sample (never all zero).
      expect([h[9], h[10], h[11], h[12]]).toEqual([0x10, 0, 0, 10]);
      expect((h[13] << 16) | (h[14] << 8) | h[15]).toBeGreaterThan(0);
    });
  });
});

// Nord Sound Manager rejects a `.nsmp4` whose `NSMP` section ends in the `.nsmp3` value 0x0c
// ("Unsupported version", hardware test 2026-10-14); real files: 0x0c in `.nsmp3`, 0x05 in `.nsmp4`.
describe('the NSMP section matches the generation', () => {
  const tone = Int32Array.from({ length: 2000 }, (_, i) => Math.round(3000 * Math.sin(i / 7)));
  it.each([[3, 0x0c], [4, 0x05]] as const)('codec %i ends its NSMP section with 0x%s', (codec, last) => {
    const bytes = writeNsmpMulti({ name: 'v', codec, zones: [{ channels: [tone], rootKey: 60, keyLow: 0, keyHigh: 127 }] });
    const s = readNsmp(bytes).sections.find((x) => x.tag === 'NSMP')!;
    expect([...bytes.subarray(s.payloadOffset, s.endOffset)]).toEqual([0x00, 0x02, 0x00, last]);
  });
});

// A Stage 4 played only the first of several zones over the same keys, and played a zone with
// mode 1 at its recorded pitch on every key (hardware test 2026-10-14). Layers are strokes of
// one zone; zone mode is 0 in every real `.nsmp4`.
// Writing layers as one multi-stroke zone is off (`LAYERED_ZONES`, see nsmp-write.ts); the
// reader and editor support for such zones stays and is tested with a hand-built map.
describe('codec-4 layers: one stroke per zone while layered zones are unverified', () => {
  const tone = (p: number) => Int32Array.from({ length: 1500 }, (_, i) => Math.round(3000 * Math.sin(i / p)));
  it('writes each layer as its own zone, mode 0', () => {
    const bytes = writeNsmpMulti({
      name: 'layers', codec: 4, zones: [
        { channels: [tone(5)], rootKey: 57, keyLow: 0, keyHigh: 68, velLow: 0, velTop: 63 },
        { channels: [tone(6)], rootKey: 57, keyLow: 0, keyHigh: 68, velLow: 64, velTop: 127 },
      ],
    });
    expect(readNsmpZones(bytes).map((z) => [z.globalID, z.velLow, z.velTop, z.zoneMode])).toEqual([[1, 0, 63, 0], [2, 64, 127, 0]]);
  });
});

describe('codec-4 multi-stroke zones (reader + editor)', () => {
  const tone = (p: number) => Int32Array.from({ length: 1500 }, (_, i) => Math.round(3000 * Math.sin(i / p)));
  const bytes = writeNsmpMulti({
    name: 'layers', codec: 4, layeredZones: true, zones: [
      { channels: [tone(5)], rootKey: 57, keyLow: 0, keyHigh: 68, velLow: 0, velTop: 63 },
      { channels: [tone(6)], rootKey: 57, keyLow: 0, keyHigh: 68, velLow: 64, velTop: 127 },
      { channels: [tone(7)], rootKey: 69, keyLow: 69, keyHigh: 127, velLow: 0, velTop: 63 },
      { channels: [tone(8)], rootKey: 69, keyLow: 69, keyHigh: 127, velLow: 64, velTop: 127 },
    ],
  });
  const map = readNsmp(bytes).sections.find((s) => s.tag === '.map')!;
  const recStart = map.payloadOffset + 6 + 128 * 10 + 32;

  it('with layeredZones, writes two zones of two strokes each (the editor layout)', () => {
    expect(bytes[recStart - 1]).toBe(2); // zone count
    const z = (o: number) => [...bytes.subarray(o, o + 24)];
    // head [root keyHigh keyLow mode playback oneShot count:u16], strokes [id:u32 strength:u16 velMin velMax]
    expect(z(recStart)).toEqual([57, 68, 0, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 1, 0, 63, 0, 0, 0, 2, 0, 1, 64, 127]);
    expect(z(recStart + 24)).toEqual([69, 93, 69, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 1, 0, 63, 0, 0, 0, 4, 0, 1, 64, 127]);
  });

  it('reads back one entry per stroke, with the zone keys and its own velocities', () => {
    const zones = readNsmpZones(bytes).map((z) => [z.globalID, z.rootKey, z.keyLow, z.keyHigh, z.velLow, z.velTop, z.zoneMode]);
    expect(zones).toEqual([
      [1, 57, 0, 68, 0, 63, 0], [2, 57, 0, 68, 64, 127, 0],
      [3, 69, 69, 93, 0, 63, 0], [4, 69, 69, 93, 64, 127, 0], // top key capped at root + 24
    ]);
    expect(decodeNsmp(bytes).length).toBe(4);
  });

  it('an edit to a later stroke patches its own entry', () => {
    const file = readNsmp(bytes);
    const model = editModel(file, readNsmpZones(bytes));
    model.zones[1].velLow = 90; // stroke 2 of zone 1
    model.zones[0].velTop = 89;
    const back = readNsmpZones(patchEditedNsmp(bytes, model)).map((z) => [z.globalID, z.velLow, z.velTop]);
    expect(back).toEqual([[1, 0, 89], [2, 90, 127], [3, 0, 63], [4, 64, 127]]);
  });
});

// Every real looped stroke has its loop-begin pointer on a multiple of 32 words; one that
// didn't stopped a Stage 4's sample DSP at the loop (hardware test 2026-10-14).
describe('a looped stroke has its loop begin on a 32-word line', () => {
  const u32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
  const sine = (n: number, p: number, a = 3000) => Int32Array.from({ length: n }, (_, i) => Math.round(a * Math.sin(i / p)));
  const noisy = (n: number) => { let x = 1; return Int32Array.from({ length: n }, (_, i) => { x = (x * 1103515245 + 12345) & 0x7fffffff; return Math.round(2000 * Math.sin(i / 9)) + (x % 400) - 200; }); };
  const cases: [string, 3 | 4, Int32Array[], number][] = [];
  for (const codec of [3, 4] as const) {
    for (const loopStart of [35002, 32000, 17520, 1000, 777]) {
      cases.push([`codec ${codec}, mono sine, loop at ${loopStart}`, codec, [sine(loopStart + 1591, 12.7)], loopStart]);
    }
    cases.push([`codec ${codec}, stereo noisy, loop at 4100`, codec, [noisy(9000), noisy(9000).reverse()], 4100]);
  }
  it.each(cases)('%s', (_, codec, channels, loopStart) => {
    const bytes = writeNsmpMulti({ name: 'loop', codec, zones: [{ channels, rootKey: 60, keyLow: 0, keyHigh: 127, stroke: { loop: { loopStart, altStart: 0, loops: true } } }] });
    const s = readNsmp(bytes).sections.find((x) => x.tag === '.stk')!;
    const loopW = u32(bytes, s.payloadOffset + 0x24), endW = u32(bytes, s.payloadOffset + 0x2d);
    expect(loopW % 32).toBe(0);
    expect(endW % 32).toBe(0);
    const d = decodeNsmp(bytes)[0];
    expect(d.loop?.loopStart).toBe(loopStart);
    channels.forEach((c, ch) => expect(Array.from(d.channels[ch])).toEqual(Array.from(c)));
  });
});

// A resampler's overshoot on hot audio must not reach the encoder: values past ±32767 were
// encoded wrongly and the stroke read back without audio.
describe('writeNsmpMulti clamps out-of-range PCM', () => {
  it.each([3, 4] as const)('codec %i', (codec) => {
    const hot = Int32Array.from({ length: 4000 }, (_, i) => (i % 40 < 20 ? 40000 : -40000));
    const bytes = writeNsmpMulti({ name: 'hot', codec, zones: [{ channels: [hot], rootKey: 60, keyLow: 0, keyHigh: 84 }] });
    const s = decodeNsmp(bytes)[0];
    expect(s.channels[0].length).toBe(4000);
    expect(Math.max(...Array.from(s.channels[0]))).toBe(32767);
    expect(Math.min(...Array.from(s.channels[0]))).toBe(-32767);
  });
});
