import { useState } from 'react';
import '../library/library.css';
import { BrowseToolbar, Button, Card, Dialog, Pill, SourceBadge, type FacetGroup } from '../ui';
import type { SampleEntry, SampleGeneration } from '../../lib/library/sample-entries';
import type { SamplesPrefsApi, SampleSort } from '../../lib/library/prefs';
import type { LibrarySource } from '../../lib/library/types';

/** Human-friendly byte size, e.g. 1900000 → "1.8 MB". */
function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Round bytes to nearest MB for the reclaim bar. */
function fmtMB(bytes: number): string {
  return `${Math.round(bytes / 1048576)} MB`;
}

const GEN_LABEL: Record<SampleGeneration, string> = { og: '.nsmp', '3': '.nsmp3', '4': '.nsmp4', npno: 'Piano (.npno)', unknown: 'Unrecognized' };
const SORT_LABEL: Record<SampleSort, string> = { default: 'Default', name: 'Name (A–Z)', size: 'Size', strokes: 'Samples' };

export function SamplesBrowse(
  { entries, source, generation, query, nordCount, localCount, showSourceFacet, showUnknownGen,
    onSource, onGeneration, onQuery, onOpen, onLoadNew, onImport, onRemove,
    storedCount, storedBytes, prefs,
    canScanUsage, onScanUsage, scanPct, unusedCount, unusedOnly, onUnusedOnly,
    selected, toggleSelected, selectAllUnused, clearSelected, selectedFreeBytes,
    removeFromNord, removing, removePct }: {
    entries: SampleEntry[];
    source: LibrarySource | 'all'; generation: SampleGeneration | 'all'; query: string;
    nordCount: number; localCount: number;
    showSourceFacet: boolean; showUnknownGen: boolean;
    onSource: (s: LibrarySource | 'all') => void;
    onGeneration: (g: SampleGeneration | 'all') => void;
    onQuery: (q: string) => void;
    onOpen: (e: SampleEntry) => void;
    onLoadNew: () => void;
    onImport: () => void;
    onRemove: (id: string) => void;
    storedCount: number;
    storedBytes: number;
    prefs: SamplesPrefsApi;
    // Sample-usage cleanup (device-connected)
    canScanUsage: boolean;
    onScanUsage: () => void;
    scanPct: number | null;
    unusedCount: number | null;
    unusedOnly: boolean;
    onUnusedOnly: (v: boolean) => void;
    // Reclaim-space selection
    selected: Set<string>;
    toggleSelected: (id: string) => void;
    selectAllUnused: () => void;
    clearSelected: () => void;
    selectedFreeBytes: number;
    removeFromNord: (opts: { keepCopyIds: Set<string> }) => Promise<{ removed: number; failed: number }>;
    removing: boolean;
    removePct: number | null;
  },
) {
  const { favorites, toggleFavorite: onToggleFavorite } = prefs;
  const total = nordCount + localCount;

  // Confirm-remove dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Default keepCopy = true if any selected sample is non-factory
  const selectedEntries = entries.filter((e) => selected.has(e.id));
  const anyNonFactory = selectedEntries.some((e) => e.factory !== true);
  const anyFactory = selectedEntries.some((e) => e.factory === true);
  const [keepCopy, setKeepCopy] = useState(anyNonFactory);
  const [removeError, setRemoveError] = useState('');
  const [removeResult, setRemoveResult] = useState<{ removed: number; failed: number } | null>(null);

  // Re-sync keepCopy default when selection changes (derive from latest selectedEntries)
  // We do this imperatively only when the dialog opens; dialog re-renders each open.

  function openConfirm() {
    // Recompute default on open
    const nonFactory = entries.filter((e) => selected.has(e.id)).some((e) => e.factory !== true);
    setKeepCopy(nonFactory);
    setRemoveError('');
    setRemoveResult(null);
    setConfirmOpen(true);
  }

  async function handleRemove() {
    const keepCopyIds = keepCopy
      ? new Set(entries.filter((e) => selected.has(e.id) && e.factory !== true).map((e) => e.id))
      : new Set<string>();
    setRemoveError('');
    try {
      const result = await removeFromNord({ keepCopyIds });
      setRemoveResult(result);
      setConfirmOpen(false);
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const genOptions: Array<{ key: SampleGeneration | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'og', label: GEN_LABEL.og },
    { key: '3', label: GEN_LABEL['3'] },
    { key: '4', label: GEN_LABEL['4'] },
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

  const confirmTitle = `Remove ${selected.size} ${selected.size === 1 ? 'sample' : 'samples'} · frees ~${fmtMB(selectedFreeBytes)}`;

  return (
    <div className="lib-panel">
      <div className="lib-panel__head">
      <div className="lib-head">
        <div>
          <h1 className="lib-title">Samples</h1>
          <div className="lib-counts">
            {total} {total === 1 ? 'sample' : 'samples'} · {nordCount} on Nord · {localCount} local
            {storedCount > 0 && <> · {storedCount} stored ({fmtSize(storedBytes)})</>}
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
          <button className="on-btn" onClick={onLoadNew}>Preview a file</button>
          <button className="on-btn on-btn--primary" onClick={onImport}>+ Import sample</button>
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
      </div>

      {/* Reclaim bar — shown when at least one sample is selected */}
      {selected.size > 0 && (
        <div className="lib-reclaim-bar" role="region" aria-label="Selected samples">
          <span className="lib-reclaim-bar__info">
            {selected.size} selected · frees ~{fmtMB(selectedFreeBytes)}
          </span>
          <Button variant="ghost" onClick={selectAllUnused}>Select all unused</Button>
          <Button variant="primary" onClick={openConfirm}>Remove from Nord</Button>
          <Button variant="ghost" onClick={clearSelected}>Clear</Button>
        </div>
      )}

      {/* Remove result feedback */}
      {removeResult && (
        <p className="lib-reclaim-bar__result" role="status">
          {removeResult.removed} {removeResult.removed === 1 ? 'sample' : 'samples'} removed
          {removeResult.failed > 0 && ` · ${removeResult.failed} could not be removed`}
        </p>
      )}

      <div className="lib-panel__body">
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
                {unusedOnly && e.source === 'nord' && e.unused && (
                  <input
                    type="checkbox"
                    className="lib-patch__select"
                    aria-label={`Select ${e.name}`}
                    checked={selected.has(e.id)}
                    onChange={() => toggleSelected(e.id)}
                    onClick={(ev) => ev.stopPropagation()}
                  />
                )}
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
                {e.source === 'backup' && e.factory !== undefined && (
                  <Pill>{e.factory ? 'Factory' : 'Yours'}</Pill>
                )}
                <span className="lib-slot">{e.size != null ? fmtSize(e.size) : ''}</span>
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
        </div>
      )}
      </div>

      {/* Confirm-remove dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={confirmTitle}
        footer={
          <div className="on-dialog__footer-actions">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={removing}>Cancel</Button>
            <Button variant="primary" onClick={() => void handleRemove()} disabled={removing}>
              {removing && removePct !== null ? `Removing… ${removePct}%` : 'Remove'}
            </Button>
          </div>
        }
      >
        {anyFactory && (
          <p className="lib-reclaim-disclaimer">
            Some of these are factory samples. You can always re-download them from Nord's library.
          </p>
        )}
        <label className="lib-reclaim-keepcopy">
          <input
            type="checkbox"
            checked={keepCopy}
            onChange={(ev) => setKeepCopy(ev.currentTarget.checked)}
          />
          {' '}Download a copy first
        </label>
        {removeError && (
          <p className="lib-reclaim-error" role="alert">{removeError}</p>
        )}
      </Dialog>
    </div>
  );
}
