import { describe, it, expect } from 'vitest';
import { decodeNg } from './decode';
import { ngDecoded } from './present';
import { NG_LAYOUT, type NgFieldKey } from './layout.generated';
import { synthFwBody, synthFwFile, writeBits } from '../clavia/block-chain.synth';

const file = (values: Partial<Record<NgFieldKey, number>> = {}) => synthFwFile('ngp', synthFwBody(NG_LAYOUT, values));

describe('decodeNg (Grand, firmware layout = Piano 4 + Com_kSplPos)', () => {
  it('reads a 134-byte file (90-byte body) built from the program map', () => {
    const bytes = file();
    expect(bytes.length).toBe(134);
    const p = decodeNg(bytes);
    expect(p).toMatchObject({ parsed: true, format: 'ngp', layoutMatched: true, formatVersion: 100, version: '1.00' });
    expect(p.warnings).toEqual([]);
    expect(p.values['piano.level']).toBe(127);
    expect(p.values['common.transposeValue']).toBe(1); // firmware default +1
  });

  it('round-trips piano, synth, effect and split fields', () => {
    const p = decodeNg(file({
      'piano.bank': 2, 'piano.entry': 17, 'piano.variation': 3, 'piano.nameHash': 0x64cd1a4b,
      'piano.octaveShift': -2, 'synth.smpPos': 399, 'synth.ampEnvDcyRls': -60,
      'effects.eqlTreble': -30, 'effects.rvbType': 2, 'common.splPos': 8,
    }));
    expect(p.values).toMatchObject({
      'piano.bank': 2, 'piano.entry': 17, 'piano.variation': 3, 'piano.nameHash': 0x64cd1a4b,
      'piano.octaveShift': -2, 'synth.smpPos': 399, 'synth.ampEnvDcyRls': -60,
      'effects.eqlTreble': -30, 'effects.rvbType': 2, 'common.splPos': 8,
    });
  });

  it('places fields at the firmware body bits (hash 162/32, bank 152/3, entry 155/5, SplPos 59/4)', () => {
    const body = synthFwBody(NG_LAYOUT);
    writeBits(body, 162, 32, 0xa1b2c3d4);
    writeBits(body, 152, 3, 4);
    writeBits(body, 155, 5, 19);
    writeBits(body, 59, 4, 6);
    writeBits(body, 54, 4, 0b1110); // TransposeValue −2, two's complement
    const v = decodeNg(synthFwFile('ngp', body)).values;
    expect(v['piano.nameHash']).toBe(0xa1b2c3d4);
    expect(v['piano.bank']).toBe(4);
    expect(v['piano.entry']).toBe(19);
    expect(v['common.splPos']).toBe(6);
    expect(v['common.transposeValue']).toBe(-2);
  });

  it('odd or short files → header-only with a warning, never a throw', () => {
    const full = file();
    for (const bytes of [full.slice(0, 44), full.slice(0, 100), new Uint8Array(10)]) {
      const p = decodeNg(bytes);
      expect(p.layoutMatched).toBe(false);
      expect(p.values).toEqual({});
      expect(p.warnings.length).toBeGreaterThan(0);
    }
  });
});

describe('ngDecoded', () => {
  it('shows the piano with Grand labels, the injected piano name and the effects that are on', () => {
    const d = ngDecoded(file({
      'piano.enable': 1, 'piano.bank': 2, 'piano.nameHash': 1691162699, 'piano.level': 100, 'piano.eq': 3,
      'effects.fx2Enable': 1, 'effects.fx2Type': 5, 'effects.rvbEnable': 1, 'effects.rvbType': 1, 'effects.rvbBright': 1,
      'common.transposeEnable': 1, 'common.transposeValue': -3,
    }), (h) => (h === 1691162699 ? 'EP5 BrightTines XL' : undefined));
    expect(d.title).toBe('Nord Grand · Program');
    expect(d.header).toContainEqual(['Transpose', '−3 semitones']);
    expect(d.sections[0].engines[0].parts).toEqual(['EP5 BrightTines XL', 'Electric', 'level 100', 'Timbre Bright']);
        const fx = d.sections[2].fx!.groups[0].units;
        expect(fx.filter((u) => u.on).map((u) => [u.label, u.type])).toEqual([['Effect 2', 'Vibe'], ['Reverb', 'Stage']]);
        expect(fx[5].switches).toEqual([{ label: 'Bright', on: true }]);
        expect(fx[2].source?.map((k) => k.label)).toEqual(['Piano', 'Synth']);
    expect(d.note).toMatch(/map of Grand OS 1\.68 programs/);
    expect(d.warnings).toEqual([]);
  });

  it('header-only presentation for a file whose structure does not match', () => {
    const d = ngDecoded(file().slice(0, 60));
    expect(d.sections).toEqual([]);
    expect(d.note).toMatch(/only the file header/);
    expect(d.warnings?.length).toBeGreaterThan(0);
  });
});

describe('ngDecoded: keyboard split', () => {
  const split = (values: Parameters<typeof file>[0]) => ngDecoded(file(values)).header.find(([k]) => k === 'Split')?.[1];
  const v101 = (values: Parameters<typeof file>[0]) =>
    ngDecoded(synthFwFile('ngp', synthFwBody(NG_LAYOUT, values, 101), 101)).header.find(([k]) => k === 'Split')?.[1];
  it('format 1.01 reads the nine-place split point (F2 to F6)', () => {
    expect(v101({ 'common.splSelect': 0 })).toBe('off');
    expect(v101({ 'common.splSelect': 1, 'common.splPos': 0 })).toBe('Piano / Synth · at F2');
    expect(v101({ 'common.splSelect': 2, 'common.splPos': 8, 'common.splWidth': 1 })).toBe('Synth / Piano · at F6 · crossfade ±6');
  });
  it('format 1.00 reads the earlier seven-place field (from C3)', () => {
    expect(split({ 'common.splSelect': 1, 'common.splPosEol': 0, 'common.splPos': 8 })).toBe('Piano / Synth · at C3');
  });
});
