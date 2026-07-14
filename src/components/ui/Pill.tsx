import type { ReactNode } from 'react';

/**
 * A small rounded metadata chip (the `.ps-pill` used across program/sample
 * headers). `variant="warning"` tints it for a caution marker (e.g. "factory?").
 */
export function Pill({ variant = 'default', title, children }: {
  variant?: 'default' | 'warning';
  title?: string;
  children: ReactNode;
}) {
  return (
    <span className={variant === 'warning' ? 'ps-pill ps-pill--warning' : 'ps-pill'} title={title}>
      {children}
    </span>
  );
}
