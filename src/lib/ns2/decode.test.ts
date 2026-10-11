/**
 * NS2 reader tests.
 *
 * 1. The byte-level tests of the earlier ns3-program-viewer-derived decoder,
 *    kept unchanged: they write raw bytes at the offsets that decoder read
 *    (checked against real files), so passing them shows the firmware layout
 *    reads the same bits.
 * 2. Synthetic records built from the program map (Stage 2 OS 3.00
 *    descriptors, layout.generated.ts): framing, morph deltas and the fixes.
 * 3. Real files under fixtures/stage-2* (gitignored; skipped when absent).
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNs2, NS2_NSM_DATA_OFFSET } from './decode';
import { NS2_LAYOUT, type Ns2FieldKey } from './layout.generated';
import { synthFwFile, synthLegacyLayoutFile, writeLegacyRecord } from '../clavia/block-chain.synth';
import { LEGACY_DATA_OFFSET } from '../clavia/legacy-record';

// Header-type-1 buffers (versionOffset 0) keep the offsets direct for tests; record version 7 at 0x2C.
const t1 = () => { const b = new Uint8Array(600); b[0x04] = 1; b[0x2d] = 7; return b; };

describe('decodeNs2', () => {
  it('selects active slots from the 0x2E flag (0=A, 1=B, 2/3=both)', () => {
    const at = (flag: number) => { const b = t1(); b[0x2e] = flag << 6; return decodeNs2(b).slots.map((s) => s.id); };
    expect(at(0)).toEqual(['A']);
    expect(at(1)).toEqual(['B']);
    expect(at(2)).toEqual(['A', 'B']);
    expect(at(3)).toEqual(['A', 'B']);
  });

  it('decodes piano on + Clavinet in slot A', () => {
    const b = t1();
    b[0x2e] = 0;        // A only
    b[0x48] = 0x80;     // piano enable (b7)
    b[0xcd] = 0x80;     // type (0xcd & 0xe0) >>> 5 = 4 → Clavinet
    expect(decodeNs2(b).slots[0].piano).toMatchObject({ on: true, type: 'Clavinet' });
  });

  it('decodes synth on + SAW oscillator', () => {
    const b = t1();
    b[0x4d] = 0x40;            // synth enable (b6)
    b[0xe1] = 0x00; b[0xe2] = 0x80; // osc (u16(0xe1) & 0x0380) >>> 7 = 1 → SAW
    expect(decodeNs2(b).slots[0].synth).toMatchObject({ on: true, osc: 'SAW' });
  });

  it('reads slot B fields shifted by 249 bytes', () => {
    const b = t1();
    b[0x2e] = 1 << 6;          // B only
    b[0x48 + 249] = 0x80;      // piano on in slot B
    b[0xcd + 249] = 0x00;      // type 0 → Grand
    const s = decodeNs2(b).slots[0];
    expect(s.id).toBe('B');
    expect(s.piano).toMatchObject({ on: true, type: 'Grand' });
  });

  it('decodes engine volume via the shared Nord dB curve', () => {
    const b = t1();
    b[0x48] = 0x80;    // piano on
    b[0x4b] = 0x7f;    // volume midi 127 → "0.0 dB"
    expect(decodeNs2(b).slots[0].piano.volume).toBe('0.0 dB');
    const z = t1(); z[0x48] = 0x80; // piano on, volume midi 0 → "Off"
    expect(decodeNs2(z).slots[0].piano.volume).toBe('Off');
  });

  it('decodes B3/Vox organ drawbars (4-bit fields from base 0x5F)', () => {
    const b = t1();
    b[0x60] = 0x00; b[0x61] = 0xe0;   // drawbar 1: (u16(0x60) & 0x01e0) >>> 5 = 7
    const dr = decodeNs2(b).slots[0].organ.drawbars;
    expect(dr).toHaveLength(9);
    expect(dr[0]).toBe(7);
    expect(dr.every((d) => d >= 0 && d <= 8)).toBe(true);
  });

  it('lists active per-slot FX with types (effect 2 + delay)', () => {
    const b = t1();
    b[0x11a] = 0x24;   // effect 2 on (0x20) + type 4 → Chorus 1
    b[0x125] = 0x20;   // delay on
    const fx = decodeNs2(b).slots[0].fx;
    expect(fx.map((f) => f.name)).toEqual(['Effect 2', 'Delay']); // signal order
    expect(fx.find((f) => f.name === 'Effect 2')?.type).toBe('Chorus 1');
  });

  it('labels amp type 0 "Clean" (Stage 2 OS 3.00 firmware), not "Off"', () => {
    const types = [0, 1, 2, 3].map((t) => {
      const b = t1();
      b[0x133] = 0x10 | t;      // amp/EQ on (b4) + type b1-0
      return decodeNs2(b).slots[0].fx.find((f) => f.name === 'Amp/EQ')?.type;
    });
    expect(types).toEqual(['Clean', 'Small', 'JC', 'Twin']);
  });

  it('decodes piano sampleId (0 = program init) and clavinet variation', () => {
    const b = t1();
    b[0x48] = 0x80;      // piano on
    b[0xcf] = 0x80;      // clav variation: (u16(0xce) & 0x0180) >>> 7 = 1
    const p = decodeNs2(b).slots[0].piano;
    expect(p.sampleId).toBe(0);    // empty sample field → program-init id 0
    expect(p.clavVariation).toBe(1);
  });

  it('decodes program-global reverb (+ type) and compressor', () => {
    const b = t1();
    b[0x3d] = 0xc0;   // reverb on (0x8000) + type 4 → Hall 1
    b[0x3e] = 0x10;   // compressor on (0x1000)
    const g = decodeNs2(b).globalFx;
    expect(g.map((x) => x.name)).toEqual(['Reverb', 'Comp']);
    expect(g[0].type).toBe('Hall 1');
  });

  it('reads B3 organ drawbars from preset 2 when active (0x5C.b7)', () => {
    const b = t1();
    b[0x5c] = 0x80;   // preset 2 enabled (B3, type 0)
    b[0x98] = 0xe0;   // preset-2 drawbar 1 @0x96 → 7
    b[0x61] = 0x20;   // preset-1 drawbar 1 @0x5F → 1 (proves we don't read preset 1)
    expect(decodeNs2(b).slots[0].organ.drawbars[0]).toBe(7);
  });

  it('decodes B3 organ vibrato/chorus + percussion (preset 1)', () => {
    const b = t1();
    b[0x35] = 0x40;   // vib mode (0x35 & 0xe0) >>> 5 = 2 → V2; soft = !(0x35 & 0x04) = true
    b[0x74] = 0x18;   // vib on (0x10) + percussion on (0x08)
    const org = decodeNs2(b).slots[0].organ;
    expect(org.vibChorus).toEqual({ on: true, mode: 'V2' });
    expect(org.percussion).toMatchObject({ on: true, soft: true, third: false, fast: false });
  });

  it('applies versionOffset -20 for the legacy header (0x04 ≠ 1)', () => {
    const b = new Uint8Array(600); // 0x04 = 0 → legacy → all body offsets -20
    b[0x2e - 20] = 0;          // slot flag → A only
    b[0x48 - 20] = 0x80;       // piano on
    b[0xcd - 20] = 0x00;       // Grand
    expect(decodeNs2(b).slots[0].piano).toMatchObject({ on: true, type: 'Grand' });
  });
});

// ── Firmware layout ──────────────────────────────────────────────────────────

type Values = Partial<Record<Ns2FieldKey, number>>;
const field = (key: Ns2FieldKey) => NS2_LAYOUT.fields.find((f) => f.key === key)!;
/** The NSM-era file byte and MSB-first bit a field starts at. */
const at = (key: Ns2FieldKey) => {
  const bit = NS2_NSM_DATA_OFFSET * 8 + field(key).bit;
  return [bit >> 3, bit & 7];
};

function record(values: Values = {}): Uint8Array {
  const data = new Uint8Array(NS2_LAYOUT.dataBytes);
  writeLegacyRecord(data, NS2_LAYOUT, values);
  return data;
}
/** An NSM-era file: 0x2C-byte header (record version at 0x14 too), u16 BE record version, data; no trailer. */
function nsmFile(values: Values = {}, version = 7): Uint8Array {
  const body = new Uint8Array(2 + NS2_LAYOUT.dataBytes);
  body[0] = version >> 8; body[1] = version & 0xff;
  body.set(record(values), 2);
  return synthFwFile('ns2p', body, version);
}
/** A legacy (formatType 0) file: record version at 0x14 and (u16 BE) at 0x18, data at 0x1A. */
const legacyFile = (values: Values = {}, version = 7) => synthLegacyLayoutFile('ns2p', NS2_LAYOUT, values, { version });

describe('NS2 firmware layout', () => {
  it('is 519 bytes of data: 21 global, then two 249-byte slots, version 7', () => {
    expect(NS2_LAYOUT).toMatchObject({ dataBytes: 519, recordVersion: 7 });
    const slotA = NS2_LAYOUT.fields.filter((f) => f.key.startsWith('slotA_'));
    const global = NS2_LAYOUT.fields.filter((f) => !/^slot[AB]_/.test(f.key));
    expect(Math.max(...global.map((f) => f.bit + f.width))).toBeLessThanOrEqual(21 * 8);
    expect(Math.min(...slotA.map((f) => f.bit))).toBeGreaterThanOrEqual(21 * 8);
    // Slot B repeats every slot A field 249 bytes later.
    for (const a of slotA) {
      const b = field(a.key.replace('slotA_', 'slotB_') as Ns2FieldKey);
      expect(b, a.key).toMatchObject({ bit: a.bit + 249 * 8, width: a.width, min: a.min, max: a.max, def: a.def });
    }
    expect(NS2_LAYOUT.fields.filter((f) => f.key.startsWith('slotB_'))).toHaveLength(slotA.length);
    // The real file sizes: NSM-era 0x2E + 519 = 565 (no trailer), legacy 0x1A + 519 + 2 = 547.
    expect(NS2_NSM_DATA_OFFSET + NS2_LAYOUT.dataBytes).toBe(565);
    expect(LEGACY_DATA_OFFSET + NS2_LAYOUT.dataBytes + 2).toBe(547);
    expect(nsmFile()).toHaveLength(565);
    expect(legacyFile()).toHaveLength(547);
  });

  it('stores parameters raw, morph deltas one bit wider in two\'s complement just before them, without overlaps', () => {
    const used = new Set<number>();
    for (const f of NS2_LAYOUT.fields) {
      for (let b = f.bit; b < f.bit + f.width; b++) { expect(used.has(b), f.key).toBe(false); used.add(b); }
      if (!f.deltaOf) { expect([f.enc, f.min], f.key).toEqual(['u', 0]); continue; }
      const base = field(f.deltaOf);
      expect(f, f.key).toMatchObject({ enc: 'twos', width: base.width + 1, min: -base.max, max: base.max, def: 0 });
    }
    const deltas = NS2_LAYOUT.fields.filter((f) => f.deltaOf === 'slotA_common.organLevel');
    expect(deltas.map((f) => f.key)).toEqual([
      'slotA_common.organLevel.morphWheel', 'slotA_common.organLevel.morphAfterTouch', 'slotA_common.organLevel.morphCtrlPedal',
    ]);
    expect(deltas.map((f) => f.bit)).toEqual([169, 177, 185]);
    expect(field('slotA_common.organLevel').bit).toBe(193);
    // Every morphable parameter has exactly three deltas (Wheel, After Touch, Ctrl Pedal).
    const perParam = new Map<string, number>();
    for (const f of NS2_LAYOUT.fields) if (f.deltaOf) perParam.set(f.deltaOf, (perParam.get(f.deltaOf) ?? 0) + 1);
    expect([...perParam.values()].every((n) => n === 3)).toBe(true);
    expect(perParam.size).toBe(2 * 73);
  });

  it('puts the fields at the file offsets the earlier decoder read from real files', () => {
    expect(at('programCommon.param0')).toEqual([0x2e, 0]);   // slot select (0x2E & 0xC0)
    expect(at('programCommon.param2')).toEqual([0x2e, 2]);   // dual (0x2E & 0x20)
    expect(at('organCommon.organModel')).toEqual([0x34, 0]);
    expect(at('b3Common.b3VibratoType')).toEqual([0x35, 0]);
    expect(at('pianoCommon.pianoSlotDetune')).toEqual([0x3b, 0]);
    expect(at('globalFx.reverbEnable')).toEqual([0x3d, 0]);
    expect(at('globalFx.rotarySpeakerEnable')).toEqual([0x3f, 3]);
    expect(at('slotA_common.organEnable')).toEqual([0x43, 0]);
    expect(at('slotA_b3PresetI.b3Sub')).toEqual([0x60, 7]);  // B3 preset 1 base 0x5F
    expect(at('slotA_voxPresetII.vox16Foot')).toEqual([0xae, 7]); // Vox preset 2 base 0xAD
    expect(at('slotA_piano.param0')).toEqual([0xcd, 0]);
    expect(at('slotA_synth.param4')).toEqual([0xe1, 6]);     // oscillator
    expect(at('slotA_effects.effect1Enable')).toEqual([0x10f, 2]);
    expect(at('slotA_effects.ampSimEqEnable')).toEqual([0x133, 3]);
    expect(at('slotB_common.organEnable')).toEqual([0x43 + 249, 0]);
  });
});

describe('decodeNs2 (synthetic, firmware layout)', () => {
  it('reads the same values behind the NSM-era header (0x2E) and the legacy one (0x1A)', () => {
    const v: Values = { 'slotA_common.synthEnable': 1, 'slotA_synth.filterFrequency': 90, 'slotA_synth.param4': 1, 'globalFx.reverbEnable': 1 };
    const nsm = decodeNs2(nsmFile(v));
    const legacy = decodeNs2(legacyFile(v));
    expect(nsm.dataOffset).toBe(0x2e);
    expect(legacy.dataOffset).toBe(0x1a);
    expect(nsm.values).toEqual(legacy.values);
    expect(nsm.recordVersion).toBe(7);
    expect(legacy.recordVersion).toBe(7);
    expect(nsm.warnings).toEqual([]);
    expect(legacy.warnings).toEqual([]);
    expect(nsm.outOfRange).toEqual([]);
    expect(nsm.slots[0].synth).toMatchObject({ on: true, osc: 'SAW', filter: { freqMidi: 90 } });
    expect(nsm.globalFx.map((f) => f.name)).toEqual(['Reverb']);
  });

  it('decodes the descriptor defaults: slot A, piano on at full level, B3 888000000', () => {
    const p = decodeNs2(nsmFile());
    expect(p.slots.map((s) => s.id)).toEqual(['A']);
    const s = p.slots[0];
    expect(s.piano).toMatchObject({ on: true, volumeMidi: 127, volume: '0.0 dB', octaveShift: 0, sustainPedal: true });
    expect(s.organ).toMatchObject({ on: false, type: 'B3', drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0], preset2: false });
    expect(s.organ.vibChorus.mode).toBe('C3'); // B3 vibrato type default 5
    expect(s.synth).toMatchObject({ on: false, volumeMidi: 127 });
    expect(Object.keys(p.values)).toHaveLength(NS2_LAYOUT.fields.length);
  });

  it('selects slots from program common (0 = A, 1 = B, 2/3 = both, dual = both)', () => {
    const ids = (v: Values) => decodeNs2(nsmFile(v)).slots.map((s) => s.id);
    expect(ids({})).toEqual(['A']);
    expect(ids({ 'programCommon.param1': 1 })).toEqual(['B']);
    expect(ids({ 'programCommon.param0': 1 })).toEqual(['A', 'B']);
    expect(ids({ 'programCommon.param1': 1, 'programCommon.param2': 1 })).toEqual(['A', 'B']);
  });

  it('groups the inline morph deltas under their parameter: Wheel, After Touch, Ctrl Pedal', () => {
    const p = decodeNs2(nsmFile({
      'slotA_common.organLevel': 100,
      'slotA_common.organLevel.morphWheel': 20,
      'slotA_common.organLevel.morphAfterTouch': -27,
      'slotB_synth.filterFrequency.morphCtrlPedal': -127,
    }));
    expect(p.morphDeltas['slotA_common.organLevel']).toEqual([20, -27, 0]);
    expect(p.morphDeltas['slotB_synth.filterFrequency']).toEqual([0, 0, -127]);
    expect(p.morphDeltas['slotA_b3PresetI.b3Sub']).toEqual([0, 0, 0]);
    expect(p.slots[0].organ.volumeMidi).toBe(100); // the deltas don't disturb the value
    expect(Object.keys(p.morphDeltas)).toHaveLength(2 * 73);
  });

  it('reads both organ presets per model, the active one first', () => {
    const p = decodeNs2(nsmFile({
      'organCommon.organModel': 1, // Vox
      'slotA_voxSelect.voxPreset': 1,
      'slotA_voxPresetI.vox16Foot': 3,
      'slotA_voxPresetII.vox16Foot': 6, 'slotA_voxPresetII.voxTri': 8,
      'voxCommon.voxVibrato': 1, 'voxCommon.voxVibratoType': 2,
    }));
    const o = p.slots[0].organ;
    expect(o).toMatchObject({ type: 'Vox', preset2: true, vibChorus: { on: true, mode: 'Original (V3)' } });
    expect(o.drawbars).toEqual([6, 8, 8, 8, 0, 0, 0, 8, 8]); // Vox defaults 16' 8' 4' 2' and sine at 8
    expect(o.drawbars2).toEqual([3, 8, 8, 8, 0, 0, 0, 8, 0]);
    const f = decodeNs2(nsmFile({ 'organCommon.organModel': 2, 'slotA_farfPresetI.farfisa223': 0 })).slots[0].organ;
    expect(f).toMatchObject({ type: 'Farfisa', drawbars: [1, 1, 1, 1, 1, 1, 1, 1, 0] });
  });

  it('builds the 32-bit sample references from their three descriptors', () => {
    const raw = 0x80001234 + 1; // ns2 form of NS3 id 0x1234: b31 set, plus one
    const p = decodeNs2(nsmFile({
      'slotA_piano.param9': Math.floor(raw / 2 ** 17), 'slotA_piano.param10': (raw >>> 2) & 0x7fff, 'slotA_piano.param11': raw & 3,
      'slotA_synth.param22': Math.floor(raw / 2 ** 17), 'slotA_synth.param23': (raw >>> 2) & 0x7fff, 'slotA_synth.param24': raw & 3,
    }));
    expect(p.slots[0].piano.sampleId).toBe(0x1234);
    expect(p.slots[0].synth.sampleId).toBe(0x1234);
  });

  it('flags a short file and an older or newer record version, and never throws', () => {
    expect(decodeNs2(nsmFile().slice(0, 0x2e + 100)).warnings[0]).toMatch(/shorter than a Stage 2 program.*expected 565/);
    expect(decodeNs2(legacyFile().slice(0, 546)).warnings[0]).toMatch(/expected 547/);
    expect(decodeNs2(legacyFile({}, 5)).warnings[0]).toMatch(/older Stage 2 OS/);
    expect(decodeNs2(nsmFile({}, 8)).warnings[0]).toMatch(/newer Stage 2 format/);
    expect(() => decodeNs2(new Uint8Array(3))).not.toThrow();
    expect(decodeNs2(new Uint8Array(0)).slots.length).toBeGreaterThan(0);
  });
});

describe('decodeNs2 — fixes against the earlier decoder', () => {
  it('reads the piano slot detune once, program-wide (slot B read 0x3B + 249: slot A Amp/EQ drive)', () => {
    const p = decodeNs2(nsmFile({ 'programCommon.param0': 1, 'pianoCommon.pianoSlotDetune': 2, 'slotA_effects.ampSimEqDrive': 127 }));
    expect(p.slots.map((s) => s.piano.slotDetune)).toEqual(['2', '2']);
  });

  it('reports the rotary speaker once, as a program effect (slot B read slot A padding)', () => {
    const p = decodeNs2(nsmFile({
      'programCommon.param0': 1,
      'globalFx.rotarySpeakerEnable': 1, 'globalFx.rotarySpeakerSource': 0, 'globalFx.rotarySpeakerDrive': 127, 'globalFx.param9': 1,
      'globalFx.reverbEnable': 1,
    }));
    expect(p.rotary).toEqual({ on: true, source: 'Organ', driveMidi: 127, stopMode: false, speed: 'Fast' });
    expect(p.globalFx.map((f) => f.name)).toEqual(['Rotary', 'Reverb']);
    expect(p.globalFx[0]).toMatchObject({ source: 'Organ', params: { drive: '10.0', speed: 'Fast' } });
    for (const s of p.slots) expect(s.fx.map((f) => f.name)).not.toContain('Rotary');
  });

  it('reads whole fields: outputs (3 bits), Vox/Farfisa vibrato type (3), arp rate (8), Clavinet model (7)', () => {
    const p = decodeNs2(nsmFile({
      'slotA_common.param27': 4, 'slotA_common.param25': 3, 'slotA_common.param26': 2,
      'organCommon.organModel': 1, 'voxCommon.voxVibratoType': 4,
      'slotA_arpLfo.arpeggiatorRate': 200,
      'slotA_piano.param3': 5,
    }));
    const s = p.slots[0];
    // The earlier decoder read the low 2 bits: '1', 'Less (V1)', 72 and 'B'.
    expect(s.organ.output).toBe('#4');
    expect(s.piano.output).toBe('Off');
    expect(s.synth.output).toBe('2');
    expect(s.organ.vibChorus.mode).toBe('#4');
    expect(s.synth.arpRateMidi).toBe(200);
    expect(s.piano).toMatchObject({ clavVariation: 5, clavinetModel: '#5' });
    // Values outside the descriptor range are flagged (the Nord loads its default).
    expect(p.outOfRange).toEqual(expect.arrayContaining([
      'slotA_common.param27', 'voxCommon.voxVibratoType', 'slotA_arpLfo.arpeggiatorRate',
    ]));
    expect(p.outOfRange).not.toContain('slotA_piano.param3');
  });

  it('labels envelope decay/release 59 as 1.05 s (the viewer\'s table says "1050 s")', () => {
    const { modEnv, ampEnv } = decodeNs2(nsmFile({
      'slotA_synth.modEnvelopeDecay': 59, 'slotA_synth.modEnvelopeRelease': 58,
      'slotA_synth.ampEnvelopeDecay': 60, 'slotA_synth.ampEnvelopeRelease': 59,
    })).slots[0].synth;
    expect([modEnv.decay, modEnv.release, ampEnv.decay, ampEnv.release]).toEqual(['1.05 s', '983 ms', '1.13 s', '1.05 s']);
  });

  it('reads long release and string resonance from the one 2-bit Acoustic field', () => {
    const acoustic = (v: number) => {
      const { longRelease, stringResonance } = decodeNs2(nsmFile({ 'slotA_piano.pianoAcoustic': v })).slots[0].piano;
      return [longRelease, stringResonance];
    };
    expect([0, 1, 2, 3].map(acoustic)).toEqual([[false, false], [false, true], [true, false], [true, true]]);
  });
});

// ── Real files (gitignored) ──────────────────────────────────────────────────

const FIXTURES = join(process.cwd(), 'fixtures');
function ns2Files(): string[] {
  if (!existsSync(FIXTURES)) return [];
  const out: string[] = [];
  for (const dir of readdirSync(FIXTURES).filter((d) => d.startsWith('stage-2'))) {
    const walk = (p: string) => {
      for (const e of readdirSync(p)) {
        const q = join(p, e);
        if (statSync(q).isDirectory()) walk(q);
        else if (/\.ns2p$/i.test(e)) out.push(q);
      }
    };
    walk(join(FIXTURES, dir));
  }
  return out;
}

// ns3-program-viewer's public test corpus (489 .ns2p, kept local) passed all of
// these when the reader was written: 488 NSM-era 565-byte files at version 7 and
// one legacy 547-byte file at version 6, no value out of range, the same slot
// values as the earlier decoder except the slot B detune fix, and morph deltas
// that land on every target the file names assert.
describe.skipIf(ns2Files().length === 0)('decodeNs2 (fixtures)', () => {
  it('every real program is one whole record behind its header, with every value in range', () => {
    for (const path of ns2Files()) {
      const bytes = new Uint8Array(readFileSync(path));
      const p = decodeNs2(bytes);
      expect(bytes.length, path).toBe(p.dataOffset === NS2_NSM_DATA_OFFSET ? 565 : 547);
      expect(p.warnings.filter((w) => /shorter/.test(w)), path).toEqual([]);
      expect(p.outOfRange, path).toEqual([]);
      expect(p.slots.length, path).toBeGreaterThan(0);
      expect(p.recordVersion, path).toBeGreaterThan(0);
      expect(p.recordVersion, path).toBeLessThanOrEqual(7);
    }
  });
});
