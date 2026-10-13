/**
 * NW2 decoder tests.
 *
 * 1. Synthetic bodies built from the program map (Wave 2 OS 1.24 registry
 *, via layout.generated.ts) — always run.
 * 2. Cross-checks against the 26 real .nw2p fixtures (gitignored; skipped when
 *    absent). Expectations that encoded the corpus-only reading (slots at
 *    0/244/488/732, a per-slot "on/volume" head, "drawbars", the 0xfe/0xff
 *    "oscFlag", the 68-byte "global tail") are dropped or restated in the
 *    firmware's terms; the bundle meta.xml sample-slot cross-check is kept.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { describe, it, expect } from 'vitest';
import {
  decodeNw2, NW2_SLOTS, nw2ImpulseTarget, nw2MorphSources, nw2SlotEnabled, nw2SlotMorphs, nw2SlotSource,
} from './decode';
import { nw2Decoded } from './present';
import { NW2_LAYOUT, type Nw2FieldKey } from './layout.generated';
import { synthFwBody, synthFwFile } from '../clavia/block-chain.synth';
import { readBits } from '../clavia/bitstream';
import { parseBundleDeps } from '../contribute/bundle-deps';

const file = (values: Partial<Record<Nw2FieldKey, number>> = {}) =>
  synthFwFile('nw2p', synthFwBody(NW2_LAYOUT, values, 301), 301);

/** Absolute body bit of a field's first bit. */
function bodyBit(key: Nw2FieldKey): number {
  const f = NW2_LAYOUT.fields.find((x) => x.key === key)!;
  return (NW2_LAYOUT.blocks[f.block].offset + 1) * 8 + f.bit;
}

describe('NW2 firmware layout', () => {
  it('chains MultiCommon (63) + four 244-byte slots of ten blocks to the 1044-byte body end', () => {
    expect(NW2_LAYOUT.blocks[0]).toMatchObject({ name: 'MultiCommon', offset: 4, length: 63 });
    expect(NW2_LAYOUT.blocks).toHaveLength(41);
    expect(NW2_LAYOUT.bodyBytes).toBe(1044);
    for (let k = 0; k < 4; k++) expect(NW2_LAYOUT.blocks[1 + 10 * k].offset).toBe(68 + 244 * k);
  });

  it('repeats slot A exactly in slots B-D, 244 bytes apart', () => {
    const slotFields = (s: string) => NW2_LAYOUT.fields.filter((f) => f.key.startsWith(`slot${s}`));
    const a = slotFields('A');
    NW2_SLOTS.forEach((s, k) => {
      const fields = slotFields(s);
      expect(fields.map((f) => [f.name, f.width, f.min, f.max, f.def]), s).toEqual(a.map((f) => [f.name, f.width, f.min, f.max, f.def]));
      fields.forEach((f, i) => expect(bodyBit(f.key), f.key).toBe(bodyBit(a[i].key) + 244 * 8 * k));
    });
  });

  it('places OscBank / OscWave / GatePtnDur at the old corpus anchors', () => {
    expect(bodyBit('slotACommon.oscBank')).toBe(77 * 8 + 7); // 77 b0: the 0xfe/0xff byte's low bit
    expect(bodyBit('slotACommon.oscWave')).toBe(78 * 8 + 2); // 78 b5 … 80 b6
    expect(bodyBit('slotAArp.gatePtnDur')).toBe(143 * 8 + 2); // the old "drawbars"
  });

  it('reads every morph buffer inline after its base value, one bit wider', () => {
    expect(NW2_LAYOUT.fields).toHaveLength(1196);
    // GlideRate (7 bits at 72 b7) is followed by its five 8-bit buffers before Osc Bank (77 b0).
    const glide = bodyBit('slotACommon.glideRate');
    expect(['morphImpulse', 'morphWheel', 'morphPedal', 'morphAfterTouch', 'morphVelocity']
      .map((m) => bodyBit(`slotACommon.glideRate.${m}` as Nw2FieldKey))).toEqual([0, 1, 2, 3, 4].map((i) => glide + 7 + 8 * i));
    expect(glide + 7 + 5 * 8).toBe(bodyBit('slotACommon.oscBank'));
    for (const f of NW2_LAYOUT.fields) {
      const m = /^(.*)\.morph(\w+)$/.exec(f.key);
      if (!m) continue;
      const base = NW2_LAYOUT.fields.find((g) => g.key === m[1])!;
      const span = base.max - base.min;
      expect(f.width, f.key).toBe(base.width + 1);
      // Impulse: an unsigned target (0 = off); the others: deltas stored as delta + span.
      expect([f.enc, f.min, f.max], f.key).toEqual(m[2] === 'Impulse' ? ['u', 0, span + 1] : ['offset', -span, span]);
    }
    // Kind 6 parameters carry all five buffers, kind 2 the Impulse buffer only.
    const count = (suffix: string) => NW2_LAYOUT.fields.filter((f) => f.key.startsWith('slotA') && f.key.endsWith(suffix)).length;
    expect([count('.morphImpulse'), count('.morphWheel'), count('.morphVelocity')]).toEqual([63, 29, 29]);
  });
});

describe('decodeNw2 (synthetic, firmware layout)', () => {
  it('decodes a default body cleanly', () => {
    const p = decodeNw2(file());
    expect(p).toMatchObject({ format: 'nw2p', layoutMatched: true, formatVersion: 301, version: '3.01' });
    expect(p.warnings).toEqual([]);
    expect(Array.from(p._rawBody.slice(0, 5))).toEqual([0x00, 0x00, 0x01, 0x2d, 0x3f]);
    expect(NW2_SLOTS.map((s) => nw2SlotEnabled(p, s))).toEqual([true, false, false, false]); // SlotEnable default 1
  });

  it('reads slot enable / level and pan from MultiCommon, with negative pans as two\'s complement', () => {
    const p = decodeNw2(file({
      'common.slotEnable': 0b1010, 'common.slotFocus': 3, 'common.slotLevelB': 90, 'common.slotPanD': -30,
      'slotCCommon.oscTuneCoarse': -24,
    }));
    expect(NW2_SLOTS.map((s) => nw2SlotEnabled(p, s))).toEqual([false, true, false, true]);
    expect(p.values).toMatchObject({ 'common.slotFocus': 3, 'common.slotLevelB': 90, 'common.slotPanD': -30, 'slotCCommon.oscTuneCoarse': -24 });
    expect(readBits(p._rawBody, bodyBit('common.slotPanD'), 7)).toBe(128 - 30); // not −30 − (−60) = 30
    expect(p.warnings).toEqual([]);
  });

  it('reads the sound source per slot at 68 + 244k', () => {
    const p = decodeNw2(file({
      'slotACommon.oscBank': 4, 'slotACommon.oscWave': 0x196,
      'slotCCommon.oscBank': 1, 'slotCCommon.oscWave': 7, 'slotCFilter.fltType': 2,
    }));
    expect(nw2SlotSource(p, 'A')).toEqual({ bank: 4, kind: 'sample', wave: 0x196 });
    expect(nw2SlotSource(p, 'C')).toEqual({ bank: 1, kind: 'oscillator', wave: 7 });
    expect(p.values['slotCFilter.fltType']).toBe(2);
    // The old corpus reader saw bank 4 as 0xff at body 77+244k and the index in 78-80.
    const body = p._rawBody;
    expect(body[77] & 1).toBe(1);
    expect((((body[78] << 8) | body[79]) << 2) | (body[80] >> 6)).toBe(0x196);
    expect(body[77 + 488] & 1).toBe(0);
  });

  it('reads morphs: Impulse targets (stored target − min + 1) and continuous deltas (stored delta + span)', () => {
    const p = decodeNw2(file({
      'slotAFilter.fltFreq': 60, 'slotAFilter.fltFreq.morphImpulse': 101, 'slotAFilter.fltFreq.morphWheel': -40,
      'slotAFilter.fltFreq.morphVelocity': 127,
      'common.slotPanA': -10, 'common.slotPanA.morphImpulse': 1,
      'slotBFilter.fltFreq.morphPedal': 5,
    }));
    expect(p.warnings).toEqual([]);
    expect(readBits(p._rawBody, bodyBit('slotAFilter.fltFreq.morphWheel'), 8)).toBe(-40 + 127);
    expect(readBits(p._rawBody, bodyBit('slotAFilter.fltFreq.morphImpulse'), 8)).toBe(101);
    expect(nw2ImpulseTarget(p, 'slotAFilter.fltFreq')).toBe(100);
    expect(nw2ImpulseTarget(p, 'common.slotPanA')).toBe(-60); // stored 1 = the range minimum
    expect(nw2ImpulseTarget(p, 'slotBFilter.fltFreq')).toBeUndefined(); // stored 0 = no Impulse morph
    expect(nw2MorphSources(p, 'slotAFilter.fltFreq')).toEqual(['Impulse', 'Wheel', 'Velocity']);
    expect([...nw2SlotMorphs(p, 'A').keys()]).toEqual(['common.slotPanA', 'slotAFilter.fltFreq']);
    expect([...nw2SlotMorphs(p, 'B').entries()]).toEqual([['slotBFilter.fltFreq', ['Pedal']]]);
  });

  it('a broken chain or a truncated file → header-only with a warning', () => {
    const bytes = file();
    bytes[0x2c + 68 + 244] = 0;
    expect(decodeNw2(bytes).layoutMatched).toBe(false);
    expect(decodeNw2(new Uint8Array(5)).warnings.length).toBeGreaterThan(0);
    expect(nw2Decoded(new Uint8Array(5)).sections).toEqual([]);
    expect(nw2SlotSource(decodeNw2(new Uint8Array(5)), 'A')).toBeUndefined();
  });

  it('presents slots A-D with source, level, on/off, filter and effects', () => {
    const d = nw2Decoded(file({
      'common.slotEnable': 0b0011, 'common.slotLevelB': 100,
      'slotBCommon.oscBank': 4, 'slotBFx.fxEnable': 1, 'slotBFx.fxType': 2, 'slotBReverb.rvbEnable': 1,
      'slotBFilter.fltFreq.morphWheel': 20, 'slotBAmpEnv.ampEnvRls.morphImpulse': 3, 'common.slotLevelB.morphVelocity': -9,
    }));
    expect(d.sections.map((s) => s.label)).toEqual(['SLOT A', 'SLOT B', 'SLOT C', 'SLOT D', 'EFFECTS']);
    const [, b, c] = d.sections;
    expect(b.engines.map((e) => [e.label, e.parts])).toEqual([
      ['Voice', ['Sample', 'level 100']], ['Filter', ['LP24']],
      ['Morph', ['3 controls', 'Impulse', 'Wheel', 'Velocity']],
    ]);
    // The effects card has a row for each slot that is on (A and B here), in panel order.
    const fxCard = d.sections.find((s) => s.id === 'FX')!;
    expect(fxCard.fx!.groups.map((g) => g.label)).toEqual(['Slot A', 'Slot B']);
    const slotB = fxCard.fx!.groups[1].units;
    expect(slotB.map((u) => u.label)).toEqual(['Effect', 'EQ', 'Delay', 'Reverb']);
    expect(slotB.filter((u) => u.on).map((u) => [u.label, u.type])).toEqual([['Effect', 'Phaser'], ['Reverb', 'Stage']]);
    expect(c.engines[0].parts).toEqual(['Oscillator', 'level 127', '(off)']);
    expect(c.engines.at(-1)).toEqual({ label: 'Morph', parts: ['none'] });
    // No slot card carries an Effects line any more; slot C is off, so it has no effects row either.
    expect(c.engines.map((e) => e.label)).toEqual(['Voice', 'Filter', 'Morph']);
  });
});

const FIXTURE_DIR = join(__dirname, '../../../fixtures/wave-2');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.nw2p'));

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNw2 (fixtures)', () => {
  it('decodes every fixture without warnings', () => {
    for (const name of fixtures()) {
      const prog = decodeNw2(load(name));
      expect(prog.layoutMatched, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 3.01 (CBIN and body u32) from all fixtures', () => {
    for (const name of fixtures()) {
      const prog = decodeNw2(load(name));
      expect(prog.version, name).toBe('3.01');
      expect(prog.formatVersion, name).toBe(301);
    }
  });

  it('every fixture has at least one enabled slot', () => {
    for (const name of fixtures()) {
      const p = decodeNw2(load(name));
      expect(NW2_SLOTS.some((s) => nw2SlotEnabled(p, s)), name).toBe(true);
    }
  });

  // CONFIRMED (bundle meta.xml, dep0 = Men+Women Mm choir sample): Choir's slot A
  // is a sample slot at sample-list position 0x196 (was `sampleIndex`).
  it('Choir slot A is a sample slot at OscWave 0x196', () => {
    expect(nw2SlotSource(decodeNw2(load('EF__Program_Bank O_Choir.nw2p')), 'A')).toMatchObject({ kind: 'sample', wave: 0x196 });
  });

  // CONFIRMED (meta.xml depCnt=0): Eli Bass 6 is a pure oscillator program.
  it('Eli Bass 6 slot A is an oscillator slot', () => {
    expect(nw2SlotSource(decodeNw2(load('EF__Program_Bank O_Eli    Bass 6.nw2p')), 'A')?.kind).toBe('oscillator');
  });

  // The old "waveformId" anchor was body byte 79+244k = OscWave bits 9..2.
  it('Sine Pad: all four slots are oscillators with OscWave bits 9..2 = 0 (Sine anchor)', () => {
    const p = decodeNw2(load('EF__Program_Bank O_Sine Pad.nw2p'));
    for (const s of NW2_SLOTS) {
      const src = nw2SlotSource(p, s)!;
      expect(src.kind, s).toBe('oscillator');
      expect((src.wave >> 2) & 0xff, s).toBe(0);
    }
  });

  it('Drip / Infinity EP / Infinity EP 2 share the Wurlitzer sample position 0x51f', () => {
    for (const name of ['Drip', 'Infinity EP', 'Infinity EP 2']) {
      const src = nw2SlotSource(decodeNw2(load(`EF__Program_Bank O_${name}.nw2p`)), 'A');
      expect(src, name).toMatchObject({ kind: 'sample', wave: 0x51f });
    }
  });

  // Ground-truth regression: for every program listed in the bundle's meta.xml,
  // the number of sample slots equals the declared sample-dependency count.
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
      const p = decodeNw2(load(fixture));
      const sampleSlots = NW2_SLOTS.filter((s) => nw2SlotSource(p, s)?.kind === 'sample').length;
      expect(sampleSlots, program).toBe(sampleDeps);
    }
  });
});
