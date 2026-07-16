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

/** The red-tinted icon tile. Features uses it at 40px; Proof overrides to 34px. */
export const iconTile = 'mb-3 inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[color-mix(in_srgb,var(--red)_22%,var(--line))] bg-[color-mix(in_srgb,var(--red)_12%,transparent)] text-red-bright';

/** The amber "not shipped yet" / "Alpha" marker. More and DesktopApp. */
export const roadmapTag = 'rounded-full border border-[color-mix(in_srgb,var(--warn)_45%,var(--line))] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[1px] text-warn';

/** The inline red link out to a fuller page. Matrix and DesktopApp. */
export const covLink = 'whitespace-nowrap text-xs font-semibold text-red-bright no-underline transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)] hover:text-red';
