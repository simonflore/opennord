import { LIBRARY_CATEGORIES } from '../../lib/library/categories';
import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';
import { DeviceStatus } from './DeviceStatus';
import type { NavTo } from './nav';
export type { NavTo } from './nav';

interface Props {
  /** Current pathname without its leading slash (e.g. "library", "library/abc", "dev/inspect"). */
  active: string;
  onNavigate: (to: NavTo) => void;
  onManageDevice: () => void;
}

const DESTS: Array<{ to: NavTo; label: string }> = [
  { to: '/device', label: 'Device' },
  { to: '/compatibility', label: 'Compatibility' },
];

// RE-only destinations — present only in the web/dev build (__RE__).
const RE_DESTS: Array<{ to: NavTo; label: string }> = [{ to: '/contribute', label: 'Contribute' }];

// Cloud is a build-injected route (present only when a proprietary build supplies it +
// the cloud capability is available), so it sits outside the base NavTo union — cast once.
const CLOUD_TO = '/cloud' as NavTo;

// Community is likewise build-injected (proprietary build + community capability). Same
// cast rationale as Cloud. The sub-items are the reachable community destinations.
const COMMUNITY_TO = '/community' as NavTo;
const COMMUNITY_SUB: Array<{ to: NavTo; label: string }> = [
  { to: '/community' as NavTo, label: 'Browse' },
  { to: '/community/share' as NavTo, label: 'Share a patch' },
  { to: '/community/mine' as NavTo, label: 'My shares' },
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
  const caps = useCapabilities();
  const path = '/' + active;
  // A nav item is active when the path equals it or sits beneath it (e.g.
  // /library/$id keeps Library lit).
  const isActive = (to: NavTo) => path === to || path.startsWith(to + '/');

  return (
    <nav className="on-rail">
      <div className="on-rail__brand">Open<span className="on-rail__brand-accent">Nord</span></div>

      {/* Library + its category sub-nav (registry-driven) */}
      <button
        className={`on-nav ${isActive('/library') ? 'on-nav--active' : ''}`.trim()}
        aria-current={isActive('/library') ? 'page' : undefined}
        onClick={() => onNavigate('/library')}
      >
        Library
      </button>
      {isActive('/library') && LIBRARY_CATEGORIES.map((c) => (
        <button
          key={c.id}
          className={`on-nav on-nav--sub ${path === c.path || path.startsWith(c.path + '/') ? 'on-nav--active' : ''}`.trim()}
          aria-current={path === c.path ? 'page' : undefined}
          disabled={!c.ready}
          title={c.ready ? undefined : 'Coming soon'}
          onClick={c.ready ? () => onNavigate(c.path) : undefined}
        >
          {c.label}
        </button>
      ))}

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

      {/* Cloud — proprietary builds light this up via the capability seam; the open
          client (cloud unavailable) never shows a dead link. */}
      {caps.cloud.available && (
        <button
          className={`on-nav ${isActive(CLOUD_TO) ? 'on-nav--active' : ''}`.trim()}
          aria-current={isActive(CLOUD_TO) ? 'page' : undefined}
          onClick={() => onNavigate(CLOUD_TO)}
        >
          Cloud
        </button>
      )}

      {/* Community — proprietary builds light this up via the capability seam; the open
          client (community unavailable) never shows a dead link. Sub-items appear while
          on any community route. */}
      {caps.community.available && (
        <>
          <button
            className={`on-nav ${isActive(COMMUNITY_TO) ? 'on-nav--active' : ''}`.trim()}
            aria-current={isActive(COMMUNITY_TO) ? 'page' : undefined}
            onClick={() => onNavigate(COMMUNITY_TO)}
          >
            Community
          </button>
          {isActive(COMMUNITY_TO) && COMMUNITY_SUB.map((d) => (
            <button
              key={d.to}
              className={`on-nav on-nav--sub ${path === d.to ? 'on-nav--active' : ''}`.trim()}
              aria-current={path === d.to ? 'page' : undefined}
              onClick={() => onNavigate(d.to)}
            >
              {d.label}
            </button>
          ))}
        </>
      )}

      {__RE__ && RE_DESTS.map((d) => (
        <button
          key={d.to}
          className={`on-nav ${isActive(d.to) ? 'on-nav--active' : ''}`.trim()}
          aria-current={isActive(d.to) ? 'page' : undefined}
          onClick={() => onNavigate(d.to)}
        >
          {d.label}
        </button>
      ))}

      <div className="on-rail__spacer" />

      <DeviceStatus onManage={onManageDevice} />

      {__RE__ && (
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
      )}

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
