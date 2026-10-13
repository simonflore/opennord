import { useNavigate } from '@tanstack/react-router';
import { useOpenEntry } from '@/components/library/openEntry';
import { usePianosState } from '@/lib/library/PianosContext';
import { PianosBrowse } from './PianosBrowse';
import { PianoInspector } from './PianoInspector';
import { CategorySplit } from '@/components/library/CategorySplit';
import { EmptyNote, NotListedNote } from '@/components/library/EmptyNote';
import { useSplitLayout } from '@/lib/responsive';
import { useCapabilities } from '@/lib/capabilities/CapabilitiesContext';
import { COMMUNITY_SHARE_TO } from '@/components/shell/nav';
import { canShareAudio } from '@/lib/library/share-audio';

/**
 * Pianos master/detail: the browse list + a thin piano inspector.
 * `/library/pianos/{-$pianoId}` renders this, with or without a piano; the open
 * piano comes from the route.
 */
export function PianosSplit({ selectedId }: { selectedId?: string }) {
  const wide = useSplitLayout();
  const s = usePianosState();
  const open = useOpenEntry();
  const community = useCapabilities().community;
  const navigate = useNavigate();
  const share = (id: string) => () => void navigate({ to: COMMUNITY_SHARE_TO, search: { item: id } as never });
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
        onSelect={(e) => open.piano(e.id)}
        activeId={selectedId}
        canScanUsage={s.canScanUsage} onScanUsage={() => void s.scanUsage()} scanPct={s.scanPct} scanError={s.scanError}
        unusedCount={s.unusedCount} unusedOnly={s.unusedOnly} onUnusedOnly={s.setUnusedOnly}
        selected={s.selected} selectedEntries={s.selectedEntries} toggleSelected={s.toggleSelected}
        selectAllUnused={s.selectAllUnused} clearSelected={s.clearSelected}
        selectedFreeBytes={s.selectedFreeBytes}
        removeFromNord={s.removeFromNord}
        removing={s.removing} removePct={s.removePct}
      />
    </div>
  );

  const detail = entry
    ? <PianoInspector key={entry.id} entry={entry} session={s.session} onShare={canShareAudio(community, entry) ? share(entry.id) : undefined} />
    : selectedId ? <NotListedNote noun="piano" className="p-4" />
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
