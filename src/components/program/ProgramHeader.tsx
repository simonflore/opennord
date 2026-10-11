import type { ReactNode } from 'react';
import type { HeaderView } from '../../lib/clavia/engine-view';
import { EngineTags } from '../library/EngineTags';

/**
 * The program's identity, the way the Nord shows it: slot and name on the LCD,
 * category and saved-with OS version underneath, then the engines in use. `aside`
 * sits beside the LCD — the scene switch, on models that have one. File size and
 * other container details stay out of the header (they're not what a player
 * reads); the "all parameters" drawer still has everything.
 */
export function ProgramHeader({ header: h, aside }: { header: HeaderView; aside?: ReactNode }) {
  const slot = h.slot === '—' ? '' : `${h.slot} `;
  return (
    <div className="ps-hd">
      <div className="ps-hd-id">
        <div className="ps-lcd ps-lcd-id">
          <h2 className="big">{slot}{h.name}</h2>
          <div>{h.category} · {h.version}</div>
        </div>
        <EngineTags summary={h.engines} detail />
      </div>
      {aside}
    </div>
  );
}
