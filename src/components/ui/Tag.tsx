import type { ReactNode } from 'react';

export function Tag({ children }: { children: ReactNode }) {
  return <span className="on-tag">{children}</span>;
}
