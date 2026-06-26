import { useCallback, useEffect, useState } from 'react';
import type { WriteBackMode } from '../folder/writeBack';

const KEY = 'opennord.writeback.mode';
const parse = (raw: string | null): WriteBackMode =>
  raw === 'new' || raw === 'overwrite' ? raw : 'ask';

/** Remembered "save to folder" overwrite policy. Default `ask`; the dialog's
 *  "remember my choice" sets `new`/`overwrite`. */
export function useWriteBackPref() {
  const [mode, setModeState] = useState<WriteBackMode>(() => parse(localStorage.getItem(KEY)));
  useEffect(() => { try { localStorage.setItem(KEY, mode); } catch { /* storage off */ } }, [mode]);
  const setMode = useCallback((m: WriteBackMode) => setModeState(m), []);
  return { mode, setMode };
}
