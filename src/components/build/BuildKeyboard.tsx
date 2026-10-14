import { Button, SectionLabel } from '@/components/ui';
import { KeyboardZoneMap } from '@/components/sample/KeyboardZoneMap';
import { moveSplit, type SampleProject } from '@/lib/sample-build/model';
import type { Apply } from '@/lib/library/useSampleProject';
import { autoMap, keyGaps } from '@/lib/sample-build/analysis/automap';
import { TARGETS } from '@/lib/sample-build/targets';
import { noteName } from '@/lib/ns4/sample-view';
import type { EditZone } from '@/lib/ns4/sample-edit';
import { useApplyError } from './useApplyError';

/** The zones on the keyboard (spec §7): select one, drag a split, Auto map; key gaps named. */
export function BuildKeyboard({ project, selectedZoneId, onSelect, apply }: {
  project: SampleProject;
  /** One of the project's zones (the caller resolves it), or null when there are none. */
  selectedZoneId: string | null;
  onSelect: (zoneId: string) => void;
  apply: Apply;
}) {
  const [run, error] = useApplyError(apply);
  const zones = [...project.zones].sort((a, b) => a.keyLow - b.keyLow);
  const editZones: EditZone[] = zones.map((z) => ({ rootKey: z.rootKey, keyLow: z.keyLow, keyHigh: z.keyHigh, velTop: 127, velLow: 0 }));
  const selected = zones.findIndex((z) => z.id === selectedZoneId);
  // A sample plays nothing on keys no zone covers, so those stay bare; a piano's zones tile from the zone below.
  const sample = TARGETS[project.target].partition === 'sample';
  const gaps = sample ? keyGaps(project) : [];
  return (
    <section aria-label="Keyboard" className="flex flex-col gap-2 rounded-lg border border-line bg-surface-2 p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <SectionLabel>Keyboard</SectionLabel>
        <span className="text-sm text-dim">Drag a split to move it.</span>
        <Button variant="secondary" className="ml-auto" onClick={() => run(autoMap)} disabled={!zones.length}>Auto map</Button>
      </div>
      {zones.length > 0 && (
        <KeyboardZoneMap zones={editZones} selected={selected} respectKeyLow={sample} onSelect={(i) => onSelect(zones[i].id)}
          onChangeKeyHigh={(i, keyHigh) => run((p) => moveSplit(p, zones[i].id, keyHigh), `split:${zones[i].id}`)} />
      )}
      {gaps.map((g) => (
        <p key={g.low} className="text-sm text-warn">{g.low === g.high ? noteName(g.low) : `${noteName(g.low)} to ${noteName(g.high)}`} play nothing: no zone reaches them.</p>
      ))}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </section>
  );
}
