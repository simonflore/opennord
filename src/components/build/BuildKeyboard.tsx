import { useEffect, useMemo, useState } from 'react';
import { Button, SectionLabel } from '@/components/ui';
import { KeyboardZoneMap } from '@/components/sample/KeyboardZoneMap';
import { MidiConnect } from '@/components/sample/MidiConnect';
import { loadSample } from '@/components/sample/loadSample';
import { useSampleTransport } from '@/components/sample/useSampleTransport';
import { useSamplerMidiSink } from '@/components/sample/useSamplerMidiSink';
import { moveSplit, type SampleProject } from '@/lib/sample-build/model';
import { MAX_KEYS_ABOVE_ROOT } from '@/lib/ns4/nsmp-write';
import type { Apply } from '@/lib/library/useSampleProject';
import { autoMap, keyGaps } from '@/lib/sample-build/analysis/automap';
import { TARGETS } from '@/lib/sample-build/targets';
import { noteName } from '@/lib/ns4/sample-view';
import type { EditZone } from '@/lib/ns4/sample-edit';
import { plural } from '@/lib/plural';
import { useApplyError } from './useApplyError';
import { useNarrow } from '@/lib/responsive';
import { KEY_MAX, KEY_MIN } from '@/lib/ns4/keyboard-view';
import type { Built } from './useBuiltFile';

const NO_ENVELOPE = () => null;
const NO_UNISON = () => 0;

/**
 * The built sample's sampler, so the keyboard plays the file the Nord gets. Null until there is
 * one. A newer build waits until no note sounds, so a rebuild never cuts a note being held.
 */
function useBuiltSampler(built: Built) {
  const file = built && 'file' in built && built.file.extension !== '.npno' ? built.file : null;
  const next = useMemo(() => (file ? loadSample(file.bytes, file.fileName, { env: NO_ENVELOPE, unisonLevel: NO_UNISON }) : null), [file]);
  const [loaded, setLoaded] = useState(next);
  const sampler = loaded?.decodable ? loaded.sampler : null;
  const transport = useSampleTransport(sampler);
  const quiet = transport.sounding.size === 0;
  useEffect(() => { if (next !== loaded && quiet) setLoaded(next); }, [next, loaded, quiet]);
  useEffect(() => () => { sampler?.stopAll(); }, [sampler]);
  useSamplerMidiSink(sampler, !!sampler, transport.refresh);
  return { loaded, sampler, transport };
}

/**
 * The zones on the keyboard (spec §7, canvas "Build sample"): each band named by its root, select
 * one, drag a split, Auto map, and play the built sample with the mouse or a MIDI keyboard.
 */
export function BuildKeyboard({ project, selectedZoneId, onSelect, apply, built }: {
  project: SampleProject;
  /** One of the project's zones (the caller resolves it), or null when there are none. */
  selectedZoneId: string | null;
  onSelect: (zoneId: string) => void;
  apply: Apply;
  built: Built;
}) {
  const [run, error] = useApplyError(apply);
  // A phone shows two octaves around the selected zone, keys wide enough to tap.
  const narrow = useNarrow();
  const zones = [...project.zones].sort((a, b) => a.keyLow - b.keyLow);
  const editZones: EditZone[] = zones.map((z) => ({ rootKey: z.rootKey, keyLow: z.keyLow, keyHigh: z.keyHigh, velTop: 127, velLow: 0 }));
  const selected = zones.findIndex((z) => z.id === selectedZoneId);
  // A sample plays nothing on keys no zone covers, so those stay bare; a piano's zones tile from the zone below.
  const sample = TARGETS[project.target].partition === 'sample';
  const gaps = sample ? keyGaps(project) : [];
  const { loaded, sampler, transport } = useBuiltSampler(sample ? built : null);
  const playing = !!sampler;
  const centre = zones[Math.max(0, selected)]?.rootKey ?? 60;
  const low = Math.max(KEY_MIN, Math.min(KEY_MAX - 24, centre - 12));
  const shownKeys = narrow ? { low, high: low + 24 } : undefined;
  // A piano plays each recording only downwards: the keys above that are re-pitched copies.
  const copies = sample ? [] : zones.flatMap((z) => {
    const own = TARGETS.npno.reach(z);
    return own.highest < z.keyHigh ? [{ keyLow: Math.max(own.highest + 1, z.keyLow), keyHigh: z.keyHigh }] : [];
  });
  return (
    <section aria-label="Keyboard" className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface-2 px-4 py-4 sm:px-[18px]">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <SectionLabel>Keyboard</SectionLabel>
        <span className="text-[13px] text-dim">
          {!zones.length ? 'Add recordings to map them over the keys.'
            : narrow ? `Two octaves around zone ${noteName(centre)}${playing ? ' · tap to play' : ''}`
            : sample ? `${plural(zones.length, 'zone')} · drag a split to move it${playing ? ' · play with the mouse or your MIDI keyboard' : ''}`
            : 'A piano plays each recording only downwards; the hatched keys use re-pitched copies'}
        </span>
        <Button variant="secondary" className="ml-auto min-h-11" onClick={() => run(autoMap)} disabled={!zones.length}>Auto map</Button>
      </div>
      {zones.length > 0 && (
        <KeyboardZoneMap zones={editZones} selected={selected} respectKeyLow={sample} labelByRoot hatched={copies} keys={shownKeys} onSelect={(i) => onSelect(zones[i].id)}
          onChangeKeyHigh={(i, keyHigh) => run((p) => moveSplit(p, zones[i].id, keyHigh), `split:${zones[i].id}`)}
          onNoteOn={playing ? (midi) => { sampler.noteOn(midi, 100); transport.refresh(); } : undefined}
          onNoteOff={playing ? (midi) => sampler.noteOff(midi) : undefined}
          soundingMidis={playing ? new Set(transport.sounding.keys()) : undefined}
          playableZones={loaded?.playableZones} />
      )}
      {gaps.map((g) => (
        <p key={g.low} className="text-sm text-warn">{g.low === g.high ? noteName(g.low) : `${noteName(g.low)} to ${noteName(g.high)}`} play nothing: no zone reaches them.</p>
      ))}
      {built && 'error' in built && <p className="text-sm text-warn">Fix this to {sample ? 'play it' : 'listen'}: {built.error}</p>}
      {zones.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span><span aria-hidden="true" className="mr-1.5 inline-block size-2 rounded-full bg-accent" />{sample ? 'root key' : 'recorded pitch'}</span>
          {copies.length > 0 && <span><span aria-hidden="true" className="mr-1.5 inline-block h-2 w-3.5 hatch" />re-pitched copy</span>}
          {sample && <span className="max-md:hidden">A zone reaches at most {MAX_KEYS_ABOVE_ROOT} semitones above its root, as on the Nord</span>}
          {playing && <span className="ml-auto"><MidiConnect what="the sample" /></span>}
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </section>
  );
}
