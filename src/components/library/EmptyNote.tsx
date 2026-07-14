import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Shared "nothing to show" note — the plain centered dim caption used for a
 * split detail pane's placeholder and (via `LibraryEmpty`) every category's
 * filtered/onboarding empty state.
 */
export function EmptyNote({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('py-6 text-center text-[12px] text-dim', className)}>{children}</div>;
}
