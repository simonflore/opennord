import { createContext, useContext, useState, type ReactNode } from 'react';
import type { NordSession } from './session';
import type { ProgramEntry } from './transfer';
import type { PartitionCapacity } from './capacity';
import type { PresetGroup } from './presets';

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
  setEntries: (e: ProgramEntry[]) => void;
  disconnect: () => void;
}

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

  const value: DeviceState = {
    session, entries, deviceName, productId,
    sampleEntries, setSampleEntries,
    presetEntries, setPresetEntries,
    pianoEntries, setPianoEntries,
    capacity, setCapacity,
    setConnection: (s, e, name, pid) => { setSession(s); setEntries(e); setDeviceName(name); setProductId(pid); },
    setEntries,
    disconnect: () => {
      // Release the USB interface, or the next connect fails "busy" as if NSM
      // held the device. Best-effort: the state reset must not hinge on it.
      void session?.close().catch(() => undefined);
      setSession(null); setEntries([]); setSampleEntries([]); setPresetEntries([]); setPianoEntries([]); setDeviceName(''); setProductId(0); setCapacity(null);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDevice(): DeviceState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDevice must be used within DeviceProvider');
  return v;
}
