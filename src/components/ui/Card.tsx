import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The card primitive: a top-lit surface panel (`fill-surface` + `elev-2`).
 * `accent` swaps in the red rail + warm wash used to flag "this one matters"
 * (e.g. the on-Nord highlight in the Library).
 */
export function Card(
  { accent = false, children, className, ...rest }:
  { accent?: boolean; children: ReactNode } & HTMLAttributes<HTMLDivElement>,
) {
  return (
    <div
      className={cn(
        'rounded-md border border-line p-3 text-ink elev-2',
        accent ? 'border-l-[3px] border-l-red fill-surface-accent' : 'fill-surface',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
