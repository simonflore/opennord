import { useEffect, useState } from 'react';
import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { ErrorBoundary } from '@/components/shell/ErrorBoundary';
import { Rail } from '@/components/shell/Rail';
import type { NavTo } from '@/components/shell/nav';
import { TopBar } from '@/components/shell/TopBar';
import { PhoneTabs } from '@/components/shell/PhoneTabs';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { useRailData } from '@/components/shell/useShell';
import { isApple } from '@/lib/platform';

/** The persistent app shell: top bar, left rail (phone: bottom tabs) + routed content outlet. */
export const rootRoute = createRootRoute({ component: RootLayout });

function RootLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });

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
  const [palette, setPalette] = useState(false);

  // ⌘K (Ctrl+K off the Mac, where Ctrl+K in a text field is "delete to end of
  // line") opens the palette, or closes it again; it never opens over another dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The letter K as typed (Dvorak, Colemak…); on a non-Latin layout (Cyrillic,
      // Greek…) the key in K's place. e.key can be missing (autofill).
      // Alt/Option (AltGr on Windows) or Shift means another character or shortcut.
      if (e.altKey || e.shiftKey || !(isApple ? e.metaKey : e.ctrlKey)) return;
      const key = e.key?.toLowerCase() ?? '';
      if (key !== 'k' && (/^[a-z]$/.test(key) || e.code !== 'KeyK')) return;
      e.preventDefault();
      if (e.repeat) return; // holding the keys doesn't flicker it
      setPalette((open) => !open && !document.querySelector('[role="dialog"], [role="alertdialog"]'));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-screen flex-col stage-backdrop">
      <TopBar onSearch={() => setPalette(true)} onManageDevice={() => navigate({ to: '/device' })} />
      <div className="flex flex-1">
        <ShellRail path={path} onNavigate={(to) => navigate({ to })} />
        {/* Plain "on-content" class kept as a hook: `[data-native] .on-content` in
            shell.css layers Capacitor safe-area insets on top of the utilities below. */}
        <main className="on-content min-w-0 flex-1 max-w-[1100px] px-6 py-4 max-[720px]:px-4 max-[720px]:pt-3">
          {/* resetKey: navigating clears a caught error, so one bad program
              view doesn't dead-end the content pane for the whole session. */}
          <ErrorBoundary resetKey={path}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <PhoneTabs path={path} onNavigate={(to) => navigate({ to })} onMore={() => setPalette(true)} />
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
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
