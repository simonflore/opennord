import type { ReactNode } from 'react';

/** The red overline used above a section/group heading. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[9px] font-bold uppercase tracking-[1.4px] text-red-bright">
      {children}
    </div>
  );
}
