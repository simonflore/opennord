import { describe, it, expect } from 'vitest';
import { readNsmpHeader } from './sample';
import { parseNs4Program } from './parse';
import { patchNs4Checksum, verifyNs4Checksum } from '../clavia/checksum';

/**
 * Build a minimal, synthetic Nord Sample header — CBIN header + NSMP chunk +
 * a name, then a few zero "payload" bytes. Deliberately contains NO real audio
 * (docs/LEGAL.md); it exists only to exercise the header reader.
 */
function makeSyntheticNsmp(name = 'Test Sample', versionRaw = 410): Uint8Array {
  const buf = new Uint8Array(0x120);
  const ascii = (s: string, at: number) => {
    for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i);
  };
  ascii('CBIN', 0x00);
  buf[0x04] = 1; // header format type
  ascii('nsmp', 0x08);
  buf[0x14] = versionRaw & 0xff;
  buf[0x15] = (versionRaw >> 8) & 0xff;
  ascii('NSMP', 0x2c); // chunk container marker
  ascii(name, 0x52); // name within the header reader's scan window, NUL-padded
  return patchNs4Checksum(buf); // valid CRC over bytes[0x2C:]
}

describe('readNsmpHeader', () => {
  it('recognizes a sample file and reads name + version + checksum', () => {
    const h = readNsmpHeader(makeSyntheticNsmp('Indian Harmonium 1', 410));
    expect(h.kind).toBe('sample');
    expect(h.recognized).toBe(true);
    expect(h.name).toBe('Indian Harmonium 1');
    expect(h.version).toBe('4.10');
    expect(h.versionRaw).toBe(410);
    expect(h.checksumValid).toBe(true);
    expect(h.audioPayloadBytes).toBe(0x20);
    expect(h.warnings).toHaveLength(0);
  });

  it('flags a checksum mismatch (e.g. truncated/modified sample)', () => {
    const buf = makeSyntheticNsmp();
    buf[0x60] ^= 0xff; // corrupt a payload byte after the checksum was written
    const h = readNsmpHeader(buf);
    expect(h.recognized).toBe(true);
    expect(h.checksumValid).toBe(false);
    expect(verifyNs4Checksum(buf)).toBe(false);
    expect(h.warnings.join(' ')).toMatch(/checksum/i);
  });

  it('returns recognized:false for non-sample input', () => {
    const h = readNsmpHeader(new Uint8Array([1, 2, 3, 4]));
    expect(h.recognized).toBe(false);
    expect(h.checksumValid).toBe(false);
    expect(h.name).toBeUndefined();
  });
});

describe('parseNs4Program — sample files are not decoded as programs', () => {
  it('classifies a sample as kind "sample" and does NOT program-decode it', () => {
    const prog = parseNs4Program(makeSyntheticNsmp());
    expect(prog.kind).toBe('sample');
    expect(prog.parsed).toBe(false);
    expect(prog.layers).toBeUndefined();
    expect(prog.warnings.join(' ')).toMatch(/not a Stage 4 program/i);
  });
});
