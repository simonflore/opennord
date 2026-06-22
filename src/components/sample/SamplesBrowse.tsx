import '../library/library.css';
import { BrowseToolbar, Card, SourceBadge, type FacetGroup } from '../ui';
import type { SampleEntry, SampleGeneration } from '../../lib/library/sample-entries';
import type { SamplesPrefsApi, SampleSort } from '../../lib/library/prefs';
import type { LibrarySource } from '../../lib/library/types';

/** Human-friendly byte size, e.g. 1900000 → "1.8 MB". */
function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const GEN_LABEL: Record<SampleGeneration, string> = { og: 'OG', '3': '.nsmp3', '4': '.nsmp4', npno: 'Piano (.npno)', unknown: 'Unrecognized' };
const SORT_LABEL: Record<SampleSort, string> = { default: 'Default', name: 'Name (A–Z)', size: 'Size', strokes: 'Samples' };

export function SamplesBrowse(
  { entries, source, generation, query, nordCount, localCount, showSourceFacet, showUnknownGen,
    onSource, onGeneration, onQuery, onOpen, onLoadNew, prefs,
    canScanUsage, onScanUsage, scanPct, unusedCount, unusedOnly, onUnusedOnly }: {
    entries: SampleEntry[];
    source: LibrarySource | 'all'; generation: SampleGeneration | 'all'; query: string;
    nordCount: number; localCount: number;
    showSourceFacet: boolean; showUnknownGen: boolean;
    onSource: (s: LibrarySource | 'all') => void;
    onGeneration: (g: SampleGeneration | 'all') => void;
    onQuery: (q: string) => void;
    onOpen: (e: SampleEntry) => void;
    onLoadNew: () => void;
    prefs: SamplesPrefsApi;
    // Sample-usage cleanup (device-connected)
    canScanUsage: boolean;
    onScanUsage: () => void;
    scanPct: number | null;
    unusedCount: number | null;
    unusedOnly: boolean;
    onUnusedOnly: (v: boolean) => void;
  },
) {
  const { favorites, toggleFavorite: onToggleFavorite } = prefs;
  const total = nordCount + localCount;

  const genOptions: Array<{ key: SampleGeneration | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'og', label: GEN_LABEL.og },
    { key: '3', label: GEN_LABEL['3'] },
    { key: '4', label: GEN_LABEL['4'] },
    { key: 'npno', label: GEN_LABEL.npno },
    ...(showUnknownGen ? [{ key: 'unknown' as const, label: GEN_LABEL.unknown }] : []),
  ];

  const facets: FacetGroup[] = [
    ...(showSourceFacet ? [{
      ariaLabel: 'Filter by source',
      value: source,
      options: [
        { key: 'all', label: 'All' }, { key: 'nord', label: 'On Nord' }, { key: 'local', label: 'Local' },
      ],
      onChange: (k: string) => onSource(k as LibrarySource | 'all'),
    }] : []),
    {
      ariaLabel: 'Filter by format',
      value: generation,
      options: genOptions.map((o) => ({ key: o.key, label: o.label })),
      onChange: (k: string) => onGeneration(k as SampleGeneration | 'all'),
    },
  ];

  return (
    <div>
      <div className="lib-head">
        <div>
          <h1 className="lib-title">Samples</h1>
          <div className="lib-counts">
            {total} {total === 1 ? 'sample' : 'samples'} · {nordCount} on Nord · {localCount} local
          </div>
        </div>
        <div className="lib-actions">
          {canScanUsage && (
            <button className="on-btn" onClick={onScanUsage} disabled={scanPct !== null}>
              {scanPct !== null ? `Scanning… ${scanPct}%` : 'Find unused samples'}
            </button>
          )}
          {unusedCount !== null && scanPct === null && (
            <button
              className={`on-btn${unusedOnly ? ' is-active' : ''}`}
              aria-pressed={unusedOnly}
              onClick={() => onUnusedOnly(!unusedOnly)}
            >
              {unusedCount === 0 ? 'No unused samples' : `${unusedOnly ? 'Show all' : `Unused only (${unusedCount})`}`}
            </button>
          )}
          <button className="on-btn" onClick={onLoadNew}>Load sample</button>
        </div>
      </div>

      <BrowseToolbar
        query={query}
        onQuery={onQuery}
        placeholder="Search samples by name…"
        facets={facets}
        sort={prefs.sort}
        sortOptions={(Object.keys(SORT_LABEL) as SampleSort[]).map((k) => ({ key: k, label: SORT_LABEL[k] }))}
        onSort={(k) => prefs.setSort(k as SampleSort)}
        sortAriaLabel="Sort samples"
      />

      {entries.length === 0 ? (
        <div className="lib-empty"><p>No samples match.</p></div>
      ) : (
        <div className="lib-grid">
          {entries.map((e) => (
            <Card
              key={e.id}
              accent={e.source === 'nord'}
              className="lib-patch"
              role="button"
              tabIndex={0}
              onClick={() => onOpen(e)}
              onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onOpen(e); } }}
            >
              <div className="lib-patch__top">
                <button
                  className={`lib-fav${favorites.has(e.id) ? ' is-fav' : ''}`}
                  aria-label={favorites.has(e.id) ? `Unfavorite ${e.name}` : `Favorite ${e.name}`}
                  aria-pressed={favorites.has(e.id)}
                  onClick={(ev) => { ev.stopPropagation(); onToggleFavorite(e.id); }}
                  onKeyDown={(ev) => ev.stopPropagation()}
                >{favorites.has(e.id) ? '★' : '☆'}</button>
                <span className="lib-patch__nm">{e.name}</span>
                {e.unused && <span className="lib-tag lib-tag--unused" title="Not used by any program">unused</span>}
                <span className="lib-slot">{e.slot ?? GEN_LABEL[e.generation]}</span>
              </div>
              <div className="lib-patch__engines">
                <span className="lib-eng">
                  {e.generation === 'npno'
                    ? 'piano library'
                    : e.strokeCount != null
                    ? `${e.strokeCount} ${e.strokeCount === 1 ? 'sample' : 'samples'}`
                    : (e.source === 'nord' ? 'on Nord' : 'unrecognized')}
                </span>
              </div>
              <div className="lib-patch__foot">
                <SourceBadge source={e.source} />
                <span className="lib-slot">{e.size != null ? fmtSize(e.size) : ''}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
