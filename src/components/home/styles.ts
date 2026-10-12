import { buttonVariants } from '@/components/ui';

/**
 * Class strings shared across more than one landing-page section.
 *
 * Each of these was originally declared inside a single section's comment
 * banner, but banner position never implied ownership — every one below has
 * consumers in other sections. They live here so the split cannot duplicate
 * them.
 */

/** The primary CTA. Hero, DesktopApp and OpenSource all use it. */
export const heroBtn = buttonVariants({ variant: 'primary', size: 'lg' });

/** The amber "not shipped yet" / "Beta" marker. Features and DesktopApp. */
export const roadmapTag = 'rounded-full border border-[color-mix(in_srgb,var(--warn)_45%,var(--line))] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[1px] text-warn';

/** The inline red link out to a fuller page. Matrix and DesktopApp. */
export const covLink = 'whitespace-nowrap text-xs font-semibold text-red-bright no-underline transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)] hover:text-red';

/**
 * The head of a dense list: a mono label, with an optional count on the right.
 * Features, Coverage, DesktopApp and OpenSource all open their lists with it.
 */
export const listHead = 'flex items-baseline justify-between border-b border-line pb-2 font-mono text-[11px] uppercase tracking-[1px] text-dim';

/** The hairline between rows of a dense list — fainter than the head's rule. */
export const listRule = 'border-b border-[color-mix(in_srgb,var(--line)_55%,transparent)]';

/** Two dense lists side by side, stacked at phone width. */
export const listGrid = 'grid grid-cols-2 gap-x-10 gap-y-8 max-[760px]:grid-cols-1';

/** A numbered row: a mono index column, then the content. Features and Why. */
export const indexedRow = 'grid grid-cols-[28px_1fr] gap-3 py-4';

/** The mono index of a numbered row: 01, 02, … */
export const listIndex = 'pt-[3px] font-mono text-[11px] text-muted';
