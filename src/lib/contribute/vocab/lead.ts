import type { ControlVocabItem } from '../types';

/**
 * Starter control vocabulary for the Nord Lead 4 (nl4p) — virtual-analog synth
 * panel controls, for labeling captured changes. Extend freely.
 */
export const LEAD_VOCAB: ControlVocabItem[] = [
  { id: 'osc.waveform', label: 'Oscillator waveform', section: 'Oscillator' },
  { id: 'osc.shape', label: 'Oscillator shape', section: 'Oscillator' },
  { id: 'osc.mod', label: 'Oscillator modulation', section: 'Oscillator' },
  { id: 'mix.balance', label: 'Oscillator mix/balance', section: 'Mixer' },
  { id: 'flt.type', label: 'Filter type', section: 'Filter' },
  { id: 'flt.cutoff', label: 'Filter cutoff', section: 'Filter' },
  { id: 'flt.resonance', label: 'Filter resonance', section: 'Filter' },
  { id: 'flt.envamount', label: 'Filter envelope amount', section: 'Filter' },
  { id: 'flt.drive', label: 'Filter drive', section: 'Filter' },
  { id: 'amp.attack', label: 'Amp envelope attack', section: 'Amp envelope' },
  { id: 'amp.decay', label: 'Amp envelope decay', section: 'Amp envelope' },
  { id: 'amp.sustain', label: 'Amp envelope sustain', section: 'Amp envelope' },
  { id: 'amp.release', label: 'Amp envelope release', section: 'Amp envelope' },
  { id: 'lfo1.rate', label: 'LFO 1 rate', section: 'LFO' },
  { id: 'lfo1.amount', label: 'LFO 1 amount', section: 'LFO' },
  { id: 'arp.onoff', label: 'Arpeggiator on/off', section: 'Arpeggiator' },
  { id: 'arp.rate', label: 'Arpeggiator rate', section: 'Arpeggiator' },
  { id: 'fx.delay', label: 'Delay amount', section: 'Effects' },
  { id: 'fx.reverb', label: 'Reverb amount', section: 'Effects' },
  { id: 'master.level', label: 'Master level', section: 'Master' },
];
