/**
 * Nord Piano reader tests: synthetic records built from the program map
 * (OS 1.50 descriptors). No real `.nppg` is in the corpus, and the record's
 * file position (0x1A) is assumed.
 */
import { describe, it, expect } from 'vitest';
import { decodeNp1 } from './decode';
import { np1Decoded } from './present';
import { NP1_LAYOUT, type Np1FieldKey } from './layout.generated';
import { synthLegacyFile, writeLegacyRecord } from '../clavia/block-chain.synth';

function nppg(values: Partial<Record<Np1FieldKey, number>> = {}, cbinVersion = 0): Uint8Array {
  const data = new Uint8Array(NP1_LAYOUT.dataBytes);
  writeLegacyRecord(data, NP1_LAYOUT, values);
  return synthLegacyFile('nppg', cbinVersion, data);
}

describe('Nord Piano firmware layout', () => {
  it('is a 20-byte record (piano, then effects: 156 bits) with no version, 29 parameters', () => {
    expect(NP1_LAYOUT).toMatchObject({ dataBytes: 20, recordVersion: null });
    expect(NP1_LAYOUT.fields).toHaveLength(29);
    expect(Math.max(...NP1_LAYOUT.fields.map((f) => f.bit + f.width))).toBe(156);
  });
});

describe('decodeNp1 (synthetic)', () => {
  it('reads the record whatever the version field holds (the record has none)', () => {
    for (const v of [0, 150]) {
      const p = decodeNp1(nppg({ 'piano.pianoType': 3, 'effects.reverbOn': 1 }, v));
      expect(p.warnings).toEqual([]);
      expect(p).toMatchObject({ layoutMatched: true, recordVersion: null, format: 'nppg' });
      expect(p.values['piano.pianoType']).toBe(3);
    }
  });

  it('presents the piano type and effects, and says the alignment is assumed', () => {
    const d = np1Decoded(nppg({ 'piano.pianoType': 1, 'piano.acoustics': 1, 'effects.eqOn': 1, 'effects.reverbOn': 1 }));
    expect(d.title).toBe('Nord Piano · Program');
    expect(d.sections[0].engines[0].parts).toEqual(['Upright', 'Acoustics']);
    expect(d.sections[1].engines[0].parts).toEqual(['EQ', 'Reverb']);
    expect(d.note).toMatch(/assumed/);
  });

  it('a file too short for the record is header only', () => {
    expect(np1Decoded(nppg().slice(0, 30)).sections).toEqual([]);
  });
});
