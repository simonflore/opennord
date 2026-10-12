import { useEffect, useRef } from 'react';
import { plainShortcut } from './plainShortcut';
import { isLetterKey } from '../../lib/keys';
import type { LibraryEntry } from '../../lib/library/types';

/**
 * J and K open the next and previous program in the list, counted from the open
 * one (from the top with none open). Nord slots not read yet (no program) are
 * stepped over, since opening one leaves for the Device page. Left alone while
 * typing or composing, over a dialog, with a modifier held, on key repeat, or
 * when something else already handled the key;
 * a non-Latin layout uses the keys in J's and K's places. One listener for the
 * page's lifetime, reading the latest list through a ref.
 */
export function useStepKeys(entries: LibraryEntry[], activeId: string | null | undefined, onOpen: (e: LibraryEntry) => void) {
  const latest = useRef({ entries, activeId, onOpen });
  useEffect(() => { latest.current = { entries, activeId, onOpen }; });
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const step = isLetterKey(ev, 'j') ? 1 : isLetterKey(ev, 'k') ? -1 : 0;
      if (!step || !plainShortcut(ev)) return;
      const { entries, activeId, onOpen } = latest.current;
      const at = entries.findIndex((e) => e.id === activeId);
      let i = at < 0 ? (step > 0 ? -1 : entries.length) : at;
      do i += step; while (i >= 0 && i < entries.length && !entries[i].program);
      const next = entries[i];
      if (!next) return;
      ev.preventDefault();
      onOpen(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
