import { describe, it, expect } from 'vitest';
import { decodeNp6 } from './decode';
import { np6Decoded } from './present';
import { NP6_LAYOUT, type Np6FieldKey } from './layout.generated';
import { synthFwBody, synthFwFile, writeBits } from '../clavia/block-chain.synth';

const file = (values: Partial<Record<Np6FieldKey, number>> = {}) => synthFwFile('np6p', synthFwBody(NP6_LAYOUT, values, 102), 102);

describe('decodeNp6 (Piano 6, firmware layout = Grand 2 + three deltas)', () => {
  it('reads a 229-byte file (185-byte body, 11 blocks)', () => {
    const bytes = file();
    expect(bytes.length).toBe(229);
    const p = decodeNp6(bytes);
    expect(p).toMatchObject({ format: 'np6p', layoutMatched: true, formatVersion: 102 });
    expect(p.warnings).toEqual([]);
  });

  it('round-trips both piano and synth layers and their effects', () => {
    const v = {
      'pianoA.bank': 1, 'pianoA.entry': 12, 'pianoA.nameHash': 0x830146c3, 'pianoA.octaveShift': -6,
      'pianoB.layerLevel': 42, 'pianoB.eq': 15, 'synthA.smpId': 16383, 'synthA.ampEnvDecay': 33,
      'synthB.vibDly': 30, 'pianoFxB.eqBass': -60, 'synthFxA.dlyRate': 9999, 'common.effectsRvbType': 5,
    } as const;
    expect(decodeNp6(file(v)).values).toMatchObject(v);
  });

  it('places the Piano 6 deltas at their firmware bits (FxEnable 53, PnoCom mode 131, piano A hash 201, B hash 313)', () => {
    const body = synthFwBody(NP6_LAYOUT, { 'common.fxEnable': 0 });
    writeBits(body, 53, 1, 1);
    writeBits(body, 131, 1, 1);
    writeBits(body, 201, 32, 0x11223344);
    writeBits(body, 313, 32, 0x55667788);
    writeBits(body, 881, 7, 99);  // SynA AmpEnvDecay
    writeBits(body, 888, 7, 12);  // SynA AmpEnvRelease
    const v = decodeNp6(synthFwFile('np6p', body)).values;
    expect(v['common.fxEnable']).toBe(1);
    expect(v['pianoCommon.effectsSectionModePno']).toBe(1);
    expect(v['pianoA.nameHash']).toBe(0x11223344);
    expect(v['pianoB.nameHash']).toBe(0x55667788);
    expect(v['synthA.ampEnvDecay']).toBe(99);
    expect(v['synthA.ampEnvRelease']).toBe(12);
  });

  it('odd or short files → header-only with a warning, never a throw', () => {
    const full = file();
    for (const bytes of [full.slice(0, 44), full.slice(0, 228), new Uint8Array([1, 2, 3])]) {
      const p = decodeNp6(bytes);
      expect(p.layoutMatched).toBe(false);
      expect(p.warnings.length).toBeGreaterThan(0);
    }
  });
});

describe('np6Decoded', () => {
  it('shows the enabled layers with Piano 6 labels and per-layer effects', () => {
    const d = np6Decoded(file({
      'pianoCommon.layerEnable': 0b11, 'synthCommon.layerEnable': 0b01,
      'pianoA.bank': 0, 'pianoA.layerLevel': 90, 'pianoB.bank': 3, 'pianoB.octaveShift': 1,
      'pianoFxA.fx1Enable': 1, 'pianoFxA.fx1Type': 3, 'pianoFxA.ampEnable': 1, 'pianoFxA.ampType': 1,
      'pianoFxA.dlyEnable': 1, 'pianoFxA.dlyFltType': 2,
      'common.effectsRvbEnable': 1, 'common.effectsRvbType': 0, 'common.effectsRvbColor': 1,
    }));
    const [pa, pb, sa, sb, rv] = d.sections;
    expect(pa.engines[0].parts).toEqual(['Grand', 'level 90']);
    expect(pa.engines[1].parts).toEqual(['Spin', 'Delay HP', 'Amp Twin']);
    expect(pb.engines[0].parts).toEqual(['Clavinet', 'level 127', 'Oct +1']);
    expect(sa.engines[0].parts).not.toContain('(off)');
    expect(sb.engines[0].parts).toContain('(off)');
    expect(rv.engines[0].parts).toEqual(['Reverb Spring Dark']);
    expect(d.note).toMatch(/Piano 6 OS 1\.20 firmware/);
  });

  it('resolves piano names through the injected table', () => {
    const d = np6Decoded(file({ 'pianoA.nameHash': 17138523, 'pianoA.bank': 1 }), (h) => (h === 17138523 ? 'Baby Upright XL' : undefined));
    expect(d.sections[0].engines[0].parts.slice(0, 2)).toEqual(['Baby Upright XL', 'Upright']);
  });
});
