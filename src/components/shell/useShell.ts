import { useCallback, useMemo } from 'react';
import type { CategoryId } from '../../lib/library/categories';
import { SOURCE_LABEL, type LibrarySource } from '../../lib/library/types';
import { countBySource } from '../../lib/library/browse';
import { useDevice } from '../../lib/device/DeviceContext';
import { useLibraryState } from '../../lib/library/LibraryContext';
import { usePresetsState } from '../../lib/library/PresetsContext';
import { useSamplesState } from '../../lib/library/SamplesContext';
import { usePianosState } from '../../lib/library/PianosContext';
import type { SourceItem } from './Rail';

/**
 * What the rail shows beside its entries: each library list's size, and the
 * program sources that hold anything (with the Nord's LED lit while connected).
 * Built from the memoised lists, so it only recomputes when a list changes.
 */
export function useRailData() {
  const live = !!useDevice().session;
  const { all: programs, source: activeSource, clearFilters, setSource } = useLibraryState();
  const presets = usePresetsState().all.length;
  const samples = useSamplesState().all.length;
  const pianos = usePianosState().all.length;

  const counts: Record<CategoryId, number> = useMemo(
    () => ({ programs: programs.length, presets, samples, pianos }),
    [programs.length, presets, samples, pianos],
  );
  const sources: SourceItem[] = useMemo(() => {
    const bySource = countBySource(programs);
    return (Object.keys(SOURCE_LABEL) as LibrarySource[])
      .map((source) => ({ source, label: SOURCE_LABEL[source], count: bySource[source], live: source === 'nord' && live }))
      // An empty source stays listed while it's the active filter, so the rail
      // always shows what the list is filtered to (e.g. On Nord after unplugging).
      .filter((s) => s.count > 0 || s.live || s.source === activeSource);
  }, [programs, live, activeSource]);
  // A source shows all of that source's programs: the list's other filters go.
  // 'all' only lifts the source filter.
  const onPickSource = useCallback((source: LibrarySource | 'all') => {
    if (source !== 'all') clearFilters();
    setSource(source);
  }, [clearFilters, setSource]);

  return { counts, sources, activeSource, onPickSource };
}
