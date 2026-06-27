import { useState } from 'react';
import '../library/library.css';
import { BrowseToolbar, Button, Card, Dialog, Pill, SourceBadge, type FacetGroup } from '../ui';
import type { PianoEntry } from '@/lib/library/piano-entries';
import type { LibrarySource } from '@/lib/library/types';
import type { PianoSort } from '@/lib/library/prefs';
import { formatBytes } from '@/lib/format';

const SORT_LABEL: Record<PianoSort, string> = { default: 'Default', name: 'Name (A–Z)', size: 'Size' };

/** Which selected pianos to keep a local copy of before removal: all of them when
 *  the toggle is on. Every Nord piano is factory content (no user/custom pianos)
 *  and pulling your own device's .npno is fine, so there's no factory exclusion. */
export function keepCopyIdsFor(entries: PianoEntry[], selected: Set<string>, keepCopy: boolean): Set<string> {
  return keepCopy ? new Set(entries.filter((e) => selected.has(e.id)).map((e) => e.id)) : new Set<string>();
}

const parsePianoSort = (raw: string): PianoSort =>
  raw === 'name' || raw === 'size' ? raw : 'default';

/** Round bytes to nearest MB for the reclaim bar. */
function fmtMB(bytes: number): string {
  return `${Math.round(bytes / 1048576)} MB`;
}

export function PianosBrowse({
  entries, source, setSource, query, setQuery,
  showSourceFacet, sort, setSort, isFavorite, toggleFavorite, onSelect,
  // Piano-usage cleanup (device-connected)
  canScanUsage, onScanUsage, scanPct, unusedCount, unusedOnly, onUnusedOnly,
  // Reclaim-space selection
  selected, toggleSelected, selectAllUnused, clearSelected, selectedFreeBytes,
  removeFromNord, removing, removePct,
  // Test escape hatch: open the confirm dialog without a click event
  _testConfirmOpen,
}: {
  entries: PianoEntry[];
  source: LibrarySource | 'all'; setSource: (s: LibrarySource | 'all') => void;
  query: string; setQuery: (q: string) => void;
  showSourceFacet: boolean;
  sort: PianoSort; setSort: (s: PianoSort) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  onSelect: (e: PianoEntry) => void;
  // Piano-usage cleanup
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
  /** For tests only: force the confirm dialog open on first render. */
  _testConfirmOpen?: boolean;
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

  // Confirm-remove dialog state
  const selectedEntries = entries.filter((e) => selected.has(e.id));

  const [confirmOpen, setConfirmOpen] = useState(_testConfirmOpen ?? false);
  // Every Nord piano is factory content (there are no user/custom pianos), and
  // pulling an .npno off your own device is fine. So there's no factory/user
  // distinction: keep-a-copy works for any piano. Default OFF only because pianos
  // are multi-GB and re-installable from Nord — an opt-in, not the common path.
  const [keepCopy, setKeepCopy] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const [removeResult, setRemoveResult] = useState<{ removed: number; failed: number } | null>(null);

  function openConfirm() {
    setKeepCopy(false);
    setRemoveError('');
    setRemoveResult(null);
    setConfirmOpen(true);
  }

  async function handleRemove() {
    const keepCopyIds = keepCopyIdsFor(entries, selected, keepCopy);
    setRemoveError('');
    try {
      const result = await removeFromNord({ keepCopyIds });
      setRemoveResult(result);
      setConfirmOpen(false);
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const confirmTitle = `Remove ${selected.size} ${selected.size === 1 ? 'piano' : 'pianos'} · frees ~${fmtMB(selectedFreeBytes)}`;

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
          <div className="lib-actions">
            {canScanUsage && (
              <button className="on-btn" onClick={onScanUsage} disabled={scanPct !== null}>
                {scanPct !== null ? `Scanning… ${scanPct}%` : 'Find unused pianos'}
              </button>
            )}
            {unusedCount !== null && scanPct === null && (
              <button
                className={`on-btn${unusedOnly ? ' is-active' : ''}`}
                aria-pressed={unusedOnly}
                onClick={() => onUnusedOnly(!unusedOnly)}
              >
                {unusedCount === 0 ? 'No unused pianos' : `${unusedOnly ? 'Show all' : `Unused only (${unusedCount})`}`}
              </button>
            )}
          </div>
        </div>
        <BrowseToolbar
          query={query} onQuery={setQuery} placeholder="Search pianos…"
          facets={facets}
          sort={sort} sortOptions={sortOptions} onSort={(k) => setSort(parsePianoSort(k))} sortAriaLabel="Sort pianos"
        />
      </div>

      {/* Reclaim bar — shown when at least one piano is selected */}
      {selected.size > 0 && (
        <div className="lib-reclaim-bar" role="region" aria-label="Selected pianos">
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
          {removeResult.removed} {removeResult.removed === 1 ? 'piano' : 'pianos'} removed
          {removeResult.failed > 0 && ` · ${removeResult.failed} could not be removed`}
        </p>
      )}

      <div className="lib-panel__body">
        {entries.length === 0 ? (
          <p className="lib-empty">No pianos match your filter.</p>
        ) : (
          <div className="lib-grid">
            {entries.map((entry) => (
              <Card
                key={entry.id}
                accent={entry.source === 'nord'}
                className="lib-patch"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(entry)}
                onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelect(entry); } }}
              >
                <div className="lib-patch__top">
                  {unusedOnly && entry.source === 'nord' && entry.unused && (
                    <input
                      type="checkbox"
                      className="lib-patch__select"
                      aria-label={`Select ${entry.name}`}
                      checked={selected.has(entry.id)}
                      onChange={() => toggleSelected(entry.id)}
                      onClick={(ev) => ev.stopPropagation()}
                    />
                  )}
                  <button
                    className={`lib-fav${isFavorite(entry.id) ? ' is-fav' : ''}`}
                    aria-label={isFavorite(entry.id) ? `Unfavorite ${entry.name}` : `Favorite ${entry.name}`}
                    aria-pressed={isFavorite(entry.id)}
                    onClick={(ev) => { ev.stopPropagation(); toggleFavorite(entry.id); }}
                    onKeyDown={(ev) => ev.stopPropagation()}
                  >{isFavorite(entry.id) ? '★' : '☆'}</button>
                  <span className="lib-patch__nm">{entry.name}</span>
                  {entry.unused && <span className="lib-tag lib-tag--unused" title="Not used by any program">unused</span>}
                  {entry.slot && <span className="lib-slot">{entry.slot}</span>}
                </div>
                <div className="lib-patch__foot">
                  <SourceBadge source={entry.source} />
                  {entry.source === 'backup' && entry.isFactory !== undefined && (
                    <Pill>{entry.isFactory ? 'Factory' : 'Yours'}</Pill>
                  )}
                  {entry.size != null && <span className="lib-slot">{formatBytes(entry.size)}</span>}
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
        {selectedEntries.some((entry) => entry.factory != null) && (
          <p className="lib-reclaim-disclaimer">
            You can re-install these from Nord's library any time:
            {selectedEntries.filter((entry) => entry.factory != null).map((entry) => (
              <span key={entry.id}>
                {' '}<a href={entry.factory!.url} target="_blank" rel="noopener noreferrer">{entry.name}</a>
              </span>
            ))}
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
