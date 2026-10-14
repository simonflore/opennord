import { useDeferredValue, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, Dialog } from '@/components/ui';
import { WaveCanvas } from '@/components/sample/WaveCanvas';
import { cn } from '@/lib/cn';
import { zonesUsing, type SampleProject } from '@/lib/sample-build/model';
import { toPcm16, type ClipAudio } from '@/lib/sample-build/render';
import { splitOnSilence } from '@/lib/sample-build/analysis/split';
import { estimatePitch } from '@/lib/sample-build/analysis/pitch';
import { placeTakes, type Candidate } from '@/lib/sample-build/analysis/automap';
import { parseNote } from '@/lib/hwtest/analysis';
import { noteName } from '@/lib/ns4/sample-view';
import { clampKey } from '@/lib/ns4/sample-edit';
import { plural } from '@/lib/plural';
import { clockTime, formatDuration } from '@/lib/duration';
import { NumberField } from './NumberField';
import { NoteField } from './NoteField';

const time = (frames: number, rate: number) => clockTime(frames / rate);
const badKey = (text: string) => `“${text}” isn’t a key: type a note like C3, F#2 or Bb3.`;

/** A control as the canvas draws it: a card with a label, the control, and what it does. */
function ControlCard({ label, htmlFor, value, hint, children }: { label: string; htmlFor: string; value: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-md border border-line bg-surface-2 px-3.5 py-3">
      <label htmlFor={htmlFor} className="text-xs uppercase tracking-wider text-dim">{label}</label>
      <div className="flex items-center gap-2.5">{children}<span className="flex-none font-mono text-[13px]">{value}</span></div>
      <div className="text-xs text-muted">{hint}</div>
    </div>
  );
}

/**
 * Split one recording into notes (spec §7, canvas "Split a recording"). The found notes are
 * numbered on the waveform under the silence lines; each note's key comes from its pitch or from
 * a start key and interval, and can be set by hand. `onApply` gets the candidates, not a finished
 * project, so the caller places them on the latest project.
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
  // Keys set by hand, by where the note starts (a note keeps its start while the sliders move).
  const [keyAt, setKeyAt] = useState<ReadonlyMap<number, number>>(new Map());
  const [badNote, setBadNote] = useState('');
  const setKey = (start: number, key: number) => { setKeyAt((m) => new Map(m).set(start, key)); setBadNote(''); };

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
    root: keyAt.get(r.start) ?? (mode === 'interval' ? clampKey(startKey + k * every) : pitches[k]?.midi ?? null),
    pitchEstimate: pitches[k] ?? undefined,
  })), [clipId, regions, pitches, mode, startKey, every, keyAt]);
  const { report } = useMemo(() => placeTakes(project, candidates), [project, candidates]);
  const nothing = report.newZones + report.addedTakes === 0;
  const unclear = report.outcomes.filter((o) => o === 'unclear').length;
  const clashes = report.outcomes.filter((o) => o === 'take').length;
  const pcm = toPcm16(audio);
  const frames = pcm.length;
  const rate = audio.sampleRate;
  // The silence lines, as a share of the drawing's half-height: the waveform is drawn scaled to its loudest sample.
  const peak = useMemo(() => { let m = 1; for (let i = 0; i < pcm.length; i++) m = Math.max(m, Math.abs(pcm[i])); return m / 32767; }, [pcm]);
  const line = 10 ** (thresholdDb / 20) / peak;
  const toCheck = [unclear && plural(unclear, 'unclear pitch', 'unclear pitches'), clashes && plural(clashes, 'key that already has a zone', 'keys that already have a zone')].filter(Boolean);
  const summary = regions.length === 0 ? 'No notes found: lower the silence level or the shortest pause.'
    : toCheck.length ? `${unclear + clashes} to check: ${toCheck.join(', ')}.`
    : `${plural(regions.length, 'note')} found.`;

  return (
    <Dialog open onClose={onClose} title={zonesUsing(project, clipId).length ? `Split “${clip?.label ?? ''}” into notes` : `Place “${clip?.label ?? ''}” on the keys`} className="w-[min(94vw,1080px)]"
      footer={(
        <>
          <span className={cn('mr-auto self-center text-[13px]', toCheck.length || !regions.length ? 'text-warn' : 'text-muted')}>{summary}</span>
          <Button variant="secondary" className="min-h-11" onClick={onClose}>Cancel</Button>
          <Button variant="primary" className="min-h-11" disabled={nothing} onClick={() => onApply(candidates)}>
            Add {plural(report.newZones, 'zone')} and {plural(report.addedTakes, 'take')}
          </Button>
        </>
      )}>
      <div className="flex min-w-0 flex-col gap-4">
        <p className="-mt-2 font-mono text-xs text-muted">
          {formatDuration(frames / rate)} · {+(rate / 1000).toFixed(1)} kHz · {audio.channels.length === 2 ? 'stereo' : 'mono'}
        </p>
        <div className="rounded-md border border-line bg-sink px-3 py-2.5">
          <div className="relative h-[120px]">
            <WaveCanvas pcm={pcm} height={120} fill />
            {/* Each found note, numbered; a note to check is marked in the warning colour. */}
            {regions.map((r, k) => {
              const warn = report.outcomes[k] === 'unclear' || report.outcomes[k] === 'take';
              return (
                <div key={r.start} aria-hidden="true"
                  className={cn('pointer-events-none absolute inset-y-0 border-l', warn ? 'border-warn/60 bg-warn/10' : 'border-lcd-cyan/50 bg-lcd-cyan/10')}
                  style={{ left: `${(r.start / frames) * 100}%`, width: `${((r.end - r.start) / frames) * 100}%` }}>
                  <span className={cn('absolute left-1 top-1 font-mono text-[11px]', warn ? 'text-warn' : 'text-lcd-cyan')}>{k + 1}</span>
                </div>
              );
            })}
            {/* The silence level: a note ends where the sound falls inside these lines. */}
            {line < 1 && [50 - line * 50, 50 + line * 50].map((top) => (
              <div key={top} aria-hidden="true" className="pointer-events-none absolute inset-x-0 border-t border-dashed border-accent" style={{ top: `${top}%` }} />
            ))}
          </div>
          <div aria-hidden="true" className="mt-1.5 flex justify-between font-mono text-[11px] text-muted">
            {[0, 0.25, 0.5, 0.75, 1].map((f) => <span key={f}>{time(f * frames, rate)}</span>)}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <ControlCard label="Silence below" htmlFor="split-silence" value={`${thresholdDb < 0 ? '−' : ''}${Math.abs(thresholdDb)} dB`}
            hint="The dashed lines: a note ends where the sound falls inside them.">
            <input id="split-silence" type="range" min={-80} max={-20} value={thresholdDb} className="min-h-8 min-w-0 flex-1 accent-[var(--accent)]"
              onChange={(e) => setThresholdDb(Number(e.target.value))} />
          </ControlCard>
          <ControlCard label="Shortest pause" htmlFor="split-pause" value={`${minPauseMs} ms`} hint="Shorter dips stay inside a note.">
            <input id="split-pause" type="range" min={50} max={2000} step={50} value={minPauseMs} className="min-h-8 min-w-0 flex-1 accent-[var(--accent)]"
              onChange={(e) => setMinPauseMs(Number(e.target.value))} />
          </ControlCard>
          <fieldset className="m-0 flex min-w-0 flex-col gap-2 rounded-md border border-line bg-surface-2 px-3.5 py-3">
            <legend className="float-left mb-1 text-xs uppercase tracking-wider text-dim">Which key each note gets</legend>
            <label className="flex min-h-8 items-center gap-2">
              <input type="radio" name="split-map" className="accent-[var(--accent)]" checked={mode === 'pitch'} onChange={() => setMode('pitch')} aria-label="Detect the pitch" />Detect the pitch
            </label>
            <div className="flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1">
              <label className="flex items-center gap-2">
                <input type="radio" name="split-map" className="accent-[var(--accent)]" checked={mode === 'interval'} onChange={() => setMode('interval')} aria-label="From a start key" />From
              </label>
              <NoteField aria-label="Start key" value={startKey} onBadNote={setBadNote}
                onCommit={(v) => { setStartKey(clampKey(v)); setMode('interval'); setBadNote(''); }}
                className="w-14 rounded-sm border border-line bg-sink px-1.5 py-0.5 font-mono" />
              <span className="whitespace-nowrap">every
                <NumberField aria-label="Every (semitones)" min={1} max={24} value={every}
                  onCommit={(v) => { setEvery(Math.max(1, Math.min(24, Math.round(v)))); setMode('interval'); }}
                  className="mx-2 w-12 rounded-sm border border-line bg-sink px-1.5 py-0.5 font-mono" />
                semitones</span>
            </div>
          </fieldset>
        </div>
        {badNote && <p role="alert" className="-mt-2 text-sm text-danger">{badNote}</p>}

        <div className="max-h-72 max-w-full overflow-auto rounded-md border border-line">
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="bg-surface text-left text-xs uppercase tracking-wider text-dim">
              <th scope="col" className="px-3 py-2 font-semibold">Note</th><th scope="col" className="px-3 py-2 font-semibold">At</th>
              <th scope="col" className="px-3 py-2 font-semibold">Length</th><th scope="col" className="px-3 py-2 font-semibold">Pitch heard</th>
              <th scope="col" className="px-3 py-2 font-semibold">Key</th><th scope="col" className="px-3 py-2 font-semibold">Goes to</th>
            </tr></thead>
            <tbody>
              {candidates.map((c, k) => {
                const outcome = report.outcomes[k];
                const heard = pitches[k];
                const goes = outcome === 'unclear' ? 'pitch unclear: pick a key'
                  : outcome === 'same' ? `already zone ${noteName(c.root!)}’s take`
                  : outcome === 'take' ? `a take on zone ${noteName(c.root!)}`
                  : `new zone ${noteName(c.root!)}`;
                return (
                  <tr key={c.start} className="border-t border-line">
                    <td className="px-3 py-1.5 font-mono">{k + 1}</td>
                    <td className="px-3 py-1.5 font-mono text-dim">{time(c.start, rate)}</td>
                    <td className="px-3 py-1.5 font-mono text-dim">{((c.end - c.start) / rate).toFixed(1)} s</td>
                    <td className="px-3 py-1.5 font-mono">{heard ? `${noteName(heard.midi)} ${heard.cents >= 0 ? '+' : '−'}${Math.abs(heard.cents)} cents` : '—'}</td>
                    <td className="px-3 py-1">
                      {c.root === null ? (
                        <input aria-label={`Key for note ${k + 1}`} placeholder="?" autoComplete="off" spellCheck={false}
                          className="w-16 rounded-sm border border-warn/60 bg-sink px-1.5 py-1 font-mono placeholder:text-warn"
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                          onBlur={(e) => {
                            const text = e.currentTarget.value.trim();
                            if (!text) return;
                            try { setKey(c.start, parseNote(text)); } catch { setBadNote(badKey(text)); }
                          }} />
                      ) : (
                        <NoteField aria-label={`Key for note ${k + 1}`} value={c.root} onBadNote={setBadNote} onCommit={(v) => setKey(c.start, v)}
                          className={cn('w-16 rounded-sm border border-transparent bg-transparent px-1.5 py-1 font-mono font-medium hover:border-line focus:border-accent',
                            keyAt.has(c.start) && 'text-accent-bright')} />
                      )}
                    </td>
                    <td className={cn('px-3 py-1.5', outcome === 'unclear' || outcome === 'take' ? 'text-warn' : outcome === 'same' ? 'text-dim' : 'text-text-tertiary')}>{goes}</td>
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
