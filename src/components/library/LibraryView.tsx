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
}

const TABS: Array<LibrarySource | 'all'> = ['all', 'nord', 'local'];
const TAB_LABEL: Record<LibrarySource | 'all', string> = { all: 'All', nord: 'On Nord', local: 'Local' };

export function LibraryView({ entries, source, query, onSource, onQuery, onOpen, onImport }: Props) {
  const nord = entries.filter((e) => e.source === 'nord').length;
  const local = entries.length - nord;

  return (
    <div>
      <div className="lib-head">
        <div>
          <div className="lib-title">Library</div>
          <div className="lib-counts">{entries.length} programs · {nord} on Nord · {local} local</div>
        </div>
        <Button variant="primary" onClick={onImport}>+ Import file</Button>
      </div>

      <div className="lib-controls">
        <SearchField value={query} onChange={onQuery} placeholder="Search patches, or describe a sound…" />
        {TABS.map((t) => (
          <FilterChip key={t} active={source === t} onClick={() => onSource(t)}>{TAB_LABEL[t]}</FilterChip>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="lib-empty">No programs yet — import a .ns4p or connect your Nord.</div>
      ) : (
        <div className="lib-grid">
          {entries.map((e) => (
            <Card key={e.id} accent={e.source === 'nord'} className="lib-patch" onClick={() => onOpen(e)}>
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
