import { Blueprint } from '@/components/ui';
import { SiteHeader } from './SiteHeader';
import { Hero } from './Hero';
import { Features } from './Features';
import { DesktopApp } from './DesktopApp';
import { Proof } from './Proof';
import { Coverage } from './Coverage';
import { Matrix } from './Matrix';
import { Why } from './Why';
import { OpenSource } from './OpenSource';
import { SiteFooter } from './SiteFooter';

/**
 * The public landing page — OpenNord's front door at `/`.
 *
 * Rendered full-bleed (outside the app's left rail; see routes/root.tsx) so the
 * initiative has a real marketing surface that explains what OpenNord is and
 * sends people into the app or to the source. Everything here routes through
 * tokens.css (Studio Dark) — no hardcoded color — and speaks the musician's
 * language, not the RE notes (docs/LEGAL.md requires the non-affiliation
 * disclaimer on every surface — it lives in the footer below).
 *
 * Composition only: each section owns its own file.
 */
export function HomeView() {
  return (
    // overflow-x-clip: the blueprint crosshairs sit half outside the column, which
    // at phone width is half outside the screen. clip, not hidden, so nothing
    // becomes a scroll container.
    <div className="relative min-h-screen overflow-x-clip stage-backdrop text-ink">
      {/* The blueprint frame's rails land at max-w-content — the same
          --container-content that CONTENT gives every section — so the frame
          traces the real column and the two cannot drift. z-0, not a negative
          index: this div carries stage-backdrop, and -z-10 would paint the
          frame behind that background and hide it. */}
      <div className="absolute inset-0 mx-auto max-w-content">
        <Blueprint />
      </div>
      <div className="relative z-10">
        <SiteHeader />
        <main>
          <Hero />
          <Features />
          <DesktopApp />
          <Proof />
          <Coverage />
          <Matrix />
          <Why />
          <OpenSource />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
