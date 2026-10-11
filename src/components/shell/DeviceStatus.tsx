import { Button } from '../ui';
import { useDevice } from '../../lib/device/DeviceContext';
import { Led } from './Led';

/**
 * The Nord's connection, as the top bar shows it: an LED that's green only while
 * a Nord is connected, its name, and Connect or Manage. At phone width only the
 * LED and a short name stay — device transfer rides vendor-USB, which a phone
 * browser can't reach (see usbAvailability in lib/device/capacitor-usb).
 */
export function DeviceStatus({ onManage }: { onManage: () => void }) {
  const { session, deviceName, entries } = useDevice();
  const name = deviceName || 'Nord Stage 4';
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center gap-2 font-mono text-xs text-dim" title={session ? `${name} · ${entries.length} programs` : undefined}>
        <Led on={!!session} tone="connected" />
        {session ? <span>{name}<span className="max-[720px]:hidden"> · USB</span></span> : <span className="max-[720px]:hidden">No Nord connected</span>}
      </span>
      <span className="max-[720px]:hidden">
        <Button variant="secondary" onClick={onManage}>{session ? 'Manage' : 'Connect'}</Button>
      </span>
    </div>
  );
}
