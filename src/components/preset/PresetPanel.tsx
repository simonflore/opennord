import { useMemo, useState } from 'react';
import { parseNs4Preset, type Ns4Preset } from '@/lib/ns4/preset';
import { presetVoices, presetParamSections } from '@/lib/ns4/preset-view';
import { filterRows } from '@/lib/ns4/params-view';
import { EngineCard } from '@/components/program/EngineCard';
import { MorphList } from '@/components/program/Morphs';
import { FxPanel } from '@/components/program/FxPanel';
import { ParamsDrawer, type ParamsDrawerGroup } from '@/components/program/AllParamsDrawer';
import { useResolvedSampleNames } from '@/components/program/BandedProgramView';
import { readSynthPreset, type SynthPresetRead } from '@/lib/synth-preset';

/**
 * A preset's sound, from its file: a Stage 4 organ/piano/synth preset drawn as
 * its engine panel (the Program view's cards) with the full parameter list
 * behind a drawer; a Stage 3 or Stage 2 synth preset as its model's synth card.
 * Without bytes (a preset still on the Nord) or for one no reader takes, a line
 * saying so.
 */
export function PresetPanel({ bytes }: { bytes?: Uint8Array }) {
  const decoded = useMemo(() => (bytes ? parseNs4Preset(bytes) : null), [bytes]);
  const synth = useMemo(() => (bytes && !decoded ? readSynthPreset(bytes) : null), [bytes, decoded]);
  const voices = useMemo(() => (decoded ? presetVoices(decoded) : []), [decoded]);
  const stacked = voices.length > 1;
  if (synth) return <SynthPresetPanel preset={synth} />;
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
            <FxPanel view={v.fx} title="FX" />
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

/** A Stage 3 / Stage 2 synth preset: its synth card, the factory sample's name looked up when it plays one. */
function SynthPresetPanel({ preset }: { preset: SynthPresetRead }) {
  const names = useResolvedSampleNames(async (): Promise<Record<string, string>> => {
    if (preset.sampleId === undefined) return {};
    const { resolveSample } = await import('@/lib/ns3/library/service');
    const r = resolveSample(preset.sampleId, 0);
    return r ? { sample: r.name } : {};
  }, [preset]);
  const { card } = preset;
  if (!card) {
    return (
      <p className="ps-sub">
        OpenNord can't open this {preset.model} synth preset: it isn't laid out like the ones OpenNord knows, so its settings would read wrong.
      </p>
    );
  }
  return (
    <section className="ps-panel">
      <EngineCard card={names.sample ? { ...card, synth: { ...card.synth, osc: names.sample } } : card} />
      <p className="ps-sub">
        A {preset.model} synth preset holds the synth's own settings; its level and keyboard zone come from the program it is loaded into.
      </p>
      {/* The readers' warnings name bytes and fields; say what they mean for the sound instead. */}
      {preset.warnings.length > 0 && (
        <p className="ps-sub">Some settings in this preset look unusual for a {preset.model}, so the panel may not show them exactly as the instrument plays them.</p>
      )}
    </section>
  );
}
