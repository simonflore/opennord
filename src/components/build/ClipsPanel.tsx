import { useState, type DragEvent } from 'react';
import { FileInput, SectionLabel, buttonVariants } from '@/components/ui';
import { cn } from '@/lib/cn';
import { removeClip, zonesUsing, type SampleProject } from '@/lib/sample-build/model';
import type { Apply } from '@/lib/library/useSampleProject';
import { useApplyError } from './useApplyError';

const seconds = (s: number) => (s < 60 ? `${s.toFixed(1)} s` : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
const rowAction = 'min-h-8 flex-none rounded-sm px-1.5 text-xs text-dim hover:bg-surface-2 hover:text-ink';

/**
 * The project's recordings (spec §7, canvas "Build sample"): add WAV files, see where each is
 * used (the selected zone's playing take is marked), split a long one, remove an unused one.
 */
export function ClipsPanel({ project, activeClipId, onAddFiles, onSplit, apply }: {
  project: SampleProject;
  /** The recording the selected zone plays, marked in the list. */
  activeClipId?: string;
  onAddFiles: (files: File[]) => void;
  onSplit: (clipId: string) => void;
  apply: Apply;
}) {
  const [over, setOver] = useState(false);
  const [run, error] = useApplyError(apply);
  const drop = (e: DragEvent) => { e.preventDefault(); setOver(false); onAddFiles([...e.dataTransfer.files]); };
  const total = project.clips.reduce((s, c) => s + c.frames / c.sampleRate, 0);

  return (
    <aside aria-label="Clips" className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between">
        <SectionLabel>Clips</SectionLabel>
        {project.clips.length > 0 && <span className="font-mono text-xs text-muted">{project.clips.length} · {seconds(total)}</span>}
      </div>
      <FileInput accept=".wav,audio/wav" multiple onFiles={onAddFiles} className={cn(buttonVariants({ variant: 'secondary' }), 'min-h-11')}>
        Add files…
      </FileInput>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}
        className={cn('rounded-md border border-dashed p-3.5 text-center text-[13px] text-muted', over ? 'border-accent' : 'border-grid')}
      >
        Drop WAV files here. Files named by note (Rhodes_C3.wav) map themselves.
      </div>
      <ul className="flex flex-col gap-1.5">
        {project.clips.map((c) => {
          const zones = zonesUsing(project, c.id);
          const active = c.id === activeClipId;
          return (
            <li key={c.id} aria-current={active || undefined} className={cn('group rounded-md border px-2.5 py-2', active ? 'border-accent bg-surface-2' : 'border-line bg-sink')}>
              <div className="flex justify-between gap-2">
                <span className="truncate">{c.label}</span>
                <span className="flex-none font-mono text-xs text-muted">{seconds(c.frames / c.sampleRate)}</span>
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-muted">
                {(c.sampleRate / 1000).toFixed(1)} kHz · {c.channels === 2 ? 'stereo' : 'mono'} · {zones.length ? `${zones.length === 1 ? 'zone' : 'zones'} ${zones.join(', ')}` : 'not used'}
              </div>
              {/* Shown for the playing clip and an unused one; the others show them on hover, on focus
                  (they stay reachable by Tab) and always on a touch screen, which has no hover. */}
              <div className={cn('-mb-1 mt-1 flex gap-1', !active && zones.length > 0 && 'sr-only group-focus-within:not-sr-only group-hover:not-sr-only [@media(hover:none)]:not-sr-only')}>
                <button type="button" className={rowAction} aria-label={`Split ${c.label} into notes`} onClick={() => onSplit(c.id)}>Split…</button>
                {!zones.length && (
                  <button type="button" className={rowAction} aria-label={`Remove ${c.label}`} onClick={() => run((p) => removeClip(p, c.id))}>Remove</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </aside>
  );
}
