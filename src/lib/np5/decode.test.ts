import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNp5 } from './decode';

const FIXTURE_DIR = join(__dirname, '../../../fixtures/piano-5');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter(f => f.endsWith('.np5p'));

describe('decodeNp5', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNp5(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 1.01 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNp5(load(name)).version, name).toBe('1.01');
    }
  });

  it('exposes correctly-sized raw clusters', () => {
    const prog = decodeNp5(load(fixtures()[0]));
    expect(prog._programHeader).toHaveLength(3);
    expect(prog._primaryParams).toHaveLength(15);
    expect(prog.soundSlotLayerA._raw).toHaveLength(9);
    expect(prog.soundSlotLayerB._raw).toHaveLength(9);
    expect(prog.fxSlotLayerA._raw).toHaveLength(14);
    expect(prog.fxSlotLayerB._raw).toHaveLength(14);
  });

  // ── Confirmed field: format tag ──────────────────────────────────────────────

  it('reads the confirmed NP5 format tag 0x0c65 from every fixture', () => {
    for (const name of fixtures()) {
      expect(decodeNp5(load(name)).formatTag, name).toBe(0x0c65);
    }
  });

  // ── Confirmed field: layer B active ─────────────────────────────────────────

  it('flags layerBActive=true for confirmed dual-layer patches', () => {
    const dualLayer = [
      'BUNDLE__Grand_EP_Bass_JA.np5p',
      'BUNDLE__Harp_Piano_JA.np5p',
      'BUNDLE__PianoSynthB_JA.np5p',
      'BUNDLE__Shimmer_Piano_JA.np5p',
    ];
    for (const name of dualLayer) {
      expect(decodeNp5(load(name)).layerBActive, name).toBe(true);
    }
  });

  it('flags layerBActive=false for single-layer patches', () => {
    const singleLayer = [
      'BUNDLE__EP_JA.np5p',
      'BUNDLE__FM_Tines_JA.np5p',
      'BUNDLE__Vintage_JA.np5p',
    ];
    for (const name of singleLayer) {
      expect(decodeNp5(load(name)).layerBActive, name).toBe(false);
    }
  });

  it('exactly 4 of 25 fixtures have layerBActive=true', () => {
    const all = fixtures();
    const active = all.filter(name => decodeNp5(load(name)).layerBActive);
    expect(active).toHaveLength(4);
  });

  // ── Candidate: record-type markers ───────────────────────────────────────────
  // The markers are read implicitly by the slot extractors; verify they match
  // the expected constants across the whole corpus.

  it('sound-slot record markers are 0x1f and FX-slot markers are 0x39 in every fixture', () => {
    const BODY_OFFSET = 0x2c;
    for (const name of fixtures()) {
      const bytes = load(name);
      const body = bytes.slice(BODY_OFFSET);
      expect(body[57], `${name} body[57]`).toBe(0x1f);  // layer A sound marker
      expect(body[89], `${name} body[89]`).toBe(0x1f);  // layer B sound marker
      expect(body[121], `${name} body[121]`).toBe(0x39); // layer A FX marker
      expect(body[179], `${name} body[179]`).toBe(0x39); // layer B FX marker
    }
  });
});
