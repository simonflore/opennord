import type { ControlVocabItem } from '../types';

/**
 * Starter control vocabulary for the Nord Electro family (ne4p/ne5p/ne6p) —
 * the panel controls a player recognizes, for labeling captured changes.
 * No byte offsets needed; extend freely as contributions come in.
 */
export const ELECTRO_VOCAB: ControlVocabItem[] = [
  { id: 'org.drawbar1', label: 'Organ drawbar 1', section: 'Organ' },
  { id: 'org.percussion', label: 'Organ percussion on/off', section: 'Organ' },
  { id: 'org.vibchorus', label: 'Organ vibrato/chorus', section: 'Organ' },
  { id: 'org.rotary', label: 'Rotary speaker on/off', section: 'Organ' },
  { id: 'pno.type', label: 'Piano type/model', section: 'Piano' },
  { id: 'pno.timbre', label: 'Piano timbre', section: 'Piano' },
  { id: 'pno.dynamics', label: 'Piano dynamics', section: 'Piano' },
  { id: 'fx.eq.bass', label: 'EQ bass', section: 'Effects' },
  { id: 'fx.effect1', label: 'Effect 1', section: 'Effects' },
  { id: 'fx.effect2', label: 'Effect 2', section: 'Effects' },
  { id: 'fx.delay', label: 'Delay amount', section: 'Effects' },
  { id: 'fx.reverb', label: 'Reverb amount', section: 'Effects' },
  { id: 'fx.compressor', label: 'Compressor amount', section: 'Effects' },
  { id: 'master.level', label: 'Master level', section: 'Master' },
];
