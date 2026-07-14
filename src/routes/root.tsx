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
    <div className="on-app">
      <Rail
        active={active}
        onNavigate={(to) => navigate({ to })}
        onManageDevice={() => navigate({ to: '/device' })}
      />
      <main className="on-content">
        {/* resetKey: navigating clears a caught error, so one bad program
            view doesn't dead-end the content pane for the whole session. */}
        <ErrorBoundary resetKey={active}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
