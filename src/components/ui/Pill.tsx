import type { ReactNode } from 'react';

/** A small rounded metadata chip (the `.ps-pill` used across program/sample headers). */
export function Pill({ title, children }: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <span className="ps-pill" title={title}>
      {children}
    </span>
  );
}
