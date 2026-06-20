import { createContext, useContext, useState, type ReactNode } from 'react';
import type { NordSession } from './session';
import type { ProgramEntry } from './transfer';

interface DeviceState {
  session: NordSession | null;
  entries: ProgramEntry[];
  deviceName: string;
  /** USB idProduct of the connected device (0 until connected). */
  productId: number;
  setConnection: (s: NordSession, e: ProgramEntry[], name: string, productId: number) => void;
  setEntries: (e: ProgramEntry[]) => void;
  disconnect: () => void;
}

const Ctx = createContext<DeviceState | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<NordSession | null>(null);
  const [entries, setEntries] = useState<ProgramEntry[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [productId, setProductId] = useState(0);

  const value: DeviceState = {
    session, entries, deviceName, productId,
    setConnection: (s, e, name, pid) => { setSession(s); setEntries(e); setDeviceName(name); setProductId(pid); },
    setEntries,
    disconnect: () => { setSession(null); setEntries([]); setDeviceName(''); setProductId(0); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDevice(): DeviceState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDevice must be used within DeviceProvider');
  return v;
}
