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
 */
export function useRailData() {
  const { session } = useDevice();
  const library = useLibraryState();
  const counts: Record<CategoryId, number> = {
    programs: library.all.length,
    presets: usePresetsState().all.length,
    samples: useSamplesState().all.length,
    pianos: usePianosState().all.length,
  };
  const bySource = countBySource(library.all);
  const sources: SourceItem[] = (Object.keys(SOURCE_LABEL) as LibrarySource[])
    .map((source) => ({ source, label: SOURCE_LABEL[source], count: bySource[source], live: source === 'nord' && !!session }))
    // An empty source stays listed while it's the active filter, so the rail
    // always shows what the list is filtered to (e.g. On Nord after unplugging).
    .filter((s) => s.count > 0 || s.live || s.source === library.source);
  return { counts, sources, activeSource: library.source, onPickSource: library.setSource };
}
