// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

const seam = vi.hoisted(() => ({
  supported: true,
  bluetooth: false,
  listen: vi.fn(),
  pair: vi.fn(),
}));

vi.mock('./midi-inputs', () => ({
  midiInputSupported: () => seam.supported,
  bluetoothMidiPairingSupported: () => seam.bluetooth,
  listenToAllMidiInputs: (...a: unknown[]) => seam.listen(...a),
  pairBluetoothMidi: (...a: unknown[]) => seam.pair(...a),
}));

import { MidiProvider, useMidi } from './MidiContext';

type OnMessage = (data: Uint8Array) => void;
type OnDevices = (names: string[]) => void;

/** A listen() stand-in that hands back the callbacks MidiContext registered. */
function liveSession(names: string[]) {
  const session = { onMessage: null as OnMessage | null, onDevices: null as OnDevices | null, stop: vi.fn() };
  seam.listen.mockImplementationOnce(async (onMessage: OnMessage, onDevices: OnDevices) => {
    session.onMessage = onMessage;
    session.onDevices = onDevices;
    return { deviceNames: names, stop: session.stop };
  });
  return session;
}

const wrapper = ({ children }: { children: ReactNode }) => <MidiProvider>{children}</MidiProvider>;

/** Render the MIDI state with a recording sink attached. */
function setup() {
  const calls: string[] = [];
  const hook = renderHook(() => useMidi(), { wrapper });
  act(() => hook.result.current.setSink({
    noteOn: (n, v) => calls.push(`on ${n} ${v}`),
    noteOff: (n) => calls.push(`off ${n}`),
  }));
  return { hook, calls };
}

const pedalDown = new Uint8Array([0xb0, 64, 127]);
const on = (n: number) => new Uint8Array([0x90, n, 100]);
const off = (n: number) => new Uint8Array([0x80, n, 0]);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  seam.listen.mockReset();
  seam.supported = true;
  seam.bluetooth = false;
});

describe('MidiContext — sustain reset', () => {
  it('Disconnect releases pending notes and forgets the pedal', async () => {
    const { hook, calls } = setup();
    const first = liveSession(['Keys']);
    await act(async () => { await hook.result.current.connect(); });
    act(() => { first.onMessage!(pedalDown); first.onMessage!(on(60)); first.onMessage!(off(60)); });
    expect(calls).toEqual(['on 60 100']); // note-off held by the pedal

    act(() => hook.result.current.disconnect());
    expect(calls).toEqual(['on 60 100', 'off 60']);
    expect(first.stop).toHaveBeenCalledTimes(1);

    // Reconnect with the pedal up: note-offs must go straight through.
    const second = liveSession(['Keys']);
    await act(async () => { await hook.result.current.connect(); });
    calls.length = 0;
    act(() => { second.onMessage!(on(62)); second.onMessage!(off(62)); });
    expect(calls).toEqual(['on 62 100', 'off 62']);
  });

  it('hot-unplug resets the gate (no ringing notes, no phantom pedal)', async () => {
    const { hook, calls } = setup();
    const s = liveSession(['Keys']);
    await act(async () => { await hook.result.current.connect(); });
    act(() => { s.onMessage!(pedalDown); s.onMessage!(on(60)); s.onMessage!(off(60)); });

    act(() => s.onDevices!([])); // keyboard unplugged
    expect(calls).toEqual(['on 60 100', 'off 60']);
    expect(hook.result.current.status).toBe('no-device');

    calls.length = 0;
    act(() => s.onDevices!(['Keys'])); // plugged back in, pedal up
    act(() => { s.onMessage!(on(64)); s.onMessage!(off(64)); });
    expect(calls).toEqual(['on 64 100', 'off 64']);
  });

  it('plugging in another keyboard keeps held notes and the pedal', async () => {
    const { hook, calls } = setup();
    const s = liveSession(['Keys']);
    await act(async () => { await hook.result.current.connect(); });
    act(() => { s.onMessage!(pedalDown); s.onMessage!(on(60)); s.onMessage!(off(60)); });
    act(() => s.onDevices!(['Keys', 'Pads']));
    expect(calls).toEqual(['on 60 100']); // still sustained
  });

  it('losing one of two same-named keyboards still counts as a loss', async () => {
    const { hook, calls } = setup();
    const s = liveSession(['Keys', 'Keys']);
    await act(async () => { await hook.result.current.connect(); });
    act(() => { s.onMessage!(pedalDown); s.onMessage!(on(60)); s.onMessage!(off(60)); });
    act(() => s.onDevices!(['Keys']));
    expect(calls).toEqual(['on 60 100', 'off 60']);
  });
});

describe('MidiContext — connect guard', () => {
  it('concurrent connect() calls share one listening session', async () => {
    let resolve!: (h: unknown) => void;
    seam.listen.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    const { hook } = setup();
    let a!: Promise<void>;
    let b!: Promise<void>;
    act(() => { a = hook.result.current.connect(); b = hook.result.current.connect(); });
    expect(hook.result.current.status).toBe('connecting');
    await act(async () => { resolve({ deviceNames: ['Keys'], stop: vi.fn() }); await Promise.all([a, b]); });
    expect(seam.listen).toHaveBeenCalledTimes(1);
    expect(hook.result.current.status).toBe('connected');
  });

  it('a connect that lands after Disconnect is dropped, not left listening', async () => {
    let resolve!: (h: unknown) => void;
    seam.listen.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    const { hook } = setup();
    let pending!: Promise<void>;
    act(() => { pending = hook.result.current.connect(); });
    act(() => hook.result.current.disconnect());
    const stop = vi.fn();
    await act(async () => { resolve({ deviceNames: ['Keys'], stop }); await pending; });
    expect(stop).toHaveBeenCalledTimes(1);
    expect(hook.result.current.status).toBe('idle');
  });
});
