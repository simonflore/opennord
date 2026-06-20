import { useNavigate } from '@tanstack/react-router';
import { LibraryView } from './LibraryView';
import { ProgramView } from '@/components/program/ProgramView';
import { Button, SplitView } from '@/components/ui';
import { useLibraryState } from '@/lib/library/LibraryContext';
import { useSplitLayout } from '@/lib/responsive';

/**
 * The Library as master/detail. Both `/library` and `/library/$programId` render
 * this: at wide widths the list stays visible beside a detail pane; below the
 * split breakpoint it shows one pane at a time (today's full-page behavior).
 */
export function LibrarySplit({ selectedId }: { selectedId?: string }) {
  const wide = useSplitLayout();
  const s = useLibraryState();
  const navigate = useNavigate();
  const entry = selectedId ? s.entryById(selectedId) : undefined;

  const list = (
    <LibraryView
      entries={s.shown}
      source={s.source}
      query={s.query}
      onSource={s.setSource}
      onQuery={s.setQuery}
      onOpen={(e) => {
        if (e.program) navigate({ to: '/library/$programId', params: { programId: e.id } });
        else navigate({ to: '/device' });
      }}
      onImport={s.importFile}
      onRemove={s.imported.remove}
      prefs={s.prefs}
      folder={s.folder}
    />
  );

  // Narrow: one pane at a time.
  if (!wide) {
    if (!selectedId) return list;
    return (
      <div>
        <Button variant="ghost" onClick={() => navigate({ to: '/library' })}>← Library</Button>
        {entry?.program ? (
          <ProgramView program={entry.program} />
        ) : (
          <p className="lib-empty">This program isn't open. Pick it from the Library.</p>
        )}
      </div>
    );
  }

  // Wide: master list + detail side by side.
  const detail = entry?.program ? (
    <ProgramView program={entry.program} />
  ) : (
    <p className="lib-empty">Pick a program to see its details.</p>
  );
  return <SplitView master={list} detail={detail} />;
}
