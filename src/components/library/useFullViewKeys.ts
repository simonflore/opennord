import { useEffect, useRef } from 'react';
import { plainShortcut } from './plainShortcut';
import { isLetterKey } from '../../lib/keys';

/**
 * F opens the open program across the full width and closes it back to the
 * inspector; Escape closes it too. Left alone while typing or composing, over a
 * dialog, with a modifier held, on key repeat, or when something else already
 * handled the key (plainShortcut, shared with J/K). Off while `enabled` is false
 * (nothing open, or no room for the inspector).
 */
export function useFullViewKeys(enabled: boolean, full: boolean, onFull: (on: boolean) => void) {
  const latest = useRef({ enabled, full, onFull });
  useEffect(() => { latest.current = { enabled, full, onFull }; });
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const { enabled, full, onFull } = latest.current;
      if (!enabled) return;
      const toggle = isLetterKey(ev, 'f');
      const close = ev.key === 'Escape' && full;
      if ((!toggle && !close) || !plainShortcut(ev)) return;
      ev.preventDefault();
      onFull(close ? false : !full);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
