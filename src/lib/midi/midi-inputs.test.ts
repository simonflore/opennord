// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

const listenNative = vi.fn();
const pairNative = vi.fn();
const listenWeb = vi.fn();

vi.mock('./native-midi-inputs', () => ({
  listenToNativeMidiInputs: (...a: unknown[]) => listenNative(...a),
  showNativeBluetoothPairing: (...a: unknown[]) => pairNative(...a),
}));
vi.mock('./web-midi-inputs', () => ({
  listenToWebMidiInputs: (...a: unknown[]) => listenWeb(...a),
}));

import {
  bluetoothMidiPairingSupported,
  listenToAllMidiInputs,
  midiInputBackend,
  midiInputSupported,
  pairBluetoothMidi,
} from './midi-inputs';

type Nav = { requestMIDIAccess?: unknown };
function setWebMidi(present: boolean) {
  if (present) (navigator as unknown as Nav).requestMIDIAccess = () => Promise.resolve({});
  else delete (navigator as unknown as Nav).requestMIDIAccess;
}
function setCapacitor(platform: 'ios' | 'android' | null) {
  const w = window as unknown as { Capacitor?: unknown };
  if (platform) w.Capacitor = { isNativePlatform: () => true, getPlatform: () => platform };
  else delete w.Capacitor;
}

afterEach(() => {
  vi.clearAllMocks();
  setWebMidi(false);
  setCapacitor(null);
});

describe('midiInputBackend', () => {
  it('uses Web MIDI on a desktop browser', () => {
    setWebMidi(true);
    expect(midiInputBackend()).toBe('web-midi');
    expect(midiInputSupported()).toBe(true);
    expect(bluetoothMidiPairingSupported()).toBe(false);
  });

  it('uses the native CoreMIDI plugin in the iPad app', () => {
    setCapacitor('ios');
    expect(midiInputBackend()).toBe('native');
    expect(midiInputSupported()).toBe(true);
    expect(bluetoothMidiPairingSupported()).toBe(true);
  });

  it('prefers native in the iPad app even if a Web MIDI shim is present', () => {
    setCapacitor('ios');
    setWebMidi(true);
    expect(midiInputBackend()).toBe('native');
  });

  it('is none where neither exists (Safari, iPhone browser)', () => {
    expect(midiInputBackend()).toBe('none');
    expect(midiInputSupported()).toBe(false);
  });

  it('does not route a non-iOS native shell to the iOS-only plugin', () => {
    setCapacitor('android');
    expect(midiInputBackend()).toBe('none');
    setWebMidi(true);
    expect(midiInputBackend()).toBe('web-midi');
  });
});

describe('listenToAllMidiInputs', () => {
  const onMessage = () => {};
  const onDevices = () => {};

  it('dispatches to Web MIDI on desktop', async () => {
    setWebMidi(true);
    const handle = { deviceNames: ['X'], stop() {} };
    listenWeb.mockResolvedValue(handle);
    await expect(listenToAllMidiInputs(onMessage, onDevices)).resolves.toBe(handle);
    expect(listenWeb).toHaveBeenCalledWith(onMessage, onDevices);
    expect(listenNative).not.toHaveBeenCalled();
  });

  it('dispatches to the native plugin in the iPad app', async () => {
    setCapacitor('ios');
    const handle = { deviceNames: [], stop() {} };
    listenNative.mockResolvedValue(handle);
    await expect(listenToAllMidiInputs(onMessage, onDevices)).resolves.toBe(handle);
    expect(listenNative).toHaveBeenCalledWith(onMessage, onDevices);
    expect(listenWeb).not.toHaveBeenCalled();
  });

  it("throws 'unsupported' where there is no MIDI", async () => {
    await expect(listenToAllMidiInputs(onMessage)).rejects.toThrow('unsupported');
  });
});

describe('pairBluetoothMidi', () => {
  it('opens the native sheet in the iPad app', async () => {
    setCapacitor('ios');
    pairNative.mockResolvedValue(undefined);
    await pairBluetoothMidi();
    expect(pairNative).toHaveBeenCalledTimes(1);
  });
  it("throws 'unsupported' on desktop (the OS handles Bluetooth MIDI there)", async () => {
    setWebMidi(true);
    await expect(pairBluetoothMidi()).rejects.toThrow('unsupported');
    expect(pairNative).not.toHaveBeenCalled();
  });
});
