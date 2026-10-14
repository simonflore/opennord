import { useState } from 'react';
import type { Apply, Edit } from '@/lib/library/useSampleProject';

/**
 * Apply edits and keep why the last one was refused ('' when it worked), for a panel's alert.
 * The setter lets a panel report another failure in the same place.
 */
export function useApplyError(apply: Apply) {
  const [error, setError] = useState('');
  const run = (edit: Edit, mergeKey?: string) => setError(apply(edit, mergeKey) ?? '');
  return [run, error, setError] as const;
}
