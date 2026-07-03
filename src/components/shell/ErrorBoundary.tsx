import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Clears a caught error when it changes (e.g. the route pathname), so
   *  navigating away recovers the app instead of dead-ending it on the
   *  fallback until a full reload. */
  resetKey?: unknown;
}

interface State {
  error: Error | null;
}

/**
 * Catches render/runtime errors in the subtree so one bad component can't blank
 * the whole app (which looks like "nothing works / can't click anything"). Shows
 * a recover affordance instead of a dead tree.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep a console trail for debugging; the UI shows a friendly recover path.
    console.error('UI error caught by ErrorBoundary:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: 'var(--ink)' }}>
          <h3 style={{ marginTop: 0 }}>Something went wrong</h3>
          <p style={{ color: 'var(--dim)' }}>{this.state.error.message}</p>
          <button className="on-btn on-btn--primary" onClick={() => location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
