import { useMemo, useState } from 'react';
import { parseNs4Preset, type Ns4Preset } from '@/lib/ns4/preset';
import { presetVoices, presetParamSections } from '@/lib/ns4/preset-view';
import { filterRows } from '@/lib/ns4/params-view';
import { EngineCard } from '@/components/program/EngineCard';
import { MorphList } from '@/components/program/Morphs';
import { FxChain } from '@/components/program/widgets';
import { ParamsDrawer, type ParamsDrawerGroup } from '@/components/program/AllParamsDrawer';

/**
 * A preset's sound, from its file: a Stage 4 organ/piano/synth preset drawn as
 * its engine panel (the Program view's cards) with the full parameter list
 * behind a drawer. Without bytes (a preset still on the Nord) or for one with
 * no reader (ns3y/ns2s, where parseNs4Preset returns null), a line saying so.
 */
export function PresetPanel({ bytes }: { bytes?: Uint8Array }) {
  const decoded = useMemo(() => (bytes ? parseNs4Preset(bytes) : null), [bytes]);
  const voices = useMemo(() => (decoded ? presetVoices(decoded) : []), [decoded]);
  const stacked = voices.length > 1;
  if (!decoded) {
    return <p className="ps-sub">This preset is recognized but not opened in detail — OpenNord lists and moves presets without decoding them.</p>;
  }
  return (
    <>
      {voices.map((v) => (
        <section className="ps-panel" key={v.letter}>
          {stacked && <div className="ps-panel-lbl">Layer {v.letter}</div>}
          <div className="ps-preset-grid">
            <EngineCard card={v.card} />
            <FxChain slots={v.fx} />
          </div>
          <MorphList rows={v.morphs} />
        </section>
      ))}
      <PresetParams preset={decoded} />
    </>
  );
}

/** Every parameter of the preset, for reference: the Program view's drawer,
 *  sectioned the way the panel reads. Stacked voices tag each section's layer. */
function PresetParams({ preset }: { preset: Ns4Preset }) {
  const [query, setQuery] = useState('');
  const sections = useMemo(() => {
    const stacked = preset.layers.length > 1;
    return preset.layers.flatMap((l) => presetParamSections(l.rows).map((g): ParamsDrawerGroup => ({
      ...g, key: `${l.letter}-${g.key}`, tag: stacked ? l.letter : undefined,
    })));
  }, [preset]);
  const total = useMemo(() => sections.reduce((n, g) => n + g.rows.length, 0), [sections]);
  const groups = useMemo(
    () => sections.map((g) => ({ ...g, rows: filterRows(g.rows, query) })).filter((g) => g.rows.length > 0),
    [sections, query],
  );
  return <ParamsDrawer total={total} query={query} onQuery={setQuery} groups={groups} />;
}
