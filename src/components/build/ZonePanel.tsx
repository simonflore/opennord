import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { removeTake, removeZone, setActiveTake, setRoot, takeOf, updateTake, zoneById, type NewTake, type SampleProject, type Take, type Zone } from '@/lib/sample-build/model';
import type { ReadAudio } from '@/lib/sample-build/render';
import { TARGETS } from '@/lib/sample-build/targets';
import { keyRange, noteName } from '@/lib/ns4/sample-view';
import { TakeEditor } from './TakeEditor';
import { formatDuration } from '@/lib/duration';
import { NumberField } from './NumberField';
import { NoteField } from './NoteField';
import { PianoLayers } from './PianoLayers';
import type { Apply } from '@/lib/library/useSampleProject';
import { useApplyError } from './useApplyError';

const signed = (n: number, digits = 0) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)}`;
/** The value inside a card: large mono, the card itself is the box. */
const cardValue = 'w-full min-w-0 bg-transparent font-mono text-lg text-ink outline-none disabled:text-muted';

/** "keys F#2–F3", "keys up to F#2", "every key". */
const zoneKeys = (lo: number, hi: number) => { const r = keyRange(lo, hi); return r === 'every key' ? r : `keys ${r}`; };

/** Where a piano zone plays its own recording and where re-pitched copies take over. */
function pianoKeys(z: Zone): string {
  const own = TARGETS.npno.reach(z);
  if (own.highest >= z.keyHigh) return `plays ${keyRange(z.keyLow, z.keyHigh)} as recorded`;
  if (own.highest < own.lowest) return `plays ${keyRange(z.keyLow, z.keyHigh)} from copies`;
  return `plays ${keyRange(own.lowest, own.highest)} as recorded, ${keyRange(own.highest + 1, z.keyHigh)} from copies`;
}

/** One setting as the canvas draws it: label, value, and a line saying what it means. */
function Card({ label, hint, children, htmlFor }: { label: string; hint: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex min-w-0 flex-col rounded-md border border-line bg-sink px-3 py-2.5 focus-within:border-accent">
      {htmlFor
        ? <label htmlFor={htmlFor} className="text-xs uppercase tracking-wider text-dim">{label}</label>
        : <span className="text-xs uppercase tracking-wider text-dim">{label}</span>}
      <div className="mt-1 flex min-h-8 items-center">{children}</div>
      <div className="mt-0.5 text-xs text-muted">{hint}</div>
    </div>
  );
}

/** The selected zone (spec §7, canvas "Build sample"): its takes or layers, the take's recording and its settings. */
export function ZonePanel({ project, zoneId, read, apply }: { project: SampleProject; zoneId: string; read: ReadAudio; apply: Apply }) {
  const [run, error, setError] = useApplyError(apply);
  const [editing, setEditing] = useState<string | null>(null); // a layer's take, for pianos
  const z = zoneById(project, zoneId);
  const piano = TARGETS[project.target].partition === 'piano';
  const take: Take | undefined = (editing && z.takes.find((t) => t.id === editing)) || takeOf(z, z.layers[0]);
  /** A take edit; edits of one field in a row (a drag, typing) are one undo step unless `step` says otherwise. */
  const change = (c: Partial<NewTake>, step = true) => {
    if (take) run((p) => updateTake(p, zoneId, take.id, c), step ? `take:${take.id}:${Object.keys(c).join(',')}` : undefined);
  };
  const clip = take && project.clips.find((c) => c.id === take.clipId);
  const audio = take && read(take.clipId);
  const clipLabel = (t: Take) => project.clips.find((c) => c.id === t.clipId)?.label ?? '';
  const heard = take?.pitchEstimate;
  const rate = clip?.sampleRate ?? 44100;

  return (
    <section aria-label="Zone" className="flex flex-col gap-3.5 rounded-lg border border-line bg-surface-2 px-4 py-4 sm:px-[18px]">
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <h2 className="text-[22px] font-medium">Zone {noteName(z.rootKey)}</h2>
        {piano ? (
          <span className="font-mono text-[13px] text-dim">recorded at {noteName(z.rootKey)} · {pianoKeys(z)}</span>
        ) : (
          <span className="font-mono text-[13px] text-dim">{zoneKeys(z.keyLow, z.keyHigh)} · root {noteName(z.rootKey)}</span>
        )}
        {!piano && <span className="text-[13px] text-dim sm:ml-auto">Takes: one plays, the others wait</span>}
        {piano && <Button variant="ghost" className="ml-auto min-h-11 text-dim" onClick={() => run((p) => removeZone(p, zoneId))}>Remove zone</Button>}
      </div>

      {!piano ? (
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Take that plays" className="flex flex-wrap gap-2">
            {z.takes.map((t, i) => {
              const on = z.layers[0]?.takeId === t.id;
              return (
                <div key={t.id} className={cn('flex items-center rounded-md border', on ? 'border-accent bg-accent/10' : 'border-line bg-sink')}>
                  <button type="button" role="radio" aria-checked={on} onClick={() => run((p) => setActiveTake(p, zoneId, t.id))}
                    className="flex min-h-11 items-center gap-2 py-2 pl-3 pr-2 text-left">
                    <span aria-hidden="true" className={cn('size-3 rounded-full border', on ? 'border-accent bg-accent dot-ring' : 'border-muted')} />
                    <span>Take {i + 1}</span>
                    <span className="max-w-48 truncate font-mono text-[11px] text-muted">{clipLabel(t)}</span>
                  </button>
                  {z.takes.length > 1 && (
                    <button type="button" aria-label={`Remove take ${i + 1}`} onClick={() => run((p) => removeTake(p, zoneId, t.id))}
                      className="flex min-h-11 w-9 items-center justify-center text-muted hover:text-ink">
                      <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10"><path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" strokeWidth="1.5" /></svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <Button variant="ghost" className="ml-auto min-h-11 text-dim" onClick={() => run((p) => removeZone(p, zoneId))}>Remove zone</Button>
        </div>
      ) : (
        <PianoLayers zone={z} read={read} selectedTakeId={take?.id} onSelect={setEditing} run={run} clipLabel={clipLabel} />
      )}

      {take && audio && <TakeEditor take={take} audio={audio} onChange={change} />}
      {take && clip && !audio && <p className="text-sm text-warn">The audio for this take is missing; add the file again.</p>}

      {take && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <Card label="Root key" htmlFor={`root-${zoneId}`}
            hint={heard ? `heard ${noteName(heard.midi)}, ${signed(heard.cents, 1)} cents` : 'no clear pitch heard'}>
            <NoteField id={`root-${zoneId}`} aria-label="Root" value={z.rootKey} className={cardValue}
              onCommit={(v, step) => run((p) => setRoot(p, zoneId, v), step ? `root:${zoneId}` : undefined)} onBadNote={setError} />
          </Card>
          <Card label="Tune" htmlFor={`tune-${zoneId}`}
            // The cents heard only correct the pitch when the root is the note that was heard.
            hint={heard && heard.midi === z.rootKey && Math.round(-heard.cents) !== take.tuneCents
              ? <button type="button" className="text-accent-bright underline-offset-2 hover:underline" onClick={() => change({ tuneCents: Math.round(-heard.cents) }, false)}>
                  set {signed(Math.round(-heard.cents))} to correct what was heard
                </button>
              : heard ? 'corrects the pitch heard' : 'in cents'}>
            <NumberField id={`tune-${zoneId}`} aria-label="Tune (cents)" value={take.tuneCents} onCommit={(v) => change({ tuneCents: v })} className={cardValue} />
            <span aria-hidden="true" className="font-mono text-sm text-dim">ct</span>
          </Card>
          <Card label="Level" htmlFor={`level-${zoneId}`} hint="this take’s volume">
            <NumberField id={`level-${zoneId}`} aria-label="Level (dB)" step={0.5} value={take.gainDb} onCommit={(v) => change({ gainDb: v })} className={cardValue} />
            <span aria-hidden="true" className="font-mono text-sm text-dim">dB</span>
          </Card>
          <Card label="Loop" hint={take.loop ? `${formatDuration((take.end - take.loop.start) / rate)} loop while held` : 'plays once, then stops'}>
            <button type="button" role="switch" aria-checked={!!take.loop} aria-label="Loop"
              onClick={() => change({ loop: take.loop ? null : { start: Math.floor((take.start + take.end) / 2) } }, false)}
              className="flex items-center gap-2 font-mono text-lg">
              <span aria-hidden="true" className={cn('relative h-5 w-9 rounded-full transition-colors', take.loop ? 'bg-accent' : 'bg-surface-2 ring-1 ring-line')}>
                <span className={cn('absolute top-0.5 size-4 rounded-full bg-ink transition-[left]', take.loop ? 'left-[18px]' : 'left-0.5')} />
              </span>
              {take.loop ? 'On' : 'Off'}
            </button>
          </Card>
          <Card label="Loop decay" htmlFor={`decay-${zoneId}`}
            hint={!take.loop ? 'needs a loop' : take.loopDecaySeconds ? 'fades out over this time while held' : 'holds while the key is down'}>
            <NumberField id={`decay-${zoneId}`} aria-label="Loop decay (s)" min={0} step={0.5} value={take.loop ? take.loopDecaySeconds : null}
              placeholder={take.loop ? 'hold' : '—'} disabled={!take.loop}
              onCommit={(v) => change({ loopDecaySeconds: v })} onClear={() => change({ loopDecaySeconds: null })} className={cardValue} />
            {take.loop && take.loopDecaySeconds != null && <span aria-hidden="true" className="font-mono text-sm text-dim">s</span>}
          </Card>
          <Card label="Keys" hint="drag a split on the keyboard">
            <span className="font-mono text-lg">{keyRange(z.keyLow, z.keyHigh)}</span>
          </Card>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </section>
  );
}
