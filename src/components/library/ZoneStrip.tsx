import { memo } from 'react';
import { isNs4Program, type NordProgram } from '../../lib/formats';
import { layerZones } from '../../lib/ns4/view';

// Literal class names (not built from the kind) so Tailwind sees them.
// Rows in the same order as the table's P/O/S LEDs beside it.
const FILL = { piano: 'bg-engine-piano', organ: 'bg-engine-organ', synth: 'bg-engine-synth' } as const;
const ROWS = Object.keys(FILL) as (keyof typeof FILL)[];
const ZONES = [0, 1, 2, 3];

/**
 * Which engine plays in which of the four keyboard zones: a three-row (piano,
 * organ, synth) by four-zone glance for a library row. Built from the layers'
 * zone flags only (`layerZones`, no parameter decode), so a long list stays
 * cheap; memoised, since a row's program object is stable while the list
 * re-renders on every search keystroke. Renders nothing for a program that
 * isn't split, where every engine covers the whole keyboard.
 */
export const ZoneStrip = memo(function ZoneStrip({ program }: { program?: NordProgram }) {
  if (!program || !isNs4Program(program)) return null;
  const zones = layerZones(program);
  const grid = ROWS
    .map((kind) => ({ kind, cells: ZONES.map((z) => zones[z].layers.some((l) => l.kind === kind)) }))
    .filter((r) => r.cells.some(Boolean));
  if (grid.every((r) => r.cells.every(Boolean))) return null;
  const label = grid
    .map((r) => `${r.kind}: zones ${ZONES.filter((z) => r.cells[z]).map((z) => z + 1).join(',')}`)
    .join('; ');

  return (
    <span className="grid w-[60px] flex-none grid-cols-4 gap-x-px gap-y-[2px]" role="img" aria-label={`Keyboard split — ${label}`}>
      {grid.flatMap((r) => r.cells.map((on, z) => (
        <span key={`${r.kind}${z}`} className={`h-[3px] rounded-[1px] ${on ? FILL[r.kind] : 'bg-sink'}`} />
      )))}
    </span>
  );
});
