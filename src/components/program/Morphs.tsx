import type { NS4Program } from '../../lib/ns4/types';
import { morphSummary } from '../../lib/ns4/view';

/**
 * A dedicated "what moves in performance" panel. The engine cards mark
 * morph-assigned controls with a small ✎, but it's easy to miss and FX morphs
 * aren't badged anywhere — so this lists every morph with its source (wheel /
 * aftertouch / control pedal) and the value it morphs toward. Renders nothing
 * when the program has no morphs.
 */
export function Morphs({ program }: { program: NS4Program }) {
  const rows = morphSummary(program);
  if (rows.length === 0) return null;
  return (
    <div className="ps-card ps-morphs">
      <h4>MORPHS</h4>
      <p className="ps-sub" style={{ marginTop: 0 }}>
        Controls that move while you play — the mod wheel, aftertouch, or control pedal morphs each toward the value shown.
      </p>
      <ul className="ps-morph-list">
        {rows.map((r, i) => (
          <li key={i} className="ps-morph-item">
            <span className="ps-morph-sec">{r.section}</span>
            <span className="ps-morph-nm">{r.name}</span>
            <span className="ps-morph-srcs">
              {r.wheel && <span className="ps-morph-src"><b>Wheel</b> → {r.wheel}</span>}
              {r.at && <span className="ps-morph-src"><b>A.T.</b> → {r.at}</span>}
              {r.pedal && <span className="ps-morph-src"><b>Pedal</b> → {r.pedal}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
