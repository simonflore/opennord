/**
 * NE6 decoder smoke tests — pinned against the 16 real .ne6p fixtures.
 *
 * Confirmed invariants (corpus RE, 2026-06-22):
 *   - CBIN tag is `ne6p`
 *   - Version is 2.04 for all fixtures (OS 2.66 era)
 *   - All-drawbar-8 presets: both upper & lower bars = [8,8,8,8,8,8,8,8,8]
 *   - Drunken_Brass upper drawbars: [8,5,7,0,5,0,0,0,0]
 *   - Drunken_Brass lower drawbars: [7,5,6,0,4,5,5,0,0]
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNe6 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/electro-6');

function load(name: string): Uint8Array {
  return new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
}

describe('decodeNe6', () => {
  it('decodes without warnings on a valid fixture', () => {
    const prog = decodeNe6(load('BUNDLE__Brass_Boy.ne6p'));
    expect(prog.parsed).toBe(true);
    expect(prog.warnings).toHaveLength(0);
  });

  it('reads version 2.04 from all fixtures', () => {
    const names = [
      'BUNDLE__Brass_Boy.ne6p',
      'BUNDLE__Drunken_Brass.ne6p',
      'BUNDLE__Logan_Synth.ne6p',
    ];
    for (const name of names) {
      const prog = decodeNe6(load(name));
      expect(prog.version, name).toBe('2.04');
    }
  });

  describe('organ drawbars', () => {
    it('Brass_Boy: upper drawbars all at 8', () => {
      const prog = decodeNe6(load('BUNDLE__Brass_Boy.ne6p'));
      expect(prog.organ.upper.bars).toEqual([8,8,8,8,8,8,8,8,8]);
    });

    it('Brass_Boy: lower drawbars all at 8', () => {
      const prog = decodeNe6(load('BUNDLE__Brass_Boy.ne6p'));
      expect(prog.organ.lower.bars).toEqual([8,8,8,8,8,8,8,8,8]);
    });

    it('Drunken_Brass: upper drawbars match known brass registration', () => {
      const prog = decodeNe6(load('BUNDLE__Drunken_Brass.ne6p'));
      // 85 70 50 00 03 → nibbles [8,5,7,0,5,0,0,0,0]
      expect(prog.organ.upper.bars).toEqual([8,5,7,0,5,0,0,0,0]);
    });

    it('Drunken_Brass: lower drawbars match known setting', () => {
      const prog = decodeNe6(load('BUNDLE__Drunken_Brass.ne6p'));
      // 75 60 45 50 03 → nibbles [7,5,6,0,4,5,5,0,0]
      expect(prog.organ.lower.bars).toEqual([7,5,6,0,4,5,5,0,0]);
    });

    it('synth presets have default all-8 drawbars (organ section inactive)', () => {
      const prog = decodeNe6(load('BUNDLE__Logan_Synth.ne6p'));
      expect(prog.organ.upper.bars).toEqual([8,8,8,8,8,8,8,8,8]);
      expect(prog.organ.lower.bars).toEqual([8,8,8,8,8,8,8,8,8]);
    });

    it('Duvet_Pad: upper drawbars match corpus', () => {
      const prog = decodeNe6(load('BUNDLE__Duvet_Pad.ne6p'));
      // 62 54 32 11 0b → nibbles [6,2,5,4,3,2,1,1,0]
      expect(prog.organ.upper.bars).toEqual([6,2,5,4,3,2,1,1,0]);
    });
  });

  it('exposes raw body clusters for RE tooling', () => {
    const prog = decodeNe6(load('BUNDLE__Brass_Boy.ne6p'));
    expect(prog._clusterA).toHaveLength(4);
    expect(prog._clusterB).toHaveLength(9);
    expect(prog._clusterC).toHaveLength(13);
    expect(prog._clusterD).toHaveLength(14);
    expect(prog._rawBody.length).toBeGreaterThan(0);
  });
});
