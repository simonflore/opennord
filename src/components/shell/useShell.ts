import { useCallback, useMemo } from 'react';
import type { CategoryId } from '../../lib/library/categories';
import { SOURCE_LABEL, type LibrarySource } from '../../lib/library/types';
import { countFoundOn } from '../../lib/library/found-on';
import { useDevice } from '../../lib/device/DeviceContext';
import { useLibraryData } from '../../lib/library/LibraryContext';
import { usePresetsData } from '../../lib/library/PresetsContext';
import { useSamplesData } from '../../lib/library/SamplesContext';
import { usePianosData } from '../../lib/library/PianosContext';
import { useFolderOptional } from '../../lib/folder/FolderContext';
import { useCloudSnapshot } from '../../lib/library/CloudSnapshotContext';
import type { SourceItem } from './Rail';

/**
 * What the rail shows beside its entries: each library list's size, and the
 * program sources that hold anything (with the Nord's LED lit while connected),
 * and whether a folder is connected.
 * Built from the memoised lists, so it only recomputes when a list changes.
 */
export function useRailData() {
  const live = !!useDevice().session;
  const { rows: programs, source: activeSource, clearFilters, setSource } = useLibraryData();
  const presets = usePresetsData().rows.length;
  const samples = useSamplesData().rows.length;
  const pianos = usePianosData().rows.length;
  const hasFolder = !!useFolderOptional()?.folderName;
  const { status: cloudStatus, takenAt } = useCloudSnapshot();

  const counts: Record<CategoryId, number> = useMemo(
    () => ({ programs: programs.length, presets, samples, pianos }),
    [programs.length, presets, samples, pianos],
  );
  const sources: SourceItem[] = useMemo(() => {
    // A sound found on two sources counts under both: the rail says where things are found.
    const bySource = countFoundOn(programs);
    return (Object.keys(SOURCE_LABEL) as LibrarySource[])
      .map((source) => ({
        source,
        // The cloud source is one snapshot: its label says when it was taken.
        label: source === 'cloud' && takenAt ? `Cloud · ${shortTime(takenAt)}` : SOURCE_LABEL[source],
        count: bySource[source], live: source === 'nord' && live,
      }))
      // An empty source stays listed while it's the active filter, so the rail
      // always shows what the list is filtered to (e.g. On Nord after unplugging).
      // The cloud stays listed wherever the build has it, so its filter (and the
      // line saying to sign in, or that there is no snapshot yet) can be reached.
      .filter((s) => s.count > 0 || s.live || s.source === activeSource || (s.source === 'cloud' && cloudStatus !== 'absent'));
  }, [programs, live, activeSource, takenAt, cloudStatus]);
  // A source shows all of that source's programs: the list's other filters go.
  // 'all' only lifts the source filter.
  const onPickSource = useCallback((source: LibrarySource | 'all') => {
    if (source !== 'all') clearFilters();
    setSource(source);
  }, [clearFilters, setSource]);

  return { counts, sources, activeSource, onPickSource, hasFolder };
}

/** "13 Oct 13:10", in the user's own locale. */
function shortTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}
