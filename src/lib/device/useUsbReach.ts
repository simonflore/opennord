import { useSyncExternalStore } from 'react';
import { nordUsbAvailable, usbAvailability } from './capacitor-usb';

// One probe for the whole app: the iPad's driver state, shared by every caller,
// probed when the first one subscribes and again whenever the app returns to
// the foreground (the driver is approved in Settings mid-session).
let ready: boolean | null = null;
let probes = 0;
const listeners = new Set<() => void>();
function probe() {
  const n = ++probes;
  void nordUsbAvailable().then((ok) => {
    if (n !== probes || ok === ready) return; // only the latest probe counts
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
 * How this host reaches a Nord (`reach`, see usbAvailability) and whether it can
 * connect one now: Electron and WebUSB can, an iPad once its USB driver is
 * approved (probed once for the whole app, and again on returning to the
 * foreground), an iPhone or a browser without WebUSB can't. The Device page and
 * the top bar's Connect read it here, so they can't disagree.
 */
export function useUsbReach() {
  const reach = usbAvailability();
  const ipad = reach === 'ipad-dext-pending';
  const ipadReady = useSyncExternalStore(ipad ? subscribe : noop, () => ready, () => null);
  return { reach, reachable: reach === 'webusb' || reach === 'electron' || (ipad && ipadReady === true) };
}
