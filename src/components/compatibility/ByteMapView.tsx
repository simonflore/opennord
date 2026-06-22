import type { ModelProgress, BodyRegion, RegionStatus } from '../../lib/contribute/coverage-data';
import { summarizeProgress } from '../../lib/contribute/coverage';

const COLS = 16;

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
    <div className="bmap">
      <div className="bmap__meta">
        <span className="bmap__stat bmap__stat--confirmed">{coveredBytes} decoded</span>
        {candidateBytes > 0 && <><span className="bmap__sep">·</span><span className="bmap__stat">{candidateBytes} identified</span></>}
        <span className="bmap__sep">·</span>
        <span className="bmap__stat">{controlCount} controls</span>
        {pct != null && <><span className="bmap__sep">·</span><span className="bmap__stat">{pct}% decoded</span></>}
      </div>

      <div className="bmap__grid" style={{ '--bmap-cols': COLS } as React.CSSProperties}>
        {rows.map((row, ri) => (
          <div key={ri} className="bmap__row">
            <span className="bmap__addr">{ri * COLS}</span>
            {row.map(b => {
              const r = lookup[b];
              const status = r?.status ?? 'constant';
              return (
                <span
                  key={b}
                  className={`bmap__cell bmap__cell--${status}`}
                  title={tip(b, r)}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="bmap__legend">
        {(['confirmed', 'candidate', 'unknown', 'constant'] as RegionStatus[]).map(s => (
          <span key={s} className="bmap__leg-item">
            <span className={`bmap__cell bmap__cell--${s}`} />
            {LABEL[s]}
          </span>
        ))}
      </div>

      {controls.length > 0 && (
        <ul className="bmap__controls">
          {controls.map((c, i) => (
            <li key={i} className="bmap__control">
              <span className="bmap__cell bmap__cell--confirmed" />
              {c.label}
              <span className="bmap__range">
                {c.ranges.map(r => r.start === r.end ? `b${r.start}` : `b${r.start}–${r.end}`).join(', ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
