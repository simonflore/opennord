import './library.css';
import { Button, Card, FilterChip, SearchField, SourceBadge } from '../ui';
import type { LibraryEntry, LibrarySource } from '../../lib/library/types';

interface Props {
  entries: LibraryEntry[];
  source: LibrarySource | 'all';
  query: string;
  onSource: (s: LibrarySource | 'all') => void;
  onQuery: (q: string) => void;
  onOpen: (e: LibraryEntry) => void;
  onImport: () => void;
  // Folder source:
  folderName: string | null;
  folderCount: number;
  canPersist: boolean;
  needsReconnect: boolean;
  busy: boolean;
  onChooseFolder: () => void;
  onReconnect: () => void;
  onRefresh: () => void;
}

const TABS: Array<LibrarySource | 'all'> = ['all', 'nord', 'local'];
const TAB_LABEL: Record<LibrarySource | 'all', string> = { all: 'All', nord: 'On Nord', local: 'Local' };

export function LibraryView({
  entries, source, query, onSource, onQuery, onOpen, onImport,
  folderName, folderCount, canPersist, needsReconnect, busy,
  onChooseFolder, onReconnect, onRefresh,
}: Props) {
  const nord = entries.filter((e) => e.source === 'nord').length;
  const local = entries.length - nord;

  return (
    <div>
      <div className="lib-head">
        <div>
          <div className="lib-title">Library</div>
          <div className="lib-counts">{entries.length} programs · {nord} on Nord · {local} local</div>
        </div>
        <div className="lib-actions">
          {folderName ? (
            <span className="lib-folder" title={folderName}>
              📁 {folderName} · {folderCount} {folderCount === 1 ? 'file' : 'files'}
              {canPersist
                ? <button className="on-btn on-btn--ghost lib-folder__btn" onClick={onRefresh} disabled={busy} aria-label="Refresh folder">⟳</button>
                : <button className="on-btn on-btn--ghost lib-folder__btn" onClick={onChooseFolder} disabled={busy}>Re-pick</button>}
            </span>
          ) : (
            <Button variant="ghost" onClick={onChooseFolder} disabled={busy}>Choose folder</Button>
          )}
          <Button variant="primary" onClick={onImport}>+ Import file</Button>
        </div>
      </div>

      {needsReconnect && folderName && (
        <div className="lib-reconnect">
          Reconnect <strong>{folderName}</strong> to load your patches.
          <button className="on-btn on-btn--ghost" onClick={onReconnect} disabled={busy}>Reconnect</button>
        </div>
      )}

      <div className="lib-controls">
        <SearchField value={query} onChange={onQuery} placeholder="Search patches, or describe a sound…" />
        {TABS.map((t) => (
          <FilterChip key={t} active={source === t} onClick={() => onSource(t)}>{TAB_LABEL[t]}</FilterChip>
        ))}
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
              <div className="lib-patch__nm">{e.name}</div>
              <div className="lib-patch__sub">{e.summary ?? '—'}</div>
              <div className="lib-patch__row">
                <SourceBadge source={e.source} />
                <span className="lib-slot">{e.slot ?? 'file'}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
