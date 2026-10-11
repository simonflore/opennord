import type { CSSProperties } from 'react';
import type { NS4Program } from '../../lib/ns4/types';
import { programZones } from '../../lib/ns4/view';
import { BLACK_KEYS, BLACK_KEY_WIDTH, WHITE_KEYS, shortXfade, zoneLanes } from './zone-map';

const KIND_ABBR: Record<string, string> = { organ: 'ORG', piano: 'PNO', synth: 'SYN' };
const pct = (f: number) => `${(f * 100).toFixed(3)}%`;

/**
 * Keyboard split map + performance routing: one lane per layer, in its engine
 * colour, over the stretch of the keyboard it plays, with the split points (and
 * their crossfades) marked on a real keyboard. Then the program's performance
 * switches — transpose, pitch stick, sustain, KB hold — as lit LED keys. Renders
 * when there's anything routing-related to show; a plain layered patch needs none.
 */
export function ProgramZones({ program, scene }: { program: NS4Program; scene?: 'I' | 'II' }) {
  const z = programZones(program, scene);
  const perf = z.performance;
  const hasPerf = !!perf.pitchStick || perf.sustain || perf.kbHold;
  if (!z.hasSplit && !z.transpose && !hasPerf) return null;
  const { lanes, splits } = zoneLanes(z.zones, z.boundaries, z.xfade);
  const describe = splits.length
    ? `Keyboard split at ${splits.map((s) => s.note).join(' and ')}`
    : 'Keyboard layers';

  return (
    <div className="ps-zones">
      <div className="ps-zones-hd">
        <span className="ps-zones-t">{z.hasSplit ? 'KEYBOARD SPLIT' : 'KEYBOARD'}</span>
        {z.transpose && <span className="ps-key on">transpose {z.transpose}</span>}
        {perf.pitchStick && (
          <span className="ps-key on">pitch stick{perf.pitchStick === 'on' ? '' : ` ${perf.pitchStick}`}</span>
        )}
        {perf.sustain && <span className="ps-key on">sustain</span>}
        {perf.kbHold && <span className="ps-key on">KB hold</span>}
      </div>

      {z.hasSplit && (
        <figure className="ps-zonebar ps-kmap" aria-label={describe}>
          {lanes.map((l) => (
            <div className="ps-kmap-row" key={`${l.kind}${l.id}`}>
              <span className="ps-kmap-name">{KIND_ABBR[l.kind] ?? '?'} {l.id}</span>
              <div className="ps-kmap-track">
                {l.segments.map((s) => (
                  <span
                    key={s.from}
                    className={`ps-kmap-seg ps-zone-${l.kind}`}
                    style={{ left: pct(s.from), width: pct(s.to - s.from) }}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="ps-kmap-row" aria-hidden="true">
            <span className="ps-kmap-name" />
            <div className="ps-kmap-keys" style={{ ['--whites' as string]: WHITE_KEYS } as CSSProperties}>
              {BLACK_KEYS.map((x) => (
                <span key={x} className="ps-kmap-black" style={{ left: pct(x), width: pct(BLACK_KEY_WIDTH) }} />
              ))}
            </div>
          </div>
          {splits.map((s, i) => (
            <div
              className="ps-kmap-split"
              key={s.note}
              // Alternate label lines so two close split points never overprint.
              style={{ ['--x' as string]: s.x, ['--line' as string]: i % 2 } as CSSProperties}
            >
              <span>
                {s.note}
                {s.xfade && <span className="ps-zone-xfade" title="crossfade"> · xfade {shortXfade(s.xfade)}</span>}
              </span>
            </div>
          ))}
        </figure>
      )}
    </div>
  );
}
