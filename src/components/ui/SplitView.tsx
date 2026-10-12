import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Master/detail two-pane container. Purely presentational — the parent decides
 * (via useSplitLayout) whether there's room to render both panes.
 *
 * NOT converted to Tailwind utilities like its siblings: `library.css` keys
 * descendant selectors off these exact class names (`.on-split .lib-panel`,
 * `.on-split .lib-master`, `.on-split__detail .ps-hd`) to stretch/pin the
 * Library's panels when the split is active. Those rules live outside
 * `components/ui/` and are unlayered CSS, so they'd win the cascade over any
 * Tailwind utilities added here anyway (Tailwind's utilities sit in `@layer
 * utilities`, which unlayered CSS always beats) — re-expressing the layout in
 * utilities here would be inert. Left wired to `ui.css`'s `.on-split*` rules
 * until that cross-file coupling is untangled.
 */
export function SplitView({ master, detail, solo, inspector }: {
  master: ReactNode;
  detail: ReactNode;
  /** Only the master, across the full width (nothing open yet); the same tree, so it stays mounted. */
  solo?: boolean;
  /** The detail as an inspector column on the right, the master keeping its width (wide screens). */
  inspector?: boolean;
}) {
  return (
    <div className={cn('on-split', solo && 'on-split--solo', inspector && 'on-split--inspector')}>
      <div className="on-split__master">{master}</div>
      <div className="on-split__detail">{detail}</div>
    </div>
  );
}
