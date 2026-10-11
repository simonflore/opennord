import { useSyncExternalStore } from 'react';
import { nordUsbAvailable, usbAvailability } from './capacitor-usb';

// One probe for the whole app: the iPad's driver state, shared by every caller.
// The driver only shows up once a Nord is plugged in (and switched on in
// Settings), and nothing announces that, so while anyone is listening and it
// isn't there yet, it's asked again every IPAD_RECHECK_MS, and at once when the
// app returns to the foreground.
const IPAD_RECHECK_MS = 2000;
let ready: boolean | null = null;
let probes = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();
function probe() {
  if (ready === true) return; // found: nothing more to wait for
  const n = ++probes;
  // A probe that throws (plugin missing, driver error) means not ready.
  void nordUsbAvailable().catch(() => false).then((ok) => {
    if (n !== probes || ok === ready) return; // only the latest probe counts
    ready = ok;
    for (const l of listeners) l();
  });
}
function onVisible() { if (document.visibilityState === 'visible') probe(); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    probe();
    timer = setInterval(probe, IPAD_RECHECK_MS);
    document.addEventListener('visibilitychange', onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisible);
    ready = null; // the next subscriber probes afresh, not from a stale answer
    probes++; // and a probe still running can't write its old answer back
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
