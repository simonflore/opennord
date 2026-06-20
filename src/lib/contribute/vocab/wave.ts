import type { ControlVocabItem } from '../types';

/**
 * Starter control vocabulary for the Nord Wave 2 (nw2p) — its four-voice
 * wavetable/sample/FM/VA synth panel, for labeling captured changes. Extend freely.
 */
export const WAVE_VOCAB: ControlVocabItem[] = [
  { id: 'osc.mode', label: 'Oscillator mode (analog/wavetable/FM/sample)', section: 'Oscillator' },
  { id: 'osc.wavetable', label: 'Wavetable selection', section: 'Oscillator' },
  { id: 'osc.control', label: 'Oscillator control', section: 'Oscillator' },
  { id: 'flt.type', label: 'Filter type', section: 'Filter' },
  { id: 'flt.cutoff', label: 'Filter cutoff', section: 'Filter' },
  { id: 'flt.resonance', label: 'Filter resonance', section: 'Filter' },
  { id: 'flt.envamount', label: 'Filter envelope amount', section: 'Filter' },
  { id: 'amp.attack', label: 'Amp envelope attack', section: 'Amp envelope' },
  { id: 'amp.decay', label: 'Amp envelope decay', section: 'Amp envelope' },
  { id: 'amp.sustain', label: 'Amp envelope sustain', section: 'Amp envelope' },
  { id: 'amp.release', label: 'Amp envelope release', section: 'Amp envelope' },
  { id: 'lfo.rate', label: 'LFO rate', section: 'LFO' },
  { id: 'lfo.amount', label: 'LFO amount', section: 'LFO' },
  { id: 'arp.onoff', label: 'Arpeggiator on/off', section: 'Arpeggiator' },
  { id: 'fx.effect', label: 'Effect amount', section: 'Effects' },
  { id: 'fx.delay', label: 'Delay amount', section: 'Effects' },
  { id: 'fx.reverb', label: 'Reverb amount', section: 'Effects' },
  { id: 'master.level', label: 'Master level', section: 'Master' },
];
