import { useOpenEntry, useRemoveCopy } from '@/components/library/openEntry';
import { usePresetsState } from '@/lib/library/PresetsContext';
import { PresetsBrowse } from './PresetsBrowse';
import { PresetInspector } from './PresetInspector';
import { CategorySplit } from '@/components/library/CategorySplit';
import { EmptyNote, NotListedNote } from '@/components/library/EmptyNote';
import { useSplitLayout } from '@/lib/responsive';
import { copyHere } from '@/lib/library/found-on';

/**
 * Presets master/detail: the browse list + a thin recognized-preset inspector.
 * `/library/presets/{-$presetId}` renders this, with or without a preset; the
 * open preset comes from the route.
 */
export function PresetsSplit({ selectedId }: { selectedId?: string }) {
  const wide = useSplitLayout();
  const s = usePresetsState();
  const open = useOpenEntry();
  const entry = selectedId ? s.entryById(selectedId) : undefined;
  const onRemove = useRemoveCopy('/library/presets', s.removePreset, s.entryById, open.preset);

  function importPreset() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ns4o,.ns4n,.ns4y,.ns3y,.ns2s';
    input.style.display = 'none';
    document.body.appendChild(input);
    const cleanup = () => input.remove();
    input.onchange = async () => {
      const f = input.files?.[0];
      cleanup();
      if (f) await s.importPreset(f);
    };
    input.oncancel = cleanup;
    input.click();
  }

  const list = (
    <div className="lib-master">
      <PresetsBrowse
        entries={s.shown}
        source={s.source} setSource={s.setSource}
        kind={s.kind} setKind={s.setKind} clearFilters={s.clearFilters} filtered={s.filtered}
        query={s.query} setQuery={s.setQuery}
        generation={s.generation} setGeneration={s.setGeneration} generations={s.generations}
        kinds={s.kinds} showSourceFacet={s.showSourceFacet}
        sort={s.prefs.sort} setSort={s.prefs.setSort}
        showCloud={s.showCloud}
        isFavorite={s.prefs.isFavoriteRow} toggleFavorite={s.prefs.toggleFavoriteRow}
        onSelect={(e) => open.preset(e.id)}
        // selectedId may name any entry of the open row.
        activeId={entry?.id ?? selectedId}
        onImport={importPreset}
        onRemove={onRemove}
      />
    </div>
  );

  // A preset with no copy on this computer can be kept once its bytes are here.
  const keepBytes = entry && !copyHere(entry) ? entry.bytes : undefined;
  const detail = entry
    ? <PresetInspector
        key={entry.id} entry={entry} session={s.session} cloud={s.cloud}
        onKeepCopy={keepBytes ? () => void s.keepCopy(entry, keepBytes) : undefined}
      />
    : selectedId ? <NotListedNote noun="preset" className="p-4" />
    : <EmptyNote className="p-4">Pick a preset to see its details.</EmptyNote>;

  return (
    <CategorySplit
      wide={wide}
      master={list}
      detail={detail}
      hasDetail={!!selectedId}
      list="/library/presets"
      backLabel="← Presets"
      selectedId={selectedId}
    />
  );
}
