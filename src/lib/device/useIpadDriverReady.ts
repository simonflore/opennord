import { useEffect, useState } from 'react';
import { nordUsbAvailable } from './capacitor-usb';

/**
 * On an iPad (`ipad` true), whether its USB driver is installed and ready:
 * null while probing, then true/false. Probes again whenever the app comes back
 * to the foreground, since the driver is approved in Settings mid-session.
 * The Device page and the top bar's Connect share this.
 */
export function useIpadDriverReady(ipad: boolean): boolean | null {
  const [ready, setReady] = useState<boolean | null>(ipad ? null : false);
  useEffect(() => {
    if (!ipad) return;
    let alive = true;
    const probe = () => { void nordUsbAvailable().then((ok) => { if (alive) setReady(ok); }); };
    const onVisible = () => { if (document.visibilityState === 'visible') probe(); };
    probe();
    document.addEventListener('visibilitychange', onVisible);
    return () => { alive = false; document.removeEventListener('visibilitychange', onVisible); };
  }, [ipad]);
  return ready;
}
