import type { ControlVocabItem } from '../types';

/** A starter set of Stage 4 controls for labeling — extend freely. */
export const NS4_VOCAB: ControlVocabItem[] = [
  { id: 'org.drawbar1', label: 'Organ drawbar 1', section: 'Organ' },
  { id: 'org.vibchorus', label: 'Organ vibrato/chorus', section: 'Organ' },
  { id: 'org.rotary', label: 'Rotary speaker on/off', section: 'Organ' },
  { id: 'pno.model', label: 'Piano model', section: 'Piano' },
  { id: 'pno.timbre', label: 'Piano timbre', section: 'Piano' },
  { id: 'syn.osc.type', label: 'Synth oscillator type', section: 'Synth' },
  { id: 'syn.flt.cutoff', label: 'Synth filter cutoff', section: 'Synth' },
  { id: 'syn.flt.reso', label: 'Synth filter resonance', section: 'Synth' },
  { id: 'syn.amp.attack', label: 'Synth amp attack', section: 'Synth' },
  { id: 'fx.reverb.amount', label: 'Reverb amount', section: 'Effects' },
  { id: 'fx.delay.amount', label: 'Delay amount', section: 'Effects' },
  { id: 'master.level', label: 'Master level', section: 'Master' },
];
