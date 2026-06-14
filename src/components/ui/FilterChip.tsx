import type { ReactNode } from 'react';

export function FilterChip(
  { active = false, onClick, children }:
  { active?: boolean; onClick?: () => void; children: ReactNode },
) {
  return (
    <button className={`on-chip ${active ? 'on-chip--active' : ''}`.trim()} onClick={onClick}>
      {children}
    </button>
  );
}
