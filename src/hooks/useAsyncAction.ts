import { useCallback, useState } from 'react';
import { getErrorMessage } from '../lib/errors';

/**
 * Owns the `busy` + `error` state shared by every "do one async thing, disable
 * the button while it runs, surface the failure" flow. `run` wraps the action:
 * clears the error, sets busy, runs it, on throw stores a message (custom via
 * `onError`, else the raw error text), and always clears busy. Domain state
 * (progress, results, pending selections…) stays in the caller. Returns the
 * action's value, or `undefined` if it threw.
 */
export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async <T,>(
    action: () => Promise<T>,
    onError?: (e: unknown) => string,
  ): Promise<T | undefined> => {
    setError('');
    setBusy(true);
    try {
      return await action();
    } catch (e) {
      setError(onError ? onError(e) : getErrorMessage(e));
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, setError, run };
}
