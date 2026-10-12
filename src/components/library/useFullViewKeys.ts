import { useEffect, useRef } from 'react';
import { anyDialogOpen } from '../ui';
import { isLetterKey } from '../../lib/keys';

/**
 * F opens the open program across the full width and closes it back to the
 * inspector; Escape closes it too. Left alone while typing or composing, over a
 * dialog, with a modifier held, on key repeat, or when something else already
 * handled the key — the same rules as useStepKeys. Off while `enabled` is false
 * (nothing open, or no room for the inspector).
 */
export function useFullViewKeys(enabled: boolean, full: boolean, onFull: (on: boolean) => void) {
  const latest = useRef({ enabled, full, onFull });
  useEffect(() => { latest.current = { enabled, full, onFull }; });
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.altKey || ev.shiftKey || ev.repeat || ev.isComposing) return;
      const { enabled, full, onFull } = latest.current;
      if (!enabled) return;
      const toggle = isLetterKey(ev, 'f');
      const close = ev.key === 'Escape' && full;
      if (!toggle && !close) return;
      const t = ev.target;
      const typing = t instanceof HTMLElement && (t.isContentEditable || !!t.closest('input, textarea, select'));
      if (typing || anyDialogOpen()) return;
      ev.preventDefault();
      onFull(close ? false : !full);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
