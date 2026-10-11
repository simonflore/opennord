import { memo, type ReactNode } from 'react';
import { isNs4Program, type NordProgram } from '../../lib/formats';
import { engineZones, gridSplits } from '../../lib/ns4/view';

// Literal class names (not built from the kind) so Tailwind sees them.
const FILL = { piano: 'bg-engine-piano', organ: 'bg-engine-organ', synth: 'bg-engine-synth' } as const;
const ZONES = [0, 1, 2, 3];

/**
 * Which engine plays in which of the four keyboard zones: a three-row (piano,
 * organ, synth) by four-zone glance for a library row. Built from the layers'
 * zone flags only (`engineZones`, no parameter decode), so a long list stays
 * cheap; memoised, since a row's program object is stable while the list
 * re-renders on every search keystroke. Renders nothing for a program that
 * isn't split, where every engine covers the whole keyboard.
 */
export const ZoneStrip = memo(function ZoneStrip({ program, fallback = null }: {
  program?: NordProgram;
  /** Shown instead when there's no split to draw (or no Stage 4 program). */
  fallback?: ReactNode;
}) {
  if (!program || !isNs4Program(program)) return fallback;
  const grid = engineZones(program);
  if (!gridSplits(grid)) return fallback;
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
