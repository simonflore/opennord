import { createRoute, useNavigate, useParams } from '@tanstack/react-router';
import { rootRoute } from '@/routes/root';
import { LibraryView } from '@/components/library/LibraryView';
import { ProgramView } from '@/components/program/ProgramView';
import { Button } from '@/components/ui';
import { useLibraryState } from '@/lib/library/LibraryContext';

export const LibraryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library',
  component: LibraryScreen,
});

export const ProgramRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library/$programId',
  component: ProgramScreen,
});

function LibraryScreen() {
  const s = useLibraryState();
  const navigate = useNavigate();
  return (
    <LibraryView
      entries={s.shown} source={s.source} query={s.query}
      onSource={s.setSource} onQuery={s.setQuery}
      onOpen={(e) => {
        // Programs we already hold open in place (deep-linkable); Nord-only stubs
        // are read on the Device screen via the pull flow.
        if (e.program) navigate({ to: '/library/$programId', params: { programId: e.id } });
        else navigate({ to: '/device' });
      }}
      onImport={s.importFile} onRemove={s.imported.remove}
      sort={s.prefs.sort} onSort={s.prefs.setSort}
      favorites={s.prefs.favorites} onToggleFavorite={s.prefs.toggleFavorite}
      folderName={s.folder.folderName}
      folderCount={s.folder.result.programs.length + s.folder.result.samples.length}
      canPersist={s.folder.canPersist} needsReconnect={s.folder.needsReconnect}
      reconnectError={s.folder.reconnectError} busy={s.folder.busy}
      onChooseFolder={s.folder.choose} onReconnect={s.folder.reconnect}
      onRefresh={s.folder.refresh} scanErrors={s.folder.result.errors}
      onForget={s.folder.forget}
    />
  );
}

function ProgramScreen() {
  const { programId } = useParams({ from: '/library/$programId' });
  const navigate = useNavigate();
  const s = useLibraryState();
  const entry = s.entryById(programId);

  // Cold deep-link (entry not in memory, or a Nord stub): don't auto-redirect —
  // the imported/folder sources load async, so a flash-redirect would race them.
  // Show a calm fallback with a way back to the list.
  if (!entry?.program) {
    return (
      <div>
        <Button variant="ghost" onClick={() => navigate({ to: '/library' })}>← Library</Button>
        <p className="lib-empty">This program isn’t open. Pick it from the Library.</p>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate({ to: '/library' })}>← Library</Button>
      <ProgramView program={entry.program} />
    </div>
  );
}
