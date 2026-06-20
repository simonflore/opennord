import { DeviceStatus } from './DeviceStatus';

/** Route paths the rail can navigate to — kept in sync with the route tree in router.tsx. */
export type NavTo = '/library' | '/samples' | '/device' | '/compatibility' | '/about' | '/dev/inspect' | '/dev/decode';

interface Props {
  /** Current pathname without its leading slash (e.g. "library", "library/abc", "dev/inspect"). */
  active: string;
  onNavigate: (to: NavTo) => void;
  onManageDevice: () => void;
}

const DESTS: Array<{ to: NavTo; label: string }> = [
  { to: '/library', label: 'Library' },
  { to: '/samples', label: 'Samples' },
  { to: '/device', label: 'Device' },
  { to: '/compatibility', label: 'Compatibility' },
];

// Device transfer rides vendor-USB (WebUSB) — desktop Chrome/Edge or the iPad app
// only. Where it's unavailable, Device stays visible but disabled with a reason.
const usbSupported = typeof navigator !== 'undefined' && 'usb' in navigator;
const DEVICE_DISABLED_HINT = 'Connecting to the Nord needs Chrome or Edge on a computer (or the iPad app).';

const DEV_DESTS: Array<{ to: NavTo; label: string }> = [
  { to: '/dev/inspect', label: 'Decode Inspector' },
  { to: '/dev/decode', label: 'Program Decode' },
];

export function Rail({ active, onNavigate, onManageDevice }: Props) {
  const path = '/' + active;
  // A nav item is active when the path equals it or sits beneath it (e.g.
  // /library/$id keeps Library lit).
  const isActive = (to: NavTo) => path === to || path.startsWith(to + '/');

  return (
    <nav className="on-rail">
      <div className="on-rail__brand">Open<span className="on-rail__brand-accent">Nord</span></div>

      {DESTS.map((d) => {
        const disabled = d.to === '/device' && !usbSupported;
        return (
          <button
            key={d.to}
            className={`on-nav ${isActive(d.to) ? 'on-nav--active' : ''}`.trim()}
            aria-current={isActive(d.to) ? 'page' : undefined}
            disabled={disabled}
            title={disabled ? DEVICE_DISABLED_HINT : undefined}
            onClick={() => onNavigate(d.to)}
          >
            {d.label}
          </button>
        );
      })}

      <div className="on-rail__spacer" />

      <DeviceStatus onManage={onManageDevice} />

      <details className="on-rail__dev">
        <summary>Developer</summary>
        {DEV_DESTS.map((d) => (
          <button
            key={d.to}
            className={`on-nav on-nav--sub ${isActive(d.to) ? 'on-nav--active' : ''}`.trim()}
            aria-current={isActive(d.to) ? 'page' : undefined}
            onClick={() => onNavigate(d.to)}
          >
            {d.label}
          </button>
        ))}
      </details>

      <button
        className={`on-nav on-rail__about ${isActive('/about') ? 'on-nav--active' : ''}`.trim()}
        aria-current={isActive('/about') ? 'page' : undefined}
        onClick={() => onNavigate('/about')}
      >
        About &amp; legal
      </button>

      <div
        className="on-rail__note"
        title="OpenNord is alpha software, provided as-is with no warranty. Features may break, and device transfer writes to real hardware — back up your keyboard first. Use at your own risk."
      >
        <span className="on-rail__note-tag">ALPHA</span>
        <span className="on-rail__note-text">use at your own risk</span>
      </div>
    </nav>
  );
}
