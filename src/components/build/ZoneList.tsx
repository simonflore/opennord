import { cn } from '@/lib/cn';
import { keyRange, noteName } from '@/lib/ns4/sample-view';
import { plural } from '@/lib/plural';
import type { SampleProject } from '@/lib/sample-build/model';

/**
 * The zones as a list, for a phone (canvas "Build sample on a phone"), where the keyboard shows
 * only two octaves: each zone's colour, root, keys and takes; tap one to edit and play it.
 */
export function ZoneList({ project, selectedZoneId, onSelect }: { project: SampleProject; selectedZoneId: string | null; onSelect: (zoneId: string) => void }) {
  const zones = [...project.zones].sort((a, b) => a.keyLow - b.keyLow);
  if (!zones.length) return null;
  return (
    <section aria-label="Zones" className="flex flex-col gap-1.5">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-dim">Zones</h2>
      <ul className="flex flex-col gap-1.5">
        {zones.map((z, pos) => {
          const on = z.id === selectedZoneId;
          return (
            <li key={z.id}>
              <button type="button" aria-current={on || undefined} onClick={() => onSelect(z.id)}
                className={cn('flex min-h-11 w-full items-center gap-2.5 rounded-md border px-3 text-left', on ? 'border-accent bg-accent/10' : 'border-line bg-surface-2')}>
                <span aria-hidden="true" className="h-7 w-3 rounded-sm" style={{ background: `var(--zone-${(pos % 6) + 1})` }} />
                <span className="w-10 font-mono font-medium">{noteName(z.rootKey)}</span>
                <span className="flex-1 text-[13px] text-dim">{keyRange(z.keyLow, z.keyHigh)}</span>
                <span className="text-xs text-muted">{plural(z.takes.length, 'take')}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
