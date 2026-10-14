import { useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { cn } from '@/lib/cn';
import { ConfirmDialog } from '../ui';

const stop = (ev: SyntheticEvent) => ev.stopPropagation();

/**
 * Foot-row "Remove from library" control shared by every Library category
 * card. Hidden until the card is hovered or focused — always shown on touch,
 * which has no hover — via the parent `Card`'s `group` class (set by
 * `LibraryCard`). A 44px hit target keeps it thumb-friendly despite the small
 * glyph.
 *
 * It asks first: a removed import is gone from the library (the file on disk or
 * on the Nord is untouched). The dialog is portalled out of the row — a row's
 * `content-visibility` would clip a fixed child to the row — and the span still
 * stops its clicks and keys, since React bubbles portal events to the row,
 * which would open the item.
 */
export function CardRemoveButton({ name, onRemove }: { name: string; onRemove: () => void }) {
  const [asking, setAsking] = useState(false);
  return (
    <>
      <button
        className={cn(
          '-my-2.5 inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-[13px] leading-none text-muted opacity-0',
          'transition-[opacity,color,background] duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
          'group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
          'hover:bg-surface hover:text-red',
        )}
        aria-label={`Remove ${name} from library`}
        title="Remove from library"
        onClick={(ev) => { ev.stopPropagation(); setAsking(true); }}
        // Only the keys that would also open the row; J/K and the rest still reach the page.
        onKeyDown={(ev: KeyboardEvent) => { if (ev.key === 'Enter' || ev.key === ' ') ev.stopPropagation(); }}
      >
        ✕
      </button>
      {asking && (
        <span onClick={stop} onKeyDown={stop} className="contents">
          <RemoveFromLibraryDialog name={name} onCancel={() => setAsking(false)} onRemove={() => { setAsking(false); onRemove(); }} />
        </span>
      )}
    </>
  );
}

/** "Remove … from your library?" — the confirm every Remove from library goes through. */
export function RemoveFromLibraryDialog({ name, onCancel, onRemove }: { name: string; onCancel: () => void; onRemove: () => void }) {
  return (
    <ConfirmDialog portal title={`Remove “${name}” from your library?`} confirmLabel="Remove from library" onCancel={onCancel} onConfirm={onRemove}>
      OpenNord forgets its copy. The file on your computer or your Nord isn’t touched.
    </ConfirmDialog>
  );
}
