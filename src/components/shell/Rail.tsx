import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';
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

/**
 * A rail nav item. `active` swaps the quiet dim label for the raised panel
 * chip (`fill-raised elev-1`) + a red left-accent bar — mirrors the old
 * `.on-nav--active` look, refined with a real hover state and a visible
 * keyboard focus ring (the old CSS had neither). `sub` shrinks text/indent
 * and the accent bar for category / sub-route entries.
 */
const navItem = cva(
  cn(
    'relative block w-full text-left bg-transparent border-0 cursor-pointer select-none',
    'font-semibold px-2.5 py-[7px] rounded-sm',
    'transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
    'disabled:text-muted disabled:cursor-not-allowed disabled:opacity-55',
  ),
  {
    variants: {
      active: {
        true: cn(
          'fill-raised elev-1 text-ink',
          "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:content-['']",
          'before:w-[3px] before:rounded-[0_2px_2px_0] before:bg-red',
        ),
        false: 'text-dim hover:text-ink hover:[background:color-mix(in_srgb,var(--lift)_3%,transparent)]',
      },
      sub: {
        true: 'text-[11px] pl-4',
        false: 'text-xs',
      },
    },
    compoundVariants: [
      { active: true, sub: false, class: 'before:h-4' },
      { active: true, sub: true, class: 'before:h-3' },
    ],
    defaultVariants: { active: false, sub: false },
  },
);

export function Rail({ active, onNavigate, onManageDevice }: Props) {
  const caps = useCapabilities();
  const path = '/' + active;
  // A nav item is active when the path equals it or sits beneath it (e.g.
  // /library/$id keeps Library lit).
  const isActive = (to: NavTo) => path === to || path.startsWith(to + '/');

  return (
    <nav
      className={cn(
        // Plain class kept as a hook: `[data-native] .on-rail` in shell.css layers
        // Capacitor safe-area insets on top of the utilities below (the web
        // build stays byte-identical since the attribute is never present there).
        'on-rail',
        'flex flex-col gap-0.5 fill-sink box-border',
        'w-[188px] px-3 py-4 border-r border-line',
        'sticky top-0 self-start h-screen overflow-y-auto',
        'shadow-[inset_-1px_0_0_color-mix(in_srgb,var(--lift)_3%,transparent)]',
        'max-[720px]:w-auto max-[720px]:flex-row max-[720px]:items-center',
        'max-[720px]:overflow-x-auto max-[720px]:overflow-y-visible',
        'max-[720px]:border-r-0 max-[720px]:border-b max-[720px]:py-2',
        'max-[720px]:static max-[720px]:h-auto max-[720px]:self-auto',
      )}
    >
      <div className="px-2 pt-0.5 pb-4 text-base font-extrabold tracking-[-0.2px] text-ink">
        Open<span className="italic text-red">Nord</span>
      </div>

      {/* Library + its category sub-nav (registry-driven) */}
      <button
        className={navItem({ active: isActive('/library') })}
        aria-current={isActive('/library') ? 'page' : undefined}
        onClick={() => onNavigate('/library')}
      >
        Library
      </button>
      {isActive('/library') && LIBRARY_CATEGORIES.map((c) => (
        <button
          key={c.id}
          className={navItem({ active: path === c.path || path.startsWith(c.path + '/'), sub: true })}
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
            className={navItem({ active: isActive(d.to) })}
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
          className={navItem({ active: isActive(CLOUD_TO) })}
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
            className={navItem({ active: isActive(COMMUNITY_TO) })}
            aria-current={isActive(COMMUNITY_TO) ? 'page' : undefined}
            onClick={() => onNavigate(COMMUNITY_TO)}
          >
            Community
          </button>
          {isActive(COMMUNITY_TO) && COMMUNITY_SUB.map((d) => (
            <button
              key={d.to}
              className={navItem({ active: path === d.to, sub: true })}
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
          className={navItem({ active: isActive(d.to) })}
          aria-current={isActive(d.to) ? 'page' : undefined}
          onClick={() => onNavigate(d.to)}
        >
          {d.label}
        </button>
      ))}

      <div className="flex-1 max-[720px]:hidden" />

      <DeviceStatus onManage={onManageDevice} />

      {__RE__ && (
        <details className="mt-2 max-[720px]:hidden">
          <summary className="cursor-pointer px-2 py-1.5 text-[9px] text-muted">Developer</summary>
          {DEV_DESTS.map((d) => (
            <button
              key={d.to}
              className={navItem({ active: isActive(d.to), sub: true })}
              aria-current={isActive(d.to) ? 'page' : undefined}
              onClick={() => onNavigate(d.to)}
            >
              {d.label}
            </button>
          ))}
        </details>
      )}

      <button
        className={cn(navItem({ active: isActive('/about') }), 'mt-1 text-muted')}
        aria-current={isActive('/about') ? 'page' : undefined}
        onClick={() => onNavigate('/about')}
      >
        About &amp; legal
      </button>

      <div
        className={cn(
          'mt-2 flex flex-col gap-[3px] border-t border-line p-2',
          'max-[720px]:mt-0 max-[720px]:ml-auto max-[720px]:border-t-0 max-[720px]:p-0',
        )}
        title="OpenNord is alpha software, provided as-is with no warranty. Features may break, and device transfer writes to real hardware — back up your keyboard first. Use at your own risk."
      >
        <span className="self-start rounded-sm border border-warn px-[5px] py-px text-[8px] font-bold tracking-[1px] text-warn">
          ALPHA
        </span>
        <span className="text-[9px] leading-[1.4] text-muted max-[720px]:hidden">use at your own risk</span>
      </div>
    </nav>
  );
}
