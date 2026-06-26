import './library.css';
import { Button, BrowseToolbar, Card, SourceBadge } from '../ui';
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
  onQuery: (q: string) => void;
  onOpen: (e: LibraryEntry) => void;
  onImport: () => void;
  /** Remove an imported program (local source only). */
  onRemove: (id: string) => void;
  /** Sort order + favorites (organize). */
  prefs: LibraryPrefsApi;
  /** The connected folder source (name, scan results, connect/refresh/forget). */
  folder: FolderLibrary;
}

const TABS: Array<LibrarySource | 'all'> = ['all', 'nord', 'local', 'backup'];
const TAB_LABEL: Record<LibrarySource | 'all', string> = { all: 'All', nord: 'On Nord', local: 'Local', backup: 'Backup' };

const SORT_LABEL: Record<LibrarySort, string> = { default: 'Default', name: 'Name (A–Z)', source: 'Source' };

export function LibraryView({
  entries, source, query, onSource, onQuery, onOpen, onImport, onRemove,
  prefs, folder,
}: Props) {
  // Unpack the grouped props so the JSX below reads the same as before.
  const { sort, setSort: onSort, favorites, toggleFavorite: onToggleFavorite } = prefs;
  const { folderName, canPersist, needsReconnect, busy, reconnectError } = folder;
  const onChooseFolder = folder.choose, onReconnect = folder.reconnect, onRefresh = folder.refresh, onForget = folder.forget;
  const folderCount = folder.result.programs.length + folder.result.samples.length;
  const scanErrors = folder.result.errors;

  const nord = entries.filter((e) => e.source === 'nord').length;
  const local = entries.length - nord;

  return (
    <div className="lib-panel">
      <div className="lib-panel__head">
      <div className="lib-head">
        <div>
          <h1 className="lib-title">Library</h1>
          <div className="lib-counts">{entries.length} programs · {nord} on Nord · {local} local</div>
        </div>
        <div className="lib-actions">
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
        </div>
      </div>

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

      {!folder.pickerOpen && (
        <NewBackupsBanner count={folder.newBundles.length} onReview={folder.openBundlePicker} />
      )}
      <BundlePicker
        open={folder.pickerOpen}
        bundles={folder.newBundles}
        onConfirm={(paths) => { void folder.applyBundleSelection(paths); }}
        onClose={() => { void folder.applyBundleSelection([]); }}
      />

      <BrowseToolbar
        query={query}
        onQuery={onQuery}
        placeholder="Search patches by name…"
        facets={[{
          ariaLabel: 'Filter by source',
          value: source,
          options: TABS.map((t) => ({ key: t, label: TAB_LABEL[t] })),
          onChange: (k) => onSource(k as LibrarySource | 'all'),
        }]}
        sort={sort}
        sortOptions={(Object.keys(SORT_LABEL) as LibrarySort[]).map((k) => ({ key: k, label: SORT_LABEL[k] }))}
        onSort={(k) => onSort(k as LibrarySort)}
        sortAriaLabel="Sort patches"
      />
      </div>

      <div className="lib-panel__body">
      {entries.length === 0 ? (
        <div className="lib-empty">
          <p>Nothing here yet.</p>
          <Button variant="primary" onClick={onChooseFolder} disabled={busy}>Choose a folder of Nord files</Button>
          <p className="lib-empty__hint">Subfolders and <code>.ns4b</code> backups are included. Or import a single file, or connect your Nord.</p>
        </div>
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
                  title={favorites.has(e.id) ? 'Remove from favorites' : 'Add to favorites'}
                  onClick={(ev) => { ev.stopPropagation(); onToggleFavorite(e.id); }}
                  onKeyDown={(ev) => ev.stopPropagation()}
                >{favorites.has(e.id) ? '★' : '☆'}</button>
                <span className="lib-patch__nm">{e.name}</span>
                <span className="lib-slot">{e.slot ?? 'file'}</span>
              </div>
              {e.summary
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
              <div className="lib-patch__foot">
                <SourceBadge source={e.source} />
                {e.source === 'local' && (
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
    </div>
  );
}
