import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseNsmpSections, nsmpLayout } from './nsmp';
import { writeOgStrokeHeader, parseOgStrokeHeader, OG_STROKE_HEADER_FIXED, assembleOgNsmp, ogEnvelope, type OgSection } from './nsmp-og';
import { level2DSP, dsp2Level, get0dB, decay2DSP, getDSPNormalize } from './nw1-dsp';

const ogFiles = [
  resolve(__dirname, '../../../nsmp conversion demo files/BrassAlesis 2.nsmp'),
  resolve(__dirname, '../../../research/nsmp/TAKE ON ME.nsmp'),
];

describe('nw1-dsp helpers', () => {
  it('level2DSP / get0dB / round-trip', () => {
    expect(level2DSP(0)).toBe(1048576); // 0 dB → 2^20
    expect(get0dB(14)).toBe(8192); // 2^13
    expect(get0dB(24)).toBe(8388608); // 2^23
    // DSP2Level inverts Level2DSP near 0 dB.
    expect(Math.abs(dsp2Level(level2DSP(-6)) - -6)).toBeLessThan(1e-3);
  });

  it('decay2DSP one-shot marker', () => {
    expect(decay2DSP(0)).toBe(-0x800000); // no decay → 0xff800000
    expect(decay2DSP(1) < 0).toBe(true);
  });

  it('getDSPNormalize frexp split', () => {
    // 1.0 → mantissa 0.5·2^23, exp 1 (matches the binary's loop).
    expect(getDSPNormalize(1)).toEqual({ mant: 4194304, exp: 1 });
    // round-trip: mant/2^23 · 2^exp ≈ x
    const x = 0.731;
    const { mant, exp } = getDSPNormalize(x);
    expect(Math.abs((mant / 8388608) * 2 ** exp - x)).toBeLessThan(1e-6);
  });
});

describe('assembleOgNsmp — envelope + section framing round-trip', () => {
  for (const path of ogFiles) {
    const name = path.split('/').pop()!;
    it(name, () => {
      const bytes = new Uint8Array(readFileSync(path));
      const lay = nsmpLayout(bytes);
      expect(lay.legacy).toBe(true);
      // envelope reproduces
      const env = ogEnvelope(bytes[0x14] | (bytes[0x15] << 8));
      for (let i = 0; i < 0x18; i++) expect(env[i], `envelope byte 0x${i.toString(16)}`).toBe(bytes[i]);
      // parse sections (carry raw payloads) → reassemble → byte-exact
      const sections: OgSection[] = parseNsmpSections(bytes).map((s) => ({
        tag: s.tag, version: s.version, payload: bytes.subarray(s.payloadOffset, s.endOffset),
      }));
      const rebuilt = assembleOgNsmp(sections, bytes[0x14] | (bytes[0x15] << 8));
      expect(rebuilt.length).toBe(bytes.length);
      let diff = -1;
      for (let i = 0; i < bytes.length; i++) if (rebuilt[i] !== bytes[i]) { diff = i; break; }
      expect(diff, `first diff at 0x${diff.toString(16)}`).toBe(-1);
    });
  }
});

describe('OG stroke header — byte-exact re-serialization (17 real strokes)', () => {
  for (const path of ogFiles) {
    const name = path.split('/').pop()!;
    it(name, () => {
      const bytes = new Uint8Array(readFileSync(path));
      const strokes = parseNsmpSections(bytes).filter((s) => s.tag.endsWith('stk'));
      expect(strokes.length).toBeGreaterThan(0);
      strokes.forEach((sec, i) => {
        const p = sec.payloadOffset;
        const original = bytes.subarray(p, p + OG_STROKE_HEADER_FIXED);
        const fields = parseOgStrokeHeader(bytes, p);
        const rewritten = writeOgStrokeHeader(fields);
        for (let j = 0; j < OG_STROKE_HEADER_FIXED; j++) {
          expect(
            rewritten[j],
            `${name} stk[${i}] header byte 0x${j.toString(16)}: got 0x${rewritten[j].toString(16)} exp 0x${original[j].toString(16)}`,
          ).toBe(original[j]);
        }
      });
    });
  }
});
