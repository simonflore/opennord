import type { NS4Program } from '../../lib/ns4/types';
import { programZones } from '../../lib/ns4/view';

const KIND_ABBR: Record<string, string> = { organ: 'ORG', piano: 'PNO', synth: 'SY' };

/**
 * Keyboard split map + performance routing — which layers play where (with the
 * split-point notes and crossfades between zones), transpose, and the program's
 * keyboard-performance flags (pitch stick, sustain, KB hold). Renders when there's
 * anything routing-related to show; a plain layered patch needs none of it.
 */
export function ProgramZones({ program, scene }: { program: NS4Program; scene?: 'I' | 'II' }) {
  const z = programZones(program, scene);
  const perf = z.performance;
  const hasPerf = !!perf.pitchStick || perf.sustain || perf.kbHold;
  if (!z.hasSplit && !z.transpose && !hasPerf) return null;

  return (
    <div className="ps-zones">
      <div className="ps-zones-hd">
        <span className="ps-zones-t">{z.hasSplit ? 'KEYBOARD SPLIT' : 'KEYBOARD'}</span>
        {z.transpose && <span className="ps-zones-tr">transpose {z.transpose}</span>}
        {perf.pitchStick && <span className="ps-perf-chip">pitch stick {perf.pitchStick}</span>}
        {perf.sustain && <span className="ps-perf-chip">sustain</span>}
        {perf.kbHold && <span className="ps-perf-chip">KB hold</span>}
      </div>

      {z.hasSplit && (
        <div className="ps-zonebar">
          {z.zones.map((zone, i) => (
            <div className="ps-zone" key={i}>
              <div className="ps-zone-cell">
                {zone.layers.length === 0
                  ? <span className="ps-zone-empty">—</span>
                  : zone.layers.map((l) => (
                      <span className={`ps-zone-chip ps-zone-${l.kind}`} key={`${l.kind}${l.id}`}>
                        {KIND_ABBR[l.kind] ?? '?'}·{l.id}
                      </span>
                    ))}
              </div>
              {i < 3 && (
                <span className="ps-zone-split">
                  {z.boundaries[i] ?? ''}
                  {z.xfade[i] && <span className="ps-zone-xfade" title="crossfade">↔{z.xfade[i]}</span>}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
