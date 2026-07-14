import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { ErrorBoundary } from '@/components/shell/ErrorBoundary';
import { Rail } from '@/components/shell/Rail';

/** The persistent app shell: left rail + routed content outlet. */
export const rootRoute = createRootRoute({ component: RootLayout });

function RootLayout() {
  const navigate = useNavigate();
  // Current path, minus the leading slash — Rail matches nav items against it.
  const active = useRouterState({ select: (s) => s.location.pathname.replace(/^\//, '') });

  // The landing page (`/`) is its own full-bleed marketing surface — no app rail.
  if (active === '') {
    return (
      <ErrorBoundary resetKey={active}>
        <Outlet />
      </ErrorBoundary>
    );
  }

  return (
    <div className="flex min-h-screen stage-backdrop max-[720px]:flex-col">
      <Rail
        active={active}
        onNavigate={(to) => navigate({ to })}
        onManageDevice={() => navigate({ to: '/device' })}
      />
      {/* Plain "on-content" class kept as a hook: `[data-native] .on-content` in
          shell.css layers Capacitor safe-area insets on top of the utilities below. */}
      <main className="on-content flex-1 max-w-[1100px] px-6 py-4 max-[720px]:px-4 max-[720px]:py-3">
        {/* resetKey: navigating clears a caught error, so one bad program
            view doesn't dead-end the content pane for the whole session. */}
        <ErrorBoundary resetKey={active}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
