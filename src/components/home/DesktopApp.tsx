import type { ReactElement } from 'react';
import { cn } from '@/lib/cn';
import { SEC } from './layout';
import { SectionHead } from './SectionHead';
import { heroBtn, listGrid, listHead, listRule, roadmapTag, covLink } from './styles';
import { IconMac, IconWindows } from './icons';

/**
 * Desktop-app download. The desktop build talks to any Nord over USB with no
 * browser, and additionally reaches the pre-WinUSB models (product id < 0x0024,
 * e.g. the Stage 2) a browser can't claim.
 *
 * The links follow the newest published desktop release: its asset names carry
 * no version (electron/README.md, "Releasing"), so nothing here changes when a
 * new build ships. Both builds update themselves once installed.
 */
const RELEASE_BASE = 'https://github.com/simonflore/opennord/releases';
const RELEASE_PAGE = `${RELEASE_BASE}/latest`;

const BUILDS: { name: string; detail: string; href: string; icon: () => ReactElement }[] = [
  { name: 'Windows', detail: 'x64', href: `${RELEASE_BASE}/latest/download/OpenNord-win-x64.exe`, icon: IconWindows },
  { name: 'macOS', detail: 'universal', href: `${RELEASE_BASE}/latest/download/OpenNord-mac.dmg`, icon: IconMac },
];

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
        sub="A native app for Windows and macOS: the same app, with a direct line to the keyboard."
      />
      <div className={listGrid}>
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
              <span className={roadmapTag}>Beta</span>
              <a className={cn(heroBtn, 'ml-auto')} href={href} aria-label={`Download for ${name}`}>
                Download
              </a>
            </div>
          ))}
          <p className="mt-3 text-xs leading-[1.55] text-muted">
            Needs Windows 10 or macOS 13, or newer. On Windows, older Nords need
            one setup step, the UsbDk driver, and the installer shows a
            SmartScreen notice the first time.{' '}
            <a className={covLink} href={RELEASE_PAGE} target="_blank" rel="noopener noreferrer">
              Release notes
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
