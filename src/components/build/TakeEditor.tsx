import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { WaveCanvas } from '@/components/sample/WaveCanvas';
import { playPcm } from '@/components/sample/audioPlayer';
import { cn } from '@/lib/cn';
import type { NewTake, Take } from '@/lib/sample-build/model';
import { renderTake, toPcm16, type ClipAudio } from '@/lib/sample-build/render';
import { formatDuration } from '@/lib/duration';

type Point = 'start' | 'loop' | 'end';
type View = 'whole' | 'start' | 'seam';

const LABEL: Record<Point, string> = { start: 'Start', loop: 'Loop start', end: 'End' };
const FLAG: Record<Point, string> = { start: 'START', loop: 'LOOP', end: 'END' };
/** Within this many pixels of a point, a press on the wave picks that point up. */
const GRAB_PX = 12;
const GRAB_TOUCH_PX = 24;
const SEAM_SECONDS = 0.04;

const formatTime = (frames: number, rate: number) => formatDuration(frames / rate);

/**
 * The take's recording, with its Start, Loop and End drawn on it and dragged there (spec §7,
 * canvas "Build sample"). Each point is also a slider: Left and Right move it 1 ms, with Shift
 * 10 ms. "Start" zooms in on the attack; "Loop seam" shows the loop's end running into its
 * start, the join you hear while a key is held.
 */
export function TakeEditor({ take, audio, onChange }: { take: Take; audio: ClipAudio; onChange: (change: Partial<NewTake>) => void }) {
  const frames = audio.channels[0].length;
  const rate = audio.sampleRate;
  const pcm = toPcm16(audio);
  const [view, setView] = useState<View>('whole');
  const shownView = view === 'seam' && !take.loop ? 'whole' : view;
  const wave = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<Point | null>(null);

  // The stretch of the recording on screen, in frames.
  const [v0, v1] = shownView === 'start'
    ? [Math.max(0, take.start - Math.round(0.05 * rate)), Math.min(frames, take.start + Math.round(0.35 * rate))]
    : [0, frames];
  const seamFrames = Math.round(SEAM_SECONDS * rate);
  const shown = useMemo(() => {
    if (shownView === 'seam' && take.loop) {
      // The last moments before the end, then the first after the loop start: what plays at the turn.
      const out = new Int32Array(2 * seamFrames);
      out.set(pcm.subarray(Math.max(0, take.end - seamFrames), take.end), seamFrames - Math.min(seamFrames, take.end));
      out.set(pcm.subarray(take.loop.start, Math.min(frames, take.loop.start + seamFrames)), seamFrames);
      return out;
    }
    return pcm.subarray(v0, v1);
  }, [pcm, shownView, take.end, take.loop, seamFrames, frames, v0, v1]);

  const points: Point[] = take.loop ? ['start', 'loop', 'end'] : ['start', 'end'];
  const frameOf = (p: Point) => (p === 'start' ? take.start : p === 'end' ? take.end : take.loop!.start);
  const range = (p: Point): [number, number] => {
    if (p === 'start') return [0, (take.loop?.start ?? take.end) - 1];
    if (p === 'loop') return [take.start + 1, take.end - 1];
    return [(take.loop?.start ?? take.start) + 1, frames];
  };
  const set = (p: Point, f: number) => {
    const [lo, hi] = range(p);
    const v = Math.max(lo, Math.min(hi, Math.round(f)));
    if (v === frameOf(p)) return;
    onChange(p === 'start' ? { start: v } : p === 'end' ? { end: v } : { loop: { start: v } });
  };
  const pct = (f: number) => ((f - v0) / (v1 - v0)) * 100;
  const visible = (p: Point) => shownView !== 'seam' && frameOf(p) >= v0 && frameOf(p) <= v1;

  const frameAt = (clientX: number) => {
    const r = wave.current!.getBoundingClientRect();
    return v0 + ((clientX - r.left) / r.width) * (v1 - v0);
  };
  /** Where a point's line is on screen, in px. */
  const lineX = (p: Point) => { const r = wave.current!.getBoundingClientRect(); return r.left + (pct(frameOf(p)) / 100) * r.width; };
  // How far from its line the point was picked up, so it moves with the pointer instead of jumping to it.
  const grabOffset = useRef(0);
  const grab = (p: Point, e: PointerEvent<HTMLDivElement>) => {
    grabOffset.current = e.clientX - lineX(p);
    wave.current!.setPointerCapture(e.pointerId);
    setDragging(p);
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (shownView === 'seam') return;
    const near = points.filter(visible)
      .map((p) => ({ p, d: Math.abs(lineX(p) - e.clientX) }))
      .sort((a, b) => a.d - b.d)[0];
    if (!near || near.d > (e.pointerType === 'touch' ? GRAB_TOUCH_PX : GRAB_PX)) return;
    grab(near.p, e);
  };
  /** A press on a point's flag picks that point up, wherever on the flag it lands. */
  const grabFlag = (p: Point) => (e: PointerEvent<HTMLDivElement>) => { e.stopPropagation(); grab(p, e); };
  const move = (e: PointerEvent<HTMLDivElement>) => { if (dragging) set(dragging, frameAt(e.clientX - grabOffset.current)); };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
    setDragging(null);
  };
  const key = (p: Point) => (e: KeyboardEvent) => {
    const ms = Math.round((e.shiftKey ? 0.01 : 0.001) * rate);
    const [lo, hi] = range(p);
    const to = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? frameOf(p) + ms
      : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? frameOf(p) - ms
      : e.key === 'Home' ? lo : e.key === 'End' ? hi : null;
    if (to === null) return;
    e.preventDefault();
    set(p, to);
  };

  // Play the take as it will sound: from Start to End, at its level.
  const [stop, setStop] = useState<(() => void) | null>(null);
  useEffect(() => () => stop?.(), [stop]);
  const play = () => {
    if (stop) { stop(); setStop(null); return; }
    const r = renderTake(take, audio);
    const s = playPcm(r.channels, () => setStop(null), r.sampleRate, { asIs: true });
    setStop(() => s);
  };

  const ticks = Array.from({ length: 7 }, (_, i) => v0 + (i / 6) * (v1 - v0));
  const viewButton = (v: View, label: string, disabled = false) => (
    <button type="button" aria-pressed={shownView === v} disabled={disabled} onClick={() => setView(v)}
      className={cn('min-h-9 rounded-sm border border-line px-3 text-sm disabled:opacity-40',
        shownView === v ? 'bg-surface-2 text-ink' : 'bg-sink text-dim hover:text-ink')}>{label}</button>
  );

  return (
    <div className="rounded-md border border-line bg-sink px-3 pb-3 pt-2">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Zoom" className="flex gap-1">
          {viewButton('whole', 'Whole take')}
          {viewButton('start', 'Start')}
          {viewButton('seam', 'Loop seam', !take.loop)}
        </div>
        <button type="button" onClick={play} aria-label={stop ? 'Stop' : 'Play take'}
          className="ml-auto flex h-9 w-11 items-center justify-center rounded-sm border border-line bg-surface-2 text-ink hover:border-accent">
          {stop
            ? <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" fill="currentColor" /></svg>
            : <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M3 2 L12 7 L3 12 Z" fill="currentColor" /></svg>}
        </button>
      </div>

      <div ref={wave} className={cn('relative h-32 touch-none select-none sm:h-[190px]', dragging && 'cursor-ew-resize')}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <WaveCanvas pcm={shown} height={190} fill />
        {shownView === 'seam' ? (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 border-l-2 border-dashed border-accent" />
            <span className="pointer-events-none absolute left-1 top-1 font-mono text-[11px] text-dim">… end</span>
            <span className="pointer-events-none absolute left-1/2 top-1 ml-1 font-mono text-[11px] text-accent-bright">loop start …</span>
          </>
        ) : (
          <>
            {/* What doesn't play: before Start and after End, faded. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 bg-sink/70" style={{ width: `${Math.max(0, pct(take.start))}%` }} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 bg-sink/70" style={{ width: `${Math.max(0, 100 - pct(take.end))}%` }} />
            {take.loop && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 bg-accent/10"
                style={{ left: `${Math.max(0, pct(take.loop.start))}%`, right: `${Math.max(0, 100 - pct(take.end))}%` }} />
            )}
            {points.filter(visible).map((p) => {
              const x = pct(frameOf(p));
              const [lo, hi] = range(p);
              const atEnd = p === 'end';
              return (
                <div key={p} className="absolute inset-y-0" style={{ left: `${x}%` }}>
                  <div aria-hidden="true" className={cn('absolute inset-y-0 -ml-px w-0.5', p === 'start' ? 'bg-ink' : 'bg-accent')} />
                  <div role="slider" tabIndex={0} aria-label={LABEL[p]} aria-valuemin={lo} aria-valuemax={hi} aria-valuenow={frameOf(p)}
                    aria-valuetext={formatTime(frameOf(p), rate)} onKeyDown={key(p)} onPointerDown={grabFlag(p)}
                    className={cn('absolute cursor-ew-resize whitespace-nowrap px-1.5 py-0.5 font-mono text-[11px] text-text-on-accent outline-offset-2',
                      p === 'start' ? 'bg-ink' : 'bg-accent',
                      atEnd ? 'bottom-0 right-0 rounded-l-sm' : 'top-0 left-0 rounded-r-sm')}>
                    {FLAG[p]} {formatTime(frameOf(p), rate)}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
      <div aria-hidden="true" className="mt-1.5 flex justify-between font-mono text-[11px] text-muted">
        {shownView === 'seam'
          ? <><span>−{Math.round(SEAM_SECONDS * 1000)} ms</span><span>the turn</span><span>+{Math.round(SEAM_SECONDS * 1000)} ms</span></>
          : ticks.map((f, i) => <span key={i}>{(f / rate).toFixed(f / rate < 10 ? 2 : 1)} s</span>)}
      </div>
    </div>
  );
}
