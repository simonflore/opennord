import { isNs4Program, type NordProgram } from '../../lib/formats';
import { activeLayers } from '../../lib/ns4/view';

const ROWS = ['organ', 'piano', 'synth'] as const;
const FILL: Record<(typeof ROWS)[number], string> = {
  organ: 'bg-engine-organ',
  piano: 'bg-engine-piano',
  synth: 'bg-engine-synth',
};

/**
 * Which engine plays in which of the four keyboard zones: a three-row (organ,
 * piano, synth) by four-zone glance for a library row. Built from each layer's
 * zone flags only — no parameter decode — so a long list stays cheap. Renders
 * nothing for a program that isn't split, where every engine covers the keys.
 */
export function ZoneStrip({ program }: { program?: NordProgram }) {
  if (!program || !isNs4Program(program)) return null;
  const layers = activeLayers(program).filter((l) => l.kbZones && l.kind);
  if (layers.length === 0 || layers.every((l) => l.kbZones === '1111')) return null;
  const plays = (kind: string, zone: number) => layers.some((l) => l.kind === kind && l.kbZones?.[zone] === '1');
  const rows = ROWS.filter((k) => layers.some((l) => l.kind === k));
  const label = rows.map((k) => `${k}: zones ${[0, 1, 2, 3].filter((z) => plays(k, z)).map((z) => z + 1).join(',')}`).join('; ');

  return (
    <span className="grid w-[60px] flex-none grid-cols-4 gap-x-px gap-y-[2px]" role="img" aria-label={`Keyboard split — ${label}`}>
      {rows.flatMap((k) => [0, 1, 2, 3].map((z) => (
        <span key={`${k}${z}`} className={`h-[3px] rounded-[1px] ${plays(k, z) ? FILL[k] : 'bg-sink'}`} />
      )))}
    </span>
  );
}
