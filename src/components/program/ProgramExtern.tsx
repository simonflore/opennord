import type { NS4Program } from '../../lib/ns4/types';
import { externViews } from '../../lib/ns4/view';

const KIND_ABBR: Record<string, string> = { organ: 'ORG', piano: 'PNO', synth: 'SY' };

/**
 * External / MIDI section — layers sending a program-change + two CCs to outboard
 * gear. Renders only when a layer has External switched on (decoded but otherwise
 * invisible). `scene` follows the Scene I/II view toggle.
 */
export function ProgramExtern({ program, scene }: { program: NS4Program; scene?: 'I' | 'II' }) {
  const rows = externViews(program, scene);
  if (rows.length === 0) return null;

  return (
    <div className="ps-extern">
      <div className="ps-extern-t">EXTERNAL / MIDI</div>
      {rows.map((r) => (
        <div className="ps-extern-row" key={`${r.kind}${r.id}`}>
          <span className="ps-extern-tag">{KIND_ABBR[r.kind] ?? '?'}·{r.id}</span>
          {r.program && <span className="ps-extern-v">prog {r.program}</span>}
          {r.cc1 && <span className="ps-extern-v">CC1 {r.cc1}</span>}
          {r.cc2 && <span className="ps-extern-v">CC2 {r.cc2}</span>}
        </div>
      ))}
    </div>
  );
}
