import { describe, it, expect } from 'vitest';
import {
  LEGACY_DATA_OFFSET, legacyData, legacyRecordVersion, readLegacyRecord, readMorphList,
  type LegacyLayout, type LegacyMorphList,
} from './legacy-record';
import { synthLegacyFile, writeBits, writeLegacyRecord } from './block-chain.synth';
import { verifyTrailerChecksum } from './crc16';

/** A tiny record: a raw 7-bit level, a two's-complement 8-bit delta, a 1-bit flag. */
const TINY: LegacyLayout<'s.level' | 's.delta' | 's.flag'> = {
  model: 'Test', source: 'test', container: 'test', recordVersion: 3, dataBytes: 3,
  fields: [
    { key: 's.level', name: 'level', id: 0, bit: 3, width: 7, min: 0, max: 100, def: 64, enc: 'u', confidence: 'high', src: 't' },
    { key: 's.delta', name: 'delta', id: 0, bit: 10, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 't', deltaOf: 's.level' },
    { key: 's.flag', name: 'flag', id: 1, bit: 18, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'high', src: 't' },
  ],
};

describe('legacy formatType-0 record', () => {
  it('starts the data at file 0x1A, drops the CRC trailer and reads the u16 LE record version at 0x14', () => {
    const file = new Uint8Array(0x1a + 5 + 2).map((_, i) => i);
    expect(LEGACY_DATA_OFFSET).toBe(0x1a);
    expect(Array.from(legacyData(file))).toEqual([0x1a, 0x1b, 0x1c, 0x1d, 0x1e]);
    expect(legacyData(new Uint8Array(4))).toHaveLength(0);
    // A Stage 2 record behind the NSM-era header starts at 0x2E and has no trailer.
    const nsm = new Uint8Array(0x2e + 3).map((_, i) => i);
    expect(Array.from(legacyData(nsm, 0x2e, 0))).toEqual([0x2e, 0x2f, 0x30]);
    expect(legacyData(new Uint8Array(0x20), 0x2e, 0)).toHaveLength(0);
    expect(legacyRecordVersion(file)).toBe(0x14 | (0x15 << 8));
  });

  it("reads raw and two's-complement fields, at any record offset, and flags values out of range", () => {
    const data = new Uint8Array(6);
    writeLegacyRecord(data, TINY, { 's.level': 120, 's.delta': -5 }, 3);
    const r = readLegacyRecord(data, TINY, 3);
    expect(r.values).toEqual({ 's.level': 120, 's.delta': -5, 's.flag': 1 });
    expect(r.outOfRange).toEqual(['s.level']);
    expect(data[3 + 1] & 0x3f).toBe(0xfb >> 2); // −5 is 0xfb, MSB-first from record bit 10
    expect(readLegacyRecord(data, TINY, 0).values['s.flag']).toBe(0);
  });

  it('builds a sealed synthetic file around the record', () => {
    const data = new Uint8Array(TINY.dataBytes);
    writeLegacyRecord(data, TINY);
    const file = synthLegacyFile('test', 3, data);
    expect(file).toHaveLength(0x1a + 3 + 2);
    expect(verifyTrailerChecksum(file)).toBe(true);
    expect(legacyRecordVersion(file)).toBe(3);
    expect(readLegacyRecord(legacyData(file), TINY).values).toEqual({ 's.level': 64, 's.delta': 0, 's.flag': 1 });
  });

  it('reads only the used entries of a sparse morph list, with signed deltas', () => {
    const list: LegacyMorphList = { set: 's', countBit: 0, countWidth: 4, maxEntries: 3, entryBit: 4, paramBits: 7, sourceBits: 4, deltaBits: 8 };
    const data = new Uint8Array(10);
    writeBits(data, 0, 4, 2);
    writeBits(data, 4, 7, 50); writeBits(data, 11, 4, 3); writeBits(data, 15, 8, 0x100 - 20);
    writeBits(data, 23, 7, 8); writeBits(data, 30, 4, 0); writeBits(data, 34, 8, 64);
    writeBits(data, 42, 7, 99); // unused third entry: ignored (count = 2)
    expect(readMorphList(data, list)).toEqual([
      { param: 50, source: 3, delta: -20 },
      { param: 8, source: 0, delta: 64 },
    ]);
    writeBits(data, 0, 4, 15); // a count above the list size is capped
    expect(readMorphList(data, list)).toHaveLength(3);
  });
});
