import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * The overline above a section/group heading.
 *
 * `accent` (the default) is the red overline used throughout the app's chrome —
 * device panels, dialogs, group headings. `eyebrow` is the editorial variant:
 * monospace, muted, wide-tracked, with a bullet. Both stay uppercase.
 *
 * An eyebrow states its section's CLAIM, not its name — "Stage first, family
 * next", not "Coverage". An eyebrow that merely labels its section is a review
 * failure. See docs/specs/2026-07-16-blueprint-motifs-design.md §4.
 */
export const sectionLabelVariants = cva('uppercase', {
  variants: {
    variant: {
      accent: 'text-[9px] font-bold tracking-[1.4px] text-red-bright',
      // inline-flex, not flex: a block-level flex box would ignore a centring
      // parent's text-align and silently left-align the eyebrow (OpenSource's
      // panel is text-center). inline-flex behaves identically when the parent
      // is left-aligned.
      eyebrow: 'inline-flex items-center gap-2 font-mono text-[10px] font-medium tracking-[1.6px] text-muted',
    },
  },
  defaultVariants: { variant: 'accent' },
});

export function SectionLabel({
  variant,
  children,
}: { children: ReactNode } & VariantProps<typeof sectionLabelVariants>) {
  return (
    <div className={cn(sectionLabelVariants({ variant }))}>
      {variant === 'eyebrow' && (
        <span aria-hidden="true" className="inline-block h-1 w-1 shrink-0 rounded-full bg-muted" />
      )}
      {children}
    </div>
  );
}
