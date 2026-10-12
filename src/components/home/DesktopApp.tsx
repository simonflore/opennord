import { cn } from '@/lib/cn';
import { SEC } from './layout';
import { SectionHead } from './SectionHead';
import { heroBtn, listGrid, listHead, listRule, roadmapTag, covLink } from './styles';
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

// What the desktop build adds over the web app, stated as rows like the
// feature list rather than as marketing copy in a panel.
const ADDS: { title: string; body: string }[] = [
  { title: 'USB with no browser', body: 'Connect, read and write without Chrome or Edge.' },
  { title: 'Older Nords', body: 'Reaches the pre-WinUSB models, like the Stage 2, that a browser can’t claim.' },
  { title: 'The same app', body: 'Everything the web app does works here too.' },
];

export function DesktopApp() {
  return (
    <section id="download" className={SEC}>
      <SectionHead
        overline="Where USB actually works"
        title="Talk to your Nord from the desktop"
        sub="A native Windows build of the same app, with a direct line to the keyboard."
      />
      <div className={listGrid}>
        <div>
          <div className={listHead}>
            <span>Builds</span>
          </div>
          <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 py-4', listRule)}>
            <span className="inline-flex items-center gap-2 text-[15px] font-bold text-ink">
              <IconWindows />
              Windows
              <span className="font-mono text-[11px] font-normal text-muted">x64</span>
            </span>
            <span className={roadmapTag}>Beta</span>
            <a className={cn(heroBtn, 'ml-auto')} href={DOWNLOAD_WIN} aria-label="Download for Windows (x64)">
              Download
            </a>
          </div>
          <p className="mt-3 text-xs leading-[1.55] text-muted">
            First launch needs one setup step, the UsbDk driver, for reaching older
            Nords.{' '}
            <a className={covLink} href={RELEASE_PAGE} target="_blank" rel="noopener noreferrer">
              Setup notes
            </a>
          </p>
        </div>
        <div>
          <div className={listHead}>
            <span>What it adds</span>
            <span className="text-muted">{ADDS.length}</span>
          </div>
          <ul className="m-0 list-none p-0">
            {ADDS.map((a) => (
              <li key={a.title} className={cn('py-3', listRule)}>
                <div className="text-[13px] font-bold text-ink">{a.title}</div>
                <p className="mt-0.5 text-[13px] leading-[1.55] text-dim">{a.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
