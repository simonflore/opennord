import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { NordSession } from './session';
import type { ProgramEntry } from './transfer';
import type { PartitionCapacity } from './capacity';
import type { PresetGroup } from './presets';
import { enumeratePrograms } from './transfer';
import { readPartitionCapacity } from './capacity';

interface DeviceState {
  session: NordSession | null;
  entries: ProgramEntry[];
  deviceName: string;
  /** USB idProduct of the connected device (0 until connected). */
  productId: number;
  /** User Sample Library files enumerated from the device (partition 5). */
  sampleEntries: ProgramEntry[];
  setSampleEntries: (e: ProgramEntry[]) => void;
  /** Preset groups enumerated from the device (organ/piano/synth partitions). */
  presetEntries: PresetGroup[];
  setPresetEntries: (g: PresetGroup[]) => void;
  /** User Piano Library files enumerated from the device (partition 1). */
  pianoEntries: ProgramEntry[];
  setPianoEntries: (e: ProgramEntry[]) => void;
  /** Program partition capacity (slots + free space), or null until read. */
  capacity: PartitionCapacity | null;
  setCapacity: (c: PartitionCapacity | null) => void;
  setConnection: (s: NordSession, e: ProgramEntry[], name: string, productId: number) => void;
  /** Whether `s` is still the connected session: a read that finishes after a
   *  reconnect or disconnect checks this before storing what it read. */
  isCurrent: (s: NordSession) => boolean;
  setEntries: (e: ProgramEntry[]) => void;
  /** Read the program list (and storage) of `s` again, after something changed it (a restore, a send). */
  refresh: (s: NordSession) => Promise<void>;
  disconnect: () => void;
  /** True after the Nord went away on its own (unplugged, switched off), until the next connect. */
  lost: boolean;
  /** The connect under way or last tried, shared by every Connect button (useConnectNord). */
  connectState: ConnectState;
  /** Claim the one connect: false while another is under way (the top bar's and the
   *  Device page's Connect must not open the same Nord twice). */
  beginConnect: () => boolean;
  /** Settle the claimed connect. */
  endConnect: (state: ConnectState) => void;
}

export interface ConnectState { status: 'idle' | 'connecting' | 'connected' | 'error'; message: string }

const Ctx = createContext<DeviceState | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<NordSession | null>(null);
  const [entries, setEntries] = useState<ProgramEntry[]>([]);
  const [sampleEntries, setSampleEntries] = useState<ProgramEntry[]>([]);
  const [presetEntries, setPresetEntries] = useState<PresetGroup[]>([]);
  const [pianoEntries, setPianoEntries] = useState<ProgramEntry[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [productId, setProductId] = useState(0);
  const [capacity, setCapacity] = useState<PartitionCapacity | null>(null);
  // The connected session right now (set with it, not after a render), for isCurrent.
  const current = useRef<NordSession | null>(null);
  const isCurrent = useCallback((s: NordSession) => current.current === s, []);
  const [lost, setLost] = useState(false);
  const [connectState, setConnectState] = useState<ConnectState>({ status: 'idle', message: '' });
  // Set synchronously, so two clicks in the same moment can't both start a connect.
  const connecting = useRef(false);
  const beginConnect = useCallback(() => {
    if (connecting.current) return false;
    connecting.current = true;
    setConnectState({ status: 'connecting', message: '' });
    return true;
  }, []);
  const endConnect = useCallback((state: ConnectState) => {
    connecting.current = false;
    setConnectState(state);
  }, []);

  // Forget the connected Nord: its session and every list read from it.
  const forget = useCallback(() => {
    const s = current.current;
    current.current = null;
    // Release the USB interface, or the next connect fails "busy" as if NSM
    // held the device. Best-effort: the state reset must not hinge on it.
    void s?.close().catch(() => undefined);
    setSession(null); setEntries([]); setSampleEntries([]); setPresetEntries([]); setPianoEntries([]); setDeviceName(''); setProductId(0); setCapacity(null);
  }, []);

  const refresh = useCallback(async (s: NordSession) => {
    await s.withSession(s.programPartition, async () => {
      const programs = await enumeratePrograms(s);
      // Best-effort: a failed capacity read shouldn't break the program list.
      const cap = await readPartitionCapacity(s, s.programPartition).catch(() => null);
      if (current.current !== s) return; // another Nord connected meanwhile
      setEntries(programs);
      setCapacity(cap);
    });
  }, []);

  const value: DeviceState = {
    session, entries, deviceName, productId,
    sampleEntries, setSampleEntries,
    presetEntries, setPresetEntries,
    pianoEntries, setPianoEntries,
    capacity, setCapacity,
    // A new connection starts without the last Nord's per-device state (sample,
    // preset and piano lists, capacity): each is read again for this session,
    // and the last Nord's lists name slots this one may fill differently.
    isCurrent,
    setConnection: (s, e, name, pid) => {
      current.current = s;
      setLost(false);
      // An unplugged Nord: without this the lists stay up as if it were still there.
      s.onLost(() => { if (current.current === s) { forget(); setLost(true); } });
      setSession(s); setEntries(e); setDeviceName(name); setProductId(pid);
      setSampleEntries([]); setPresetEntries([]); setPianoEntries([]); setCapacity(null);
    },
    setEntries,
    refresh,
    disconnect: forget,
    lost,
    connectState, beginConnect, endConnect,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDevice(): DeviceState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDevice must be used within DeviceProvider');
  return v;
}
