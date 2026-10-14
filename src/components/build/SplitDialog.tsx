import { useDeferredValue, useMemo, useRef, useState } from 'react';
import { Button, Dialog } from '@/components/ui';
import { WaveCanvas } from '@/components/sample/WaveCanvas';
import type { SampleProject } from '@/lib/sample-build/model';
import { toPcm16, type ClipAudio } from '@/lib/sample-build/render';
import { splitOnSilence } from '@/lib/sample-build/analysis/split';
import { estimatePitch } from '@/lib/sample-build/analysis/pitch';
import { placeTakes, type Candidate } from '@/lib/sample-build/analysis/automap';
import { noteName } from '@/lib/ns4/sample-view';
import { clampKey } from '@/lib/ns4/sample-edit';
import { plural } from '@/lib/plural';
import { NumberField } from './NumberField';

const time = (frames: number, rate: number) => {
  const tenths = Math.round((frames / rate) * 10);
  return `${Math.floor(tenths / 600)}:${((tenths % 600) / 10).toFixed(1).padStart(4, '0')}`;
};

/**
 * Split one recording into notes (spec §7, canvas "Split a recording"). `onApply` gets the
 * candidates, not a finished project, so the caller places them on the latest project.
 */
export function SplitDialog({ project, clipId, audio, onClose, onApply }: {
  project: SampleProject; clipId: string; audio: ClipAudio; onClose: () => void; onApply: (candidates: Candidate[]) => void;
}) {
  const clip = project.clips.find((c) => c.id === clipId);
  const [thresholdDb, setThresholdDb] = useState(-50);
  const [minPauseMs, setMinPauseMs] = useState(400);
  const [mode, setMode] = useState<'pitch' | 'interval'>('pitch');
  const [startKey, setStartKey] = useState(36);
  const [every, setEvery] = useState(3);

  // The sliders move freely; the split and the pitches catch up when there is time.
  const deferredThreshold = useDeferredValue(thresholdDb);
  const deferredPause = useDeferredValue(minPauseMs);
  const regions = useMemo(() => splitOnSilence(audio, { thresholdDb: deferredThreshold, minPauseMs: deferredPause }), [audio, deferredThreshold, deferredPause]);
  // A region's pitch is heard once: moving a slider mostly gives back the same regions.
  const pitchCache = useRef<{ audio: ClipAudio; byRegion: Map<string, ReturnType<typeof estimatePitch>> }>({ audio, byRegion: new Map() });
  const pitches = useMemo(() => {
    if (pitchCache.current.audio !== audio) pitchCache.current = { audio, byRegion: new Map() };
    const cache = pitchCache.current.byRegion;
    return regions.map((r) => {
      const key = `${r.start}:${r.end}`;
      if (!cache.has(key)) cache.set(key, estimatePitch(audio, r.start, r.end));
      return cache.get(key)!;
    });
  }, [audio, regions]);
  const candidates = useMemo<Candidate[]>(() => regions.map((r, k) => ({
    clipId, start: r.start, end: r.end, label: `note ${k + 1}`,
    root: mode === 'interval' ? clampKey(startKey + k * every) : pitches[k]?.midi ?? null,
    pitchEstimate: pitches[k] ?? undefined,
  })), [clipId, regions, pitches, mode, startKey, every]);
  const { report } = useMemo(() => placeTakes(project, candidates), [project, candidates]);
  const nothing = report.newZones + report.addedTakes === 0;
  const pcm = toPcm16(audio);

  return (
    <Dialog open onClose={onClose} title={`Split “${clip?.label ?? ''}” into notes`} className="w-[min(92vw,720px)]"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={nothing} onClick={() => onApply(candidates)}>
            Add {plural(report.newZones, 'zone')} and {plural(report.addedTakes, 'take')}
          </Button>
        </>
      )}>
      <div className="flex min-w-0 flex-col gap-3">
        <WaveCanvas pcm={pcm} height={90} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          <label className="flex flex-col text-sm">Silence below ({thresholdDb} dB)
            <input aria-label="Silence below" type="range" min={-80} max={-20} value={thresholdDb} onChange={(e) => setThresholdDb(Number(e.target.value))} />
          </label>
          <label className="flex flex-col text-sm">Shortest pause ({minPauseMs} ms)
            <input aria-label="Shortest pause" type="range" min={50} max={2000} step={50} value={minPauseMs} onChange={(e) => setMinPauseMs(Number(e.target.value))} />
          </label>
          <fieldset className="flex min-w-0 flex-col gap-1 text-sm">
            <legend>Which key each note gets</legend>
            <label className="flex items-center gap-2"><input type="radio" name="map" checked={mode === 'pitch'} onChange={() => setMode('pitch')} aria-label="Detect the pitch" />Detect the pitch</label>
            <label className="flex flex-wrap items-center gap-2">
              <input type="radio" name="map" checked={mode === 'interval'} onChange={() => setMode('interval')} aria-label="From a start key" />From
              <NumberField aria-label="Start key" min={0} max={127} value={startKey} onCommit={(v) => setStartKey(clampKey(v))} className="w-16 rounded-sm border border-line bg-sink px-1 font-mono" />
              ({noteName(startKey)}) every
              <NumberField aria-label="Every (semitones)" min={1} max={24} value={every} onCommit={(v) => setEvery(Math.max(1, Math.min(24, Math.round(v))))} className="w-14 rounded-sm border border-line bg-sink px-1 font-mono" />
              semitones
            </label>
          </fieldset>
        </div>
        <div className="max-h-72 max-w-full overflow-auto rounded-md border border-line">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="bg-surface text-left text-xs uppercase text-dim"><th className="p-2">Note</th><th className="p-2">At</th><th className="p-2">Length</th><th className="p-2">Pitch heard</th><th className="p-2">Key</th><th className="p-2">Goes to</th></tr></thead>
            <tbody>
              {candidates.map((c, k) => {
                const unclear = report.outcomes[k] === 'unclear';
                const clash = report.outcomes[k] === 'take';
                return (
                  <tr key={k} className="border-t border-line">
                    <td className="p-2 font-mono">{k + 1}</td>
                    <td className="p-2 font-mono text-dim">{time(c.start, audio.sampleRate)}</td>
                    <td className="p-2 font-mono text-dim">{((c.end - c.start) / audio.sampleRate).toFixed(1)} s</td>
                    <td className="p-2 font-mono">{pitches[k] ? `${noteName(pitches[k]!.midi)} ${pitches[k]!.cents >= 0 ? '+' : ''}${pitches[k]!.cents} cents` : '—'}</td>
                    <td className="p-2 font-mono">{unclear ? '?' : noteName(c.root!)}</td>
                    <td className={`p-2 ${unclear || clash ? 'text-warn' : ''}`}>{unclear ? 'pitch unclear: left out' : clash ? `a take on zone ${noteName(c.root!)}` : `new zone ${noteName(c.root!)}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Dialog>
  );
}
