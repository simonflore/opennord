import type { ReactNode } from 'react';

/** A small read-only metadata tag (e.g. an instrument/engine label on a card). */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold text-text-tertiary fill-raised edge-hi">
      {children}
    </span>
  );
}
