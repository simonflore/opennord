import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useFolderOptional } from '@/lib/folder/FolderContext';

/**
 * Shared "nothing to show" note — the plain centered dim caption used for a
 * split detail pane's placeholder and (via `LibraryEmpty`) every category's
 * filtered/onboarding empty state.
 */
export function EmptyNote({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('py-6 text-center text-[12px] text-dim', className)}>{children}</div>;
}

/**
 * The detail for an entry the route names but the list doesn't hold: still
 * being looked for while the folder scans (a reload or a deep link), otherwise
 * not in the library now (removed, or gone with its Nord).
 */
export function NotListedNote({ noun, className }: { noun: string; className?: string }) {
  const busy = useFolderOptional()?.busy ?? false;
  return (
    <EmptyNote className={className}>
      {busy ? `Looking for this ${noun} in your library…` : `This ${noun} isn’t in your library right now. Pick one from the list.`}
    </EmptyNote>
  );
}
