import { describe, it, expect } from 'vitest';
import { patchNs4Checksum } from './checksum';
import { identifyNsmp, nsmpLayout } from './sample-identify';

/** Minimal synthetic CBIN sample container: `nsmp` type tag + NSMP root @0x2c. */
function makeNsmp(versionRaw: number): Uint8Array {
  const buf = new Uint8Array(0x2c + 12);
  const ascii = (s: string, at: number) => { for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i); };
  const u32be = (v: number, at: number) => {
    buf[at] = (v >>> 24) & 0xff; buf[at + 1] = (v >>> 16) & 0xff; buf[at + 2] = (v >>> 8) & 0xff; buf[at + 3] = v & 0xff;
  };
  ascii('CBIN', 0x00);
  buf[0x04] = 1;
  ascii('nsmp', 0x08);
  buf[0x14] = versionRaw & 0xff; buf[0x15] = (versionRaw >> 8) & 0xff;
  u32be(0x4e534d50, 0x2c); // "NSMP" root
  return patchNs4Checksum(buf);
}

describe('identifyNsmp', () => {
  it('recognizes a codec-3 sample and reads its version', () => {
    const id = identifyNsmp(makeNsmp(300));
    expect(id).toMatchObject({ recognized: true, legacy: false, codec: 3, version: '3.00' });
  });

  it('recognizes a codec-4 sample', () => {
    expect(identifyNsmp(makeNsmp(400))).toMatchObject({ recognized: true, codec: 4, version: '4.00' });
  });

  it('rejects non-Nord bytes', () => {
    expect(identifyNsmp(new Uint8Array([1, 2, 3, 4]))).toEqual({ recognized: false, legacy: false });
  });
});

describe('nsmpLayout', () => {
  it('frames modern codec 3/4 with the 12-byte NSMP header @0x2c', () => {
    expect(nsmpLayout(makeNsmp(300))).toEqual({ bodyStart: 0x2c, headerSize: 12, legacy: false });
  });
});
