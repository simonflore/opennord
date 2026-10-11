import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeNp5 } from './decode';
import { np5Decoded } from './present';
import { NP5_LAYOUT, type Np5FieldKey } from './layout.generated';
import { synthFwBody, synthFwFile, writeBits } from '../clavia/block-chain.synth';
import { CBIN_BODY_OFFSET } from '../clavia/cbin';

const file = (values: Partial<Record<Np5FieldKey, number>> = {}) =>
  synthFwFile('np5p', synthFwBody(NP5_LAYOUT, values, 101), 101);

describe('decodeNp5 (Piano 5, firmware layout OS 1.34)', () => {
  it('reads a 281-byte file (237-byte body: MultiCommon 12 · Effects 39 · PianoA/B 31 · SynthA/B 57)', () => {
    expect(NP5_LAYOUT.blocks.map((b) => [b.name, b.offset, b.length])).toEqual([
      ['MultiCommon', 4, 12], ['Effects', 17, 39], ['PianoA', 57, 31], ['PianoB', 89, 31],
      ['SynthA', 121, 57], ['SynthB', 179, 57],
    ]);
    const bytes = file();
    expect(bytes.length).toBe(281);
    const p = decodeNp5(bytes);
    expect(p).toMatchObject({ parsed: true, format: 'np5p', layoutMatched: true, formatVersion: 101, version: '1.01' });
    expect(p.warnings).toEqual([]);
  });

  it('the corpus "format tag 0x0c65" is the version low byte plus the MultiCommon length byte', () => {
    const body = file().slice(CBIN_BODY_OFFSET);
    expect([body[3], body[4]]).toEqual([0x65, 0x0c]);
    expect([body[17], body[57], body[89], body[121], body[179]]).toEqual([0x27, 0x1f, 0x1f, 0x39, 0x39]);
  });

  it('places the piano references at their firmware bits (A: bank 480, entry 483, variation 488, hash 490; B = +256)', () => {
    const body = synthFwBody(NP5_LAYOUT, {}, 101);
    writeBits(body, 480, 3, 3);
    writeBits(body, 483, 5, 17);
    writeBits(body, 488, 2, 2);
    writeBits(body, 490, 32, 550238836);
    writeBits(body, 746, 32, 1209279823);
    writeBits(body, 473, 4, 0b1111); // OctaveShift −1, two's complement
    writeBits(body, 42, 2, 0b11);    // SlotPnoEnable: both layers
    writeBits(body, 59, 2, 0b01);    // LayerDetune 1 — the old "layerBActive" bit (body[7] & 0x08)
    const p = decodeNp5(synthFwFile('np5p', body, 101));
    expect(p.values).toMatchObject({
      'pianoA.bank': 3, 'pianoA.entry': 17, 'pianoA.variation': 2, 'pianoA.nameHash': 550238836,
      'pianoB.nameHash': 1209279823, 'pianoA.octaveShift': -1, 'common.slotPnoEnable': 3, 'common.layerDetune': 1,
    });
    expect(p._rawBody[7] & 0x08).toBe(0x08);
  });

  it('round-trips the global effects and both synth layers', () => {
    const values = {
      'effects.fx1Enable': 1, 'effects.fx1Src': 5, 'effects.fx1Type': 7, 'effects.eqlTreble': -60, 'effects.eqlMidGain': 33,
      'effects.rvbType': 4, 'effects.rvbColor': 2, 'effects.dlyRate': 9999,
      'synthA.smpPos': 2599, 'synthA.smpNameHash': 0xfedcba98, 'synthA.ampEnvDcyRls': -60, 'synthA.voiceMode': 2,
      'synthB.octaveShift': 6, 'synthB.vibratoRate': 60, 'pianoB.dynComp': 3, 'common.transposeValue': -6,
    } as const;
    expect(decodeNp5(file(values)).values).toMatchObject(values);
  });

  it('odd or short files → header-only with a warning, never a throw', () => {
    const full = file();
    for (const bytes of [full.slice(0, 44), full.slice(0, 280), new Uint8Array([1, 2, 3])]) {
      const p = decodeNp5(bytes);
      expect(p.layoutMatched).toBe(false);
      expect(p.warnings.length).toBeGreaterThan(0);
    }
  });
});

describe('np5Decoded', () => {
  it('shows the enabled layers with Piano 5 labels and the global effects', () => {
    const d = np5Decoded(file({
      'common.slotPnoEnable': 0b11, 'common.slotSynEnable': 0b10,
      'pianoA.bank': 0, 'pianoA.level': 90, 'pianoB.bank': 3, 'pianoB.variation': 2, 'pianoB.octaveShift': 1,
      'synthB.level': 70,
      'effects.fx1Enable': 1, 'effects.fx1Type': 6, 'effects.spkEnable': 1, 'effects.spkType': 3,
      'effects.rvbEnable': 1, 'effects.rvbType': 0, 'effects.rvbColor': 1,
    }));
    expect(d.title).toBe('Nord Piano 5 · Program');
    expect(d.sections.map((s) => s.label)).toEqual(['PIANO A', 'PIANO B', 'SYNTH A', 'SYNTH B', 'EFFECTS']);
    const [pa, pb, sa, sb, fx] = d.sections;
    expect(pa.engines[0].parts).toEqual(['Grand', 'level 90']);
    expect(pb.engines[0].parts).toEqual(['Clavinet', 'variation 3', 'level 127', 'Oct +1']);
    expect(sa.engines[0].parts).toContain('(off)');
    expect(sb.engines[0].parts).toEqual(['Sample', 'level 70']);
    expect(fx.engines[0].parts).toEqual(['Wah-Wah', 'Amp Dist', 'Reverb Booth Dark']);
    expect(d.note).toMatch(/map of Piano 5 OS 1\.34 programs/);
  });

  it('resolves piano names through the injected table; layer B is off by default', () => {
    const d = np5Decoded(file({ 'pianoA.nameHash': 550238836, 'pianoA.bank': 3 }), (h) => (h === 550238836 ? 'Clavinet D6 6.1' : undefined));
    expect(d.sections[0].engines[0].parts.slice(0, 2)).toEqual(['Clavinet D6 6.1', 'Clavinet']);
    expect(d.sections[0].engines[0].parts).not.toContain('(off)');
    expect(d.sections[1].engines[0].parts).toContain('(off)');
    expect(d.header).toContainEqual(['Piano A sound id', '0x20cbfa74']);
  });

  it('header-only presentation for a file whose structure does not match', () => {
    const d = np5Decoded(file().slice(0, 100));
    expect(d.sections).toEqual([]);
    expect(d.warnings?.length).toBeGreaterThan(0);
  });
});

// ── Real-corpus cross-checks (gitignored fixtures; skipped when absent) ─────────

const FIXTURE_DIR = join(__dirname, '../../../fixtures/piano-5');
const load = (name: string) => new Uint8Array(readFileSync(join(FIXTURE_DIR, name)));
const fixtures = () => readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.np5p'));
const values = (n: string) => decodeNp5(load(`BUNDLE__${n}_JA.np5p`)).values;

describe.skipIf(!existsSync(FIXTURE_DIR))('decodeNp5 — fixtures', () => {
  it('decodes every fixture without warnings (the block chain tiles the 237-byte body)', () => {
    for (const name of fixtures()) {
      const prog = decodeNp5(load(name));
      expect(prog.layoutMatched, name).toBe(true);
      expect(prog.warnings, name).toHaveLength(0);
    }
  });

  it('reads version 1.01 from all fixtures', () => {
    for (const name of fixtures()) {
      expect(decodeNp5(load(name)).version, name).toBe('1.01');
    }
  });

  // The corpus decoder pinned 32-bit windows at body bit 489 (core) and 488 (byte
  // reads). The firmware NameHash is bits 490-521, Variation bits 488-489, so:
  //   hash >>> 1      === old bit-489 value & 0x7fffffff   (31 bits shared)
  //   variation       === old byte-read value >>> 30
  // and the one remaining bit (521) is the one that makes the hash resolve in
  // the piano-name table — the other candidate is in no table. Each expectation
  // below is derived that way from the previously pinned values:
  //   EP_Flu / Wurlitzer A    0x3f5e8911 → 2126320162 "Wurlitzer 2"
  //   PianoSynthB / Shimmer A 0x240a12a7 → 1209279823 "White Grand XL"
  //   PianoSynthB / Shimmer B 0x6a3f2e5d → 3565051066 "Mellow Upright Med"
  //   Vintage / Wah_Clav A    0x1065fd3a → 550238836  "Clavinet D6 6.1"
  //                           (bytes 0832fe9d vs 8832fe9d → variation 0 vs 2)
  it('reads the piano name hash at body bit 490 (layer B at 746)', () => {
    const expected: [string, 'A' | 'B', number][] = [
      ['EP_Flu', 'A', 2126320162], ['Wurlitzer', 'A', 2126320162],
      ['PianoSynthB', 'A', 1209279823], ['Shimmer_Piano', 'A', 1209279823],
      ['PianoSynthB', 'B', 3565051066], ['Shimmer_Piano', 'B', 3565051066],
      ['Vintage', 'A', 550238836], ['Wah_Clav', 'A', 550238836],
    ];
    for (const [n, layer, hash] of expected) expect(values(n)[`piano${layer}.nameHash`], `${n} ${layer}`).toBe(hash);
  });

  it('Vintage and Wah_Clav share one piano and differ only in variation', () => {
    expect(values('Vintage')['pianoA.variation']).toBe(0);
    expect(values('Wah_Clav')['pianoA.variation']).toBe(2);
    expect(values('EP_Flu')['pianoA.variation']).toBe(0);
  });

  it('decodes the layer-A octave shift as two\'s complement (old raw 0 / 15 / 1)', () => {
    // The corpus decoder's octave window (bit 473) was already the firmware one.
    expect(values('Atmosphere')['pianoA.octaveShift']).toBe(0);
    expect(values('Piano_Bass')['pianoA.octaveShift']).toBe(-1);
    expect(values('Cyber_Town')['pianoA.octaveShift']).toBe(1);
  });

  it('decodes zone and level from the bits the old sound-slot volume byte covered', () => {
    // Vintage body[58] = 0xbf → KbZone 0b10, Level top six bits 0b111111.
    expect(values('Vintage')['pianoA.kbZone']).toBe(2);
    expect(values('Vintage')['pianoA.level']).toBeGreaterThanOrEqual(126);
    // EP_Flu (old type bits 0b001 at 479-481) → Bank bits 480-481 = 0b01x: Electric or Clavinet.
    expect([2, 3]).toContain(values('EP_Flu')['pianoA.bank']);
  });

  it('the dual-layer bundle patches enable more than one layer', () => {
    // Replaces the body[7]&0x08 "layerBActive" expectation (that bit is LayerDetune's
    // low bit). Unverified expectation: these four patches layer two sounds.
    const bits = (n = 0) => (n & 1) + ((n >> 1) & 1);
    for (const n of ['Grand_EP_Bass', 'Harp_Piano', 'PianoSynthB', 'Shimmer_Piano']) {
      const v = values(n);
      expect(bits(v['common.slotPnoEnable']) + bits(v['common.slotSynEnable']), n).toBeGreaterThanOrEqual(2);
    }
  });

  it('every field stays inside its firmware range across the corpus', () => {
    for (const name of fixtures()) {
      expect(decodeNp5(load(name)).warnings.filter((w) => /outside the instrument/.test(w)), name).toEqual([]);
    }
  });
});
