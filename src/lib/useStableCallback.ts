import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * A callback whose identity never changes but that always calls the latest
 * `fn`, for a memoised list whose parent passes new closures each render.
 * Call it from events, not during render (it runs the last committed `fn`).
 */
export function useStableCallback<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const latest = useRef(fn);
  useLayoutEffect(() => { latest.current = fn; });
  return useCallback((...args: A) => latest.current(...args), []);
}
