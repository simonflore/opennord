import type { ReactNode } from 'react';

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="on-overline">{children}</div>;
}
