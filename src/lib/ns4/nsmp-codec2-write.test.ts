import { describe, it, expect } from 'vitest';
import { readNsmp, decodeNsmp, readNsmpZones, parseNsmpSections } from './nsmp';
import { writeCodec2Nsmp, type Codec2WriteZone } from './nsmp-codec2-write';
import { writeNsmpMulti } from './nsmp-write';
import { convertNsmp } from './nsmp-convert';

const sine = (n: number, amp: number, k: number) => {
  const a = new Int32Array(n);
  for (let i = 0; i < n; i++) a[i] = Math.round(amp * Math.sin(i / k));
  return a;
};
const eq = (a: ArrayLike<number>, b: ArrayLike<number>) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

describe('writeCodec2Nsmp — codec-2 / Library-2.0 writer', () => {
  it('round-trips name + zones + audio through readNsmp/readNsmpZones/decodeNsmp', () => {
    const zones: Codec2WriteZone[] = [
      { channels: [sine(12000, 3000, 7)], globalID: 5, rootKey: 72, keyHigh: 96 },
      { channels: [sine(9000, 2000, 11)], globalID: 4, rootKey: 60, keyHigh: 71 },
    ];
    const bytes = writeCodec2Nsmp({ name: 'My Synth Pad', zones });

    const f = readNsmp(bytes);
    expect(f.recognized).toBe(true);
    expect(f.codec).toBe(2); // Library-2.0 generation
    expect(f.legacy).toBe(true);
    expect(f.versionRaw).toBe(200);
    expect(f.name).toBe('My Synth Pad'); // v11 preserves the name (v8 cannot)
    expect(f.strokeCount).toBe(2);
    expect(f.warnings).toEqual([]); // codec 2 is a supported generation — no warning

    const z = readNsmpZones(bytes);
    expect(z.length).toBe(2);
    // Tiling: top zone [72-96] gid5, bottom [0-71] gid4.
    expect(z[0]).toMatchObject({ globalID: 5, keyHigh: 96, keyLow: 72, rootKey: 72 });
    expect(z[1]).toMatchObject({ globalID: 4, keyHigh: 71, keyLow: 0, rootKey: 60 });

    const dec = decodeNsmp(bytes);
    expect(dec.length).toBe(2);
    expect(eq(dec[0].channels[0], zones[0].channels[0])).toBe(true);
    expect(eq(dec[1].channels[0], zones[1].channels[0])).toBe(true);
  });

  it('emits a v11 container (CBIN ver 200, NWS body v11, map v10) with a valid CRC', () => {
    const bytes = writeCodec2Nsmp({ name: 'X', zones: [{ channels: [sine(8000, 1500, 5)], globalID: 1, rootKey: 60, keyHigh: 127 }] });
    expect((bytes[0x14] | (bytes[0x15] << 8))).toBe(200); // CBIN version
    const secs = parseNsmpSections(bytes);
    expect(secs.find((s) => s.tag.endsWith('NWS'))!.version).toBe(11);
    expect(secs.find((s) => s.tag.endsWith('map'))!.version).toBe(10);
    expect(secs.find((s) => s.tag.endsWith('hdr'))!.version).toBe(9);
  });

  // Every real factory `.nsmp` gives each stroke a distinct, cumulative region in
  // the stroke buffer: start[n] === end[n-1], strictly increasing (measured on
  // `SupremeClsc 2.2.nsmp` — 653 → 4.38M across 39 strokes). The writer hard-wrote
  // start = 0 for every stroke, so all of them claimed to begin at position 0 —
  // which hangs the hardware the moment it stops on a sample and streams from there
  // (OpenNord reads the pointers per-stroke, so it looked fine on screen).
  it('lays out stroke region pointers cumulatively (start[n] === end[n-1]), not all at 0', () => {
    const zones: Codec2WriteZone[] = [
      { channels: [sine(6000, 3000, 7)], globalID: 3, rootKey: 84, keyHigh: 108 },
      { channels: [sine(9000, 2500, 11)], globalID: 2, rootKey: 72, keyHigh: 83 },
      { channels: [sine(7500, 2000, 5)], globalID: 1, rootKey: 60, keyHigh: 71 },
    ];
    const bytes = writeCodec2Nsmp({ name: 'Cumulative', zones });
    const stks = parseNsmpSections(bytes).filter((s) => s.tag.endsWith('stk'));
    const u32 = (o: number) => (bytes[o] * 0x1000000 + (bytes[o + 1] << 16) + (bytes[o + 2] << 8) + bytes[o + 3]);
    const regions = stks.map((s) => ({ start: u32(s.payloadOffset + 0x12), end: u32(s.payloadOffset + 0x2d) }));
    expect(regions).toHaveLength(3);
    expect(regions[0].start).toBe(0);
    for (let i = 0; i < regions.length; i++) {
      expect(regions[i].end).toBeGreaterThan(regions[i].start);      // non-empty span
      if (i > 0) expect(regions[i].start).toBe(regions[i - 1].end);  // contiguous, no overlap
    }
    expect(new Set(regions.map((r) => r.start)).size).toBe(3);        // three distinct starts
  });

  it('convertNsmp(x, 2) now preserves the source name (v8 dropped it)', () => {
    // Build a codec-3 source with a name, convert down to .nsmp.
    const src = writeNsmpMulti({
      name: 'Keeps Name', codec: 3,
      zones: [{ channels: [sine(10000, 2500, 9)], rootKey: 64, keyHigh: 127, velTop: 127 }],
    });
    const { bytes, extension, warnings } = convertNsmp(src, 2);
    expect(extension).toBe('.nsmp');
    expect(warnings.some((w) => /experimental/i.test(w))).toBe(true);

    const f = readNsmp(bytes);
    expect(f.codec).toBe(2);
    expect(f.name).toBe('Keeps Name'); // the headline win of the v11 default

    // Audio survives the down-convert.
    const before = decodeNsmp(src);
    const after = decodeNsmp(bytes);
    expect(after.length).toBe(before.length);
    expect(eq(after[0].channels[0], before[0].channels[0])).toBe(true);
  });
});
