import { Button } from '../ui';
import { useDevice } from '../../lib/device/DeviceContext';

export function DeviceStatus({ onManage }: { onManage: () => void }) {
  const { session, deviceName, entries } = useDevice();
  if (!session) {
    return (
      <div className="on-devbox on-devbox--off">
        <div className="on-devbox__state">○ No Nord connected</div>
        <Button variant="secondary" onClick={onManage}>Connect</Button>
      </div>
    );
  }
  return (
    <div className="on-devbox">
      <div className="on-devbox__state on-devbox__state--on">● Connected</div>
      <div className="on-devbox__name">{deviceName || 'Nord Stage 4'}</div>
      <div className="on-devbox__meta">{entries.length} programs</div>
      <div className="on-devbox__actions">
        <Button variant="secondary" onClick={onManage}>Manage</Button>
      </div>
    </div>
  );
}
