import '../library/library.css';
import { BrowseToolbar, Button, type FacetGroup } from '../ui';
import { CategoryPanel } from '../library/CategoryPanel';
import { LibraryCard } from '../library/LibraryCard';
import { LibraryEmpty } from '../library/LibraryEmpty';
import type { PresetEntry } from '@/lib/library/preset-entries';
import type { PresetKind } from '@/lib/clavia/preset-kind';
import type { LibrarySource } from '@/lib/library/types';
import type { PresetSort } from '@/lib/library/prefs';
import { formatBytes } from '@/lib/format';

export const KIND_LABEL: Record<PresetKind, string> = {
  'organ-preset': 'Organ', 'piano-preset': 'Piano', 'synth-preset': 'Synth',
};
const SORT_LABEL: Record<PresetSort, string> = { default: 'Default', name: 'Name (A–Z)', size: 'Size' };

const parsePresetSort = (raw: string): PresetSort =>
  raw === 'name' || raw === 'size' ? raw : 'default';

export function PresetsBrowse({
  entries, source, setSource, kind, setKind, query, setQuery,
  kinds, showSourceFacet, sort, setSort, isFavorite, toggleFavorite, onSelect, onImport, onRemove,
}: {
  entries: PresetEntry[];
  source: LibrarySource | 'all'; setSource: (s: LibrarySource | 'all') => void;
  kind: PresetKind | 'all'; setKind: (k: PresetKind | 'all') => void;
  query: string; setQuery: (q: string) => void;
  kinds: PresetKind[];
  showSourceFacet: boolean;
  sort: PresetSort; setSort: (s: PresetSort) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  onSelect: (e: PresetEntry) => void;
  onImport: () => void;
  onRemove: (id: string) => void;
}) {
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

  const filtered = query.trim() !== '' || (showSourceFacet && source !== 'all') || kind !== 'all';
  const clearFilters = () => { setQuery(''); setSource('all'); setKind('all'); };

  return (
    <CategoryPanel
      title="Presets"
      counts={<span className="lib-counts__total">{entries.length} preset{entries.length !== 1 ? 's' : ''}</span>}
      actions={<Button variant="primary" onClick={onImport}>+ Import preset</Button>}
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
            {entries.map((e) => (
              <LibraryCard
                key={e.id}
                name={e.name}
                source={e.source}
                favorite={isFavorite(e.id)}
                onToggleFavorite={() => toggleFavorite(e.id)}
                onOpen={() => onSelect(e)}
                badge={<span className="lib-slot">{e.slot ?? KIND_LABEL[e.kind]}</span>}
                footExtras={
                  <>
                    {e.size != null && <span className="lib-slot">{formatBytes(e.size)}</span>}
                    {e.id.startsWith('local:') && (
                      <button
                        className="lib-patch__rm"
                        aria-label={`Remove ${e.name}`}
                        title="Remove from library"
                        onClick={(ev) => { ev.stopPropagation(); onRemove(e.id); }}
                        onKeyDown={(ev) => ev.stopPropagation()}
                      >✕</button>
                    )}
                  </>
                }
              />
            ))}
    </CategoryPanel>
  );
}
