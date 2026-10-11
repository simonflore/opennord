/**
 * "Help improve file support" — the per-device opt-in for `file.read` diagnostics
 * (see file-read.ts). OFF by default; stored in this browser's localStorage only,
 * never synced. Every storage access is guarded: when storage is unavailable
 * (private mode, blocked site data) the choice lasts for this session only.
 */
import { useCallback, useEffect, useState } from 'react';

export const FILE_SUPPORT_PREF_KEY = 'opennord.diagnostics.fileSupport';

/** Fired on window when the pref changes in this tab, so every mounted toggle agrees. */
const CHANGE_EVENT = 'opennord:file-support-pref';

/** Session fallback for when localStorage throws. */
let sessionValue = false;

/** Whether the player opted in on this device. Never throws. */
export function readFileSupportOptIn(): boolean {
  try {
    const store = globalThis.localStorage;
    if (!store) return sessionValue;
    return store.getItem(FILE_SUPPORT_PREF_KEY) === 'on';
  } catch {
    return sessionValue;
  }
}

/** Persist the opt-in (on → 'on', off → removed). Never throws. */
export function writeFileSupportOptIn(on: boolean): void {
  sessionValue = on;
  try {
    if (on) globalThis.localStorage?.setItem(FILE_SUPPORT_PREF_KEY, 'on');
    else globalThis.localStorage?.removeItem(FILE_SUPPORT_PREF_KEY);
  } catch {
    /* storage unavailable — the session value above stands in */
  }
  try {
    globalThis.dispatchEvent?.(new Event(CHANGE_EVENT));
  } catch {
    /* no window */
  }
}

/** Reactive opt-in for the toggle UI. */
export function useFileSupportOptIn(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(readFileSupportOptIn);
  useEffect(() => {
    const sync = () => setOn(readFileSupportOptIn());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync); // another tab
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const set = useCallback((next: boolean) => writeFileSupportOptIn(next), []);
  return [on, set];
}
