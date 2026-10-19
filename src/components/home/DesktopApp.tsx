import type { ReactElement } from 'react';
import { cn } from '@/lib/cn';
import { SEC } from './layout';
import { SectionHead } from './SectionHead';
import { heroBtn, listHead, listRule, roadmapTag, covLink } from './styles';
import { docsHref } from '../shell/nav';
import { IconMac, IconWindows } from './icons';

/**
 * Desktop-app download. The desktop build talks to any Nord over USB with no
 * browser, and additionally reaches the pre-WinUSB models (product id < 0x0024,
 * e.g. the Stage 2) a browser can't claim.
 *
 * The links follow the newest published desktop release: its asset names carry
 * no version (electron/README.md, "Releasing"), so nothing here changes when a
 * new build ships. Both builds update themselves once installed.
 *
 * {@link RELEASED} is false while no build is published: the rows then say a new
 * build is coming instead of linking to a download that isn't there. Set it back
 * when the next release is out.
 */
export const RELEASED = true;

const RELEASE_BASE = 'https://github.com/simonflore/opennord/releases';
const RELEASE_PAGE = `${RELEASE_BASE}/latest`;

const BUILDS: { name: string; detail: string; href: string; icon: () => ReactElement }[] = [
  { name: 'Windows', detail: 'x64', href: `${RELEASE_BASE}/latest/download/OpenNord-win-x64.exe`, icon: IconWindows },
  { name: 'macOS', detail: 'universal', href: `${RELEASE_BASE}/latest/download/OpenNord-mac.dmg`, icon: IconMac },
];

export function DesktopApp() {
  return (
    <section id="download" className={SEC}>
      <SectionHead
        overline="Windows and macOS"
        title="Desktop app"
        sub="The same app, with USB access that doesn’t need Chrome or Edge. It can also connect to older Nords, like the Stage 2, that a browser can’t."
      />
      <div className="max-w-[34rem]">
        <div>
          <div className={listHead}>
            <span>Builds</span>
          </div>
          {BUILDS.map(({ name, detail, href, icon: Icon }) => (
            <div key={name} className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 py-4', listRule)}>
              <span className="inline-flex items-center gap-2 text-[15px] font-bold text-ink">
                <Icon />
                {name}
                {/* Dropped at phone width, where it would push the button onto its own line. */}
                <span className="font-mono text-[11px] font-normal text-muted max-[430px]:hidden">{detail}</span>
              </span>
              <span className={cn(roadmapTag, !RELEASED && 'ml-auto')}>{RELEASED ? 'Beta' : 'Coming soon'}</span>
              {RELEASED && (
                <a className={cn(heroBtn, 'ml-auto')} href={href} aria-label={`Download for ${name}`}>
                  Download
                </a>
              )}
            </div>
          ))}
          <p className="mt-3 text-xs leading-[1.55] text-muted">
            {!RELEASED && 'A new build is on the way; until then, the web app does everything but the older Nords. '}
            Needs Windows 10 or macOS 13, or newer. On Windows, older Nords need
            one setup step, the UsbDk driver, and the installer shows a
            SmartScreen notice the first time.
            {RELEASED && (
              <>
                {' '}
                <a className={covLink} href={RELEASE_PAGE} target="_blank" rel="noopener noreferrer">
                  Release notes
                </a>
              </>
            )}
            {RELEASED ? ' · ' : ' '}
            <a className={covLink} href={docsHref('start/platforms/')}>Requirements and setup →</a>
          </p>
        </div>
      </div>
    </section>
  );
}
