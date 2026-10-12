import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * A Library detail laid out for the room it gets: one column in a narrow pane,
 * and from 960px of pane a main column with a side column of controls beside it.
 *
 * Three slots, in phone order: `top` (the instrument itself — the keyboard map),
 * `side` (what you set or do with it — MIDI, audition settings, convert,
 * download) and `rest` (the long reference below — the recordings, raw tables).
 * Wide, `top` and `rest` stack in the main column and `side` runs beside both,
 * so a long `rest` never pushes the controls off screen and the phone order
 * still puts the controls before the long list.
 *
 * A container query, not a media query: the pane's width depends on the rail
 * and the list beside it, not on the window.
 */
export function DetailColumns({ top, side, rest }: { top: ReactNode; side?: ReactNode; rest?: ReactNode }) {
  return (
    <div className="@container">
      <div className={cn('grid grid-cols-1 gap-x-4 @[960px]:grid-rows-[auto_1fr] @[960px]:items-start', side && '@[960px]:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]')}>
        <div className="min-w-0 @[960px]:col-start-1 @[960px]:row-start-1">{top}</div>
        {side && <div className="min-w-0 @[960px]:col-start-2 @[960px]:row-span-2 @[960px]:row-start-1">{side}</div>}
        {rest && <div className="min-w-0 @[960px]:col-start-1 @[960px]:row-start-2">{rest}</div>}
      </div>
    </div>
  );
}
