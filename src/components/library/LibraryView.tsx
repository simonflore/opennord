import './library.css';
import { Button, Card, FilterChip, SearchField, SourceBadge } from '../ui';
import type { LibraryEntry, LibrarySource, LibrarySort } from '../../lib/library/types';
import type { ScanError } from '../../lib/folder/scan';

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
  sort: LibrarySort;
  onSort: (s: LibrarySort) => void;
  favorites: ReadonlySet<string>;
  onToggleFavorite: (id: string) => void;
  // Folder source:
  folderName: string | null;
  folderCount: number;
  canPersist: boolean;
  needsReconnect: boolean;
  busy: boolean;
  reconnectError: string | null;
  onChooseFolder: () => void;
  onReconnect: () => void;
  onRefresh: () => void;
  scanErrors: ScanError[];
  onForget: () => void;
}

const TABS: Array<LibrarySource | 'all'> = ['all', 'nord', 'local'];
const TAB_LABEL: Record<LibrarySource | 'all', string> = { all: 'All', nord: 'On Nord', local: 'Local' };

const SORT_LABEL: Record<LibrarySort, string> = { default: 'Default', name: 'Name (A–Z)', source: 'Source' };

export function LibraryView({
  entries, source, query, onSource, onQuery, onOpen, onImport, onRemove,
  sort, onSort, favorites, onToggleFavorite,
  folderName, folderCount, canPersist, needsReconnect, busy, reconnectError,
  onChooseFolder, onReconnect, onRefresh, scanErrors, onForget,
}: Props) {
  const nord = entries.filter((e) => e.source === 'nord').length;
  const local = entries.length - nord;

  return (
    <div>
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

      <div className="lib-controls">
        <SearchField value={query} onChange={onQuery} placeholder="Search patches, or describe a sound…" />
        {TABS.map((t) => (
          <FilterChip key={t} active={source === t} onClick={() => onSource(t)}>{TAB_LABEL[t]}</FilterChip>
        ))}
        <select className="lib-sort" value={sort} aria-label="Sort patches"
          onChange={(e) => onSort(e.target.value as LibrarySort)}>
          {(Object.keys(SORT_LABEL) as LibrarySort[]).map((k) => (
            <option key={k} value={k}>Sort: {SORT_LABEL[k]}</option>
          ))}
        </select>
      </div>

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
  );
}
