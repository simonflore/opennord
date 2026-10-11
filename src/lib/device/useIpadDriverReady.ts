import { useSyncExternalStore } from 'react';
import { nordUsbAvailable } from './capacitor-usb';

// One probe for the whole app: the iPad's driver state, shared by every caller,
// probed when the first one subscribes and again whenever the app returns to
// the foreground (the driver is approved in Settings mid-session).
let ready: boolean | null = null;
const listeners = new Set<() => void>();
function probe() {
  void nordUsbAvailable().then((ok) => {
    if (ok === ready) return;
    ready = ok;
    for (const l of listeners) l();
  });
}
function onVisible() { if (document.visibilityState === 'visible') probe(); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) { probe(); document.addEventListener('visibilitychange', onVisible); }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) document.removeEventListener('visibilitychange', onVisible);
  };
}
const noop = () => () => {};

/**
 * On an iPad (`ipad` true), whether its USB driver is installed and ready:
 * null while probing, then true/false. The Device page and the top bar's
 * Connect share one probe.
 */
export function useIpadDriverReady(ipad: boolean): boolean | null {
  const value = useSyncExternalStore(ipad ? subscribe : noop, () => ready, () => null);
  return ipad ? value : false;
}
