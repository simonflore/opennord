import type { NS4Program } from '../../lib/ns4/types';
import { programZones } from '../../lib/ns4/view';

const KIND_ABBR: Record<string, string> = { organ: 'ORG', piano: 'PNO', synth: 'SY' };

/**
 * Keyboard split map — which layers play where, with the split-point notes
 * between zones, plus program transpose. Renders only when the program is split
 * (or transposed); for a plain layered patch the engine cards already say it all.
 */
export function ProgramZones({ program, scene }: { program: NS4Program; scene?: 'I' | 'II' }) {
  const z = programZones(program, scene);
  if (!z.hasSplit && !z.transpose) return null;

  return (
    <div className="ps-zones">
      <div className="ps-zones-hd">
        <span className="ps-zones-t">{z.hasSplit ? 'KEYBOARD SPLIT' : 'KEYBOARD'}</span>
        {z.transpose && <span className="ps-zones-tr">transpose {z.transpose}</span>}
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
              {i < 3 && <span className="ps-zone-split">{z.boundaries[i] ?? ''}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
