import { registerPlugin } from '@capacitor/core';
import type { MidiInputPlugin } from './definitions';

export const MidiInput = registerPlugin<MidiInputPlugin>('MidiInput', {
  web: () => import('./web').then((m) => new m.MidiInputWeb()),
});

export type {
  MidiInputEvent,
  MidiInputPlugin,
  MidiSourceInfo,
  MidiSourcesEvent,
  MidiSourceTransport,
} from './definitions';
