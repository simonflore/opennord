import { useMemo } from 'react';
import { WaveCanvas } from '@/components/sample/WaveCanvas';
import type { NewTake, Take } from '@/lib/sample-build/model';
import { toPcm16, type ClipAudio } from '@/lib/sample-build/render';

const ms = (frames: number, rate: number) => `${Math.round((frames / rate) * 1000)} ms`;

/** The take's clip with its Start, Loop and End points (spec §7): range inputs in clip frames. */
export function TakeWave({ take, audio, onChange }: { take: Take; audio: ClipAudio; onChange: (change: Partial<NewTake>) => void }) {
  const frames = audio.channels[0].length;
  const pcm = toPcm16(audio);
  const loopStart = take.loop?.start;
  const loop = useMemo(() => (loopStart === undefined ? undefined : { start: loopStart, end: take.end }), [loopStart, take.end]);
  const handle = (label: string, value: number, min: number, max: number, set: (v: number) => void) => (
    <label className="flex items-center gap-2 text-sm">
      <span className="w-20 shrink-0 text-dim">{label}</span>
      <input type="range" aria-label={label} min={min} max={max} value={value} className="min-h-11 flex-1 accent-[var(--accent)]"
        onChange={(e) => set(Number(e.target.value))} />
      <span className="w-20 text-right font-mono text-xs">{ms(value, audio.sampleRate)}</span>
    </label>
  );
  return (
    <div className="flex flex-col gap-2 rounded-md border border-line bg-sink p-2">
      <WaveCanvas pcm={pcm} height={120} loop={loop} />
      {handle('Start', take.start, 0, take.end - 1, (v) => onChange({ start: v }))}
      {take.loop && handle('Loop start', take.loop.start, take.start + 1, take.end - 1, (v) => onChange({ loop: { start: v } }))}
      {handle('End', take.end, take.start + 1, frames, (v) => onChange({ end: v }))}
    </div>
  );
}
