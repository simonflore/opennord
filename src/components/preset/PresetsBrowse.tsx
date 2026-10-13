import { useMemo } from 'react';
import '../library/library.css';
import { BrowseToolbar, type FacetGroup } from '../ui';
import { CategoryPanel } from '../library/CategoryPanel';
import { LibraryCard } from '../library/LibraryCard';
import { useStableCallback } from '@/lib/useStableCallback';
import { LibraryEmpty } from '../library/LibraryEmpty';
import { SlotTag } from '../library/SlotTag';
import { CardRemoveButton } from '../library/CardRemoveButton';
import { PresetGlance } from './PresetGlance';
import type { PresetEntry } from '@/lib/library/preset-entries';
import type { PresetKind } from '@/lib/clavia/preset-kind';
import { isImported, type LibrarySource } from '@/lib/library/types';
import type { PresetSort } from '@/lib/library/prefs';
import { formatBytes } from '@/lib/format';
import { AddMenu } from '../library/AddMenu';
import { FolderMenu } from '../library/FolderMenu';
import { useFolderOptional } from '@/lib/folder/FolderContext';

export const KIND_LABEL: Record<PresetKind, string> = {
  'organ-preset': 'Organ', 'piano-preset': 'Piano', 'synth-preset': 'Synth',
};
const SORT_LABEL: Record<PresetSort, string> = { default: 'Default', name: 'Name (A–Z)', size: 'Size' };

const parsePresetSort = (raw: string): PresetSort =>
  raw === 'name' || raw === 'size' ? raw : 'default';

export function PresetsBrowse({
  entries, source, setSource, kind, setKind, query, setQuery, clearFilters, filtered,
  kinds, showSourceFacet, sort, setSort, isFavorite, toggleFavorite, onSelect, onImport, onRemove, activeId,
}: {
  entries: PresetEntry[];
  source: LibrarySource | 'all'; setSource: (s: LibrarySource | 'all') => void;
  kind: PresetKind | 'all'; setKind: (k: PresetKind | 'all') => void;
  query: string; setQuery: (q: string) => void;
  /** Every filter off and the search cleared (from the list's context). */
  clearFilters: () => void;
  /** Whether any filter or search is narrowing the list (from the list's context). */
  filtered: boolean;
  kinds: PresetKind[];
  showSourceFacet: boolean;
  sort: PresetSort; setSort: (s: PresetSort) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  onSelect: (e: PresetEntry) => void;
  /** The entry open in the detail pane, highlighted in the list. */
  activeId?: string | null;
  onImport: () => void;
  onRemove: (id: string) => void;
}) {
  // Adding a folder is the same from every list.
  const folder = useFolderOptional();
  const facets: FacetGroup[] = [
    ...(showSourceFacet ? [{
      ariaLabel: 'Filter by source',
      value: source,
      options: [
        { key: 'all', label: 'All' }, { key: 'nord', label: 'On Nord' }, { key: 'local', label: 'Local' },
      ],
      onChange: (k: string) => setSource(k as LibrarySource | 'all'),
    }] : []),
    {
      ariaLabel: 'Filter by type',
      value: kind,
      options: [
        { key: 'all', label: 'All' },
        ...kinds.map((k) => ({ key: k, label: KIND_LABEL[k] })),
      ],
      onChange: (k: string) => setKind(k as PresetKind | 'all'),
    },
  ];

  const sortOptions = (Object.keys(SORT_LABEL) as PresetSort[]).map((k) => ({ key: k, label: SORT_LABEL[k] }));


  // Stable handlers and a memoised row list: a search keystroke (or any
  // parent render) with the same entries reuses the rows instead of rebuilding
  // every card, which a folder of a thousand samples feels.
  const onSelectStable = useStableCallback(onSelect);
  const onRemoveStable = useStableCallback(onRemove);
  const toggleFavoriteStable = useStableCallback(toggleFavorite);
  const rows = useMemo(() => entries.map((e) => (
              <LibraryCard
                key={e.id}
                name={e.name}
                source={e.source}
                favorite={isFavorite(e.id)}
                onToggleFavorite={() => toggleFavoriteStable(e.id)}
                onOpen={() => onSelectStable(e)}
                selected={e.id === activeId}
                badge={<SlotTag>{e.slot ?? KIND_LABEL[e.kind]}</SlotTag>}
                engines={<PresetGlance entry={e} />}
                footExtras={
                  <>
                    {e.size != null && <SlotTag>{formatBytes(e.size)}</SlotTag>}
                    {isImported(e.id) && (
                      <CardRemoveButton name={e.name} onRemove={() => onRemoveStable(e.id)} />
                    )}
                  </>
                }
              />
            )), [entries, activeId, isFavorite, onSelectStable, onRemoveStable, toggleFavoriteStable]);

  return (
    <CategoryPanel
      title="Presets"
      counts={`${entries.length} preset${entries.length !== 1 ? 's' : ''}`}
      actions={<>
        {/* At phone width the rail, and the folder in it, is hidden. */}
        <FolderMenu folder={folder} place="toolbar" className="min-[720px]:hidden" />
        <AddMenu folder={folder} noun="a preset file" onImport={onImport} />
      </>}
      toolbar={
        <BrowseToolbar
          query={query} onQuery={setQuery} placeholder="Search presets…"
          facets={facets}
          sort={sort} sortOptions={sortOptions} onSort={(k) => setSort(parsePresetSort(k))} sortAriaLabel="Sort presets"
        />
      }
      isEmpty={entries.length === 0}
      emptyState={<LibraryEmpty noun="preset" filtered={filtered} onClear={clearFilters} />}
    >
            {rows}
    </CategoryPanel>
  );
}
