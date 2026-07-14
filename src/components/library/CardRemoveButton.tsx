import type { MouseEvent, KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';

/**
 * Foot-row "remove from library" control shared by every Library category
 * card. Hidden until the card is hovered or focused — always shown on touch,
 * which has no hover — via the parent `Card`'s `group` class (set by
 * `LibraryCard`). A 44px hit target keeps it thumb-friendly despite the small
 * glyph.
 */
export function CardRemoveButton({ name, onRemove }: { name: string; onRemove: (ev: MouseEvent) => void }) {
  return (
    <button
      className={cn(
        '-my-2.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-[13px] leading-none text-muted opacity-0',
        'transition-[opacity,color,background] duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
        'group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
        'hover:bg-surface hover:text-red',
      )}
      aria-label={`Remove ${name}`}
      title="Remove from library"
      onClick={onRemove}
      onKeyDown={(ev: KeyboardEvent) => ev.stopPropagation()}
    >
      ✕
    </button>
  );
}
