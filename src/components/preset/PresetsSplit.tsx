import { useState } from 'react';
import { usePresetsState } from '@/lib/library/PresetsContext';
import { PresetsBrowse } from './PresetsBrowse';
import { PresetInspector } from './PresetInspector';
import { Button, SplitView } from '@/components/ui';
import { useSplitLayout } from '@/lib/responsive';

/** Presets master/detail: the browse list + a thin recognized-preset inspector. */
export function PresetsSplit() {
  const wide = useSplitLayout();
  const s = usePresetsState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const entry = selectedId ? s.entryById(selectedId) : undefined;

  const list = (
    <div className="lib-master">
      <PresetsBrowse
        entries={s.shown}
        source={s.source} setSource={s.setSource}
        kind={s.kind} setKind={s.setKind}
        query={s.query} setQuery={s.setQuery}
        kinds={s.kinds} showSourceFacet={s.showSourceFacet}
        sort={s.prefs.sort} setSort={s.prefs.setSort}
        isFavorite={s.prefs.isFavorite} toggleFavorite={s.prefs.toggleFavorite}
        onSelect={(e) => setSelectedId(e.id)}
      />
    </div>
  );

  const detail = entry
    ? <PresetInspector entry={entry} session={s.session} />
    : <p className="lib-empty" style={{ padding: 16 }}>Pick a preset to see its details.</p>;

  // Narrow: one pane at a time.
  if (!wide) {
    if (!entry) return list;
    return (
      <div>
        <Button variant="ghost" onClick={() => setSelectedId(null)}>← Presets</Button>
        {detail}
      </div>
    );
  }

  return <SplitView master={list} detail={detail} />;
}
