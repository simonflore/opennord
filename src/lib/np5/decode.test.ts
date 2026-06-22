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
    expect(prog.soundSlotLayerA.pianoModelId).toHaveLength(4);
    expect(prog.soundSlotLayerB.pianoModelId).toHaveLength(4);
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

  // ── Confirmed field: piano model ID (Stage oracle 245-5, group p) ────────────

  const hex = (b: Uint8Array) => [...b].map(x => x.toString(16).padStart(2, '0')).join('');

  it('reads identical layer-A model IDs for the same instrument', () => {
    // EP_Flu and Wurlitzer are both classic electric pianos → same model ID.
    const epFlu = decodeNp5(load('BUNDLE__EP_Flu_JA.np5p'));
    const wurli = decodeNp5(load('BUNDLE__Wurlitzer_JA.np5p'));
    expect(hex(epFlu.soundSlotLayerA.pianoModelId)).toBe('1faf4488');
    expect(hex(wurli.soundSlotLayerA.pianoModelId)).toBe('1faf4488');
  });

  it('reads the default grand model ID 12050953 for plain piano patches', () => {
    // Default grand recurs widely; PianoSynthB:A and Shimmer_Piano:A both use it.
    const psb = decodeNp5(load('BUNDLE__PianoSynthB_JA.np5p'));
    const shimmer = decodeNp5(load('BUNDLE__Shimmer_Piano_JA.np5p'));
    expect(hex(psb.soundSlotLayerA.pianoModelId)).toBe('12050953');
    expect(hex(shimmer.soundSlotLayerA.pianoModelId)).toBe('12050953');
  });

  it('reads identical layer-B model IDs for the same EP (Stage scene II)', () => {
    // PianoSynthB:B and Shimmer_Piano:B both load the same EP model.
    const psb = decodeNp5(load('BUNDLE__PianoSynthB_JA.np5p'));
    const shimmer = decodeNp5(load('BUNDLE__Shimmer_Piano_JA.np5p'));
    expect(hex(psb.soundSlotLayerB.pianoModelId)).toBe('351f972e');
    expect(hex(shimmer.soundSlotLayerB.pianoModelId)).toBe('351f972e');
  });

  it('Vintage and Wah_Clav layer-A IDs differ only in the top byte bit', () => {
    // Evidence: the preceding sub-byte type/slot field shifts the ID by one bit.
    const vintage = decodeNp5(load('BUNDLE__Vintage_JA.np5p'));
    const wahClav = decodeNp5(load('BUNDLE__Wah_Clav_JA.np5p'));
    expect(hex(vintage.soundSlotLayerA.pianoModelId)).toBe('0832fe9d');
    expect(hex(wahClav.soundSlotLayerA.pianoModelId)).toBe('8832fe9d');
  });

  // ── Candidate field: volume (Stage oracle 230-7, group p) ────────────────────

  it('decodes the layer-A volume byte (low 7 bits + active flag)', () => {
    // Vintage default 0xbf → level 63, active flag set.
    const vintage = decodeNp5(load('BUNDLE__Vintage_JA.np5p'));
    expect(vintage.soundSlotLayerA.volume).toBe(0x3f);
    expect(vintage.soundSlotLayerA.volumeActive).toBe(true);
    // PianoSynthB layer A = 0x7e → level 126, active flag clear.
    const psb = decodeNp5(load('BUNDLE__PianoSynthB_JA.np5p'));
    expect(psb.soundSlotLayerA.volume).toBe(0x7e);
    expect(psb.soundSlotLayerA.volumeActive).toBe(false);
  });

  // ── Candidate field: FX transpose (Stage oracle 243-5, group p, tentative) ───

  it('decodes the layer-A FX transpose offset (bits 3-4 of body[134])', () => {
    // Vintage body[134] = 0x30 → offset 2; most patches = 0x20 → offset 0.
    expect(decodeNp5(load('BUNDLE__Vintage_JA.np5p')).fxSlotLayerA.transpose).toBe(2);
    expect(decodeNp5(load('BUNDLE__EP_Flu_JA.np5p')).fxSlotLayerA.transpose).toBe(0);
  });

  it('FX transpose stays within the observed 0-2 range across the corpus', () => {
    for (const name of fixtures()) {
      const t = decodeNp5(load(name)).fxSlotLayerA.transpose;
      expect(t, `${name} fxA.transpose`).toBeGreaterThanOrEqual(0);
      expect(t, `${name} fxA.transpose`).toBeLessThanOrEqual(2);
    }
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
