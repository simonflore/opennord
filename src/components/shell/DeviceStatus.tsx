import { cn } from '@/lib/cn';
import { Button } from '../ui';
import { useDevice } from '../../lib/device/DeviceContext';

/**
 * The rail's connection status box — a top-lit panel (`fill-devbox elev-1`,
 * its own step between --bg and --surface) so it reads as physical hardware
 * chrome rather than flat UI. Hidden on the mobile rail: device transfer
 * rides vendor-USB, unreachable from a phone browser (desktop / native iPad
 * only — see Rail's DEVICE_DISABLED_HINT).
 */
export function DeviceStatus({ onManage }: { onManage: () => void }) {
  const { session, deviceName, entries } = useDevice();
  const boxClass = 'rounded-md border border-line p-2.5 fill-devbox elev-1 max-[720px]:hidden';

  if (!session) {
    return (
      <div className={cn(boxClass, 'flex flex-col gap-2')}>
        <div className="text-[9px] font-bold tracking-[1px] text-muted">○ No Nord connected</div>
        <Button variant="secondary" onClick={onManage}>Connect</Button>
      </div>
    );
  }
  return (
    <div className={boxClass}>
      <div className="text-[9px] font-bold tracking-[1px] text-connected">● Connected</div>
      <div className="mt-[3px] text-[11px] font-semibold text-ink">{deviceName || 'Nord Stage 4'}</div>
      <div className="mt-px text-[9px] text-muted">{entries.length} programs</div>
      <div className="mt-2">
        <Button variant="secondary" onClick={onManage}>Manage</Button>
      </div>
    </div>
  );
}
