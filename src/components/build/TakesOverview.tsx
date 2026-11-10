import { useEffect, useMemo, useRef, useState } from 'react';
import { WaveCanvas } from '@/components/sample/WaveCanvas';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { keyRange, noteName } from '@/lib/ns4/sample-view';
import { takeOf, type SampleProject, type Take } from '@/lib/sample-build/model';
import { crossfadeFrames, toPcm16, type ClipAudio, type ReadAudio } from '@/lib/sample-build/render';
import { loopJoinMatch } from '@/lib/sample-build/analysis/loop';
import { formatDuration } from '@/lib/duration';
import { plural } from '@/lib/plural';
import { WEAK_JOIN, joinWord, signed } from './takeTools';

/**
 * A take's join, scored once per take as it is: an edit replaces only the edited take, so the
 * other zones' scores are reused while one is dragged or typed into.
 */
const joinCache = new WeakMap<Take, { audio: ClipAudio; match: number | null }>();
function joinOf(take: Take, audio: ClipAudio): number | null {
  const hit = joinCache.get(take);
  if (hit && hit.audio === audio) return hit.match;
  // Scored as the sample plays it: with the take's loop crossfade.
  const match = take.loop ? loopJoinMatch(audio, take.loop.start, take.end, crossfadeFrames(take, audio.sampleRate)) : null;
  joinCache.set(take, { audio, match });
  return match;
}

/** Draws its child only once it has scrolled near the screen (all at once where the browser can't tell). */
function WhenSeen({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (seen || !ref.current) return;
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) setSeen(true); }, { rootMargin: '200px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen]);
  return <div ref={ref} className={className}>{seen ? children : null}</div>;
}

/** The playing take's audio as drawn: its own stretch, with its loop shaded. */
function TakeWave({ take, audio }: { take: Take; audio: ClipAudio }) {
  const pcm = useMemo(() => toPcm16(audio).subarray(take.start, take.end), [audio, take.start, take.end]);
  const loop = useMemo(() => (take.loop ? { start: take.loop.start - take.start, end: take.end - take.start } : undefined), [take.loop, take.start, take.end]);
  return <WaveCanvas pcm={pcm} height={36} fill loop={loop} />;
}

interface Row { zoneId: string; root: number; low: number; high: number; takes: number; take?: Take; audio?: ClipAudio; match: number | null }

/**
 * Every zone at a glance (it replaces the plain zone list): the take that plays, drawn with its
 * loop, the loop's length and how clean its join is, its level. Joins that may click are marked,
 * and "Next loop to check" walks through them. Choosing a row opens that zone in the editor above.
 */
export function TakesOverview({ project, read, selectedZoneId, onSelect }: {
  project: SampleProject; read: ReadAudio; selectedZoneId: string | null; onSelect: (zoneId: string) => void;
}) {
  const rows: Row[] = useMemo(() => [...project.zones].sort((a, b) => a.keyLow - b.keyLow).map((z) => {
    const take = takeOf(z, z.layers[0]);
    const audio = take && read(take.clipId);
    const match = take && audio ? joinOf(take, audio) : null;
    return { zoneId: z.id, root: z.rootKey, low: z.keyLow, high: z.keyHigh, takes: z.takes.length, take, audio, match };
  }), [project.zones, read]);
  if (!rows.length) return null;
  const isWeak = (r: Row) => r.match !== null && r.match < WEAK_JOIN;
  const weakCount = rows.filter(isWeak).length;
  const at = rows.findIndex((r) => r.zoneId === selectedZoneId);
  // The next weak join after the open zone, wrapping round; none when the open zone is the only one.
  let nextWeak: Row | undefined;
  for (let k = 1; k <= rows.length && !nextWeak; k++) {
    const r = rows[(at + k) % rows.length]; // with no zone open (at −1) this starts at the first
    if (isWeak(r) && r.zoneId !== selectedZoneId) nextWeak = r;
  }

  return (
    <section aria-label="Takes overview" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="m-0 text-xs font-semibold uppercase tracking-widest text-dim">Zones</h2>
        <span className="text-xs text-muted">
          {plural(rows.length, 'zone')}{weakCount ? ` · ${weakCount === 1 ? 'one loop' : `${weakCount} loops`} to check` : ''}
        </span>
        {nextWeak && (
          <Button variant="ghost" className="ml-auto min-h-11 text-accent-bright" onClick={() => onSelect(nextWeak.zoneId)}>
            Next loop to check
          </Button>
        )}
      </div>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {rows.map((r, pos) => {
          const on = r.zoneId === selectedZoneId;
          const weak = isWeak(r);
          const rate = r.audio?.sampleRate ?? 44100;
          return (
            <li key={r.zoneId}>
              <button type="button" aria-current={on || undefined} onClick={() => onSelect(r.zoneId)}
                className={cn('grid w-full grid-cols-[12px_44px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1 rounded-md border px-2.5 py-2 text-left sm:grid-cols-[12px_44px_minmax(120px,1fr)_minmax(0,1.4fr)]',
                  on ? 'border-accent bg-accent/10' : 'border-line bg-surface-2 hover:border-dim')}>
                <span aria-hidden="true" className="h-8 w-3 rounded-sm" style={{ background: `var(--zone-${(pos % 6) + 1})` }} />
                <span className="font-mono font-medium">{noteName(r.root)}</span>
                <span className="flex min-w-0 flex-col text-[13px]">
                  <span className="truncate text-dim">{keyRange(r.low, r.high)}{r.takes > 1 ? ` · ${plural(r.takes, 'take')}` : ''}</span>
                  <span className="truncate font-mono text-xs">
                    {r.take?.loop ? `loop ${formatDuration((r.take.end - r.take.loop.start) / rate)}` : 'plays once'}
                    {r.match !== null && <span className={cn(weak ? 'text-warn' : 'text-muted')}> · {joinWord(r.match)}</span>}
                    {r.take && r.take.gainDb !== 0 && <span className="text-muted"> · {signed(r.take.gainDb, 1)} dB</span>}
                  </span>
                </span>
                <WhenSeen className="col-span-3 col-start-1 h-9 sm:col-span-1 sm:col-start-auto">
                  {r.take && r.audio ? <TakeWave take={r.take} audio={r.audio} /> : <div className="h-9 rounded-sm bg-sink" />}
                </WhenSeen>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
