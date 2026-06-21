import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NsmpFile, DecodedStrokeResult } from './nsmp';
import { readNsmp } from './nsmp';
import { noteName, sampleHeaderView, zoneMapRows, strokeSummary, gainDetuneView, sampleUnisonView } from './sample-view';
import { parseNsmpSections } from './nsmp';
import { writeNsmp } from './nsmp-write';

describe('noteName', () => {
  it('maps MIDI numbers to scientific note names (C4 = 60)', () => {
    expect(noteName(60)).toBe('C4');
    expect(noteName(21)).toBe('A0');
    expect(noteName(0)).toBe('C-1');
    expect(noteName(127)).toBe('G9');
  });
});

describe('sampleHeaderView', () => {
  it('derives the header fields from an NsmpFile', () => {
    const file: NsmpFile = {
      recognized: true, version: '3.00', versionRaw: 300, codec: 3, legacy: false,
      checksumValid: true, name: 'VLV Strings', sections: [],
      strokeCount: 8, suspectedFactory: false, warnings: [],
    };
    expect(sampleHeaderView(file, 1234)).toEqual({
      name: 'VLV Strings', codecLabel: '.nsmp3', version: '3.00',
      checksumOk: true, checksumKnown: true, strokeCount: 8, sizeBytes: 1234, isFactory: false,
    });
  });

  it('falls back gracefully for an unrecognized file', () => {
    const file: NsmpFile = {
      recognized: false, legacy: false, checksumValid: false, sections: [],
      strokeCount: 0, suspectedFactory: false, warnings: ['nope'],
    };
    expect(sampleHeaderView(file, 0)).toEqual({
      name: 'Unnamed', codecLabel: '—', version: '—',
      checksumOk: false, checksumKnown: true, strokeCount: 0, sizeBytes: 0, isFactory: false,
    });
  });

  it('OG .nsmp: shows the OG label, the v8 revision, no checksum, filename fallback', () => {
    const file: NsmpFile = {
      recognized: true, version: '8', versionRaw: 8, codec: 0, legacy: true,
      checksumValid: false, name: undefined, sections: [], strokeCount: 9,
      suspectedFactory: false, warnings: [],
    };
    const v = sampleHeaderView(file, 1000, 'TAKE ON ME');
    expect(v.codecLabel).toBe('.nsmp (OG)');
    expect(v.version).toBe('8');
    expect(v.checksumKnown).toBe(false); // no CRC field to verify
    expect(v.name).toBe('TAKE ON ME'); // falls back to filename when the file has no name
  });
});

describe('strokeSummary', () => {
  it('summarizes a decoded stroke', () => {
    const d: DecodedStrokeResult = {
      index: 2, channelCount: 2, endOffset: 0, globalID: 3, segments: [], loop: { loopStart: 1, loopEnd: 3, loops: true },
      channels: [new Int32Array([0, 100, -200, 50]), new Int32Array([0, 0, 0, 0])],
    };
    expect(strokeSummary(d)).toEqual({ index: 2, sampleCount: 4, channels: 2, peak: 200, ok: true, loops: true, loopStart: 1, loopEnd: 3 });
  });

  it('marks an empty stroke not-ok; loops is undefined when no loop region decoded', () => {
    const d: DecodedStrokeResult = { index: 0, channelCount: 1, endOffset: 0, globalID: 1, segments: [], loop: null, channels: [new Int32Array(0)] };
    expect(strokeSummary(d).ok).toBe(false);
    expect(strokeSummary(d).loops).toBeUndefined();
  });

  it('exposes loopStart/loopEnd only when the stroke loops', () => {
    const looped: DecodedStrokeResult = {
      index: 0, channelCount: 1, endOffset: 0, globalID: 1, segments: [],
      loop: { loopStart: 100, loopEnd: 500, loops: true }, channels: [new Int32Array([1, 2, 3])],
    };
    expect(strokeSummary(looped).loopStart).toBe(100);
    expect(strokeSummary(looped).loopEnd).toBe(500);
    const oneShot: DecodedStrokeResult = {
      index: 0, channelCount: 1, endOffset: 0, globalID: 1, segments: [],
      loop: { loopStart: 100, loopEnd: 500, loops: false }, channels: [new Int32Array([1, 2, 3])],
    };
    expect(strokeSummary(oneShot).loopStart).toBeUndefined();
  });
});

describe('gainDetuneView — interpreted gain (dB) + detune (cents)', () => {
  it('reads unity as 0 dB / 0 cents and marks it default', () => {
    const bytes = writeNsmp({ name: 'G', channels: [new Int16Array(64)] }); // codec 3, unity global
    const v = gainDetuneView(bytes)!;
    expect(v.isDefault).toBe(true);
    expect(Math.abs(v.gainDb)).toBeLessThan(0.01);
    expect(v.detuneCents).toBe(0);
  });

  it('scales a non-unity global to dB / cents via the NSE converters', () => {
    const bytes = writeNsmp({ name: 'G', channels: [new Int16Array(64)] });
    const map = parseNsmpSections(bytes).find((s) => s.tag.endsWith('map'))!;
    const p = map.payloadOffset;
    // Mellotron-style level 0x165e7f (≈ +2.9 dB) + detune 256 (= +100 cents).
    bytes[p] = 0x16; bytes[p + 1] = 0x5e; bytes[p + 2] = 0x7f;
    bytes[p + 3] = 0x00; bytes[p + 4] = 0x01; bytes[p + 5] = 0x00;
    const v = gainDetuneView(bytes)!;
    expect(v.isDefault).toBe(false);
    expect(v.gainDb).toBeCloseTo(2.91, 1);
    expect(v.detuneCents).toBe(100);
  });
});

describe('sampleUnisonView', () => {
  it('summarises a default codec-4 unison block as off', () => {
    const bytes = writeNsmp({ name: 'U', channels: [new Int16Array(64)], codec: 4 });
    const v = sampleUnisonView(bytes)!;
    expect(v.active).toBe(false);
    expect(v.summary.toLowerCase()).toContain('off');
  });

  it('returns null for codec-3 (no unison block)', () => {
    const bytes = writeNsmp({ name: 'U3', channels: [new Int16Array(64)], codec: 3 });
    expect(sampleUnisonView(bytes)).toBeNull();
  });
});

const real = join(process.cwd(), 'research/nsmp/Strings.nsmp3');
describe.skipIf(!existsSync(real))('zoneMapRows — real Strings.nsmp3', () => {
  it('maps each zone to note names + stroke global id + velocity range', () => {
    const bytes = new Uint8Array(readFileSync(real));
    const rows = zoneMapRows(bytes);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(typeof r.globalID).toBe('number');
      expect(r.rootNote).toMatch(/^[A-G]#?-?\d+$/);
      expect(r.topNote).toMatch(/^[A-G]#?-?\d+$/);
      expect(r.velLow).toBe(0); // velMin
      expect(r.velTop).toBe(127); // velMax
    }
  });
});

const tbm = '/Users/simonflore/Documents/TBM/VibesNoVibrato Mellotron_M300A 4.1.nsmp4';
describe.skipIf(!existsSync(tbm))('zoneMapRows key range', () => {
  it('includes the zone bottom note as a range', () => {
    const bytes = new Uint8Array(readFileSync(tbm));
    if (!readNsmp(bytes).recognized) return;
    const rows = zoneMapRows(bytes);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r.btmNote).toMatch(/^[A-G]#?-?\d+$/);
  });
});
