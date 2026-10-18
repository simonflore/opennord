import { useEffect } from 'react';
import { useCapabilities } from '@/lib/capabilities/CapabilitiesContext';
import { repeatedIds } from './unique-ids';

/**
 * Record a diagnostic when a Nord list held an id twice (see `withUniqueIds`):
 * the files still open as themselves, but two slots read as one, which means
 * a slot label is folding addresses together again. Once per list.
 */
export function useReportRepeatedIds(what: string, entries: readonly { id: string }[]): void {
  const { diagnostics } = useCapabilities();
  useEffect(() => {
    const ids = repeatedIds(entries);
    if (ids.length === 0) return;
    diagnostics.record({
      kind: 'library.repeated-id',
      ok: false,
      message: `${ids.length} ${what} id${ids.length === 1 ? '' : 's'} named more than one file on the Nord`,
      detail: { what, ids },
    });
  }, [diagnostics, what, entries]);
}
