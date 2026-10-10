import { describe, expect, it } from 'vitest';
import { MidiInputWeb } from './web';

describe('MidiInputWeb', () => {
  it('start rejects as unavailable', async () => {
    await expect(new MidiInputWeb().start()).rejects.toThrow(/only available in the iPad app/i);
  });
  it('start rejects with the UNAVAILABLE code the seam maps to "unsupported"', async () => {
    await expect(new MidiInputWeb().start()).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  });
  it('showBluetoothPairing rejects as unavailable', async () => {
    await expect(new MidiInputWeb().showBluetoothPairing()).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  });
  it('listSources is empty', async () => {
    await expect(new MidiInputWeb().listSources()).resolves.toEqual({ sources: [] });
  });
  it('isAvailable reports false for input and Bluetooth', async () => {
    await expect(new MidiInputWeb().isAvailable()).resolves.toEqual({ available: false, bluetooth: false });
  });
  it('stop resolves', async () => {
    await expect(new MidiInputWeb().stop()).resolves.toBeUndefined();
  });
});
