import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { patchNs4Checksum } from './checksum';
import { readNsmp, parseNsmpSections, decodeNsmp, readNsmpZones } from './nsmp';

/** Build a minimal synthetic `.nsmp` (CBIN header + NSMP + hdr sections). */
function makeSyntheticNsmp(name = 'Hi'): Uint8Array {
  const hdrPay = new Uint8Array(8);
  for (let i = 0; i < name.length && i < 8; i++) hdrPay[i] = name.charCodeAt(i);
  const buf = new Uint8Array(0x2c + 16 + (12 + hdrPay.length));
  const ascii = (s: string, at: number) => { for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i); };
  const u32be = (v: number, at: number) => { buf[at] = (v >>> 24) & 0xff; buf[at + 1] = (v >>> 16) & 0xff; buf[at + 2] = (v >>> 8) & 0xff; buf[at + 3] = v & 0xff; };
  ascii('CBIN', 0x00);
  buf[0x04] = 1;
  ascii('nsmp', 0x08);
  buf[0x14] = 300 & 0xff; buf[0x15] = (300 >> 8) & 0xff; // version 3.00
  // NSMP section: tag, ver=30, size=4
  u32be(0x4e534d50, 0x2c); u32be(30, 0x30); u32be(4, 0x34);
  // hdr section: tag "\0hdr", ver=10, size=hdrPay.length, payload=name
  u32be(0x00686472, 0x3c); u32be(10, 0x40); u32be(hdrPay.length, 0x44);
  buf.set(hdrPay, 0x48);
  return patchNs4Checksum(buf);
}

describe('parseNsmpSections', () => {
  it('walks [tag][version][size] section headers', () => {
    const secs = parseNsmpSections(makeSyntheticNsmp());
    expect(secs.map((s) => s.tag)).toEqual(['NSMP', '.hdr']);
    expect(secs[0]).toMatchObject({ version: 30, size: 4, payloadOffset: 0x38 });
    expect(secs[1]).toMatchObject({ version: 10, size: 8, payloadOffset: 0x48 });
  });
});

describe('readNsmp', () => {
  it('reads version, codec, name and recognizes a sample file', () => {
    const f = readNsmp(makeSyntheticNsmp('Strings')); // ≤ 8-byte synthetic hdr payload
    expect(f.recognized).toBe(true);
    expect(f.version).toBe('3.00');
    expect(f.codec).toBe(3);
    expect(f.checksumValid).toBe(true);
    expect(f.name).toBe('Strings');
  });

  it('returns recognized:false for non-sample input', () => {
    expect(readNsmp(new Uint8Array([1, 2, 3, 4])).recognized).toBe(false);
  });
});

// Real-data validation against the user's own sample (gitignored). Skipped in CI.
const realFile = join(process.cwd(), 'research/nsmp/Strings.nsmp3');
describe.skipIf(!existsSync(realFile))('readNsmp / decodeNsmp — real Strings.nsmp3', () => {
  const bytes = existsSync(realFile) ? new Uint8Array(readFileSync(realFile)) : new Uint8Array();

  it('parses the section tree (codec 3, name, 8 strokes)', () => {
    const f = readNsmp(bytes);
    expect(f.codec).toBe(3);
    expect(f.name).toBe('VLV Strings');
    expect(f.strokeCount).toBe(8);
    expect(f.sections.map((s) => s.tag)).toEqual(
      ['NSMP', '.hdr', '.cat', '.map', '.stk', '.stk', '.stk', '.stk', '.stk', '.stk', '.stk', '.stk', '.sty', 'meta'],
    );
  });

  it('reads the 8 key-split zones from the map section', () => {
    const zones = readNsmpZones(bytes);
    expect(zones.length).toBe(8);
    // Strings.nsmp3 is split across the keyboard: descending top keys, one stroke each.
    expect(zones.map((z) => z.keyHigh)).toEqual([45, 42, 40, 38, 33, 30, 28, 26]);
    expect(zones.map((z) => z.strokeIndex)).toEqual([3, 4, 2, 1, 7, 8, 6, 5]);
    expect(zones[0].velTop).toBe(8); // first zone is a soft-velocity layer
    expect(zones.slice(1).every((z) => z.velTop === 127)).toBe(true);
  });

  it('decodes all 8 strokes to clean stereo PCM', () => {
    const strokes = decodeNsmp(bytes);
    expect(strokes.length).toBe(8);
    // per-stroke sample counts validated against the decoder (docs/NSMP-CODEC.md)
    expect(strokes.map((s) => s.channels[0].length)).toEqual(
      [68146, 53590, 68220, 53814, 70200, 54380, 67812, 53244],
    );
    for (const s of strokes) {
      expect(s.channelCount).toBe(2);
      expect(s.channels[1].length).toBe(s.channels[0].length); // L/R equal
      const peak = s.channels[0].reduce((m, x) => Math.max(m, Math.abs(x)), 0);
      expect(peak).toBeLessThan(1 << 20); // sane 16-bit levels, not divergence
    }
    // stroke 0: clean silent onset
    expect(Array.from(strokes[0].channels[0].slice(0, 8))).toEqual([0, 0, 0, 0, -1, -2, -3, -4]);
  });
});
