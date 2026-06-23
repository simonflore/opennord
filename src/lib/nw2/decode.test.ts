import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNw2 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/wave-2');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.nw2p'));

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNw2', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNw2(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 3.01 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNw2(load(name)).version, name).toBe('3.01');
    }
  });

  it('exposes four voice slots', () => {
    const prog = decodeNw2(load(fixtures()[0]));
    expect(prog.slots).toHaveLength(4);
  });

  it('each slot has 9 drawbar values in range 0-8', () => {
    for (const name of fixtures()) {
      const prog = decodeNw2(load(name));
      for (const slot of prog.slots) {
        expect(slot.drawbars.bars, `${name} drawbar count`).toHaveLength(9);
        for (const bar of slot.drawbars.bars) {
          expect(bar, `${name} drawbar value`).toBeGreaterThanOrEqual(0);
          expect(bar, `${name} drawbar value`).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  // One Vision Queen has a non-zero trailing nibble in slot 2 (part of the anomalous
  // 8-byte drawbar region; bytes [636-638] differ from all other fixtures).
  // All other 25 fixtures have trailing=0 on all slots.
  it('drawbar _trailing nibble is 0 in the factory corpus (except One Vision Queen slot 2)', () => {
    for (const name of fixtures()) {
      const prog = decodeNw2(load(name));
      for (let i = 0; i < 4; i++) {
        const isKnownException = name === 'One Vision Queen.nw2p' && i === 2;
        if (!isKnownException) {
          expect(prog.slots[i].drawbars._trailing, `${name} slot${i} trailing nibble`).toBe(0);
        }
      }
    }
  });

  it('slot raw bytes are the expected size', () => {
    const prog = decodeNw2(load(fixtures()[0]));
    for (const slot of prog.slots) {
      expect(slot._raw).toHaveLength(244);
    }
  });

  // Confirmed: Eli Bass 6 has non-default drawbars [3,7,7,7,7,7,7,7,4].
  // This validates the corrected body offsets (143/387/631/875) and the 5-byte/9-bar encoding.
  // Source: corpus RE 2026-06-22 — previously the skeleton used off-by-one offsets (144/388/876).
  it('Eli Bass 6 drawbars decode to [3,7,7,7,7,7,7,7,4] on all slots', () => {
    const prog = decodeNw2(load('EF__Program_Bank O_Eli    Bass 6.nw2p'));
    for (let i = 0; i < 4; i++) {
      expect(prog.slots[i].drawbars.bars, `slot${i}`).toEqual([3, 7, 7, 7, 7, 7, 7, 7, 4]);
    }
  });

  // Confirmed: most factory programs use default drawbar position [3,7,3,7,3,7,3,7,0].
  it('Sine Pad drawbars decode to default [3,7,3,7,3,7,3,7,0] on all slots', () => {
    const prog = decodeNw2(load('EF__Program_Bank O_Sine Pad.nw2p'));
    for (let i = 0; i < 4; i++) {
      expect(prog.slots[i].drawbars.bars, `slot${i}`).toEqual([3, 7, 3, 7, 3, 7, 3, 7, 0]);
    }
  });

  // Candidate: waveform bank=0 / id=0x65 for Choir (wavetable catalog entry).
  // Choir has oscFlag=0xff (extended mode) + bank=0x00 + id=0x65.
  it('Choir has wavetable-mode oscFlag and non-zero waveform id on slot 0', () => {
    const prog = decodeNw2(load('EF__Program_Bank O_Choir.nw2p'));
    expect(prog.slots[0].waveform.oscFlag).toBe(0xff);
    expect(prog.slots[0].waveform.bank).toBe(0x00);
    expect(prog.slots[0].waveform.id).toBe(0x65);
  });

  // Candidate: Eli Bass 6 is a pure synth program — standard mode, bank 0, id 0 (Sine).
  it('Eli Bass 6 has standard-mode oscFlag and zero waveform id on slot 0', () => {
    const prog = decodeNw2(load('EF__Program_Bank O_Eli    Bass 6.nw2p'));
    expect(prog.slots[0].waveform.oscFlag).toBe(0xfe);
    expect(prog.slots[0].waveform.bank).toBe(0x00);
    expect(prog.slots[0].waveform.id).toBe(0x00);
  });

  // Candidate: One Vision Queen uses bank=1 (extended wavetable bank).
  it('One Vision Queen has bank=1 (extended wavetables) on slot 0', () => {
    const prog = decodeNw2(load('One Vision Queen.nw2p'));
    expect(prog.slots[0].waveform.bank).toBe(0x01);
  });

  it('global preamble is 5 bytes, constant 00 00 01 2d 3f', () => {
    for (const name of fixtures()) {
      const prog = decodeNw2(load(name));
      expect(prog._globalPreamble, name).toHaveLength(5);
      expect(Array.from(prog._globalPreamble), name).toEqual([0x00, 0x00, 0x01, 0x2d, 0x3f]);
    }
  });

  it('global tail is 68 bytes', () => {
    const prog = decodeNw2(load(fixtures()[0]));
    expect(prog._globalTail).toHaveLength(68);
  });

  it('waveform region is 7 bytes per slot', () => {
    const prog = decodeNw2(load(fixtures()[0]));
    for (const slot of prog.slots) {
      expect(slot._oscWaveformRegion).toHaveLength(7);
    }
  });
});
