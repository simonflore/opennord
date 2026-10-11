import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/cn';
import { BetaBadge } from './BetaBadge';
import { DeviceStatus } from './DeviceStatus';
import { Wordmark } from './Wordmark';
import { isApple } from '../../lib/platform';

/**
 * The console's top bar: the wordmark, the ⌘K jump-to field (a button that
 * opens the palette) and the Nord's connection on the right. Sticky, and
 * `--topbar-h` tall (shell.css), so the rail below sizes itself from the same value.
 */
export function TopBar({ onSearch, onManageDevice }: { onSearch: () => void; onManageDevice: () => void }) {
  return (
    <header
      className={cn(
        // `on-topbar`: hook for the native shell's safe-area inset (shell.css).
        'on-topbar sticky top-0 z-30 flex h-[var(--topbar-h)] flex-none items-center gap-4 border-b border-line bg-surface px-4',
        'max-[720px]:gap-3 max-[720px]:px-3',
      )}
    >
      {/* The app's home is the library; the marketing page at / sits outside the app. */}
      <Link to="/library/programs" className="no-underline" aria-label="OpenNord library">
        <Wordmark className="text-sm" />
      </Link>
      <button
        type="button"
        onClick={onSearch}
        aria-keyshortcuts={isApple ? 'Meta+K' : 'Control+K'}
        className={cn(
          'flex h-[30px] min-w-0 max-w-[540px] flex-1 cursor-pointer items-center gap-2.5 rounded-sm border border-line fill-sink px-2.5 text-left',
          'font-mono text-xs text-muted transition-colors hover:border-muted',
          'max-[720px]:max-w-none',
        )}
      >
        <kbd className="flex-none rounded-[3px] border border-line px-1.5 py-px font-mono text-[10px] text-dim max-[720px]:hidden">{isApple ? '⌘' : 'Ctrl '}K</kbd>
        <span className="truncate">Go to a program, sample or page…</span>
      </button>
      <div className="ml-auto flex flex-none items-center gap-3">
        {/* The rail carries the beta label on wider screens. */}
        <span className="hidden max-[720px]:block"><BetaBadge /></span>
        <DeviceStatus onManage={onManageDevice} />
      </div>
    </header>
  );
}
