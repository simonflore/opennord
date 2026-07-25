import { cn } from '@/lib/cn';

/**
 * Every mention of Gigmeister — OpenNord's sibling product — lives in this one
 * file, so the copy stays consistent and a fork can delete the directory to
 * remove all of it at once. (Same posture as `BuyMeACoffeeButton`: an
 * author-level link inside the AGPL client, not a product feature.)
 *
 * ## Why this exists, and the rules it follows
 *
 * OpenNord's users are gigging Nord players; Gigmeister is a paid app for
 * gigging bands whose MIDI automation drives a Nord between songs. The overlap
 * is real, so a pointer is genuinely useful — but a cross-promo turns into an
 * *ad* the moment it takes attention it hasn't earned. The rules below are what
 * keep it on the useful side, and they are load-bearing: breaking one is what
 * would make this feel like an ad.
 *
 * 1. **Earned by context, never by prominence.** Every placement sits where the
 *    adjacent problem actually comes up — the Organize view (slot numbers *are*
 *    Program Change numbers), the About screen ("who made this"), and the
 *    bottom of the landing page. Never above the fold, never in the rail, never
 *    an interstitial or a dismissible banner (a banner you must dismiss has
 *    already interrupted).
 * 2. **Frame it as OpenNord's boundary, not Gigmeister's pitch.** "The gig is a
 *    different job and OpenNord won't grow into it" is information about *this*
 *    tool. "Try Gigmeister, it's great" is an ad.
 * 3. **Disclose everything a reader would otherwise suspect** — same author,
 *    separate app, and *paid*. Candour is what separates a recommendation from
 *    a placement; hiding the relationship is what makes people feel sold to.
 * 4. **Never compete with OpenNord's own CTA.** No red accent, no primary
 *    button, no icon tile. `siblingLink` is deliberately quieter than `covLink`
 *    (which is red) — the loudest thing on any page stays "Open the app".
 * 5. **State that it's optional, out loud.** OpenNord is free, complete, and
 *    unaffected if you ignore every link here.
 * 6. **No slogan.** A tagline is the most ad-shaped element there is, and it
 *    adds nothing a plain sentence about what the app does can't. Describe;
 *    don't pitch. (There is deliberately no `GIGMEISTER_TAGLINE` constant.)
 */

export const GIGMEISTER_URL = 'https://gigmeister.app';

/**
 * The quiet outbound link. Muted → ink on hover, never red: rule 4 above. Red
 * is OpenNord's accent and belongs to OpenNord's own actions.
 */
const siblingLink = cn(
  'inline-flex items-baseline gap-1 font-semibold text-dim no-underline',
  'underline decoration-line underline-offset-[3px]',
  'transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
  'hover:text-ink hover:decoration-[var(--color-dim)]',
);

/** A small outbound-arrow glyph — line art with `currentColor`, per the icon convention. */
function ArrowOut() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="translate-y-px"
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

/** The link itself. `children` defaults to the bare product name. */
export function GigmeisterLink({
  children = 'Gigmeister',
  className,
}: { children?: React.ReactNode; className?: string }) {
  return (
    <a
      className={cn(siblingLink, className)}
      href={GIGMEISTER_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowOut />
    </a>
  );
}

/**
 * The landing-page footer mention: the permanent, always-available pointer.
 *
 * Rule 3 binds per *placement*, not per site — a visitor who only ever sees the
 * footer still has to be told this is a separate paid app. Keeping the copy here
 * rather than inline in `SiteFooter` is what makes that checkable (`SiteFooter`
 * itself needs a router to render, so it can't be asserted on directly).
 */
export function GigmeisterFooterNote({ className }: { className?: string }) {
  return (
    <div className={cn('text-[11px] leading-[1.55] text-muted', className)}>
      <div>Also by OpenNord&rsquo;s author</div>
      <div className="mt-1">
        <GigmeisterLink>Gigmeister</GigmeisterLink> — a separate paid app, for
        the gig itself.
      </div>
    </div>
  );
}

/**
 * The in-tool mention, for the Organize view.
 *
 * This is the placement the whole feature is built around, because here the
 * pointer is *information first*: rearranging a bank renumbers the slots, and
 * slot numbers are exactly what a setlist sends as MIDI Program Change. The
 * consequence is real and OpenNord already warns about it in the reorganize
 * dialog — this names a tool that tracks the mapping, and says so plainly.
 */
export function GigmeisterSlotNote({ className }: { className?: string }) {
  return (
    <p className={cn('m-0 text-[11px] leading-[1.55] text-muted', className)}>
      <strong className="font-semibold text-dim">Slot numbers travel.</strong>{' '}
      A slot is what a setlist sends as MIDI Program Change, so re-check any
      saved set that points here after you rearrange a bank.{' '}
      <GigmeisterLink>Gigmeister</GigmeisterLink>, a separate paid app from
      OpenNord&rsquo;s author, keeps that song&#8202;→&#8202;slot mapping for
      you — entirely optional, and nothing here depends on it.
    </p>
  );
}
