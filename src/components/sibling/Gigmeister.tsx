import { cn } from '@/lib/cn';

/**
 * Every mention of Gigmeister — OpenNord's author's other project — lives in
 * this one file, so a fork can delete the directory to remove all of it at once.
 * (Same posture as `BuyMeACoffeeButton`: an author-level link inside the AGPL
 * client, not a product feature.)
 *
 * Keep these mentions to what they are: *this is my other project, here is what
 * it does.* No pitch, no benefit claims, no slogan, no CTA weight — the link is
 * deliberately quieter than `covLink` (which is red), because red is OpenNord's
 * accent and belongs to OpenNord's own actions. If a mention grows past a
 * sentence or two, it has turned into an ad.
 */

export const GIGMEISTER_URL = 'https://gigmeister.app';

/** What it is, in one line. Shared so the surfaces can't drift into pitching. */
export const GIGMEISTER_BLURB =
  'an app for gigging bands — setlists, a band calendar, and MIDI automation that switches your Nord between songs';

/** The quiet outbound link. Muted → ink on hover, never red. */
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

/** The landing-page footer mention. */
export function GigmeisterFooterNote({ className }: { className?: string }) {
  return (
    <p className={cn('m-0 text-[11px] leading-[1.55] text-muted', className)}>
      OpenNord&rsquo;s author also built{' '}
      <GigmeisterLink>Gigmeister</GigmeisterLink> — {GIGMEISTER_BLURB}.
    </p>
  );
}

/**
 * The in-tool mention, under the Organize bank grids.
 *
 * The first sentence is OpenNord's own advice and earns the placement:
 * rearranging a bank renumbers slots, and a slot number is what a setlist sends
 * as MIDI Program Change. The mention is a clause, not a callout.
 */
export function GigmeisterSlotNote({ className }: { className?: string }) {
  return (
    <p className={cn('m-0 text-[11px] leading-[1.55] text-muted', className)}>
      <strong className="font-semibold text-dim">Slot numbers travel.</strong>{' '}
      A setlist sends MIDI Program Change at a slot, not at a program, so
      re-check any saved set after you rearrange a bank.{' '}
      <GigmeisterLink>Gigmeister</GigmeisterLink> — also by OpenNord&rsquo;s
      author — keeps that song&#8202;→&#8202;slot mapping in step.
    </p>
  );
}
