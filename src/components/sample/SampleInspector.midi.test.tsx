// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MidiProvider, useMidi, type MidiState } from '../../lib/midi/MidiContext';
import { FolderProvider } from '../../lib/folder/FolderContext';

// A fake MIDI input layer: the test plays notes and hot-plugs devices through it.
const midiIo: { onMessage?: (d: Uint8Array) => void; onDevices?: (names: string[]) => void } = {};
vi.mock('../../lib/midi/midi-inputs', () => ({
  midiInputSupported: () => true,
  bluetoothMidiPairingSupported: () => false,
  pairBluetoothMidi: async () => {},
  listenToAllMidiInputs: async (onMessage: (d: Uint8Array) => void, onDevices: (names: string[]) => void) => {
    midiIo.onMessage = onMessage;
    midiIo.onDevices = onDevices;
    return { deviceNames: ['Keys'], stop: () => {} };
  },
}));

const { SampleInspector } = await import('./SampleInspector');

afterEach(cleanup);

const organ = { noteOn: vi.fn(), noteOff: vi.fn() };
let midiState: MidiState | null = null;
/** Another instrument (an organ) that owns MIDI while the sample inspector is open. */
function Organ() {
  const midi = useMidi();
  midiState = midi;
  const { setSink, clearSink } = midi;
  useEffect(() => { setSink(organ); return () => clearSink(organ); }, [setSink, clearSink]);
  return null;
}

describe('SampleInspector MIDI routing', () => {
  it('never unhooks another instrument: not on mount, not on hot-plug, not on unmount', async () => {
    const { unmount } = render(
      <FolderProvider><MidiProvider><Organ /><SampleInspector /></MidiProvider></FolderProvider>,
    );
    await act(async () => { await midiState!.connect(); });
    const send = (...bytes: number[]) => act(() => { midiIo.onMessage!(new Uint8Array(bytes)); });

    send(0x90, 60, 100);
    expect(organ.noteOn).toHaveBeenCalledWith(60, 100);

    // Plugging in a second keyboard gives the MIDI context a new identity.
    act(() => { midiIo.onDevices!(['Keys', 'Pads']); });
    expect(organ.noteOff).not.toHaveBeenCalled(); // the held note rings on
    send(0x80, 60, 0);
    expect(organ.noteOff).toHaveBeenCalledWith(60);
    send(0x90, 62, 90);
    expect(organ.noteOn).toHaveBeenCalledWith(62, 90);

    unmount();
  });
});
