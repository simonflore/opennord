import { useState, type DragEvent } from 'react';
import { Button, FileInput, SectionLabel, buttonVariants } from '@/components/ui';
import { cn } from '@/lib/cn';
import { removeClip, zonesUsing, type SampleProject } from '@/lib/sample-build/model';
import type { Apply } from '@/lib/library/useSampleProject';
import { useApplyError } from './useApplyError';

const seconds = (frames: number, rate: number) => `${(frames / rate).toFixed(1)} s`;

/** The project's recordings (spec §7): add WAV files, see where each is used, split a long one, remove an unused one. */
export function ClipsPanel({ project, onAddFiles, onSplit, apply }: {
  project: SampleProject;
  onAddFiles: (files: File[]) => void;
  onSplit: (clipId: string) => void;
  apply: Apply;
}) {
  const [over, setOver] = useState(false);
  const [run, error] = useApplyError(apply);
  const drop = (e: DragEvent) => { e.preventDefault(); setOver(false); onAddFiles([...e.dataTransfer.files]); };

  return (
    <aside aria-label="Clips" className="flex flex-col gap-3">
      <SectionLabel>Clips</SectionLabel>
      <FileInput accept=".wav,audio/wav" multiple onFiles={onAddFiles} className={cn(buttonVariants({ variant: 'secondary' }), 'min-h-11')}>
        Add files…
      </FileInput>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}
        className={`rounded-md border border-dashed p-3 text-center text-sm text-muted ${over ? 'border-accent' : 'border-line'}`}
      >
        Drop WAV files here. Files named by note (Rhodes_C3.wav) map themselves.
      </div>
      <ul className="flex flex-col gap-2">
        {project.clips.map((c) => {
          const zones = zonesUsing(project, c.id);
          return (
            <li key={c.id} className="rounded-md border border-line bg-sink p-2">
              <div className="flex justify-between gap-2"><span className="truncate">{c.label}</span><span className="font-mono text-xs text-muted">{seconds(c.frames, c.sampleRate)}</span></div>
              <div className="font-mono text-xs text-muted">
                {(c.sampleRate / 1000).toFixed(1)} kHz · {c.channels === 2 ? 'stereo' : 'mono'} · {zones.length ? `${zones.length === 1 ? 'zone' : 'zones'} ${zones.join(', ')}` : 'not used'}
              </div>
              <div className="flex flex-wrap gap-1">
                <Button variant="ghost" size="sm" className="min-h-11" onClick={() => onSplit(c.id)}>Split into notes…</Button>
                {!zones.length && (
                  <Button variant="ghost" size="sm" className="min-h-11" aria-label={`Remove ${c.label}`}
                    onClick={() => run((p) => removeClip(p, c.id))}>Remove</Button>
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
