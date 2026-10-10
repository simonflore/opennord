import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { parseNoteMessage } from './note-input';
import { createSustainGate, type NoteSink, type SustainGate } from './sustain-gate';
import {
  bluetoothMidiPairingSupported,
  listenToAllMidiInputs,
  midiInputSupported,
  pairBluetoothMidi,
  type MidiInputsHandle,
} from './midi-inputs';

export type MidiStatus = 'unsupported' | 'idle' | 'connecting' | 'connected' | 'denied' | 'no-device' | 'failed';

export interface MidiState {
  status: MidiStatus;
  deviceNames: string[];
  supported: boolean;
  /** The host can pair a Bluetooth MIDI keyboard from inside the app (iPad app). */
  bluetoothPairing: boolean;
  connect(): Promise<void>;
  /** Open the Bluetooth MIDI pairing sheet, then start listening if not already. */
  pairBluetooth(): Promise<void>;
  disconnect(): void;
  /** Point MIDI input at the active sampler (or null to silence it). */
  setSink(sink: NoteSink | null): void;
}

function useMidiStateValue(): MidiState {
  // Host capabilities don't change during a session; read once (Web MIDI on
  // desktop, CoreMIDI in the iPad app — see ./midi-inputs.ts).
  const [supported] = useState(midiInputSupported);
  const [bluetoothPairing] = useState(bluetoothMidiPairingSupported);
  const sinkRef = useRef<NoteSink | null>(null);
  // One gate for the whole session, delegating to whatever sink is current.
  const gateRef = useRef<SustainGate | null>(null);
  if (!gateRef.current) {
    gateRef.current = createSustainGate({
      noteOn: (n, v) => sinkRef.current?.noteOn(n, v),
      noteOff: (n) => sinkRef.current?.noteOff(n),
    });
  }
  const handleRef = useRef<MidiInputsHandle | null>(null);
  const [status, setStatus] = useState<MidiStatus>(supported ? 'idle' : 'unsupported');
  const [deviceNames, setDeviceNames] = useState<string[]>([]);

  const onDevices = useCallback((names: string[]) => {
    setDeviceNames(names);
    // Hot-plug: reflect device presence once we're live.
    setStatus((s) => (s === 'connected' || s === 'no-device') ? (names.length ? 'connected' : 'no-device') : s);
  }, []);

  const onMessage = useCallback((data: Uint8Array) => {
    const ev = parseNoteMessage(data);
    if (!ev) return;
    const gate = gateRef.current!;
    if (ev.type === 'noteOn') gate.noteOn(ev.note, ev.velocity);
    else if (ev.type === 'noteOff') gate.noteOff(ev.note);
    else gate.setSustain(ev.down);
  }, []);

  const connect = useCallback(async () => {
    if (!supported) { setStatus('unsupported'); return; }
    setStatus('connecting');
    // A retry ("plug one in & retry") must not leave the previous session bound.
    handleRef.current?.stop();
    handleRef.current = null;
    try {
      const handle = await listenToAllMidiInputs(onMessage, onDevices);
      handleRef.current = handle;
      setDeviceNames(handle.deviceNames);
      setStatus(handle.deviceNames.length > 0 ? 'connected' : 'no-device');
    } catch (e) {
      const reason = e instanceof Error ? e.message : '';
      setStatus(reason === 'denied' ? 'denied' : reason === 'failed' ? 'failed' : 'unsupported');
    }
  }, [supported, onMessage, onDevices]);

  const pairBluetooth = useCallback(async () => {
    if (!bluetoothPairing) return;
    try {
      await pairBluetoothMidi();
    } catch {
      return; // the sheet couldn't open; the plain connect path still works
    }
    // A newly paired keyboard reaches a live session through hot-plug; if we
    // weren't listening yet, start now so it plays straight away.
    if (!handleRef.current) await connect();
  }, [bluetoothPairing, connect]);

  const disconnect = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    gateRef.current?.allNotesOff();
    setStatus(supported ? 'idle' : 'unsupported');
    setDeviceNames([]);
  }, [supported]);

  const setSink = useCallback((sink: NoteSink | null) => {
    gateRef.current?.allNotesOff(); // never strand a held note on the previous sampler
    sinkRef.current = sink;
  }, []);

  useEffect(() => () => { handleRef.current?.stop(); }, []);

  return useMemo(
    () => ({
      status, deviceNames, supported, bluetoothPairing, connect, pairBluetooth, disconnect, setSink,
    }),
    [status, deviceNames, supported, bluetoothPairing, connect, pairBluetooth, disconnect, setSink],
  );
}

const Ctx = createContext<MidiState | null>(null);

export function MidiProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={useMidiStateValue()}>{children}</Ctx.Provider>;
}

export function useMidi(): MidiState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMidi must be used within MidiProvider');
  return v;
}

/** MIDI state when a MidiProvider is mounted, else null (for views also rendered standalone). */
export function useOptionalMidi(): MidiState | null {
  return useContext(Ctx);
}
