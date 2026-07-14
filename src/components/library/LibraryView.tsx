import './library.css';
import { Button, BrowseToolbar, type FacetGroup } from '../ui';
import { CategoryPanel } from './CategoryPanel';
import { LibraryCard } from './LibraryCard';
import { LibraryEmpty } from './LibraryEmpty';
import { BundlePicker } from './BundlePicker';
import { NewBackupsBanner } from './NewBackupsBanner';
import type { LibraryEntry, LibrarySource, LibrarySort } from '../../lib/library/types';
import type { LibraryPrefsApi } from '../../lib/library/prefs';
import type { FolderLibrary } from '../../lib/folder/useFolderLibrary';

interface Props {
  entries: LibraryEntry[];
  source: LibrarySource | 'all';
  query: string;
  onSource: (s: LibrarySource | 'all') => void;
  /** Format-generation facet (Stage 2/3/4). Shown only when >1 generation is present. */
  generation?: LibraryEntry['generation'] | 'all';
  onGeneration?: (g: LibraryEntry['generation'] | 'all') => void;
  generationsPresent?: Array<NonNullable<LibraryEntry['generation']>>;
  /** Musical-category facet (Bass, Pad, Organ…). Shown only when >1 category is present. */
  category?: string | 'all';
  onCategory?: (c: string | 'all') => void;
  categoriesPresent?: string[];
  onQuery: (q: string) => void;
  onOpen: (e: LibraryEntry) => void;
  onImport: () => void;
  /** Remove an imported program (local source only). */
  onRemove: (id: string) => void;
  /** Message shown when an import was rejected (wrong file type); '' when none. */
  importError?: string;
  onDismissImportError?: () => void;
  /** Sort order + favorites (organize). */
  prefs: LibraryPrefsApi;
  /** The connected folder source (name, scan results, connect/refresh/forget). */
  folder: FolderLibrary;
}

const TABS: Array<LibrarySource | 'all'> = ['all', 'nord', 'local', 'backup', 'cloud'];
const TAB_LABEL: Record<LibrarySource | 'all', string> = { all: 'All', nord: 'On Nord', local: 'Local', backup: 'Backup', cloud: 'Cloud' };

const SORT_LABEL: Record<LibrarySort, string> = { default: 'Default', name: 'Name (A–Z)', source: 'Source' };

export function LibraryView({
  entries, source, query, onSource, onQuery, onOpen, onImport, onRemove,
  generation = 'all', onGeneration, generationsPresent = [],
  category = 'all', onCategory, categoriesPresent = [],
  importError, onDismissImportError, prefs, folder,
}: Props) {
  // Unpack the grouped props so the JSX below reads the same as before.
  const { sort, setSort: onSort, favorites, toggleFavorite: onToggleFavorite } = prefs;
  const { folderName, canPersist, needsReconnect, busy, reconnectError } = folder;
  const onChooseFolder = folder.choose, onReconnect = folder.reconnect, onRefresh = folder.refresh, onForget = folder.forget;
  const folderCount = folder.result.programs.length + folder.result.samples.length;
  const scanErrors = folder.result.errors;

  const nord = entries.filter((e) => e.source === 'nord').length;
  const local = entries.length - nord;

  // When a search/facet is hiding everything, show the shared "no match" state
  // rather than the first-run onboarding (which would wrongly read as "empty").
  const filtered = query.trim() !== '' || source !== 'all'
    || (generationsPresent.length > 1 && (generation ?? 'all') !== 'all')
    || (categoriesPresent.length > 1 && (category ?? 'all') !== 'all');
  const clearFilters = () => { onQuery(''); onSource('all'); onGeneration?.('all'); onCategory?.('all'); };

  const facets: FacetGroup[] = [
    {
      ariaLabel: 'Filter by source',
      value: source,
      options: TABS.map((t) => ({ key: t, label: TAB_LABEL[t] })),
      onChange: (k) => onSource(k as LibrarySource | 'all'),
    },
    ...(generationsPresent.length > 1 ? [{
      ariaLabel: 'Filter by format',
      value: generation ?? 'all',
      options: [{ key: 'all', label: 'All' }, ...generationsPresent.map((g) => ({ key: g, label: g }))],
      onChange: (k: string) => onGeneration?.(k as LibraryEntry['generation'] | 'all'),
    }] : []),
    ...(categoriesPresent.length > 1 ? [{
      ariaLabel: 'Filter by category',
      value: category ?? 'all',
      options: [{ key: 'all', label: 'All' }, ...categoriesPresent.map((c) => ({ key: c, label: c }))],
      onChange: (k: string) => onCategory?.(k),
    }] : []),
  ];

  const actions = (
    <>
      {folderName ? (
        <span className="lib-folder" title={folderName}>
          📁 {folderName} · {folderCount} {folderCount === 1 ? 'file' : 'files'}
          {canPersist && !needsReconnect
            ? <button className="on-btn on-btn--ghost lib-folder__btn" onClick={onRefresh} disabled={busy} aria-label="Refresh folder">⟳</button>
            : <button className="on-btn on-btn--ghost lib-folder__btn" onClick={onChooseFolder} disabled={busy}>Re-pick</button>}
          {/* Disconnect only forgets the folder pointer — it never touches the user's files. */}
          <button className="on-btn on-btn--ghost lib-folder__btn" onClick={onForget} aria-label="Disconnect folder" title="Disconnect this folder">✕</button>
        </span>
      ) : (
        <Button variant="ghost" onClick={onChooseFolder} disabled={busy}>Choose folder</Button>
      )}
      <Button variant="primary" onClick={onImport}>+ Import file</Button>
    </>
  );

  const headExtra = (
    <>
      {needsReconnect && folderName && (
        <div className="lib-reconnect">
          {reconnectError
            ? <span className="lib-reconnect__err">{reconnectError}</span>
            : <span>Reconnect <strong>{folderName}</strong> to load your patches.</span>}
          <button className="on-btn on-btn--ghost" onClick={onReconnect} disabled={busy}>Reconnect</button>
          {/* Never disabled: Forget only clears local state, so it stays the
              escape hatch when a pending browser dialog has wedged `busy`. */}
          <button className="on-btn on-btn--ghost" onClick={onForget}>Forget</button>
        </div>
      )}
      {scanErrors.length > 0 && (
        <div className="lib-errnote" title={scanErrors.map((e) => `${e.path} — ${e.reason}`).join('\n')}>
          {scanErrors.length} {scanErrors.length === 1 ? 'file' : 'files'} couldn't be read — hover for details.
        </div>
      )}
      {importError && (
        <div className="lib-reconnect" role="alert">
          <span className="lib-reconnect__err">{importError}</span>
          <button className="on-btn on-btn--ghost" onClick={onDismissImportError}>Dismiss</button>
        </div>
      )}
      {!folder.pickerOpen && (
        <NewBackupsBanner count={folder.newBundles.length} onReview={folder.openBundlePicker} />
      )}
      <BundlePicker
        open={folder.pickerOpen}
        bundles={folder.newBundles}
        onConfirm={(paths) => { void folder.applyBundleSelection(paths); }}
        onClose={() => { void folder.applyBundleSelection([]); }}
      />
    </>
  );

  return (
    <CategoryPanel
      title="Programs"
      counts={<>{entries.length} programs · {nord} on Nord · {local} local</>}
      actions={actions}
      headExtra={headExtra}
      toolbar={
        <BrowseToolbar
          query={query}
          onQuery={onQuery}
          placeholder="Search patches by name…"
          facets={facets}
          sort={sort}
          sortOptions={(Object.keys(SORT_LABEL) as LibrarySort[]).map((k) => ({ key: k, label: SORT_LABEL[k] }))}
          onSort={(k) => onSort(k as LibrarySort)}
          sortAriaLabel="Sort patches"
        />
      }
      isEmpty={entries.length === 0}
      emptyState={
        <LibraryEmpty noun="program" filtered={filtered} onClear={clearFilters}>
          <p>Nothing here yet.</p>
          <Button variant="primary" onClick={onChooseFolder} disabled={busy}>Choose a folder of Nord files</Button>
          <p className="lib-empty__hint">Subfolders and <code>.ns4b</code> backups are included. Or import a single file, or connect your Nord.</p>
        </LibraryEmpty>
      }
    >
          {entries.map((e) => (
            <LibraryCard
              key={e.id}
              name={e.name}
              source={e.source}
              favorite={favorites.has(e.id)}
              onToggleFavorite={() => onToggleFavorite(e.id)}
              onOpen={() => onOpen(e)}
              badge={<span className="lib-slot">{e.slot ?? e.typeLabel ?? 'file'}</span>}
              engines={e.summary
                ? (
                  <div className="lib-patch__engines">
                    {e.summary.split(' + ').map((part, i) => {
                      const kind = part.trim().toLowerCase();
                      const known = kind === 'organ' || kind === 'piano' || kind === 'synth';
                      return (
                        <span key={i} className={`lib-eng${known ? ` lib-eng--${kind}` : ''}`}>
                          {part.trim()}
                        </span>
                      );
                    })}
                  </div>
                )
                : <div className="lib-patch__sub">—</div>}
              footExtras={e.source === 'local' && (
                <button
                  className="lib-patch__rm"
                  aria-label={`Remove ${e.name}`}
                  title="Remove from library"
                  onClick={(ev) => { ev.stopPropagation(); onRemove(e.id); }}
                  onKeyDown={(ev) => ev.stopPropagation()}
                >✕</button>
              )}
            />
          ))}
    </CategoryPanel>
  );
}
