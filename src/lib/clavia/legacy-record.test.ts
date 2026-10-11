import { describe, it, expect } from 'vitest';
import {
  LEGACY_DATA_OFFSET, legacyData, legacyDataOffset, legacyFileBytes, legacyLayoutData, legacyLayoutVersion,
  legacyMorphDeltas, legacyRecordOffset, legacyRecordVersion, readLegacyFile, readLegacyRecord, readMorphList,
  type LegacyLayout, type LegacyMorphList,
} from './legacy-record';
import { synthLegacyFile, synthLegacyLayoutFile, writeBits, writeLegacyRecord } from './block-chain.synth';
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

  it('places the record at 0x18 after a legacy header and 0x2C after an NSM-era one, with the layout’s version width', () => {
    const wide = { ...TINY, recordVersion: 101 };
    const narrow = { ...TINY, recordVersion: 8, versionBytes: 1 as const, padBytes: 2 };
    const a = synthLegacyLayoutFile('test', wide, { 's.level': 99 });
    expect(a).toHaveLength(0x18 + 2 + 3 + 2);
    expect([legacyRecordOffset(a), legacyDataOffset(a, wide), legacyFileBytes(a, wide)]).toEqual([0x18, 0x1a, a.length]);
    expect(legacyLayoutVersion(a, wide)).toBe(101);
    expect([a[0x18], a[0x19]]).toEqual([0, 101]); // big-endian, like the bitstream
    expect(verifyTrailerChecksum(a)).toBe(true);
    expect(readLegacyRecord(legacyLayoutData(a, wide), wide).values['s.level']).toBe(99);

    const b = synthLegacyLayoutFile('test', narrow, { 's.level': 42 });
    expect(b).toHaveLength(0x18 + 1 + 3 + 2 + 2);
    expect([legacyDataOffset(b, narrow), legacyLayoutVersion(b, narrow), b[0x18]]).toEqual([0x19, 8, 8]);
    expect(legacyLayoutData(b, narrow)).toHaveLength(3 + 2); // padding stays with the data
    expect(readLegacyRecord(legacyLayoutData(b, narrow), narrow).values['s.level']).toBe(42);

    const c = synthLegacyLayoutFile('test', wide, { 's.level': 7 }, { nsmHeader: true });
    expect(c).toHaveLength(0x2c + 2 + 3); // no 2-byte trailer after an NSM-era header
    expect([legacyRecordOffset(c), legacyDataOffset(c, wide), legacyLayoutVersion(c, wide)]).toEqual([0x2c, 0x2e, 101]);
    expect(readLegacyFile(c, wide).values['s.level']).toBe(7);
    expect(readLegacyFile(c, wide).warnings).toEqual([]);
  });

  it('reads a whole file with warnings for size, record version and range, never throwing', () => {
    const layout = { ...TINY, recordVersion: 101 };
    const ok = readLegacyFile(synthLegacyLayoutFile('test', layout), layout);
    expect(ok).toMatchObject({ recordVersion: 101, complete: true, warnings: [], outOfRange: [] });
    const old = readLegacyFile(synthLegacyLayoutFile('test', layout, {}, { version: 100 }), layout, [100, 101]);
    expect(old.warnings).toEqual([]);
    expect(readLegacyFile(synthLegacyLayoutFile('test', layout, {}, { version: 99 }), layout).warnings.join(' ')).toContain('Record version 99');
    expect(readLegacyFile(synthLegacyLayoutFile('test', layout, { 's.level': 120 }), layout).warnings.join(' ')).toContain('s.level');
    const short = readLegacyFile(new Uint8Array(0x1b), layout);
    expect(short.complete).toBe(false);
    expect(short.warnings.join(' ')).toContain('too short');
    const long = synthLegacyLayoutFile('test', layout);
    expect(readLegacyFile(new Uint8Array([...long, 0]), layout).warnings.join(' ')).toContain('makes 31');
  });

  it('lets a second stored copy overwrite the first, as the firmware reader does', () => {
    const layout: LegacyLayout<'a.x' | 'adup.x'> = {
      model: 'Test', source: 'test', container: 'test', recordVersion: 1, dataBytes: 1,
      fields: [
        { key: 'a.x', name: 'a.x', id: 0, bit: 0, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 't' },
        { key: 'adup.x', name: 'adup.x', id: 0, bit: 4, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 't', copyOf: 'a.x' },
      ],
    };
    const data = new Uint8Array(1);
    writeLegacyRecord(data, layout, { 'a.x': 3 });
    expect(data[0]).toBe(0x33); // the writer repeats the container
    writeBits(data, 4, 4, 5);
    expect(readLegacyRecord(data, layout).values).toEqual({ 'a.x': 5, 'adup.x': 5 });
  });

  it('groups inline morph deltas under their parameter', () => {
    expect(legacyMorphDeltas(TINY, { 's.level': 64, 's.delta': -3, 's.flag': 1 })).toEqual({ 's.level': [-3] });
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
