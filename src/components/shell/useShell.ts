import type { CategoryId } from '../../lib/library/categories';
import type { LibrarySource } from '../../lib/library/types';
import { useDevice } from '../../lib/device/DeviceContext';
import { useLibraryState } from '../../lib/library/LibraryContext';
import { usePresetsState } from '../../lib/library/PresetsContext';
import { useSamplesState } from '../../lib/library/SamplesContext';
import { usePianosState } from '../../lib/library/PianosContext';
import type { SourceItem } from './Rail';

const SOURCES: { source: LibrarySource; label: string }[] = [
  { source: 'nord', label: 'on the nord' },
  { source: 'local', label: 'local files' },
  { source: 'backup', label: 'backups' },
  { source: 'cloud', label: 'cloud' },
];

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
  const sources: SourceItem[] = SOURCES
    .map((s) => ({ ...s, count: library.all.filter((e) => e.source === s.source).length, live: s.source === 'nord' && !!session }))
    .filter((s) => s.count > 0 || s.live);
  return { counts, sources, activeSource: library.source, onPickSource: library.setSource };
}
