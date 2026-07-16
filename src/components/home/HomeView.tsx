import { SiteHeader } from './SiteHeader';
import { Hero } from './Hero';
import { Features } from './Features';
import { More } from './More';
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
    <div className="min-h-screen stage-backdrop text-ink">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <More />
        <DesktopApp />
        <Proof />
        <Coverage />
        <Matrix />
        <Why />
        <OpenSource />
      </main>
      <SiteFooter />
    </div>
  );
}
