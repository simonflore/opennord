import { useState, type ReactNode } from 'react';
import { Button, SectionLabel } from '@/components/ui';
import { addLayer, removeLayer, removeTake, removeZone, setActiveTake, setRoot, takeOf, updateTake, zoneById, MAX_FLOOR_DB, type NewTake, type SampleProject, type Take } from '@/lib/sample-build/model';
import type { ReadAudio } from '@/lib/sample-build/render';
import { TARGETS } from '@/lib/sample-build/targets';
import { noteName } from '@/lib/ns4/sample-view';
import { TakeWave } from './TakeWave';
import { NumberField } from './NumberField';
import type { Apply } from '@/lib/library/useSampleProject';
import { useApplyError } from './useApplyError';

const field = 'rounded-sm border border-line bg-sink px-2 py-1 font-mono';

/** A piano zone's take, as a layer or waiting: select it to edit, then its own controls and Remove take. */
function TakeRow({ n, selected, onSelect, children }: { n: number; selected: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-sink p-2">
      <button type="button" className={`min-h-11 text-left ${selected ? 'text-ink' : 'text-dim'}`} aria-pressed={selected}
        onClick={onSelect}>Take {n}</button>
      {children}
    </div>
  );
}

/** The selected zone (spec §7): its takes or layers, the active take's waveform and values. */
export function ZonePanel({ project, zoneId, read, apply }: { project: SampleProject; zoneId: string; read: ReadAudio; apply: Apply }) {
  const [run, error] = useApplyError(apply);
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
  const takeNo = (t: Take) => z.takes.indexOf(t) + 1;
  const nextFloor = () => Math.min(MAX_FLOOR_DB, (z.layers.at(-1)?.floorDb ?? 0) + 10);
  // Layers loudest first (the model keeps them sorted by floor), then the takes that are not layers.
  const layered = z.layers.flatMap((l) => { const t = takeOf(z, l); return t ? [{ take: t, floorDb: l.floorDb }] : []; });
  const spare = z.takes.filter((t) => !z.layers.some((l) => l.takeId === t.id));
  const removeButton = (t: Take) => z.takes.length > 1 && (
    <Button variant="ghost" className="min-h-11" aria-label={`Remove take ${takeNo(t)}`} onClick={() => run((p) => removeTake(p, zoneId, t.id))}>Remove take</Button>
  );

  return (
    <section aria-label="Zone" className="flex flex-col gap-3 rounded-lg border border-line bg-surface-2 p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-xl font-medium">Zone {noteName(z.rootKey)}</h2>
        <span className="font-mono text-sm text-dim">keys {noteName(z.keyLow)} to {noteName(z.keyHigh)}</span>
        <Button variant="secondary" className="ml-auto min-h-11" onClick={() => run((p) => removeZone(p, zoneId))}>Remove zone</Button>
      </div>

      {!piano ? (
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-1 text-sm text-dim">Takes: one plays, the others wait</legend>
          {z.takes.map((t, i) => (
            <div key={t.id} className="flex items-center gap-1 rounded-md border border-line bg-sink pl-3">
              <label className="flex min-h-11 items-center gap-2">
                <input type="radio" name={`take-${zoneId}`} checked={z.layers[0]?.takeId === t.id}
                  onChange={() => run((p) => setActiveTake(p, zoneId, t.id))} />
                Take {i + 1} <span className="font-mono text-xs text-muted">{project.clips.find((c) => c.id === t.clipId)?.label}</span>
              </label>
              {removeButton(t)}
            </div>
          ))}
        </fieldset>
      ) : (
        <div className="flex flex-col gap-2">
          <SectionLabel>Layers, loudest first</SectionLabel>
          {layered.map(({ take: t, floorDb }, k) => (
            <TakeRow key={t.id} n={takeNo(t)} selected={take?.id === t.id} onSelect={() => setEditing(t.id)}>
              <label className="flex items-center gap-1 text-sm">
                Takes over at
                <NumberField step={0.2} min={0} max={MAX_FLOOR_DB} aria-label={`Takes over at (take ${takeNo(t)})`} value={floorDb}
                  disabled={k === 0} className={`w-20 ${field}`}
                  onCommit={(v) => run((p) => addLayer(p, zoneId, t.id, v), `floor:${zoneId}:${t.id}`)} /> dB
              </label>
              <span className="text-xs text-muted">{k === 0 ? 'the loudest layer' : 'softer layers take over this many dB below the loudest'}</span>
              {layered.length > 1 && <Button variant="secondary" className="min-h-11" onClick={() => run((p) => removeLayer(p, zoneId, t.id))}>Remove layer</Button>}
              {removeButton(t)}
            </TakeRow>
          ))}
          {spare.map((t) => (
            <TakeRow key={t.id} n={takeNo(t)} selected={take?.id === t.id} onSelect={() => setEditing(t.id)}>
              <Button variant="secondary" className="min-h-11" onClick={() => run((p) => addLayer(p, zoneId, t.id, nextFloor()))}>Add as layer</Button>
              {removeButton(t)}
            </TakeRow>
          ))}
        </div>
      )}

      {take && audio && <TakeWave take={take} audio={audio} onChange={change} />}
      {take && clip && !audio && <p className="text-sm text-warn">The audio for this take is missing; add the file again.</p>}

      {take && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
          <label className="flex flex-col text-sm">Root
            <NumberField aria-label="Root" min={0} max={127} value={z.rootKey}
              onCommit={(v) => run((p) => setRoot(p, zoneId, v))} className={field} />
            <span className="text-xs text-muted">{noteName(z.rootKey)}{take.pitchEstimate ? ` · heard ${noteName(take.pitchEstimate.midi)} ${take.pitchEstimate.cents >= 0 ? '+' : ''}${take.pitchEstimate.cents} cents` : ''}</span>
          </label>
          <label className="flex flex-col text-sm">Tune (cents)
            <NumberField aria-label="Tune (cents)" value={take.tuneCents} onCommit={(v) => change({ tuneCents: v })} className={field} />
          </label>
          <label className="flex flex-col text-sm">Level (dB)
            <NumberField aria-label="Level (dB)" step={0.5} value={take.gainDb} onCommit={(v) => change({ gainDb: v })} className={field} />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input aria-label="Loop" type="checkbox" checked={!!take.loop}
              onChange={(e) => change({ loop: e.target.checked ? { start: Math.floor((take.start + take.end) / 2) } : null }, false)} />
            Loop
          </label>
          {take.loop && (
            <label className="flex flex-col text-sm">Loop decay (s)
              <NumberField aria-label="Loop decay (s)" min={0} step={0.5} value={take.loopDecaySeconds} placeholder="hold"
                onCommit={(v) => change({ loopDecaySeconds: v })} onClear={() => change({ loopDecaySeconds: null })} className={field} />
            </label>
          )}
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </section>
  );
}
