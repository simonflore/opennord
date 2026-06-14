import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NsmpFile, DecodedStrokeResult } from './nsmp';
import { noteName, sampleHeaderView, zoneMapRows, strokeSummary } from './sample-view';

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
      checksumOk: true, strokeCount: 8, sizeBytes: 1234, isFactory: false,
    });
  });

  it('falls back gracefully for an unrecognized file', () => {
    const file: NsmpFile = {
      recognized: false, legacy: false, checksumValid: false, sections: [],
      strokeCount: 0, suspectedFactory: false, warnings: ['nope'],
    };
    expect(sampleHeaderView(file, 0)).toEqual({
      name: 'Unnamed', codecLabel: '—', version: '—',
      checksumOk: false, strokeCount: 0, sizeBytes: 0, isFactory: false,
    });
  });
});

describe('strokeSummary', () => {
  it('summarizes a decoded stroke', () => {
    const d: DecodedStrokeResult = {
      index: 2, channelCount: 2, endOffset: 0,
      channels: [new Int32Array([0, 100, -200, 50]), new Int32Array([0, 0, 0, 0])],
    };
    expect(strokeSummary(d)).toEqual({ index: 2, sampleCount: 4, channels: 2, peak: 200, ok: true });
  });

  it('marks an empty stroke not-ok', () => {
    const d: DecodedStrokeResult = { index: 0, channelCount: 1, endOffset: 0, channels: [new Int32Array(0)] };
    expect(strokeSummary(d).ok).toBe(false);
  });
});

const real = join(process.cwd(), 'research/nsmp/Strings.nsmp3');
describe.skipIf(!existsSync(real))('zoneMapRows — real Strings.nsmp3', () => {
  it('maps each zone to note names + stroke index', () => {
    const bytes = new Uint8Array(readFileSync(real));
    const rows = zoneMapRows(bytes);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(typeof r.strokeIndex).toBe('number');
      expect(r.rootNote).toMatch(/^[A-G]#?-?\d+$/);
      expect(r.topNote).toMatch(/^[A-G]#?-?\d+$/);
    }
  });
});
