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
      'pianoA.bank': 0, 'pianoA.layerLevel': 90, 'pianoB.bank': 3, 'pianoB.variation': 1, 'pianoB.octaveShift': 1,
      'pianoFxA.fx1Enable': 1, 'pianoFxA.fx1Type': 3, 'pianoFxA.ampEnable': 1, 'pianoFxA.ampType': 1,
      'pianoFxA.dlyEnable': 1, 'pianoFxA.dlyFltType': 2,
      'common.effectsRvbEnable': 1, 'common.effectsRvbType': 0, 'common.effectsRvbColor': 1,
    }));
    const [pa, pb, sa, sb] = d.sections;
    expect(pa.engines[0].parts).toEqual(['Grand', 'level 90']);
    expect(pb.engines[0].parts).toEqual(['Clavinet', 'variation 2', 'level 127', 'Oct +1']);
    expect(sa.engines[0].parts).not.toContain('(off)');
    expect(sb.engines[0].parts).toContain('(off)');
    const fxCard = d.sections.find((s) => s.id === 'FX')!;
    expect(fxCard.fx!.groups.map((g) => g.label)).toEqual(['Piano A', 'Piano B', 'Synth A']);
    const row = (label: string) => fxCard.fx!.groups.find((g) => g.label === label)!.units;
    const lit = (label: string) => row(label).filter((u) => u.on).map((u) => [u.label, u.type]);
    // Reverb is the program's; it is lit on every layer row.
    expect(lit('Piano A')).toEqual([['Effect 1', 'Spin'], ['Delay', undefined], ['Amp', 'Twin'], ['Reverb', 'Spring']]);
    expect(row('Piano A')[2].params.find((p) => p.label === 'Filter')?.value).toBe('HP');
    expect(row('Piano A')[6].params.find((p) => p.label === 'Color')?.value).toBe('Dark');
    // The layer cards no longer carry an Effects line, and there is no separate reverb card.
    expect(d.sections.find((s) => s.id === 'RV')).toBeUndefined();
    expect(d.sections.flatMap((s) => s.engines.map((e) => e.label))).not.toContain('Effects');
    expect(d.note).toMatch(/map of Piano 6 OS 1\.20 programs/);
  });

  it('resolves piano names through the injected table', () => {
    const d = np6Decoded(file({ 'pianoA.nameHash': 17138523, 'pianoA.bank': 1 }), (h) => (h === 17138523 ? 'Baby Upright XL' : undefined));
    expect(d.sections[0].engines[0].parts.slice(0, 2)).toEqual(['Baby Upright XL', 'Upright']);
  });
});

describe('np6Decoded: keyboard split', () => {
  const split = (pos: number) => np6Decoded(file({ 'common.splitEnable': 1, 'common.splitPosition': pos, 'pianoCommon.layerEnable': 1 }))
    .header.find(([k]) => k === 'Split')?.[1];
  it('has the nine places its firmware names, F2 to F6; a tenth value is out of range', () => {
    expect([split(0), split(3), split(8)]).toEqual(['at F2', 'at C4', 'at F6']);
    const ten = np6Decoded(file({ 'common.splitEnable': 1, 'common.splitPosition': 9 }));
    expect(ten.header.find(([k]) => k === 'Split')?.[1]).toBe('on');
    expect(ten.warnings?.join(' ')).toMatch(/outside the instrument’s range/);
  });
  it('draws each layer on its side', () => {
    const d = np6Decoded(file({
      'common.splitEnable': 1, 'common.splitPosition': 3,
      'pianoCommon.layerEnable': 3, 'pianoA.kbdZone': 0, 'pianoB.kbdZone': 2,
    }));
    const ids = (i: number) => d.keyboard!.zones[i].layers.map((l) => `${l.kind}${l.id}`);
    expect([ids(0), ids(3)]).toEqual([['pianoA'], ['pianoB']]);
  });
});
