import { registerPlugin } from '@capacitor/core';
import type { NordUsbPlugin } from './definitions';

export const NordUsb = registerPlugin<NordUsbPlugin>('NordUsb', {
  web: () => import('./web').then((m) => new m.NordUsbWeb()),
});

export type { NordUsbPlugin } from './definitions';
