import { SourceBadge } from './SourceBadge';
import type { LibrarySource } from '@/lib/library/types';
import { foundOn } from '@/lib/library/found-on';

/** Every source a sound is found on, and the hint that an unread Nord slot has its name. */
export function SourceBadges({ entry }: { entry: { source: LibrarySource; sources?: LibrarySource[]; sameNameOnNord?: string } }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {foundOn(entry).map((s) => <SourceBadge key={s} source={s} />)}
      {entry.sameNameOnNord && (
        // Not a badge: the slot hasn't been read, so nothing says it is the same sound.
        <span className="text-[9px] tracking-[.4px] text-muted">same name on Nord · {entry.sameNameOnNord}</span>
      )}
    </span>
  );
}
