import '../library/library.css';
import { BrowseToolbar, Button, Card, SourceBadge, type FacetGroup } from '../ui';
import { CategoryPanel } from '../library/CategoryPanel';
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
      emptyState={<p className="lib-empty">No presets match your filter.</p>}
    >
            {entries.map((e) => (
              <Card
                key={e.id}
                accent={e.source === 'nord'}
                className="lib-patch"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(e)}
                onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelect(e); } }}
              >
                <div className="lib-patch__top">
                  <button
                    className={`lib-fav${isFavorite(e.id) ? ' is-fav' : ''}`}
                    aria-label={isFavorite(e.id) ? `Unfavorite ${e.name}` : `Favorite ${e.name}`}
                    aria-pressed={isFavorite(e.id)}
                    onClick={(ev) => { ev.stopPropagation(); toggleFavorite(e.id); }}
                    onKeyDown={(ev) => ev.stopPropagation()}
                  >{isFavorite(e.id) ? '★' : '☆'}</button>
                  <span className="lib-patch__nm">{e.name}</span>
                  <span className="lib-slot">{e.slot ?? KIND_LABEL[e.kind]}</span>
                </div>
                <div className="lib-patch__foot">
                  <SourceBadge source={e.source} />
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
                </div>
              </Card>
            ))}
    </CategoryPanel>
  );
}
