import { describe, it, expect } from 'vitest';
import { readCbinHeader, cbinRecord } from '../clavia/cbin';
import { readNsmp } from '../ns4/nsmp';
import { verifyNs4Checksum } from '../clavia/checksum';
import { cbinFile, padTo, testSample } from './wire-replies';

describe('shared sample builders', () => {
  it('testSample is a valid nsmp of the requested codec', () => {
    for (const codec of [3, 4] as const) {
      const file = readNsmp(testSample({ codec, name: 'Pad' }));
      expect(file).toMatchObject({ recognized: true, codec, legacy: false });
    }
  });

  it('cbinFile addresses the record to bank/slot with a valid checksum', () => {
    const record = testSample();
    const file = cbinFile(record, { bank: 2, slot: 7 });
    expect(readCbinHeader(file)).toMatchObject({ tag: 'nsmp', bank: 2, location: 7, versionRaw: 400 });
    expect(verifyNs4Checksum(file)).toBe(true);
    expect(cbinRecord(file)).toEqual(record);
  });

  it('padTo zero-fills up to the next multiple', () => {
    const out = padTo(new Uint8Array([1, 2, 3]), 4);
    expect([...out]).toEqual([1, 2, 3, 0]);
    expect(padTo(new Uint8Array(4), 4)).toHaveLength(4);
  });
});
