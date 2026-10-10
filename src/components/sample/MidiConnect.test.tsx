// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

const seam = vi.hoisted(() => ({
  supported: true,
  bluetooth: false,
  listen: vi.fn(),
  pair: vi.fn(),
}));

vi.mock('../../lib/midi/midi-inputs', () => ({
  midiInputSupported: () => seam.supported,
  bluetoothMidiPairingSupported: () => seam.bluetooth,
  listenToAllMidiInputs: (...a: unknown[]) => seam.listen(...a),
  pairBluetoothMidi: (...a: unknown[]) => seam.pair(...a),
}));

import { MidiProvider } from '../../lib/midi/MidiContext';
import { MidiConnect } from './MidiConnect';

const renderConnect = () => render(<MidiProvider><MidiConnect /></MidiProvider>);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  seam.supported = true;
  seam.bluetooth = false;
});

describe('MidiConnect', () => {
  it('explains where MIDI works when this host has none', () => {
    seam.supported = false;
    renderConnect();
    expect(screen.getByText(/in the iPad app/i)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('desktop: connect only, no Bluetooth pairing button', () => {
    renderConnect();
    expect(screen.getByRole('button', { name: 'Connect MIDI keyboard' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /bluetooth/i })).toBeNull();
  });

  it('iPad app: offers Bluetooth pairing, then starts listening', async () => {
    seam.bluetooth = true;
    seam.pair.mockResolvedValue(undefined);
    seam.listen.mockResolvedValue({ deviceNames: ['Nord Stage 4'], stop: vi.fn() });
    renderConnect();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /pair a bluetooth keyboard/i })); });
    expect(seam.pair).toHaveBeenCalledTimes(1);
    expect(seam.listen).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Playing from: Nord Stage 4/)).toBeTruthy();
  });

  it('shows a retry when MIDI fails to start', async () => {
    seam.listen.mockRejectedValue(new Error('failed'));
    renderConnect();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connect MIDI keyboard' })); });
    expect(screen.getByRole('button', { name: /didn’t start — tap to retry/ })).toBeTruthy();
  });

  it('a retry stops the previous session before starting a new one', async () => {
    const first = { deviceNames: [] as string[], stop: vi.fn() };
    seam.listen.mockResolvedValueOnce(first).mockResolvedValueOnce({ deviceNames: ['Keys'], stop: vi.fn() });
    renderConnect();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connect MIDI keyboard' })); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /plug one in & retry/ })); });
    expect(first.stop).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Playing from: Keys/)).toBeTruthy();
  });

  it('disables both buttons while connecting (no duplicate sessions)', async () => {
    seam.bluetooth = true;
    seam.listen.mockImplementationOnce(() => new Promise(() => {})); // never settles
    renderConnect();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connect MIDI keyboard' })); });
    expect((screen.getByRole('button', { name: 'Connecting…' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /pair a bluetooth keyboard/i }) as HTMLButtonElement).disabled).toBe(true);
  });
});
