import { useNavigate } from '@tanstack/react-router';
import { openPiano } from '@/components/library/openEntry';
import { usePianosState } from '@/lib/library/PianosContext';
import { PianosBrowse } from './PianosBrowse';
import { PianoInspector } from './PianoInspector';
import { CategorySplit } from '@/components/library/CategorySplit';
import { EmptyNote } from '@/components/library/EmptyNote';
import { useSplitLayout } from '@/lib/responsive';

/**
 * Pianos master/detail: the browse list + a thin piano inspector.
 * `/library/pianos/{-$pianoId}` renders this, with or without a piano; the open
 * piano comes from the route.
 */
export function PianosSplit({ selectedId }: { selectedId?: string }) {
  const wide = useSplitLayout();
  const s = usePianosState();
  const navigate = useNavigate();
  const entry = selectedId ? s.entryById(selectedId) : undefined;

  const list = (
    <div className="lib-master">
      <PianosBrowse
        entries={s.shown}
        source={s.source} setSource={s.setSource}
        query={s.query} setQuery={s.setQuery} clearFilters={s.clearFilters} filtered={s.filtered}
        showSourceFacet={s.showSourceFacet}
        sort={s.prefs.sort} setSort={s.prefs.setSort}
        isFavorite={s.prefs.isFavorite} toggleFavorite={s.prefs.toggleFavorite}
        onSelect={(e) => openPiano(navigate, e.id, true)}
        activeId={selectedId}
        canScanUsage={s.canScanUsage} onScanUsage={() => void s.scanUsage()} scanPct={s.scanPct}
        unusedCount={s.unusedCount} unusedOnly={s.unusedOnly} onUnusedOnly={s.setUnusedOnly}
        selected={s.selected} toggleSelected={s.toggleSelected}
        selectAllUnused={s.selectAllUnused} clearSelected={s.clearSelected}
        selectedFreeBytes={s.selectedFreeBytes}
        removeFromNord={s.removeFromNord}
        removing={s.removing} removePct={s.removePct}
      />
    </div>
  );

  const detail = entry
    ? <PianoInspector key={entry.id} entry={entry} session={s.session} />
    : selectedId ? <EmptyNote className="p-4">This piano isn’t in your library right now. Pick one from the list.</EmptyNote>
    : <EmptyNote className="p-4">Pick a piano to see its details.</EmptyNote>;

  return (
    <CategorySplit
      wide={wide}
      master={list}
      detail={detail}
      hasDetail={!!selectedId}
      list="/library/pianos"
      backLabel="← Pianos"
      selectedId={selectedId}
    />
  );
}
