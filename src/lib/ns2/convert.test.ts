/**
 * Stage 2 record conversion (versions 0–6 → 7): synthetic older records → the
 * values the OS 3.00 load path makes of them (convert.ts).
 */
import { describe, it, expect } from 'vitest';
import { convertNs2, NS2_NAMELESS_SOUNDS_NOTE } from './convert';
import { decodeNs2 } from './decode';
import { NS2_LAYOUT, type Ns2FieldKey } from './layout.generated';
import { readLegacyRecord } from '../clavia/legacy-record';
import { recordEditor } from '../clavia/record-convert';
import { synthLegacyLayoutFile, writeLegacyRecord } from '../clavia/block-chain.synth';

type Values = Partial<Record<Ns2FieldKey, number>>;

function record(values: Values = {}): Uint8Array {
  const data = new Uint8Array(NS2_LAYOUT.dataBytes);
  writeLegacyRecord(data, NS2_LAYOUT, values);
  return data;
}
const read = (data: Uint8Array) => readLegacyRecord(data, NS2_LAYOUT).values;
const SYNTH = { A: 1416, B: 3408 } as const;

/** Write a version 0 synth container (the old layout, offsets within its 256 bits). */
function v0Synth(data: Uint8Array, slot: 'A' | 'B', v: {
  head?: { atk: number; mode: number; wave: number };
  shape: number; shapeDeltas: number[]; shapeModAmt: number; oscLfoAmt: number;
  freq: number; freqDeltas: number[]; fltModAmt: number; fltLfoAmt: number; fltVelAmt: number;
  kbt: number; type: number; amp: [number, number, number, number]; lfoRate: number; lfoWave: number;
  hash: number; res: number;
}): void {
  const r = recordEditor(data, NS2_LAYOUT);
  const b = SYNTH[slot];
  for (let o = 0; o < 256; o += 32) r.setBits(b + o, 32, 0);
  if (v.head) { r.setBits(b, 7, v.head.atk); r.setBits(b + 22, 3, v.head.mode); r.setBits(b + 25, 10, v.head.wave); }
  v.shapeDeltas.forEach((d, i) => r.setBits(b + 35 + 8 * i, 8, d));
  r.setBits(b + 75, 7, v.shape);
  r.setBits(b + 82, 7, v.shapeModAmt);
  r.setBits(b + 89, 7, v.oscLfoAmt);
  v.freqDeltas.forEach((d, i) => r.setBits(b + 96 + 8 * i, 8, d));
  r.setBits(b + 136, 7, v.freq);
  r.setBits(b + 143, 7, v.fltModAmt);
  r.setBits(b + 150, 7, v.fltLfoAmt);
  r.setBits(b + 157, 7, v.fltVelAmt);
  r.setBits(b + 164, 1, v.kbt);
  r.setBits(b + 165, 3, v.type);
  [168, 175, 182].forEach((o, i) => r.setBits(b + o, 7, v.amp[i]));
  r.setBits(b + 189, 1, v.amp[3]);
  r.setBits(b + 190, 7, v.lfoRate);
  r.setBits(b + 197, 2, v.lfoWave);
  r.setBits(b + 199, 32, v.hash);
  r.setBits(b + 231, 7, v.res);
}

describe('convertNs2', () => {
  it('0 → 7: rebuilds the synth container from the version 0 layout', () => {
    const data = record({ 'slotA_piano.pianoDynamics': 0 });
    v0Synth(data, 'A', {
      head: { atk: 10, mode: 3, wave: 500 },
      shape: 90, shapeDeltas: [10, -20, 30, 40, 50], shapeModAmt: 30, oscLfoAmt: 21,
      freq: 100, freqDeltas: [-5, 6, 7, 8, 9], fltModAmt: 100, fltLfoAmt: 0, fltVelAmt: 77,
      kbt: 1, type: 2, amp: [1, 2, 3, 1], lfoRate: 44, lfoWave: 1, hash: 0x12345678, res: 66,
    });
    v0Synth(data, 'B', {
      shape: 0, shapeDeltas: [], shapeModAmt: 70, oscLfoAmt: 0,
      freq: 127, freqDeltas: [], fltModAmt: 20, fltLfoAmt: 30, fltVelAmt: 77,
      kbt: 0, type: 0, amp: [0, 0, 0, 0], lfoRate: 0, lfoWave: 0, hash: 0, res: 0,
    });
    expect(convertNs2(data, 0)).toEqual([NS2_NAMELESS_SOUNDS_NOTE]);
    const v = read(data);
    expect(v).toMatchObject({
      'slotA_synth.modEnvelopeAttack': 10, 'slotA_synth.param4': 3, 'slotA_synth.param5': 500,
      'slotA_synth.oscShape': 90,
      'slotA_synth.oscShape.morphWheel': 10, 'slotA_synth.oscShape.morphAfterTouch': -20, 'slotA_synth.oscShape.morphCtrlPedal': 30,
      'slotA_synth.shapeModAmount': 63 - 10, // ≤ 64: 63 − LFO amount / 2
      // The old shape value (sic), deltas × 25 / 128 rounded down.
      'slotA_synth.oscDetune': 90,
      'slotA_synth.oscDetune.morphWheel': 1, 'slotA_synth.oscDetune.morphAfterTouch': -4, 'slotA_synth.oscDetune.morphCtrlPedal': 5,
      'slotA_synth.sampSkipAttack': 0,
      'slotA_synth.filterFrequency': 100,
      'slotA_synth.filterFrequency.morphWheel': -5, 'slotA_synth.filterFrequency.morphAfterTouch': 6,
      'slotA_synth.filterFrequency.morphCtrlPedal': 7,
      'slotA_synth.filterResonance': 66,
      // 0 → 1 puts 100 (> 64) at mod 2; 1 → 2 keeps it and zeroes mod 1.
      'slotA_synth.fltFreqMod2Amount': 100, 'slotA_synth.fltFreqMod1Amount': 0,
      'slotA_synth.fltKBTTrack': 1, 'slotA_synth.filterMode': 2,
      'slotA_synth.ampEnvelopeAttack': 1, 'slotA_synth.ampEnvelopeDecay': 2, 'slotA_synth.ampEnvelopeRelease': 3,
      'slotA_synth.ampEnvelopeVelocity': 1,
      'slotA_synth.lFORate': 44, 'slotA_synth.lFOWave': 2, // 1 → 2 moves the waveform up one
      // 3 → 4 copies the (zero) arp-container bits; 5 → 6 clears the hashes; 6 → 7 maps dynamics 0 → 1.
      'slotA_synth.glideRate': 0, 'slotA_synth.param22': 0, 'slotA_synth.param23': 0, 'slotA_synth.param24': 0,
      'slotA_piano.pianoDynamics': 1,
      // Slot B: shape-mod 70 stays; filter mod 2 = 63 − 30 / 2 = 48 and mod 1 = 77, which 1 → 2 remaps.
      'slotB_synth.shapeModAmount': 70,
      'slotB_synth.fltFreqMod1Amount': Math.floor((15 * 127) / 63),
      'slotB_synth.fltFreqMod2Amount': Math.floor((50 * 64) / 127),
      'slotB_synth.lFOWave': 1,
    });
  });

  it('1 → 2: remaps the filter-mod amounts and moves the LFO waveform up one', () => {
    const data = record({
      'slotA_synth.fltFreqMod2Amount': 10, 'slotA_synth.fltFreqMod1Amount': 127, 'slotA_synth.lFOWave': 2,
      'slotB_synth.fltFreqMod2Amount': 64, 'slotB_synth.fltFreqMod1Amount': 99,
    });
    convertNs2(data, 1);
    expect(read(data)).toMatchObject({
      'slotA_synth.fltFreqMod1Amount': Math.floor((53 * 127) / 63), 'slotA_synth.fltFreqMod2Amount': 0, 'slotA_synth.lFOWave': 3,
      'slotB_synth.fltFreqMod1Amount': 0, 'slotB_synth.fltFreqMod2Amount': 64, 'slotB_synth.lFOWave': 1,
    });
  });

  it('2 → 3: moves the organ and synth levels and their morph deltas to the new curve', () => {
    const data = record({
      'slotA_common.organLevel': 100, 'slotA_common.organLevel.morphWheel': 27,
      'slotA_common.organLevel.morphAfterTouch': -100,
      'slotA_common.synthLevel': 64, 'slotA_common.synthLevel.morphWheel': 63,
      'slotA_common.synthLevel.morphCtrlPedal': -74,
    });
    convertNs2(data, 2);
    expect(read(data)).toMatchObject({
      // F(x) = trunc(√(((x ± 0.5) / 127)² · g) · 127); delta d → F(L + d) − F(L).
      'slotA_common.organLevel': 84, 'slotA_common.organLevel.morphWheel': 23,
      'slotA_common.organLevel.morphAfterTouch': -84, 'slotA_common.organLevel.morphCtrlPedal': 0,
      'slotA_common.synthLevel': 38, 'slotA_common.synthLevel.morphWheel': 37,
      'slotA_common.synthLevel.morphCtrlPedal': -32, // F(−10) = 6, as the firmware computes it
    });
  });

  it('3 → 4: moves glide / voice / unison / vibrato from the arp container to the synth one', () => {
    const data = record({ 'slotB_piano.param9': 123 });
    const r = recordEditor(data, NS2_LAYOUT);
    const arp = (s: 'A' | 'B') => NS2_LAYOUT.fields.find((f) => f.key === `slot${s}_arpLfo.arpeggiatorRun`)!.bit - 15;
    r.setBits(arp('A'), 15, (100 << 8) | (2 << 6) | (5 << 3) | 4);
    r.setBits(arp('B'), 15, (7 << 8) | (1 << 6) | (6 << 3) | 1);
    expect(convertNs2(data, 3)).toEqual([NS2_NAMELESS_SOUNDS_NOTE]);
    expect(read(data)).toMatchObject({
      'slotA_synth.glideRate': 100, 'slotA_synth.voiceMode': 2, 'slotA_synth.unisonMode': 5, 'slotA_synth.vibratoMode': 4,
      'slotB_synth.glideRate': 7, 'slotB_synth.voiceMode': 1, 'slotB_synth.unisonMode': 6, 'slotB_synth.vibratoMode': 1,
      'slotB_piano.param9': 0, // 5 → 6
    });
  });

  it('6 → 7: piano dynamics 0, 1, 2, 3 → 1, 2, 2, 3, the sound hashes kept', () => {
    const dyn = (d: number) => {
      const data = record({ 'slotA_piano.pianoDynamics': d, 'slotA_piano.param9': 77 });
      expect(convertNs2(data, 6)).toEqual([]);
      const v = read(data);
      expect(v['slotA_piano.param9']).toBe(77);
      return v['slotA_piano.pianoDynamics'];
    };
    expect([0, 1, 2, 3].map(dyn)).toEqual([1, 2, 2, 3]);
  });

  it('decodeNs2 converts an older file by the record’s own version, and says so', () => {
    const file = synthLegacyLayoutFile('ns2p', NS2_LAYOUT, { 'slotA_piano.pianoDynamics': 2, 'slotA_piano.param9': 5 }, { version: 5 });
    const p = decodeNs2(file);
    expect(p.recordVersion).toBe(5);
    expect(p.values).toMatchObject({ 'slotA_piano.pianoDynamics': 2, 'slotA_piano.param9': 0 });
    expect(p.warnings).toEqual([expect.stringMatching(/older Stage 2 OS.*updated the same way/), NS2_NAMELESS_SOUNDS_NOTE]);
    const current = decodeNs2(synthLegacyLayoutFile('ns2p', NS2_LAYOUT, { 'slotA_piano.pianoDynamics': 2 }));
    expect(current.values['slotA_piano.pianoDynamics']).toBe(2);
    expect(current.warnings).toEqual([]);
  });
});
