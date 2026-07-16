import './home.css';
import { buttonVariants, SectionLabel } from '@/components/ui';
import { SEC } from './layout';
import { heroBtn, roadmapTag, covLink } from './styles';
import { IconApple, IconWindows } from './icons';

/**
 * Desktop-app download targets. The desktop build is published as a GitHub
 * (pre-)release; these are the direct asset URLs for the current version plus
 * the release page (which carries the first-launch / driver setup notes). URLs
 * are version-pinned by design — bump them when a new desktop build ships.
 */
const DESKTOP_VERSION = '0.0.1';
const RELEASE_BASE = 'https://github.com/simonflore/opennord/releases';
const DOWNLOAD_MAC = `${RELEASE_BASE}/download/v${DESKTOP_VERSION}/OpenNord-${DESKTOP_VERSION}-mac-arm64.zip`;
const DOWNLOAD_WIN = `${RELEASE_BASE}/download/v${DESKTOP_VERSION}/OpenNord-${DESKTOP_VERSION}-win.zip`;
const RELEASE_PAGE = `${RELEASE_BASE}/tag/v${DESKTOP_VERSION}`;

/**
 * The desktop app is a general download, not an "older Nords only" fallback:
 * it talks to any Nord over USB without a browser, and additionally reaches the
 * pre-WinUSB models a browser can't claim. Direct per-platform links; the
 * release page (RELEASE_PAGE) carries the first-launch / driver setup notes.
 */
const archLabel = 'text-[10px] font-semibold uppercase tracking-[0.4px] text-[color-mix(in_srgb,currentColor_65%,transparent)]';

export function DesktopApp() {
  return (
    <section id="download" className={SEC}>
      {/* home-dl-glow: the one-off corner glow behind the panel — see home.css. */}
      <div className="home-dl-glow rounded-lg border border-line p-[clamp(24px,4vw,44px)] edge-hi">
        <div className="max-w-[60ch]">
          <SectionLabel>Desktop app</SectionLabel>
          <h2 className="m-0 mt-2 font-bold leading-[1.2] text-ink text-[clamp(20px,3vw,28px)]">
            Talk to your Nord from the desktop
          </h2>
          <p className="mt-2 text-sm leading-[1.6] text-dim">
            A native build for macOS and Windows — connect over USB with no
            browser, and reach older pre-WinUSB Nords a browser can’t. Everything
            the web app does works here too.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a className={heroBtn} href={DOWNLOAD_MAC} rel="noopener noreferrer">
              <span className="inline-flex items-center" aria-hidden="true"><IconApple /></span>
              macOS
              <span className={archLabel}>Apple Silicon</span>
            </a>
            <a className={buttonVariants({ variant: 'secondary', size: 'lg' })} href={DOWNLOAD_WIN} rel="noopener noreferrer">
              <span className="inline-flex items-center" aria-hidden="true"><IconWindows /></span>
              Windows
              <span className={archLabel}>x64</span>
            </a>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-xs leading-[1.55] text-muted">
            <span className={roadmapTag}>Alpha</span>
            First launch needs a quick step (Gatekeeper on macOS, the UsbDk driver
            for older Nords on Windows) —{' '}
            <a className={covLink} href={RELEASE_PAGE} target="_blank" rel="noopener noreferrer">
              setup notes &amp; all downloads
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
