/**
 * NL4 decoder tests.
 *
 * 1. Synthetic records built from the firmware layout (Lead 4 OS 1.32
 *    descriptors, via layout.generated.ts) — always run.
 * 2. Cross-checks against the real .nl4s/.nl4p corpus (gitignored; skipped when
 *    absent). The old expectations on body[30]/[239]/[245]/[248] and the
 *    cluster sizes encoded the 0x2C base (18 bytes late) and are replaced by
 *    range checks against the firmware descriptors.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNl4 } from './decode';
import { NL4_LAYOUT, NL4_PERF_LAYOUT, type Nl4FieldKey } from './layout.generated';
import { synthLegacyFile, writeBits, writeLegacyRecord } from '../clavia/block-chain.synth';
import { verifyTrailerChecksum } from '../clavia/crc16';

const field = (key: Nl4FieldKey) => NL4_LAYOUT.fields.find((f) => f.key === key)!;

describe('NL4 firmware layout', () => {
  it('places the slot set, morph lists and FX set as the descriptors say', () => {
    expect(NL4_LAYOUT).toMatchObject({ dataBytes: 315, recordVersion: 8 });
    expect(NL4_PERF_LAYOUT).toMatchObject({ dataBytes: 7, recordVersion: 9 });
    expect(field('slot.octaveShift').bit).toBe(0);
    expect(field('slot.osc2NoiseFreq').bit + field('slot.osc2NoiseFreq').width).toBe(344); // then the 44-bit reserved field
    expect(field('fx.delayReverbOnOff').bit).toBe(2048);
    expect(field('fx.delayTempo')).toMatchObject({ bit: 2102, width: 14, max: 127 });
    expect(NL4_LAYOUT.morphLists).toEqual([
      { set: 'slot', countBit: 388, countWidth: 7, maxEntries: 87, entryBit: 395, paramBits: 7, sourceBits: 4, deltaBits: 8 },
      { set: 'fx', countBit: 2131, countWidth: 5, maxEntries: 24, entryBit: 2136, paramBits: 4, sourceBits: 4, deltaBits: 8 },
    ]);
  });

  it('stores every value raw with minimum 0, inside its record, without overlaps', () => {
    for (const layout of [NL4_LAYOUT, NL4_PERF_LAYOUT]) {
      const used = new Set<number>();
      for (const f of layout.fields) {
        expect(f.enc, f.key).toBe('u');
        expect(f.min, f.key).toBe(0);
        expect(f.bit + f.width, f.key).toBeLessThanOrEqual(layout.dataBytes * 8);
        for (let b = f.bit; b < f.bit + f.width; b++) { expect(used.has(b), f.key).toBe(false); used.add(b); }
      }
    }
  });
});

describe('decodeNl4 (synthetic, firmware layout)', () => {
  it('reads a program record from file 0x1A, with both morph lists', () => {
    const data = new Uint8Array(315);
    writeLegacyRecord(data, NL4_LAYOUT, { 'slot.filterType': 6, 'slot.outputLevel': 100, 'fx.delayTempo': 99 });
    writeBits(data, 388, 7, 2);
    writeBits(data, 395, 19, (50 << 12) | (3 << 8) | (0x100 - 10)); // Filter Frequency, source 3, −10
    writeBits(data, 414, 19, (53 << 12) | (8 << 8) | 20);
    writeBits(data, 2131, 5, 1);
    writeBits(data, 2136, 16, (10 << 12) | (1 << 8) | 0x7f); // FX Amount, source 1, +127
    const file = synthLegacyFile('nl4s', 8, data);

    const p = decodeNl4(file);
    expect(p.warnings).toEqual([]);
    expect(p).toMatchObject({ fileType: 'nl4s', recordVersion: 8, version: '0.08' });
    expect(file).toHaveLength(343);
    expect(verifyTrailerChecksum(file)).toBe(true);
    expect(p.checksum).toBe(file[341] | (file[342] << 8));
    const s = p.program!;
    expect(s.values).toMatchObject({ 'slot.filterType': 6, 'slot.outputLevel': 100, 'fx.delayTempo': 99 });
    expect(s.values['slot.ampEnvSustain']).toBe(127); // descriptor default
    expect(s.morphs).toEqual([
      { param: 50, key: 'slot.filterFrequency', source: 3, delta: -10 },
      { param: 53, key: 'slot.outputLevel', source: 8, delta: 20 },
    ]);
    expect(s.fxMorphs).toEqual([{ param: 10, key: 'fx.fxAmount', source: 1, delta: 127 }]);
    expect(s.outOfRange).toEqual([]);
    expect(s._raw).toHaveLength(315);
  });

  it('the old body[30] "head selector" is the top bits of the morph count', () => {
    const data = new Uint8Array(315);
    writeBits(data, 388, 7, 87);
    const file = synthLegacyFile('nl4s', 8, data);
    expect(file[0x2c + 30] & 0x0f).toBe(87 >> 3);
    expect(decodeNl4(file).program!.morphs).toHaveLength(87);
  });

  it('flags values above their descriptor max', () => {
    const data = new Uint8Array(315);
    writeLegacyRecord(data, NL4_LAYOUT, { 'fx.delayTempo': 200 });
    expect(decodeNl4(synthLegacyFile('nl4s', 8, data)).program!.outOfRange).toEqual(['fx.delayTempo']);
  });

  it('reads a performance: 7 common bytes, then slots at file 0x21 + 315k', () => {
    const data = new Uint8Array(7 + 4 * 315);
    writeLegacyRecord(data, NL4_PERF_LAYOUT, { 'perf.slotEnable': 0b0101, 'perf.param2': 270 });
    for (let k = 0; k < 4; k++) writeLegacyRecord(data, NL4_LAYOUT, { 'slot.osc1Waveform': k + 2 }, 7 + 315 * k);
    const file = synthLegacyFile('nl4p', 9, data);
    const p = decodeNl4(file);
    expect(p.warnings).toEqual([]);
    expect(p).toMatchObject({ fileType: 'nl4p', recordVersion: 9 });
    expect(p.performance).toMatchObject({ 'perf.slotEnable': 0b0101, 'perf.param2': 270 });
    expect(p.slots!.map((s) => s.values['slot.osc1Waveform'])).toEqual([2, 3, 4, 5]);
    expect(file[0x21 + 315 * 3] >> 5).toBe(2); // slot D starts with Octave Shift (default 2)
  });

  it('warns on truncated or mis-sized files, never throws', () => {
    expect(decodeNl4(new Uint8Array(5)).warnings.length).toBeGreaterThan(0);
    expect(decodeNl4(synthLegacyFile('nl4s', 8, new Uint8Array(272))).warnings.join(' ')).toContain('343');
    expect(decodeNl4(synthLegacyFile('nl4p', 9, new Uint8Array(500))).warnings.join(' ')).toContain('1295');
  });
});

const FIXTURE_DIR = join(__dirname, '../../../fixtures/lead-4');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const nl4sFiles = () => readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.nl4s'));
const nl4pFiles = () => readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.nl4p'));

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNl4 (nl4s fixtures)', () => {
  it('decodes every nl4s fixture without warnings, record version 8', () => {
    for (const name of nl4sFiles()) {
      const prog = decodeNl4(load(name));
      expect(prog.parsed, name).toBe(true);
      expect(prog.fileType, name).toBe('nl4s');
      expect(prog.recordVersion, name).toBe(8);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('every descriptor value is within its firmware range and morph counts fit their lists', () => {
    for (const name of nl4sFiles()) {
      const s = decodeNl4(load(name)).program!;
      expect(s.outOfRange, name).toEqual([]);
      expect(s.morphs.length, name).toBeLessThanOrEqual(87);
      expect(s.fxMorphs.length, name).toBeLessThanOrEqual(24);
    }
  });

  it('decodes the CBIN checksum as the LE u16 of the last two bytes', () => {
    for (const name of nl4sFiles()) {
      const file = load(name);
      expect(decodeNl4(file).checksum, name).toBe(file[file.length - 2] | (file[file.length - 1] << 8));
    }
  });
});

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNl4 (nl4p fixtures)', () => {
  it('decodes every nl4p fixture without warnings, record version 9, four slots', () => {
    for (const name of nl4pFiles()) {
      const prog = decodeNl4(load(name));
      expect(prog.fileType, name).toBe('nl4p');
      expect(prog.recordVersion, name).toBe(9);
      expect(prog.warnings, name).toHaveLength(0);
      expect(prog.slots, name).toHaveLength(4);
      for (const s of prog.slots!) expect(s.outOfRange, name).toEqual([]);
    }
  });

  it('decodes the CBIN checksum as the LE u16 of the last two bytes', () => {
    for (const name of nl4pFiles()) {
      const file = load(name);
      expect(decodeNl4(file).checksum, name).toBe(file[file.length - 2] | (file[file.length - 1] << 8));
    }
  });
});
