// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

afterEach(cleanup);
beforeEach(() => {
  // React logs the caught error; keep the test output pristine.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

function Bomb({ defused }: { defused?: boolean }) {
  if (!defused) throw new Error('kaboom');
  return <p>content is back</p>;
}

describe('ErrorBoundary', () => {
  it('shows the fallback when a child throws', () => {
    render(
      <ErrorBoundary resetKey="/library">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
  });

  it('recovers when resetKey changes (navigation must not stay dead-ended)', () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="/library">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // One corrupt program view must not kill the whole session: navigating
    // to another route (new resetKey) renders that route's content again.
    rerender(
      <ErrorBoundary resetKey="/samples">
        <Bomb defused />
      </ErrorBoundary>,
    );
    expect(screen.getByText('content is back')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('stays on the fallback when resetKey is unchanged', () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="/library">
        <Bomb />
      </ErrorBoundary>,
    );
    rerender(
      <ErrorBoundary resetKey="/library">
        <Bomb defused />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
