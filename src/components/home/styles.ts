import { buttonVariants } from '@/components/ui';

/**
 * Class strings shared across more than one landing-page section.
 *
 * Each of these was originally declared inside a single section's comment
 * banner, but banner position never implied ownership — every one below has
 * consumers in other sections. They live here so the split cannot duplicate
 * them.
 */

/** The primary CTA. Hero and DesktopApp use it. */
export const heroBtn = buttonVariants({ variant: 'primary', size: 'lg' });

/** The amber "Beta" / "Coming soon" marker on the desktop builds. */
export const roadmapTag = 'rounded-full border border-[color-mix(in_srgb,var(--warn)_45%,var(--line))] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[1px] text-warn';

/** The inline red link out to a fuller page: the docs, a release. */
export const covLink = 'whitespace-nowrap text-xs font-semibold text-red-bright no-underline transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)] hover:text-red';

/**
 * The head of a dense list: a mono label, with an optional count on the right.
 */
export const listHead = 'flex items-baseline justify-between border-b border-line pb-2 font-mono text-[11px] uppercase tracking-[1px] text-dim';

/** The hairline between rows of a dense list — fainter than the head's rule. */
export const listRule = 'border-b border-[color-mix(in_srgb,var(--line)_55%,transparent)]';

/** A numbered row: a mono index column, then the content. */
export const indexedRow = 'grid grid-cols-[28px_1fr] gap-3 py-4';

/** The mono index of a numbered row: 01, 02, … */
export const listIndex = 'pt-[3px] font-mono text-[11px] text-muted';
