import { useMemo, useState } from 'react';
import type { RemoveResult } from '@/lib/library/keep-copies';
import '../library/library.css';
import { BrowseToolbar, Button, Dialog, type FacetGroup } from '../ui';
import { CategoryPanel } from '../library/CategoryPanel';
import { LibraryCard } from '../library/LibraryCard';
import { useStableCallback } from '@/lib/useStableCallback';
import { LibraryEmpty } from '../library/LibraryEmpty';
import { FactoryPill } from '../library/FactoryPill';
import { SlotTag } from '../library/SlotTag';
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
  entries, source, setSource, query, setQuery, clearFilters, filtered,
  showSourceFacet, sort, setSort, isFavorite, toggleFavorite, onSelect, activeId,
  // Piano-usage cleanup (device-connected)
  canScanUsage, onScanUsage, scanPct, scanError, unusedCount, unusedOnly, onUnusedOnly,
  // Reclaim-space selection
  selected, selectedEntries, toggleSelected, selectAllUnused, clearSelected, selectedFreeBytes,
  removeFromNord, removing, removePct,
  // Test escape hatch: open the confirm dialog without a click event
  _testConfirmOpen,
}: {
  entries: PianoEntry[];
  source: LibrarySource | 'all'; setSource: (s: LibrarySource | 'all') => void;
  query: string; setQuery: (q: string) => void;
  /** Every filter off and the search cleared (from the list's context). */
  clearFilters: () => void;
  /** Whether any filter or search is narrowing the list (from the list's context). */
  filtered: boolean;
  showSourceFacet: boolean;
  sort: PianoSort; setSort: (s: PianoSort) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  onSelect: (e: PianoEntry) => void;
  /** The entry open in the detail pane, highlighted in the list. */
  activeId?: string | null;
  // Piano-usage cleanup
  canScanUsage: boolean;
  onScanUsage: () => void;
  scanPct: number | null;
  scanError?: string;
  unusedCount: number | null;
  unusedOnly: boolean;
  onUnusedOnly: (v: boolean) => void;
  // Reclaim-space selection
  selected: Set<string>;
  toggleSelected: (id: string) => void;
  selectAllUnused: () => void;
  clearSelected: () => void;
  /** The selected entries from the whole list, filtered out or not (what removal deletes). */
  selectedEntries: PianoEntry[];
  selectedFreeBytes: number;
  removeFromNord: (opts: { keepCopyIds: Set<string> }) => Promise<RemoveResult>;
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


  // Confirm-remove dialog state: selectedEntries is the whole selection (a
  // search may hide some of it), which is what removal deletes.

  const [confirmOpen, setConfirmOpen] = useState(_testConfirmOpen ?? false);
  // Every Nord piano is factory content (there are no user/custom pianos), and
  // pulling an .npno off your own device is fine. So there's no factory/user
  // distinction: keep-a-copy works for any piano. Default OFF only because pianos
  // are multi-GB and re-installable from Nord — an opt-in, not the common path.
  const [keepCopy, setKeepCopy] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const [removeResult, setRemoveResult] = useState<RemoveResult | null>(null);

  function openConfirm() {
    setKeepCopy(false);
    setRemoveError('');
    setRemoveResult(null);
    setConfirmOpen(true);
  }

  async function handleRemove() {
    const keepCopyIds = keepCopyIdsFor(selectedEntries, selected, keepCopy);
    setRemoveError('');
    try {
      const result = await removeFromNord({ keepCopyIds });
      setRemoveResult(result);
      setConfirmOpen(false);
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const confirmTitle = `Delete ${selected.size} ${selected.size === 1 ? 'piano' : 'pianos'} · frees ~${fmtMB(selectedFreeBytes)}`;

  const actions = (canScanUsage || (unusedCount !== null && scanPct === null)) ? (
    <>
      {canScanUsage && (
        <Button variant="secondary" onClick={onScanUsage} disabled={scanPct !== null}>
          {scanPct !== null ? `Scanning… ${scanPct}%` : 'Find unused pianos'}
        </Button>
      )}
      {unusedCount !== null && scanPct === null && (
        <Button
          variant="secondary"
          className={unusedOnly ? 'border-warn' : undefined}
          aria-pressed={unusedOnly}
          onClick={() => onUnusedOnly(!unusedOnly)}
        >
          {unusedCount === 0 ? 'No unused pianos' : `${unusedOnly ? 'Show all' : `Unused only (${unusedCount})`}`}
        </Button>
      )}
    </>
  ) : undefined;

  const banners = (
    <>
      {scanError && <p className="mb-3 text-xs text-danger" role="alert">{scanError}</p>}
      {/* Reclaim bar — shown when at least one piano is selected */}
      {selected.size > 0 && (
        <div
          className="sticky top-[var(--sticky-top)] z-[2] mb-3 flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface-2 px-3 py-2.5"
          role="region"
          aria-label="Selected pianos"
        >
          <span className="mr-auto text-[13px] text-ink">
            {selected.size} selected · frees ~{fmtMB(selectedFreeBytes)}
          </span>
          <Button variant="ghost" onClick={selectAllUnused}>Select all unused</Button>
          <Button variant="outline" onClick={openConfirm}>Delete from Nord</Button>
          <Button variant="ghost" onClick={clearSelected}>Clear</Button>
        </div>
      )}
      {/* Remove result feedback */}
      {removeResult && (
        <p className="mb-3 text-xs text-dim" role="status">
          {removeResult.removed} {removeResult.removed === 1 ? 'piano' : 'pianos'} removed
          {removeResult.failed > 0 && ` · ${removeResult.failed} could not be removed`}
          {removeResult.recovered ? ' · the removal failed part-way and could not be undone; what it had removed was downloaded as a zip' : ''}
        </p>
      )}
    </>
  );

  // Stable handlers and a memoised row list: a search keystroke (or any
  // parent render) with the same entries reuses the rows instead of rebuilding
  // every card, which a folder of a thousand samples feels.
  const onSelectStable = useStableCallback(onSelect);
  const toggleFavoriteStable = useStableCallback(toggleFavorite);
  const toggleSelectedStable = useStableCallback(toggleSelected);
  const rows = useMemo(() => entries.map((entry) => (
              <LibraryCard
                key={entry.id}
                name={entry.name}
                source={entry.source}
                favorite={isFavorite(entry.id)}
                onToggleFavorite={() => toggleFavoriteStable(entry.id)}
                onOpen={() => onSelectStable(entry)}
                selected={entry.id === activeId}
                unused={entry.unused}
                select={unusedOnly && entry.source === 'nord' && entry.unused
                  ? { checked: selected.has(entry.id), onToggle: () => toggleSelectedStable(entry.id) }
                  : undefined}
                badge={entry.slot && <SlotTag>{entry.slot}</SlotTag>}
                footExtras={
                  <>
                    {entry.source === 'backup' && entry.isFactory !== undefined && (
                      <FactoryPill factory={entry.isFactory} />
                    )}
                    {entry.size != null && <SlotTag>{formatBytes(entry.size)}</SlotTag>}
                  </>
                }
              />
            )), [entries, activeId, isFavorite, unusedOnly, selected, onSelectStable, toggleFavoriteStable, toggleSelectedStable]);

  return (
    <>
      <CategoryPanel
        title="Piano Samples"
        counts={`${entries.length} piano${entries.length !== 1 ? 's' : ''}`}
        actions={actions}
        toolbar={
          <BrowseToolbar
            query={query} onQuery={setQuery} placeholder="Search pianos…"
            facets={facets}
            sort={sort} sortOptions={sortOptions} onSort={(k) => setSort(parsePianoSort(k))} sortAriaLabel="Sort pianos"
          />
        }
        banners={banners}
        isEmpty={entries.length === 0}
        emptyState={<LibraryEmpty noun="piano" filtered={filtered} onClear={clearFilters} />}
      >
            {rows}
      </CategoryPanel>

      {/* Confirm-remove dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={confirmTitle}
        footer={
          <div className="on-dialog__footer-actions">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={removing}>Cancel</Button>
            <Button variant="primary" onClick={() => void handleRemove()} disabled={removing}>
              {removing && removePct !== null ? `Deleting… ${removePct}%` : 'Delete from Nord'}
            </Button>
          </div>
        }
      >
        {selectedEntries.some((entry) => entry.factory != null) && (
          <p className="mb-2 border-l-2 border-l-red pl-2.5 text-xs text-dim">
            You can re-install these from Nord's library any time:
            {selectedEntries.filter((entry) => entry.factory != null).map((entry) => (
              <span key={entry.id}>
                {' '}<a href={entry.factory!.url} target="_blank" rel="noopener noreferrer">{entry.name}</a>
              </span>
            ))}
          </p>
        )}
        <label className="my-2 flex items-center gap-2 text-[13px] text-ink">
          <input
            type="checkbox"
            checked={keepCopy}
            onChange={(ev) => setKeepCopy(ev.currentTarget.checked)}
          />
          {' '}Save a copy to a folder first
        </label>
        {removeError && (
          <p className="mt-2 text-xs text-danger" role="alert">{removeError}</p>
        )}
      </Dialog>
    </>
  );
}
