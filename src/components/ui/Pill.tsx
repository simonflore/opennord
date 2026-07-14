import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * A small rounded metadata chip (the program/sample-header pill). `variant="warning"`
 * tints it for a caution marker (e.g. "factory?").
 */
export function Pill({ variant = 'default', title, children }: {
  variant?: 'default' | 'warning';
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-line bg-[var(--panel-pill)] px-[9px] py-px text-[11px]',
        variant === 'warning' && 'border-[var(--deps-border)] text-warn',
      )}
      title={title}
    >
      {children}
    </span>
  );
}
