import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * A toggleable filter chip. `active` swaps the quiet raised look for the red
 * fill + glow (mirrors the primary Button treatment so "selected" reads as an
 * affordance, not just a color swap).
 */
export function FilterChip(
  { active = false, onClick, children }:
  { active?: boolean; onClick?: () => void; children: ReactNode },
) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'cursor-pointer select-none rounded-full border px-[11px] py-1 text-[10px] font-semibold edge-hi',
        'transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]',
        active
          ? 'fill-primary border-red text-text-on-accent glow'
          : 'fill-raised border-line text-text-tertiary hover:border-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
