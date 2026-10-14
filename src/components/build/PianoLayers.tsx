import { useMemo } from 'react';
import { WaveCanvas } from '@/components/sample/WaveCanvas';
import { cn } from '@/lib/cn';
import { addLayer, removeLayer, removeTake, takeOf, MAX_FLOOR_DB, type Take, type Zone } from '@/lib/sample-build/model';
import { toPcm16, type ReadAudio } from '@/lib/sample-build/render';
import type { Edit } from '@/lib/library/useSampleProject';
import { NumberField } from './NumberField';

/** Names for a zone's layers, softest first. */
export function layerNames(n: number): string[] {
  if (n === 1) return ['Only layer'];
  if (n === 2) return ['Soft', 'Hard'];
  if (n === 3) return ['Soft', 'Medium', 'Hard'];
  return Array.from({ length: n }, (_, k) => (k === 0 ? 'Softest' : k === n - 1 ? 'Hardest' : `Layer ${k + 1}`));
}

const db = (n: number) => `−${+n.toFixed(1)} dB`;

/** A take's stretch of its recording, small. */
function MiniWave({ take, read }: { take: Take; read: ReadAudio }) {
  const audio = read(take.clipId);
  const pcm = useMemo(() => (audio ? toPcm16(audio).subarray(take.start, take.end) : null), [audio, take.start, take.end]);
  return pcm ? <div className="h-9"><WaveCanvas pcm={pcm} height={36} fill /></div> : <div className="h-9 rounded-sm bg-sink" />;
}

/**
 * A piano zone's layers (spec §7, canvas "Build a piano"): cards from soft to hard, each with its
 * recording and the loudness it takes over at; takes that aren't layers can be added as one; a
 * strip shows which hit plays which layer. Selecting a card edits that take below.
 */
export function PianoLayers({ zone, read, selectedTakeId, onSelect, run, clipLabel }: {
  zone: Zone; read: ReadAudio; selectedTakeId?: string; onSelect: (takeId: string) => void;
  run: (edit: Edit, mergeKey?: string) => void; clipLabel: (t: Take) => string;
}) {
  // The model keeps layers loudest first; the canvas reads soft to hard.
  const layers = zone.layers.flatMap((l) => { const t = takeOf(zone, l); return t ? [{ take: t, floorDb: l.floorDb }] : []; }).reverse();
  const names = layerNames(layers.length);
  const spare = zone.takes.filter((t) => !zone.layers.some((l) => l.takeId === t.id));
  const nextFloor = Math.min(MAX_FLOOR_DB, (zone.layers.at(-1)?.floorDb ?? 0) + 10);
  const takeNo = (t: Take) => zone.takes.indexOf(t) + 1;
  // The strip runs from the softest hit to the hardest, with room below the softest layer's floor.
  const span = (layers[0]?.floorDb ?? 0) + 12;
  // A layer plays the hits from its own floor up to where the next harder layer takes over:
  // the softest from the softest hit, the hardest up to the hardest hit (its floor is 0).
  const bands = layers.map((l, k) => ({ name: names[k], from: k === 0 ? span : layers[k - 1].floorDb, to: l.floorDb }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-dim">Layers, soft to hard</h3>
        <span className="text-[13px] text-muted">up to 30 per zone · the program’s Touch decides which hit reaches which layer</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5">
        {layers.map(({ take: t, floorDb }, k) => {
          const loudest = k === layers.length - 1;
          const selected = t.id === selectedTakeId;
          return (
            <div key={t.id} className={cn('flex min-w-0 flex-col gap-1.5 rounded-md border bg-sink px-3 py-2.5', selected ? 'border-accent' : 'border-line')}>
              <button type="button" aria-pressed={selected} onClick={() => onSelect(t.id)} className="flex min-h-8 min-w-0 justify-between gap-2 text-left">
                <span className="font-medium">{names[k]}</span>
                <span className="truncate font-mono text-xs text-muted">{clipLabel(t)}</span>
              </button>
              <MiniWave take={t} read={read} />
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-dim">takes over</span>
                {loudest ? <span className="font-mono">hardest</span> : (
                  <span className="flex items-center font-mono">−
                    <NumberField aria-label={`Takes over at (take ${takeNo(t)})`} step={0.2} min={0} max={MAX_FLOOR_DB} value={floorDb}
                      onCommit={(v) => run((p) => addLayer(p, zone.id, t.id, Math.abs(v)), `floor:${zone.id}:${t.id}`)}
                      className="w-12 rounded-sm border border-line bg-surface-2 px-1 text-right" />
                    <span className="ml-1">dB</span>
                  </span>
                )}
              </div>
              <div className="flex gap-1 text-xs">
                {layers.length > 1 && (
                  <button type="button" aria-label={`Remove layer ${names[k]}`} className="min-h-8 rounded-sm px-1.5 text-dim hover:bg-surface-2 hover:text-ink"
                    onClick={() => run((p) => removeLayer(p, zone.id, t.id))}>Not a layer</button>
                )}
                {zone.takes.length > 1 && (
                  <button type="button" aria-label={`Remove take ${takeNo(t)}`} className="min-h-8 rounded-sm px-1.5 text-dim hover:bg-surface-2 hover:text-ink"
                    onClick={() => run((p) => removeTake(p, zone.id, t.id))}>Remove take</button>
                )}
              </div>
            </div>
          );
        })}
        {spare.map((t) => (
          <div key={t.id} className="flex min-w-0 flex-col justify-center gap-1 rounded-md border border-dashed border-grid px-3 py-2.5 text-dim">
            <span className="truncate text-sm">Take {takeNo(t)} <span className="font-mono text-xs text-muted">{clipLabel(t)}</span></span>
            <div className="flex gap-1">
              <button type="button" aria-label="Add as layer" className="min-h-8 rounded-sm px-1.5 text-sm text-accent-bright hover:bg-surface-2"
                onClick={() => run((p) => addLayer(p, zone.id, t.id, nextFloor))}>+ Add as layer</button>
              <button type="button" aria-label={`Remove take ${takeNo(t)}`} className="min-h-8 rounded-sm px-1.5 text-xs hover:bg-surface-2 hover:text-ink"
                onClick={() => run((p) => removeTake(p, zone.id, t.id))}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      {layers.length > 1 && (
        <div aria-label="Which hit plays which layer" role="img">
          <div className="flex h-[22px] overflow-hidden rounded-sm border border-line">
            {bands.map((b, k) => (
              <div key={b.name} className="flex min-w-0 items-center overflow-hidden whitespace-nowrap pl-2 text-xs"
                style={{ flex: `${b.from - b.to} 0 0`, background: `var(--zone-${(k % 6) + 1})` }}>{b.name}</div>
            ))}
          </div>
          <div className="relative mt-1 h-4 font-mono text-[11px] text-muted">
            <span className="absolute left-0">softest hit</span>
            {/* Each boundary's loudness, under the boundary itself. */}
            {bands.slice(1).map((b) => (
              <span key={b.name} className="absolute -translate-x-1/2" style={{ left: `${((span - b.from) / span) * 100}%` }}>{db(b.from)}</span>
            ))}
            <span className="absolute right-0">hardest hit</span>
          </div>
        </div>
      )}
    </div>
  );
}
