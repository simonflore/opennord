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
  // The connect in flight, if any: a second tap (or the pairing flow) joins it
  // instead of opening a duplicate listening session.
  const connectingRef = useRef<Promise<void> | null>(null);
  // Bumped by Disconnect / unmount, so a connect that resolves afterwards is dropped.
  const epochRef = useRef(0);
  // Inputs present right now — to notice one going away.
  const namesRef = useRef<string[]>([]);
  const [status, setStatus] = useState<MidiStatus>(supported ? 'idle' : 'unsupported');
  const [deviceNames, setDeviceNames] = useState<string[]>([]);

  /** End the listening session and reset the sustain gate fully — every note
   *  released AND the pedal forgotten. Explicit, not left to effect re-runs. */
  const stopListening = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    namesRef.current = [];
    gateRef.current?.reset();
  }, []);

  const onDevices = useCallback((names: string[]) => {
    // Hot-unplug / source loss: the pedal may have gone with the keyboard, and
    // its note-offs with it — reset the gate so nothing keeps ringing and the
    // next keyboard doesn't start with a phantom pedal held down.
    if (lostInput(namesRef.current, names)) gateRef.current?.reset();
    namesRef.current = names;
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

  const connect = useCallback((): Promise<void> => {
    if (connectingRef.current) return connectingRef.current; // already connecting: join it
    const run = (async () => {
      if (!supported) { setStatus('unsupported'); return; }
      setStatus('connecting');
      // A retry ("plug one in & retry") must not leave the previous session bound.
      stopListening();
      const epoch = epochRef.current;
      try {
        const handle = await listenToAllMidiInputs(onMessage, onDevices);
        if (epoch !== epochRef.current) { handle.stop(); return; } // disconnected meanwhile
        handleRef.current = handle;
        namesRef.current = handle.deviceNames;
        setDeviceNames(handle.deviceNames);
        setStatus(handle.deviceNames.length > 0 ? 'connected' : 'no-device');
      } catch (e) {
        if (epoch !== epochRef.current) return;
        const reason = e instanceof Error ? e.message : '';
        setStatus(reason === 'denied' ? 'denied' : reason === 'failed' ? 'failed' : 'unsupported');
      }
    })();
    const tracked = run.finally(() => {
      if (connectingRef.current === tracked) connectingRef.current = null;
    });
    connectingRef.current = tracked;
    return tracked;
  }, [supported, onMessage, onDevices, stopListening]);

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
    epochRef.current++; // a connect still in flight is dropped when it lands
    connectingRef.current = null;
    stopListening();
    setStatus(supported ? 'idle' : 'unsupported');
    setDeviceNames([]);
  }, [supported, stopListening]);

  const setSink = useCallback((sink: NoteSink | null) => {
    gateRef.current?.allNotesOff(); // never strand a held note on the previous sampler
    sinkRef.current = sink;
  }, []);

  useEffect(() => () => { epochRef.current++; stopListening(); }, [stopListening]);

  return useMemo(
    () => ({
      status, deviceNames, supported, bluetoothPairing, connect, pairBluetooth, disconnect, setSink,
    }),
    [status, deviceNames, supported, bluetoothPairing, connect, pairBluetooth, disconnect, setSink],
  );
}

/** True when an input present before is missing now (names are a multiset:
 *  two keyboards of the same model unplugging one still counts). */
function lostInput(before: readonly string[], after: readonly string[]): boolean {
  const left = new Map<string, number>();
  for (const n of after) left.set(n, (left.get(n) ?? 0) + 1);
  for (const n of before) {
    const k = left.get(n) ?? 0;
    if (k === 0) return true;
    left.set(n, k - 1);
  }
  return false;
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
