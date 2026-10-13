import { describe, it, expect } from 'vitest';
import { fxUnitOf, setting, settingOf, type FxBlock } from './fx-block';
import { midis, morphsOf, texts } from '../../test-utils/fx';

describe('setting', () => {
  it('carries only what it was given: no undefined midi or morph keys', () => {
    expect(setting('rate', '1/4')).toEqual({ id: 'rate', text: '1/4' });
    expect(Object.keys(setting('rate', '1/4'))).toEqual(['id', 'text']);
    expect(setting('amount', '5.0', 64)).toEqual({ id: 'amount', text: '5.0', midi: 64 });
    expect(setting('amount', '5.0', 64, { wheel: '10.0' })).toEqual({ id: 'amount', text: '5.0', midi: 64, morph: { wheel: '10.0' } });
    expect(setting('rate', '1/4', undefined, { pedal: '1/8' })).toEqual({ id: 'rate', text: '1/4', morph: { pedal: '1/8' } });
  });

  it('keeps a stored position of 0', () => {
    expect(setting('amount', '0.0', 0)).toEqual({ id: 'amount', text: '0.0', midi: 0 });
  });
});

const delay: FxBlock = {
  name: 'Delay', on: true, source: 'Synth',
  settings: [setting('rate', '1/8'), setting('feedback', '2.0', 25), setting('mix', '5.0', 64, { wheel: '10.0' })],
  switches: { masterClock: true },
};

describe('settingOf', () => {
  it('finds a setting by id, or nothing', () => {
    expect(settingOf(delay, 'mix')).toEqual({ id: 'mix', text: '5.0', midi: 64, morph: { wheel: '10.0' } });
    expect(settingOf(delay, 'drive')).toBeUndefined();
    expect(settingOf({ name: 'Comp', on: false, settings: [] }, 'amount')).toBeUndefined();
  });
});

describe('test views of a block', () => {
  it('texts, midis and morphsOf read the settings back as records, in order', () => {
    expect(texts(delay)).toEqual({ rate: '1/8', feedback: '2.0', mix: '5.0' });
    expect(Object.keys(texts(delay))).toEqual(['rate', 'feedback', 'mix']);
    expect(midis(delay)).toEqual({ feedback: 25, mix: 64 });
    expect(morphsOf(delay)).toEqual({ mix: { wheel: '10.0' } });
  });

  it('morphsOf is undefined when nothing is morphed', () => {
    expect(morphsOf({ name: 'Comp', on: true, settings: [setting('amount', '5.0', 64)] })).toBeUndefined();
  });
});

describe('fxUnitOf', () => {
  it('carries the name, state and type, and keys the unit as given', () => {
    const u = fxUnitOf({ name: 'Reverb', on: true, type: 'Hall 1', settings: [] }, 'A-Reverb');
    expect(u).toMatchObject({ key: 'A-Reverb', label: 'Reverb', on: true, type: 'Hall 1', params: [] });
  });

  it('a setting with a stored position is a knob at that position; one without is a readout', () => {
    const u = fxUnitOf(delay, 'A-Delay');
    expect(u.params).toEqual([
      { label: 'Rate', value: '1/8' },
      { label: 'Feedback', value: '2.0', fill: 20 },
      { label: 'Mix', value: '5.0', fill: 50, morph: { wheel: '10.0' } },
    ]);
  });

  it('maps the knob range 0–127 onto 0–100', () => {
    const fill = (midi: number) => fxUnitOf({ name: 'Comp', on: true, settings: [setting('amount', 'x', midi)] }, 'k').params[0].fill;
    expect([0, 64, 127].map(fill)).toEqual([0, 50, 100]);
  });

  it('names every setting the decoders emit in the instrument\'s words', () => {
    const ids = ['rate', 'amount', 'mix', 'feedback', 'tempo', 'filter', 'drive', 'treble', 'mid', 'bass', 'midFreq',
      'frequency', 'resonance', 'dryWet', 'speed'];
    const u = fxUnitOf({ name: 'X', on: true, settings: ids.map((id) => setting(id, '1')) }, 'k');
    expect(u.params.map((p) => p.label)).toEqual(['Rate', 'Amount', 'Mix', 'Feedback', 'Tempo', 'Filter', 'Drive', 'Treble', 'Mid',
      'Bass', 'Mid Freq', 'Frequency', 'Resonance', 'Dry/Wet', 'Speed']);
  });

  it('falls back to the id for a setting it has no word for, so nothing is hidden', () => {
    expect(fxUnitOf({ name: 'X', on: true, settings: [setting('param13', '7')] }, 'k').params[0].label).toBe('param13');
  });

  it('names the switches, lit when on, in the block\'s order', () => {
    const u = fxUnitOf({ name: 'Delay', on: true, settings: [], switches: { masterClock: true, pingPong: false, analog: true } }, 'k');
    expect(u.switches).toEqual([{ label: 'Mst Clk', on: true }, { label: 'Ping Pong', on: false }, { label: 'Analog', on: true }]);
    const more = fxUnitOf({ name: 'X', on: true, settings: [], switches: { bright: true, fast: false, stopMode: true } }, 'k');
    expect(more.switches).toEqual([{ label: 'Bright', on: true }, { label: 'Fast', on: false }, { label: 'Stop Mode', on: true }]);
  });

  it('has no switches entry for a block without switches', () => {
    expect(fxUnitOf({ name: 'Comp', on: true, settings: [] }, 'k').switches).toBeUndefined();
  });

  it('gives a block with a source its three LEDs, the engine it acts on lit', () => {
    expect(fxUnitOf(delay, 'k').source).toEqual([{ label: 'Organ', on: false }, { label: 'Piano', on: false }, { label: 'Synth', on: true }]);
  });

  it('lights no LED for a source it does not know, and has none for a block without a selector', () => {
    expect(fxUnitOf({ ...delay, source: '#3' }, 'k').source).toEqual([
      { label: 'Organ', on: false }, { label: 'Piano', on: false }, { label: 'Synth', on: false },
    ]);
    expect(fxUnitOf({ name: 'Comp', on: true, settings: [] }, 'k').source).toBeUndefined();
  });

  const eqBlock = (settings: FxBlock['settings']): FxBlock => ({ name: 'Amp/EQ', on: true, type: 'Twin', settings });

  it('draws the EQ curve from the three bands and the mid frequency', () => {
    const u = fxUnitOf(eqBlock([
      setting('drive', '2.0', 25), setting('treble', '+3.0 dB'), setting('mid', '-1.5 dB'), setting('bass', '+0.0 dB'),
      setting('midFreq', '1.0 kHz', 65),
    ]), 'k');
    expect(u.eq).toEqual({ bassDb: 0, midDb: -1.5, trebDb: 3, midHz: 1000 });
  });

  it('draws no curve for a filter-type Amp/EQ, which has no bands', () => {
    const u = fxUnitOf(eqBlock([
      setting('drive', '2.0', 25), setting('resonance', '4.0'), setting('dryWet', '10.0'), setting('frequency', '1.0 kHz', 65),
    ]), 'k');
    expect(u.eq).toBeUndefined();
    expect(u.params.map((p) => p.label)).toEqual(['Drive', 'Resonance', 'Dry/Wet', 'Frequency']);
  });

  it('draws no curve when the mid frequency does not read as a frequency', () => {
    const u = fxUnitOf(eqBlock([setting('treble', '+3.0 dB'), setting('mid', '+0.0 dB'), setting('bass', '+0.0 dB'), setting('midFreq', '#200')]), 'k');
    expect(u.eq).toBeUndefined();
  });

  it('an off block keeps everything, so the panel can still merge and count on it', () => {
    const u = fxUnitOf({ ...delay, on: false }, 'k');
    expect(u.on).toBe(false);
    expect(u.params).toHaveLength(3);
  });
});
