import type { MouseEvent } from 'react';
import { cn } from '@/lib/cn';

/**
 * The landing page's content column. Resolves to --container-content, which the
 * Blueprint frame also uses — so the column and its rails cannot drift apart.
 */
export const CONTENT = 'mx-auto max-w-content px-6';

/**
 * The standard section rhythm.
 *
 * Clamped hard at the low end on purpose: the editorial reference's whitespace
 * is a desktop luxury, and unclamped at phone width it is just scrolling. The
 * app is mobile-first (working principle 4).
 */
export const SEC = cn(CONTENT, 'py-[clamp(40px,5vw,80px)]');

/** The tighter rhythm, for sections that ride close to their neighbour. */
export const SEC_TIGHT = cn(CONTENT, 'py-[clamp(20px,2.5vw,40px)]');

/**
 * Scroll to an in-page section without writing to the URL hash.
 *
 * The app uses hash-based routing (createHashHistory), so a bare
 * `href="#features"` is parsed by the router as the route `/features` — which
 * swaps this full-bleed landing page for the app shell (left rail). We keep the
 * href for accessibility and right-click, but intercept the click and scroll
 * manually so the router's hash is never touched.
 */
export function scrollToSection(id: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
}
