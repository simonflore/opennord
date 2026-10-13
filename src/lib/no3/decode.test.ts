import { describe, it, expect } from 'vitest';
import { decodeNo3 } from './decode';
import { no3Decoded, NO3_PROVISIONAL_NOTE } from './present';
import { NO3_LAYOUT, type No3FieldKey } from './layout.generated';
import { fieldBit, synthFwBody, synthFwFile, writeBits } from '../clavia/block-chain.synth';

const file = (values: Partial<Record<No3FieldKey, number>> = {}) => synthFwFile('no3p', synthFwBody(NO3_LAYOUT, values), 200);

describe('decodeNo3 (Organ 3, firmware layout, provisional block order)', () => {
  it('reads the predicted 248-byte file (204-byte body, 8 blocks, version 2.00)', () => {
    const bytes = file();
    expect(bytes.length).toBe(248);
    const p = decodeNo3(bytes);
    expect(p).toMatchObject({ format: 'no3p', layoutMatched: true, formatVersion: 200, version: '2.00' });
    expect(p.warnings).toEqual([]);
  });

  it('round-trips common, bass and manual fields', () => {
    const v = {
      'common.organModel': 4, 'common.bassModel': 8, 'common.programTranspose': -6, 'common.eqTreble': 60,
      'common.leslieRotorAngle': 32767, 'bassDrawbar.bassDrawbarValue2': 3, 'modeSpecific.vibratoTypeSoft': 4,
      'manualBDrawbar.drawbarValue9': 7, 'manualAModeAndLayer.drawbarFocus': 4,
    } as const;
    expect(decodeNo3(file(v)).values).toMatchObject(v);
  });

  it('places fields at the firmware bits (organ model 46, bass model 49, manual A drawbar 1 at byte 161)', () => {
    const body = synthFwBody(NO3_LAYOUT, {}, 200);
    writeBits(body, 46, 3, 3);
    writeBits(body, 49, 4, 6);
    writeBits(body, 161 * 8, 4, 2);
    const v = decodeNo3(synthFwFile('no3p', body)).values;
    expect(v['common.organModel']).toBe(3);
    expect(v['common.bassModel']).toBe(6);
    expect(v['manualADrawbar.drawbarValue1']).toBe(2);
  });

  it('stores negative values as two\'s complement, not value − min', () => {
    expect(NO3_LAYOUT.fields.filter((f) => f.min < 0 && f.enc !== 'twos')).toEqual([]);
    const body = synthFwBody(NO3_LAYOUT, {}, 200);
    writeBits(body, fieldBit(NO3_LAYOUT, 'common.programTranspose'), 4, 0b1111); // −1
    writeBits(body, fieldBit(NO3_LAYOUT, 'common.eqBass'), 7, 0);                // 0, not −60
    const v = decodeNo3(synthFwFile('no3p', body)).values;
    expect(v['common.programTranspose']).toBe(-1);
    expect(v['common.eqBass']).toBe(0);
  });

  it('warns on a format version other than 2.00 but still reads', () => {
    const p = decodeNo3(synthFwFile('no3p', synthFwBody(NO3_LAYOUT, {}, 100)));
    expect(p.layoutMatched).toBe(true);
    expect(p.warnings.join(' ')).toMatch(/outside the 2\.00–2\.00 range/);
  });

  it('odd or short files → header-only with a warning, never a throw', () => {
    const full = file();
    const bad = full.slice();
    bad[44 + 4] = 200; // Common block claims more bytes than the file has
    for (const bytes of [bad, full.slice(0, 47)]) {
      const p = decodeNo3(bytes);
      expect(p.layoutMatched).toBe(false);
      expect(p.warnings.length).toBeGreaterThan(0);
    }
  });
});

describe('no3Decoded', () => {
  it('shows the organ, both manuals, the bass and the effects with Organ 3 labels', () => {
    const d = no3Decoded(file({
      'common.organModel': 3, 'common.bassModel': 2, 'common.speakerEnable': 1, 'common.speakerModel': 4,
      'common.modFxEnable': 1, 'common.modFxType': 2, 'common.reverbEnable': 1, 'common.reverbType': 5,
      'common.reverbColor': 2, 'modeSpecific.percussionEnable': 1, 'manualAModeAndLayer.vibratoEnable': 1,
      'manualBDrawbar.drawbarValue1': 0,
    }));
    expect(d.note).toBe(NO3_PROVISIONAL_NOTE);
    const byId = Object.fromEntries(d.sections.map((s) => [s.id, s]));
    expect(byId.O.engines[0].parts).toEqual(['Soft B3']);
    expect(byId.O.chips).toEqual(['Percussion']);
    expect(byId.MA.drawbars?.[0].footage).toBe('16′');
    expect(byId.MA.chips).toEqual(['Vibrato']);
    expect(byId.MB.drawbars?.[0].level).toBe(0);
    expect(byId.BS.engines[0].parts).toEqual(['Trk 1']);
        const fx = byId.FX.fx!.groups[0].units;
        expect(fx.map((u) => u.label)).toEqual(['Speaker', 'Mod FX', 'Delay', 'EQ', 'Reverb']);
        expect(fx.filter((u) => u.on).map((u) => [u.label, u.type])).toEqual([['Speaker', 'Rotary'], ['Mod FX', 'Ring Modulator'], ['Reverb', 'Cathedral']]);
        expect(fx[4].params.find((p) => p.label === 'Color')?.value).toBe('Bright');
  });
});
