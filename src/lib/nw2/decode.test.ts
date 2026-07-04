import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNw2 } from './decode';
import { parseBundleDeps } from '../contribute/bundle-deps';

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

  it('decodes per-slot layer on/off + volume (Stage synth engine head)', () => {
    let anyOn = false;
    for (const name of fixtures()) {
      for (const slot of decodeNw2(load(name)).slots) {
        expect(typeof slot.on, name).toBe('boolean');
        expect(slot.volume, name).toBeGreaterThanOrEqual(0);
        expect(slot.volume, name).toBeLessThanOrEqual(127);
        if (slot.on) anyOn = true;
      }
    }
    expect(anyOn).toBe(true); // at least one slot active across the corpus
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

  // CONFIRMED (bundle meta.xml, dep0 = Men+Women Mm choir sample): Choir's
  // slot 0 is a sample slot at library index 0x196.
  it('Choir slot 0 is a sample slot at index 0x196', () => {
    const prog = decodeNw2(load('EF__Program_Bank O_Choir.nw2p'));
    expect(prog.slots[0].waveform.kind).toBe('sample');
    expect(prog.slots[0].waveform.sampleIndex).toBe(0x196);
  });

  // CONFIRMED (meta.xml depCnt=0): Eli Bass 6 is a pure oscillator program.
  it('Eli Bass 6 slot 0 is an oscillator slot', () => {
    const prog = decodeNw2(load('EF__Program_Bank O_Eli    Bass 6.nw2p'));
    expect(prog.slots[0].waveform.kind).toBe('oscillator');
    expect(prog.slots[0].waveform.oscFlag).toBe(0xfe);
  });

  // "Sine Pad" anchors waveform selector 0 = Sine (manual Basic category order).
  it('Sine Pad reads waveform 0 (Sine) on all four oscillator slots', () => {
    const prog = decodeNw2(load('EF__Program_Bank O_Sine Pad.nw2p'));
    for (const slot of prog.slots) {
      expect(slot.waveform.kind).toBe('oscillator');
      expect(slot.waveform.waveformId).toBe(0);
    }
  });

  // The same sample referenced from different programs keeps the same index —
  // Wurlitzer_CL mono 3.1 (meta.xml dep0 of all three programs) = 0x51f.
  it('Drip / Infinity EP / Infinity EP 2 share the Wurlitzer sample index 0x51f', () => {
    for (const name of ['Drip', 'Infinity EP', 'Infinity EP 2']) {
      const prog = decodeNw2(load(`EF__Program_Bank O_${name}.nw2p`));
      expect(prog.slots[0].waveform.kind, name).toBe('sample');
      expect(prog.slots[0].waveform.sampleIndex, name).toBe(0x51f);
    }
  });

  // Ground-truth regression: for every program listed in the bundle's meta.xml,
  // the number of sample slots equals the declared sample-dependency count.
  // Uses the shared bundle-deps parser (validates it against a real bundle).
  it('sample-slot count matches bundle meta.xml depCnt for every program', () => {
    const metaPath = join(FIXTURE_DIR, 'Elijah Fox Signature Sound Bank Bundle/meta.xml');
    if (!existsSync(metaPath)) return;
    const deps = parseBundleDeps(readFileSync(metaPath, 'utf8'));
    const programs = deps.filter((d) => d.program.endsWith('.nw2p'));
    expect(programs.length).toBeGreaterThan(0);
    for (const { program, deps: fileDeps } of programs) {
      const fixture = `EF__Program_Bank O_${basename(program)}`;
      if (!existsSync(join(FIXTURE_DIR, fixture))) continue;
      // Only sample deps (.nsmp*) map to sample slots — pianos/other deps don't.
      const sampleDeps = fileDeps.filter((d) => /\.nsmp\d?$/.test(d)).length;
      const sampleSlots = decodeNw2(load(fixture)).slots.filter((s) => s.waveform.kind === 'sample').length;
      expect(sampleSlots, program).toBe(sampleDeps);
    }
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
