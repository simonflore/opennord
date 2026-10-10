// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NS4Layer } from '@/lib/ns4/types';
import { MidiProvider, useMidi, type MidiState } from '@/lib/midi/MidiContext';

function makeVoice() {
  return {
    output: {} as AudioNode,
    backend: 'worklet' as const,
    noteOn: vi.fn(), noteOff: vi.fn(), setParams: vi.fn(), allNotesOff: vi.fn(), dispose: vi.fn(),
  };
}
type Voice = ReturnType<typeof makeVoice>;
const voices: Voice[] = [];
const createOrganVoice = vi.fn(async (_ctx: unknown, _opts: unknown) => {
  const v = makeVoice();
  voices.push(v);
  return v;
});
vi.mock('@/lib/engine/organ/organ-voice', () => ({ createOrganVoice }));
const getSharedCtx = vi.fn(() => ({}));
vi.mock('@/components/sample/audioPlayer', () => ({ getSharedCtx }));

// A fake MIDI input layer: the test plays notes and hot-plugs devices through it.
const midiIo: { onMessage?: (d: Uint8Array) => void; onDevices?: (names: string[]) => void } = {};
vi.mock('@/lib/midi/midi-inputs', () => ({
  midiInputSupported: () => true,
  bluetoothMidiPairingSupported: () => false,
  pairBluetoothMidi: async () => {},
  listenToAllMidiInputs: async (onMessage: (d: Uint8Array) => void, onDevices: (names: string[]) => void) => {
    midiIo.onMessage = onMessage;
    midiIo.onDevices = onDevices;
    return { deviceNames: ['Keys'], stop: () => {} };
  },
}));

const { OrganPlay } = await import('./OrganPlay');

afterEach(() => { cleanup(); vi.clearAllMocks(); voices.length = 0; });

const b3: NS4Layer = {
  id: 'A', kind: 'organ', organModel: 'B3',
  drawbars: ['8', '8', '8', '0', '0', '0', '0', '0', '0'].map((value) => ({ value })),
  percussion: { on: true, harm3rd: true },
};

let midiState: MidiState | null = null;
function Probe() { midiState = useMidi(); return null; }
const send = (...bytes: number[]) => act(() => { midiIo.onMessage!(new Uint8Array(bytes)); });

describe('OrganPlay', () => {
  it('starts the organ with the layer settings on first press, then stops it', async () => {
    render(<OrganPlay layer={b3} />);
    expect(screen.getByText(/tonewheel model/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play this organ' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Stop/ })).toBeInTheDocument());
    const opts = createOrganVoice.mock.calls[0][1] as { params: { model: string; drawbars: number[]; percussion: { harm3rd: boolean } } };
    expect(opts.params.model).toBe('B3');
    expect(opts.params.drawbars).toEqual([8, 8, 8, 0, 0, 0, 0, 0, 0]);
    expect(opts.params.percussion.harm3rd).toBe(true);
    expect(screen.getByRole('group', { name: 'Keyboard zone map' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Stop/ }));
    await waitFor(() => expect(voices[0].dispose).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Play this organ' })).toBeInTheDocument();
  });

  it('works inside the app MIDI provider and labels other models as a sketch', async () => {
    render(<MidiProvider><OrganPlay layer={{ ...b3, organModel: 'VOX' }} /></MidiProvider>);
    expect(screen.getByText(/simplified sketch/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play this organ' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Connect MIDI keyboard' })).toBeInTheDocument());
  });

  it('keeps MIDI on the organ that took it last: hot-plug keeps held notes, stopping the other organ does not unhook it', async () => {
    render(<MidiProvider><Probe /><OrganPlay layer={b3} /><OrganPlay layer={{ ...b3, id: 'B' }} /></MidiProvider>);
    fireEvent.click(screen.getAllByRole('button', { name: 'Play this organ' })[0]);
    await waitFor(() => expect(voices).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: 'Play this organ' }));
    await waitFor(() => expect(voices).toHaveLength(2));
    await act(async () => { await midiState!.connect(); });
    const [a, b] = voices;

    send(0x90, 60, 100);
    expect(b.noteOn).toHaveBeenCalledWith(60, 100);
    expect(a.noteOn).not.toHaveBeenCalled();

    // Plugging in a second keyboard changes the MIDI context; the held note rings on.
    act(() => { midiIo.onDevices!(['Keys', 'Pads']); });
    expect(b.noteOff).not.toHaveBeenCalled();
    send(0x80, 60, 0);
    expect(b.noteOff).toHaveBeenCalledWith(60);

    // Stopping organ A leaves organ B on MIDI.
    fireEvent.click(screen.getAllByRole('button', { name: /Stop/ })[0]);
    await waitFor(() => expect(a.dispose).toHaveBeenCalled());
    send(0x90, 62, 90);
    expect(b.noteOn).toHaveBeenCalledWith(62, 90);
    expect(a.noteOn).not.toHaveBeenCalled();

    // Stopping B (the owner) releases its held note and unhooks it.
    fireEvent.click(screen.getByRole('button', { name: /Stop/ }));
    await waitFor(() => expect(b.dispose).toHaveBeenCalled());
    expect(b.noteOff).toHaveBeenCalledWith(62);
    send(0x90, 64, 90);
    expect(b.noteOn).not.toHaveBeenCalledWith(64, 90);
  });

  it('resumes audio on every note-on (iPad suspends it in the background)', async () => {
    render(<MidiProvider><Probe /><OrganPlay layer={b3} /></MidiProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Play this organ' }));
    await waitFor(() => expect(voices).toHaveLength(1));
    await act(async () => { await midiState!.connect(); });
    getSharedCtx.mockClear();
    send(0x90, 60, 100);
    send(0x90, 64, 100);
    expect(getSharedCtx).toHaveBeenCalledTimes(2);
    expect(voices[0].noteOn).toHaveBeenCalledTimes(2);
  });

  it('disposes a voice that finishes loading after the page was left', async () => {
    let finish!: () => void;
    createOrganVoice.mockImplementationOnce(() => new Promise((res) => {
      finish = () => { const v = makeVoice(); voices.push(v); res(v); };
    }));
    const { unmount } = render(<OrganPlay layer={b3} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play this organ' }));
    expect(screen.getByRole('button', { name: 'Warming up…' })).toBeDisabled();
    await waitFor(() => expect(createOrganVoice).toHaveBeenCalled());
    unmount();
    await act(async () => { finish(); });
    expect(voices).toHaveLength(1);
    expect(voices[0].dispose).toHaveBeenCalledTimes(1);
  });
});
