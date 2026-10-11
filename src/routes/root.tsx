import { useEffect, useState } from 'react';
import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { ErrorBoundary } from '@/components/shell/ErrorBoundary';
import { Rail } from '@/components/shell/Rail';
import { TopBar } from '@/components/shell/TopBar';
import { PhoneTabs } from '@/components/shell/PhoneTabs';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { useRailData } from '@/components/shell/useShell';

/** The persistent app shell: top bar, left rail (phone: bottom tabs) + routed content outlet. */
export const rootRoute = createRootRoute({ component: RootLayout });

function RootLayout() {
  // Current path, minus the leading slash — the shell matches nav items against it.
  const active = useRouterState({ select: (s) => s.location.pathname.replace(/^\//, '') });

  // The landing page (`/`) is its own full-bleed marketing surface — no app shell.
  if (active === '') {
    return (
      <ErrorBoundary resetKey={active}>
        <Outlet />
      </ErrorBoundary>
    );
  }
  return <AppShell active={active} />;
}

function AppShell({ active }: { active: string }) {
  const navigate = useNavigate();
  const rail = useRailData();
  const [palette, setPalette] = useState(false);

  // ⌘K / Ctrl+K opens the palette from anywhere in the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-screen flex-col stage-backdrop">
      <TopBar onSearch={() => setPalette(true)} onManageDevice={() => navigate({ to: '/device' })} />
      <div className="flex flex-1">
        <Rail active={active} onNavigate={(to) => navigate({ to })} {...rail} />
        {/* Plain "on-content" class kept as a hook: `[data-native] .on-content` in
            shell.css layers Capacitor safe-area insets on top of the utilities below. */}
        <main className="on-content min-w-0 flex-1 max-w-[1100px] px-6 py-4 max-[720px]:px-4 max-[720px]:py-3 max-[720px]:pb-20">
          {/* resetKey: navigating clears a caught error, so one bad program
              view doesn't dead-end the content pane for the whole session. */}
          <ErrorBoundary resetKey={active}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <PhoneTabs active={active} onNavigate={(to) => navigate({ to })} onMore={() => setPalette(true)} />
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
