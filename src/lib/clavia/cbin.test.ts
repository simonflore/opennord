import { describe, it, expect } from 'vitest';
import { buildCbinHeader, cbinFraming, cbinRecord, readCbinHeader } from './cbin';

function file(formatType: number, record: number[], legacyTrailer = [0xaa, 0xbb]): Uint8Array {
  const header = buildCbinHeader({ formatType, tag: 'ns2p', bank: 2, location: 7, category: 12, versionRaw: 7 });
  if (formatType === 1) return new Uint8Array([...header, ...record]);
  return new Uint8Array([...header.subarray(0, 0x18), ...record, ...legacyTrailer]);
}

describe('CBIN framing — one rule for every model', () => {
  it('puts the record at 0x2C behind an NSM-era header: size − 44 bytes', () => {
    const f = file(1, [1, 2, 3, 4, 5]);
    expect(cbinFraming(f)).toEqual({ formatType: 1, supported: true, recordOffset: 0x2c, trailerBytes: 0, recordBytes: 5 });
    expect([...cbinRecord(f)]).toEqual([1, 2, 3, 4, 5]);
  });

  it('puts it at 0x18 behind a legacy header, before the 2-byte CRC-16 trailer: size − 26 bytes', () => {
    const f = file(0, [9, 8, 7]);
    expect(cbinFraming(f)).toEqual({ formatType: 0, supported: true, recordOffset: 0x18, trailerBytes: 2, recordBytes: 3 });
    expect([...cbinRecord(f)]).toEqual([9, 8, 7]);
  });

  it('marks a format type above 1 unsupported (NSM refuses it) and never reads past a short file', () => {
    expect(cbinFraming(file(2, [1])).supported).toBe(false);
    expect(cbinFraming(new Uint8Array(10)).recordBytes).toBe(0);
    expect(cbinRecord(new Uint8Array(10))).toHaveLength(0);
  });
});

describe('CBIN header fields', () => {
  it('reads and writes the full widths: u32 format, u16 bank and slot, u32 category and version', () => {
    const h = { formatType: 1, tag: 'np6p', bank: 0x0102, location: 0x0304, category: 0x05060708, versionRaw: 0x0a0b0c0d };
    const bytes = buildCbinHeader(h);
    expect(bytes).toHaveLength(44);
    expect(readCbinHeader(bytes)).toEqual(h);
  });

  it('NUL-pads a three-letter tag and reads it back without the padding', () => {
    const bytes = buildCbinHeader({ formatType: 1, tag: 'ngp', bank: 0, location: 0, category: 0, versionRaw: 0 });
    expect([...bytes.subarray(8, 12)]).toEqual([0x6e, 0x67, 0x70, 0]);
    expect(readCbinHeader(bytes).tag).toBe('ngp');
  });
});
