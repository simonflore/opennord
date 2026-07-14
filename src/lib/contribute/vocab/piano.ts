import type { ControlVocabItem } from '../types';

/**
 * Starter control vocabulary for the Nord Piano family (np2p–np6p, Grand) —
 * the panel controls, for labeling captured changes. Extend freely.
 */
export const PIANO_VOCAB: ControlVocabItem[] = [
  { id: 'pno.type', label: 'Piano type/model', section: 'Piano' },
  { id: 'pno.dynamics', label: 'Piano dynamics', section: 'Piano' },
  { id: 'pno.timbre', label: 'Piano timbre/soft', section: 'Piano' },
  { id: 'pno.stringres', label: 'String resonance', section: 'Piano' },
  { id: 'pno.pedalnoise', label: 'Pedal noise', section: 'Piano' },
  { id: 'fx.eq.bass', label: 'EQ bass', section: 'Effects' },
  { id: 'fx.eq.treble', label: 'EQ treble', section: 'Effects' },
  { id: 'fx.effect', label: 'Effect amount', section: 'Effects' },
  { id: 'fx.delay', label: 'Delay amount', section: 'Effects' },
  { id: 'fx.reverb', label: 'Reverb amount', section: 'Effects' },
  { id: 'fx.compressor', label: 'Compressor amount', section: 'Effects' },
  { id: 'master.level', label: 'Master level', section: 'Master' },
];
