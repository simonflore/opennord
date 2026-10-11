import { useNavigate } from '@tanstack/react-router';
import { closeRemoved, useOpenEntry } from '@/components/library/openEntry';
import { usePresetsState } from '@/lib/library/PresetsContext';
import { PresetsBrowse } from './PresetsBrowse';
import { PresetInspector } from './PresetInspector';
import { CategorySplit } from '@/components/library/CategorySplit';
import { EmptyNote } from '@/components/library/EmptyNote';
import { useSplitLayout } from '@/lib/responsive';

/**
 * Presets master/detail: the browse list + a thin recognized-preset inspector.
 * `/library/presets/{-$presetId}` renders this, with or without a preset; the
 * open preset comes from the route.
 */
export function PresetsSplit({ selectedId }: { selectedId?: string }) {
  const wide = useSplitLayout();
  const s = usePresetsState();
  const navigate = useNavigate();
  const open = useOpenEntry();
  const entry = selectedId ? s.entryById(selectedId) : undefined;

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
        kinds={s.kinds} showSourceFacet={s.showSourceFacet}
        sort={s.prefs.sort} setSort={s.prefs.setSort}
        isFavorite={s.prefs.isFavorite} toggleFavorite={s.prefs.toggleFavorite}
        onSelect={(e) => open.preset(e.id)}
        activeId={selectedId}
        onImport={importPreset}
        onRemove={(id) => { void s.removePreset(id); closeRemoved(navigate, '/library/presets', selectedId, [id]); }}
      />
    </div>
  );

  const detail = entry
    ? <PresetInspector key={entry.id} entry={entry} session={s.session} />
    : selectedId ? <EmptyNote className="p-4">This preset isn’t in your library right now. Pick one from the list.</EmptyNote>
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
