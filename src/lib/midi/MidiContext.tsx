import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { parseNoteMessage } from './note-input';
import { createSustainGate, type NoteSink, type SustainGate } from './sustain-gate';
import { listenToAllMidiInputs, type MidiInputsHandle } from './midi-inputs';

export type MidiStatus = 'unsupported' | 'idle' | 'connecting' | 'connected' | 'denied' | 'no-device';

export interface MidiState {
  status: MidiStatus;
  deviceNames: string[];
  supported: boolean;
  connect(): Promise<void>;
  disconnect(): void;
  /** Point MIDI input at the active sampler (or null to silence it). */
  setSink(sink: NoteSink | null): void;
}

const SUPPORTED = typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';

function useMidiStateValue(): MidiState {
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
  const [status, setStatus] = useState<MidiStatus>(SUPPORTED ? 'idle' : 'unsupported');
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
    if (!SUPPORTED) { setStatus('unsupported'); return; }
    setStatus('connecting');
    try {
      const handle = await listenToAllMidiInputs(onMessage, onDevices);
      handleRef.current = handle;
      setDeviceNames(handle.deviceNames);
      setStatus(handle.deviceNames.length > 0 ? 'connected' : 'no-device');
    } catch (e) {
      setStatus(e instanceof Error && e.message === 'denied' ? 'denied' : 'unsupported');
    }
  }, [onMessage, onDevices]);

  const disconnect = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    gateRef.current?.allNotesOff();
    setStatus(SUPPORTED ? 'idle' : 'unsupported');
    setDeviceNames([]);
  }, []);

  const setSink = useCallback((sink: NoteSink | null) => {
    gateRef.current?.allNotesOff(); // never strand a held note on the previous sampler
    sinkRef.current = sink;
  }, []);

  useEffect(() => () => { handleRef.current?.stop(); }, []);

  return useMemo(
    () => ({ status, deviceNames, supported: SUPPORTED, connect, disconnect, setSink }),
    [status, deviceNames, connect, disconnect, setSink],
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
