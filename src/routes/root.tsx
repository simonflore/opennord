import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { ErrorBoundary } from '@/components/shell/ErrorBoundary';
import { Rail } from '@/components/shell/Rail';
import type { NavTo } from '@/components/shell/nav';
import { TopBar } from '@/components/shell/TopBar';
import { PhoneTabs } from '@/components/shell/PhoneTabs';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { useRailData } from '@/components/shell/useShell';
import { isApple } from '@/lib/platform';
import { trimSlash } from '@/lib/library/categories';
import { isLetterKey } from '@/lib/keys';
import { anyDialogOpen } from '@/components/ui';

/** The persistent app shell: top bar, left rail (phone: bottom tabs) + routed content outlet. */
export const rootRoute = createRootRoute({ component: RootLayout });

function RootLayout() {
  // Trailing slash trimmed once, so every comparison below sees one spelling of a page.
  const path = useRouterState({ select: (s) => trimSlash(s.location.pathname) });

  // The landing page (`/`) is its own full-bleed marketing surface — no app shell.
  if (path === '/') {
    return (
      <ErrorBoundary resetKey={path}>
        <Outlet />
      </ErrorBoundary>
    );
  }
  return <AppShell path={path} />;
}

function AppShell({ path }: { path: string }) {
  const navigate = useNavigate();
  // The palette is closed, open for searching (⌘K, the top bar) or open as the phone's More menu.
  // Stable, so the memoised rail doesn't re-render when only the palette changes.
  const go = useCallback((to: NavTo) => navigate({ to }), [navigate]);
  const [palette, setPalette] = useState<false | 'search' | 'menu'>(false);
  const paletteOpen = useRef(false);
  useEffect(() => { paletteOpen.current = !!palette; }, [palette]);

  // ⌘K (Ctrl+K off the Mac, where Ctrl+K in a text field is "delete to end of
  // line") opens the palette, or closes it again; it never opens over another dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Alt/Option (AltGr on Windows) or Shift means another character or shortcut.
      if (e.altKey || e.shiftKey || !(isApple ? e.metaKey : e.ctrlKey) || !isLetterKey(e, 'k')) return;
      // Over another dialog the key is left alone (for the browser), not swallowed.
      if (!paletteOpen.current && anyDialogOpen()) return;
      e.preventDefault();
      if (e.repeat) return; // holding the keys doesn't flicker it
      setPalette((open) => (open ? false : 'search'));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-screen flex-col stage-backdrop">
      <TopBar onSearch={() => setPalette('search')} onManageDevice={() => navigate({ to: '/device' })} />
      <div className="flex flex-1">
        <ShellRail path={path} onNavigate={go} />
        {/* Plain "on-content" class kept as a hook: `[data-native] .on-content` in
            shell.css layers Capacitor safe-area insets on top of the utilities below. */}
        {/* The program console (table + inspector, B×A) uses the window's width;
            every other page keeps the 1100px reading column. */}
        <main className={cn(
          'on-content min-w-0 flex-1 px-6 py-4 max-[720px]:px-4 max-[720px]:pt-3',
          path.startsWith('/library/programs') ? 'max-w-[1680px]' : 'max-w-[1100px]',
        )}>
          {/* resetKey: navigating clears a caught error, so one bad program
              view doesn't dead-end the content pane for the whole session. */}
          <ErrorBoundary resetKey={path}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <PhoneTabs path={path} onNavigate={go} onMore={() => setPalette('menu')} />
      <CommandPalette open={!!palette} menu={palette === 'menu'} onClose={() => setPalette(false)} />
    </div>
  );
}

/**
 * The rail with its library data. Reading the lists here, not in AppShell,
 * keeps a list change (a search keystroke, a scan tick) from re-rendering the
 * whole shell.
 */
function ShellRail({ path, onNavigate }: { path: string; onNavigate: (to: NavTo) => void }) {
  return <Rail path={path} onNavigate={onNavigate} {...useRailData()} />;
}
