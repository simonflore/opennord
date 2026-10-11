import { Button } from '../ui';
import { useDevice } from '../../lib/device/DeviceContext';
import { usbAvailability } from '../../lib/device/capacitor-usb';
import { Led } from './Led';


/**
 * The Nord's connection, as the top bar shows it: an LED that's green only while
 * a Nord is connected, its name, and Connect or Manage. At phone width the label
 * folds to the LED (and its screen-reader text), and the button stays only where
 * the phone can reach the Nord over USB (Android Chrome; see usbAvailability).
 */
export function DeviceStatus({ onManage }: { onManage: () => void }) {
  const { session, deviceName, entries } = useDevice();
  // The family is wider than the Stage 4: without a product name, just "Nord".
  const name = deviceName || 'Nord';
  // Whether this host can reach a Nord over USB at all (Android Chrome can; an
  // iPhone or Safari can't). Decides whether a phone shows Connect.
  const reach = usbAvailability();
  const usbReachable = reach !== 'unsupported' && reach !== 'iphone';
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center gap-2 font-mono text-xs text-dim" title={session ? `${name} · ${entries.length} programs` : undefined}>
        <Led on={!!session} tone="connected" />
        {session ? <span>{name}<span className="max-[720px]:hidden"> · USB</span></span> : <span className="max-[720px]:sr-only">No Nord connected</span>}
      </span>
      <span className={usbReachable ? undefined : 'max-[720px]:hidden'}>
        <Button variant="secondary" onClick={onManage}>{session ? 'Manage' : 'Connect'}</Button>
      </span>
    </div>
  );
}
