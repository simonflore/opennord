import type { ModelProgress, BodyRegion, RegionStatus } from '../../lib/contribute/coverage-data';
import { summarizeProgress } from '../../lib/contribute/coverage';
import { cn } from '@/lib/cn';

const COLS = 16;

const CELL_COLOR: Record<RegionStatus, string> = {
  confirmed: 'bg-connected',
  candidate: 'bg-warn opacity-75',
  unknown: 'bg-red-bright opacity-60',
  constant: 'bg-line',
};
const cellCls = (status: RegionStatus) =>
  cn('inline-block h-2.5 w-2.5 flex-shrink-0 rounded-[2px] max-[560px]:h-2 max-[560px]:w-2', CELL_COLOR[status]);

const LABEL: Record<RegionStatus, string> = {
  confirmed: 'Confirmed',
  candidate: 'Section identified',
  constant:  'Constant across corpus',
  unknown:   'Varies — unidentified',
};

/** Build a flat byte→region lookup from the regions array. */
function buildLookup(regions: BodyRegion[], total: number): (BodyRegion | null)[] {
  const map = new Array<BodyRegion | null>(total).fill(null);
  for (const r of regions) for (let i = r.start; i <= r.end; i++) map[i] = r;
  return map;
}

/** Tooltip text for a byte cell. */
function tip(byteIndex: number, region: BodyRegion | null): string {
  if (!region) return `b${byteIndex}`;
  const label = region.label || LABEL[region.status];
  return `b${byteIndex} — ${label}`;
}

export function ByteMapView({ progress }: { progress: ModelProgress }) {
  const { bodyBytes, regions, controls } = progress;
  if (!bodyBytes || !regions) return null;

  const { coveredBytes, candidateBytes, controlCount, pct } = summarizeProgress(progress);
  const lookup = buildLookup(regions, bodyBytes);

  const rows: number[][] = [];
  for (let i = 0; i < bodyBytes; i += COLS) rows.push(Array.from({ length: COLS }, (_, j) => i + j).filter(b => b < bodyBytes));

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs text-dim">
        <span className="font-semibold text-connected">{coveredBytes} decoded</span>
        {candidateBytes > 0 && <><span className="text-muted">·</span><span>{candidateBytes} identified</span></>}
        <span className="text-muted">·</span>
        <span>{controlCount} controls</span>
        {pct != null && <><span className="text-muted">·</span><span>{pct}% decoded</span></>}
      </div>

      <div className="flex flex-col gap-0.5">
        {rows.map((row, ri) => (
          <div key={ri} className="flex items-center gap-0.5">
            <span className="mr-1 w-6 flex-shrink-0 text-right font-mono text-[10px] leading-none text-muted max-[560px]:w-5 max-[560px]:text-[9px]">
              {ri * COLS}
            </span>
            {row.map(b => {
              const r = lookup[b];
              const status = r?.status ?? 'constant';
              return <span key={b} className={cellCls(status)} title={tip(b, r)} />;
            })}
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2.5 text-[11px] text-dim">
        {(['confirmed', 'candidate', 'unknown', 'constant'] as RegionStatus[]).map(s => (
          <span key={s} className="flex items-center gap-1">
            <span className={cellCls(s)} />
            {LABEL[s]}
          </span>
        ))}
      </div>

      {controls.length > 0 && (
        <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
          {controls.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5 text-[11px] text-dim">
              <span className={cellCls('confirmed')} />
              {c.label}
              <span className="font-mono text-muted">
                {c.ranges.map(r => r.start === r.end ? `b${r.start}` : `b${r.start}–${r.end}`).join(', ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
