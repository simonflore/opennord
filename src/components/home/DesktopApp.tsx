import './home.css';
import { SectionLabel } from '@/components/ui';
import { SEC } from './layout';
import { heroBtn, roadmapTag, covLink } from './styles';
import { IconWindows } from './icons';

/**
 * Desktop-app download (Windows). The desktop build talks to any Nord over USB
 * with no browser, and additionally reaches the pre-WinUSB models (product id
 * < 0x0024, e.g. the Stage 2) a browser can't claim.
 *
 * Published as a GitHub (pre-)release; the URLs are version-pinned by design —
 * bump them when a new desktop build ships. Only Windows is offered today: it's
 * the target verified end-to-end by `desktop-win.yml` + `scripts/usb-native-
 * guard.mjs` on a clean Windows runner (the earlier build shipped a host-Mach-O
 * `usb_bindings.node` and died at launch on Windows — never ship an unverified
 * pack). A macOS button can be re-added here once a mac pack is built and
 * verified the same way.
 */
// Dated release, deliberately NOT the old `v0.0.1` asset name: that name is the
// build that crashed at launch, and replacing it in place would leave anyone
// holding the old file unable to tell a stale copy from the fix. A new tag +
// filename makes the working build unambiguous. Bump both when a build ships.
const RELEASE_TAG = 'desktop-win-2026-09-02';
const WIN_ASSET = 'OpenNord-win-x64-2026-09-02.zip';
const RELEASE_BASE = 'https://github.com/simonflore/opennord/releases';
const DOWNLOAD_WIN = `${RELEASE_BASE}/download/${RELEASE_TAG}/${WIN_ASSET}`;
const RELEASE_PAGE = `${RELEASE_BASE}/tag/${RELEASE_TAG}`;

const archLabel = 'text-[10px] font-semibold uppercase tracking-[0.4px] text-[color-mix(in_srgb,currentColor_65%,transparent)]';

export function DesktopApp() {
  return (
    <section id="download" className={SEC}>
      {/* home-dl-glow: the one-off corner glow behind the panel — see home.css. */}
      <div className="home-dl-glow rounded-lg border border-line p-[clamp(24px,4vw,44px)] edge-hi">
        <div className="max-w-[60ch]">
          <SectionLabel variant="eyebrow">Where USB actually works</SectionLabel>
          <h2 className="m-0 mt-2 font-bold leading-[1.2] text-ink text-[clamp(20px,3vw,28px)]">
            Talk to your Nord from the desktop
          </h2>
          <p className="mt-2 text-sm leading-[1.6] text-dim">
            A native Windows build — connect over USB with no browser, and reach
            older pre-WinUSB Nords a browser can’t. Everything the web app does
            works here too.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a className={heroBtn} href={DOWNLOAD_WIN} rel="noopener noreferrer">
              <span className="inline-flex items-center" aria-hidden="true"><IconWindows /></span>
              Windows
              <span className={archLabel}>x64</span>
            </a>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-xs leading-[1.55] text-muted">
            <span className={roadmapTag}>Alpha</span>
            First launch needs a quick step (the UsbDk driver, for reaching older
            Nords) —{' '}
            <a className={covLink} href={RELEASE_PAGE} target="_blank" rel="noopener noreferrer">
              setup notes &amp; download
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
