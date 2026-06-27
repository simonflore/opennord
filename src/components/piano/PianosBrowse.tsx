import '../library/library.css';
import { BrowseToolbar, Card, Pill, SourceBadge, Tag, type FacetGroup } from '../ui';
import type { PianoEntry } from '@/lib/library/piano-entries';
import type { LibrarySource } from '@/lib/library/types';
import type { PianoSort } from '@/lib/library/prefs';
import { formatBytes } from '@/lib/format';

const SORT_LABEL: Record<PianoSort, string> = { default: 'Default', name: 'Name (A–Z)', size: 'Size' };

const parsePianoSort = (raw: string): PianoSort =>
  raw === 'name' || raw === 'size' ? raw : 'default';

export function PianosBrowse({
  entries, source, setSource, query, setQuery,
  showSourceFacet, sort, setSort, isFavorite, toggleFavorite, onSelect,
}: {
  entries: PianoEntry[];
  source: LibrarySource | 'all'; setSource: (s: LibrarySource | 'all') => void;
  query: string; setQuery: (q: string) => void;
  showSourceFacet: boolean;
  sort: PianoSort; setSort: (s: PianoSort) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  onSelect: (e: PianoEntry) => void;
}) {
  const facets: FacetGroup[] = showSourceFacet
    ? [{
        ariaLabel: 'Filter by source',
        value: source,
        options: [
          { key: 'all', label: 'All' }, { key: 'nord', label: 'On Nord' }, { key: 'local', label: 'Local' },
        ],
        onChange: (k: string) => setSource(k as LibrarySource | 'all'),
      }]
    : [];

  const sortOptions = (Object.keys(SORT_LABEL) as PianoSort[]).map((k) => ({ key: k, label: SORT_LABEL[k] }));

  return (
    <div className="lib-panel">
      <div className="lib-panel__head">
        <div className="lib-head">
          <div>
            <h1 className="lib-title">Pianos</h1>
            <div className="lib-counts">
              <span className="lib-counts__total">{entries.length} piano{entries.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        <BrowseToolbar
          query={query} onQuery={setQuery} placeholder="Search pianos…"
          facets={facets}
          sort={sort} sortOptions={sortOptions} onSort={(k) => setSort(parsePianoSort(k))} sortAriaLabel="Sort pianos"
        />
      </div>
      <div className="lib-panel__body">
        {entries.length === 0 ? (
          <p className="lib-empty">No pianos match your filter.</p>
        ) : (
          <div className="lib-grid">
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
                  {e.slot && <span className="lib-slot">{e.slot}</span>}
                </div>
                <div className="lib-patch__foot">
                  <SourceBadge source={e.source} />
                  {e.source === 'backup' && e.isFactory !== undefined && (
                    <Pill>{e.isFactory ? 'Factory' : 'Yours'}</Pill>
                  )}
                  {e.size != null && <span className="lib-slot">{formatBytes(e.size)}</span>}
                  {e.factory && <Tag>Factory</Tag>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
