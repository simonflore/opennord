import { useCallback, useEffect, useState } from 'react';
import type { WriteBackMode } from '../folder/writeBack';

const KEY = 'opennord.writeback.mode';
const parse = (raw: string | null): WriteBackMode =>
  raw === 'new' || raw === 'overwrite' ? raw : 'ask';

/** Remembered "save to folder" overwrite policy. Default `ask`; the dialog's
 *  "remember my choice" sets `new`/`overwrite`. Scoped per flow (`scope`) so a
 *  remembered "overwrite" from a small sample conversion never silently governs
 *  a multi-GB backup re-export (or vice versa). The pre-scope global key is
 *  deliberately not migrated — falling back to `ask` once is the safe reset. */
export function useWriteBackPref(scope = 'default') {
  const key = `${KEY}.${scope}`;
  const [mode, setModeState] = useState<WriteBackMode>(() => parse(localStorage.getItem(key)));
  useEffect(() => { try { localStorage.setItem(key, mode); } catch { /* storage off */ } }, [key, mode]);
  const setMode = useCallback((m: WriteBackMode) => setModeState(m), []);
  return { mode, setMode };
}
