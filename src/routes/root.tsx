import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { ErrorBoundary } from '@/components/shell/ErrorBoundary';
import { Rail } from '@/components/shell/Rail';

/** The persistent app shell: left rail + routed content outlet. */
export const rootRoute = createRootRoute({ component: RootLayout });

function RootLayout() {
  const navigate = useNavigate();
  // Current path, minus the leading slash — Rail matches nav items against it.
  const active = useRouterState({ select: (s) => s.location.pathname.replace(/^\//, '') });
  return (
    <div className="on-app">
      <Rail
        active={active}
        onNavigate={(to) => navigate({ to: to as Parameters<typeof navigate>[0]['to'] })}
        onManageDevice={() => navigate({ to: '/device' })}
      />
      <main className="on-content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
