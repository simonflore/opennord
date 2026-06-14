import { createContext, useContext, useState, type ReactNode } from 'react';
import type { NordSession } from './session';
import type { ProgramEntry } from './transfer';

interface DeviceState {
  session: NordSession | null;
  entries: ProgramEntry[];
  deviceName: string;
  setConnection: (s: NordSession, e: ProgramEntry[], name: string) => void;
  setEntries: (e: ProgramEntry[]) => void;
  disconnect: () => void;
}

const Ctx = createContext<DeviceState | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<NordSession | null>(null);
  const [entries, setEntries] = useState<ProgramEntry[]>([]);
  const [deviceName, setDeviceName] = useState('');

  const value: DeviceState = {
    session, entries, deviceName,
    setConnection: (s, e, name) => { setSession(s); setEntries(e); setDeviceName(name); },
    setEntries,
    disconnect: () => { setSession(null); setEntries([]); setDeviceName(''); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDevice(): DeviceState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDevice must be used within DeviceProvider');
  return v;
}
