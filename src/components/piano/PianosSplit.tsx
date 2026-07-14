import { useState } from 'react';
import { usePianosState } from '@/lib/library/PianosContext';
import { PianosBrowse } from './PianosBrowse';
import { PianoInspector } from './PianoInspector';
import { CategorySplit } from '@/components/library/CategorySplit';
import { useSplitLayout } from '@/lib/responsive';

/** Pianos master/detail: the browse list + a thin piano inspector. */
export function PianosSplit() {
  const wide = useSplitLayout();
  const s = usePianosState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const entry = selectedId ? s.entryById(selectedId) : undefined;

  const list = (
    <div className="lib-master">
      <PianosBrowse
        entries={s.shown}
        source={s.source} setSource={s.setSource}
        query={s.query} setQuery={s.setQuery}
        showSourceFacet={s.showSourceFacet}
        sort={s.prefs.sort} setSort={s.prefs.setSort}
        isFavorite={s.prefs.isFavorite} toggleFavorite={s.prefs.toggleFavorite}
        onSelect={(e) => setSelectedId(e.id)}
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
    ? <PianoInspector entry={entry} session={s.session} />
    : <p className="lib-empty" style={{ padding: 16 }}>Pick a piano to see its details.</p>;

  return (
    <CategorySplit
      wide={wide}
      master={list}
      detail={detail}
      hasDetail={!!entry}
      onBack={() => setSelectedId(null)}
      backLabel="← Pianos"
    />
  );
}
