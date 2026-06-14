import { describe, it, expect } from 'vitest';
import type { NsmpFile } from './nsmp';
import { noteName, sampleHeaderView } from './sample-view';

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
      recognized: true, version: '3.00', versionRaw: 300, codec: 3,
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
      recognized: false, checksumValid: false, sections: [],
      strokeCount: 0, suspectedFactory: false, warnings: ['nope'],
    };
    const v = sampleHeaderView(file, 0);
    expect(v.name).toBe('Unnamed');
    expect(v.codecLabel).toBe('—');
    expect(v.version).toBe('—');
  });
});
