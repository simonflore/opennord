import './home.css';
import type { MouseEvent, ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { buttonVariants, SectionLabel, BuyMeACoffeeButton } from '@/components/ui';
import { cn } from '@/lib/cn';

/** Shared max-width content wrapper used by every full-bleed section on the landing page. */
const CONTENT = 'mx-auto max-w-[1080px] px-6';

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
 * Scroll to an in-page section without writing to the URL hash.
 *
 * The app uses hash-based routing (createHashHistory), so a bare
 * `href="#features"` is parsed by the router as the route `/features` — which
 * swaps this full-bleed landing page for the app shell (left rail). We keep the
 * href for accessibility and right-click, but intercept the click and scroll
 * manually so the router's hash is never touched.
 */
function scrollToSection(id: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
}

/**
 * The public landing page — OpenNord's front door at `/`.
 *
 * Rendered full-bleed (outside the app's left rail; see routes/root.tsx) so the
 * initiative has a real marketing surface that explains what OpenNord is and
 * sends people into the app or to the source. Everything here routes through
 * tokens.css (Studio Dark) — no hardcoded color — and speaks the musician's
 * language, not the RE notes (docs/LEGAL.md requires the non-affiliation
 * disclaimer on every surface — it lives in the footer below).
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

/* ── Header ──────────────────────────────────────────────────────────────── */

const navLink = cn(
  'text-xs font-semibold text-dim no-underline',
  'transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)] hover:text-ink',
  'max-[720px]:hidden',
);

function SiteHeader() {
  return (
    <header className={cn(CONTENT, 'flex items-center justify-between gap-4 py-4')}>
      <Link
        to="/"
        className="text-[19px] font-extrabold tracking-[-0.3px] text-ink no-underline"
        aria-label="OpenNord home"
      >
        Open<span className="italic text-red">Nord</span>
      </Link>
      <nav className="flex items-center gap-6 max-[720px]:gap-3" aria-label="Primary">
        <a className={navLink} href="#features" onClick={scrollToSection('features')}>What it does</a>
        <a className={navLink} href="#coverage" onClick={scrollToSection('coverage')}>Keyboards</a>
        <a className={navLink} href="#download" onClick={scrollToSection('download')}>Download</a>
        <a
          className={navLink}
          href="https://github.com/simonflore/opennord"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <Link to="/library/programs" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
          Open the app
        </Link>
      </nav>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────────── */

const heroBtn = buttonVariants({ variant: 'primary', size: 'lg' });

function Hero() {
  return (
    <section
      className={cn(
        CONTENT,
        'grid grid-cols-[1.05fr_0.95fr] items-center gap-6 py-[clamp(24px,8vw,88px)]',
        'max-[860px]:grid-cols-1 max-[860px]:py-6',
      )}
    >
      <div>
        <SectionLabel>Open source · in your browser</SectionLabel>
        <h1 className="m-0 mt-3 font-extrabold leading-[1.05] tracking-[-1px] text-ink text-[clamp(30px,5.4vw,52px)]">
          Know your Nord — <span className="text-dim">without the keyboard.</span>
        </h1>
        <p className="mt-4 max-w-[30rem] text-[clamp(14px,1.6vw,17px)] leading-[1.6] text-dim max-[860px]:max-w-none">
          OpenNord reads your Nord Stage program and preset files right in the
          browser. Browse, understand and organize your patches — no keyboard, no
          Sound Manager, nothing to install.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/library/programs" className={heroBtn}>
            Open the app
          </Link>
          <a
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
            href="https://github.com/simonflore/opennord"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>
        <p className="mt-4 text-[11px] font-medium tracking-[0.2px] text-muted">
          Free &amp; open source · runs entirely on your device · works from a file alone
        </p>
      </div>
      <HeroCard />
    </section>
  );
}

/** A stylized "program" card — a taste of what OpenNord shows when you open a file. */
function HeroCard() {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <div className="w-full max-w-[340px] rounded-lg border border-line border-l-[3px] border-l-red fill-surface-accent elev-3 p-4">
        <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <div>
            <div className="text-base font-extrabold text-ink">Sunday Grand</div>
            <div className="mt-0.5 text-[11px] font-medium text-dim">Nord Stage 4 · Piano</div>
          </div>
          <span className="whitespace-nowrap rounded-full fill-raised px-[9px] py-[3px] text-[9px] font-bold tracking-[0.5px] text-text-tertiary edge-hi">
            A · B
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-px">
          <DemoRow k="Piano" v="Grand · Royal Grand XL" />
          <DemoRow k="Organ" v="B3 · perc 3rd" />
          <DemoRow k="Synth" v="Analog saw · unison" />
          <DemoRow k="Effects" v="Delay · Reverb Hall" />
        </div>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full border border-[color-mix(in_srgb,var(--connected)_40%,var(--line))] px-2 py-0.5 text-[9px] font-semibold text-connected">
            Read locally
          </span>
          <span className="rounded-full border border-[color-mix(in_srgb,var(--connected)_40%,var(--line))] px-2 py-0.5 text-[9px] font-semibold text-connected">
            No upload
          </span>
        </div>
      </div>
    </div>
  );
}

function DemoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[color-mix(in_srgb,var(--line)_55%,transparent)] py-[7px]">
      <span className="text-[10px] font-bold uppercase tracking-[0.6px] text-muted">{k}</span>
      <span className="text-right font-mono text-xs font-medium text-ink">{v}</span>
    </div>
  );
}

/* ── Features ────────────────────────────────────────────────────────────── */

const FEATURES: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <IconFile />,
    title: 'Read any program',
    body: 'Drop a Stage 2, 3 or 4 file and see what’s inside — piano, organ, synth and effects, laid out clearly. No hardware required.',
  },
  {
    icon: <IconLibrary />,
    title: 'Organize a library',
    body: 'Point OpenNord at a folder and it builds a searchable, mobile-first library of your patches — Programs, Samples and Presets in one place.',
  },
  {
    icon: <IconWave />,
    title: 'Play your samples',
    body: 'Audition your sample instruments on an on-screen keyboard, or from a MIDI controller — a lightweight rompler with no Nord plugged in.',
  },
  {
    icon: <IconConvert />,
    title: 'Convert & export',
    body: 'Convert sample instruments across Nord generations — even the downconverts the official editor won’t do — and export any sample to WAV or a zip.',
  },
  {
    icon: <IconUsb />,
    title: 'Transfer over USB',
    body: 'On a computer with Chrome or Edge, pull programs off your Nord and write them back — a transfer path proven live on real hardware. Back up first.',
  },
  {
    icon: <IconBackup />,
    title: 'Back up & restore',
    body: 'Save your whole keyboard to a single file, then restore it with a preview of exactly what will change — a safety net before you experiment.',
  },
];

const SEC = cn(CONTENT, 'py-[clamp(24px,6vw,72px)]');
const SEC_TIGHT = cn(CONTENT, 'py-[clamp(16px,3vw,32px)]');
const iconTile = 'mb-3 inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[color-mix(in_srgb,var(--red)_22%,var(--line))] bg-[color-mix(in_srgb,var(--red)_12%,transparent)] text-red-bright';

function Features() {
  return (
    <section id="features" className={SEC}>
      <SectionHead
        overline="What it does"
        title="One companion for your patches and your keyboard"
        sub="Two equal front doors: understand and organize your sounds, and manage the instrument itself."
      />
      <div className="grid grid-cols-3 gap-4 max-[860px]:grid-cols-2 max-[560px]:grid-cols-1">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className={cn(
              'rounded-md border border-line fill-surface elev-1 p-4',
              'transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(.2,.6,.2,1)]',
              'hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--red)_40%,var(--line))] hover:elev-2',
            )}
          >
            <div className={iconTile} aria-hidden="true">{f.icon}</div>
            <div className="text-[15px] font-bold text-ink">{f.title}</div>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-dim">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── More (secondary, still-shipped capabilities) ────────────────────────── */

const MORE: { icon: ReactNode; title: string; body: string; to?: string }[] = [
  {
    icon: <IconSearch />,
    title: 'Check my Nord',
    body: 'Connect over USB for a safe, read-only look at what’s on your keyboard — and exactly what OpenNord supports for it.',
    to: '/compatibility',
  },
  {
    icon: <IconDownload />,
    title: 'Find missing samples',
    body: 'When a program needs factory samples you don’t have, OpenNord points you straight to the official Nord downloads.',
  },
  {
    icon: <IconDesktop />,
    title: 'Reach older Nords',
    body: 'A desktop build talks to pre-WinUSB instruments — Stage 2-era Nords a browser can’t claim over USB.',
  },
];

const roadmapTag = 'rounded-full border border-[color-mix(in_srgb,var(--warn)_45%,var(--line))] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[1px] text-warn';
const moreItem = 'flex items-start gap-3 rounded-md border border-transparent p-3 text-inherit no-underline';
const moreItemLink = cn(
  moreItem,
  'transition-[border-color,background] duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)]',
  'hover:border-[color-mix(in_srgb,var(--red)_40%,var(--line))] hover:bg-[color-mix(in_srgb,var(--lift)_3%,transparent)]',
);

function More() {
  return (
    <section className={SEC_TIGHT}>
      <SectionLabel>Also in the app</SectionLabel>
      <div className="mt-3 grid grid-cols-3 gap-4 max-[860px]:grid-cols-1 max-[860px]:gap-3">
        {MORE.map((m) => {
          const inner = (
            <>
              <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-sm border border-line fill-raised text-ink edge-hi" aria-hidden="true">
                {m.icon}
              </div>
              <div>
                <div className="text-[13px] font-bold text-ink">{m.title}</div>
                <p className="mt-1 text-xs leading-[1.55] text-dim">{m.body}</p>
              </div>
            </>
          );
          return m.to ? (
            <Link to={m.to} className={moreItemLink} key={m.title}>
              {inner}
            </Link>
          ) : (
            <div className={moreItem} key={m.title}>{inner}</div>
          );
        })}
      </div>
      <p className="mt-4 flex flex-wrap items-center gap-2 text-xs leading-[1.5] text-muted">
        <span className={roadmapTag}>On the roadmap</span>
        Community patch sharing, AI-assisted search &amp; explanations, and USB
        transfer on iPad are designed — not shipped yet.
      </p>
    </section>
  );
}

/* ── Desktop app download ────────────────────────────────────────────────── */

/**
 * The desktop app is a general download, not an "older Nords only" fallback:
 * it talks to any Nord over USB without a browser, and additionally reaches the
 * pre-WinUSB models a browser can't claim. Direct per-platform links; the
 * release page (RELEASE_PAGE) carries the first-launch / driver setup notes.
 */
const covLink = 'whitespace-nowrap text-xs font-semibold text-red-bright no-underline transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)] hover:text-red';
const archLabel = 'text-[10px] font-semibold uppercase tracking-[0.4px] text-[color-mix(in_srgb,currentColor_65%,transparent)]';

function DesktopApp() {
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

/* ── Proof ───────────────────────────────────────────────────────────────── */

const PROOF: { icon: ReactNode; lead: string; body: string }[] = [
  {
    icon: <IconCheck />,
    lead: 'Matched, not guessed',
    body: 'Stage 4 programs are validated field-for-field against real exports from the keyboard — nothing invented.',
  },
  {
    icon: <IconUsb />,
    lead: 'Proven on hardware',
    body: 'Reading and writing over USB is tested live — enumerate, read and write, on a real Nord Stage 4.',
  },
  {
    icon: <IconLock />,
    lead: 'Stays on your device',
    body: 'Your files are read locally in your browser. No upload, no account, no tracking, no server.',
  },
];

function Proof() {
  return (
    <section className={SEC_TIGHT}>
      <div className="grid grid-cols-3 gap-4 rounded-lg border border-line fill-raised elev-1 p-6 px-4 max-[860px]:grid-cols-1">
        {PROOF.map((p) => (
          <div className="flex items-start gap-3" key={p.lead}>
            <div className={cn(iconTile, 'mb-0 h-[34px] w-[34px] flex-none')} aria-hidden="true">{p.icon}</div>
            <div>
              <div className="text-[13px] font-bold text-ink">{p.lead}</div>
              <p className="mt-1 text-xs leading-[1.55] text-dim">{p.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Coverage ────────────────────────────────────────────────────────────── */

const READS_TODAY = ['Nord Stage 4', 'Nord Stage 3', 'Nord Stage 2'];
const MAPPED_NEXT = ['Nord Electro', 'Nord Piano', 'Nord Lead', 'Nord Wave'];

const covChip = 'rounded-full border border-line fill-raised px-[13px] py-1.5 text-xs font-semibold text-text-tertiary edge-hi';
const covChipOn = 'text-ink border-[color-mix(in_srgb,var(--red)_45%,var(--line))]';

function Coverage() {
  return (
    <section id="coverage" className={SEC}>
      <SectionHead
        overline="Built for the whole line"
        title="The Nord Stage series first — the rest of the family next"
        sub="Every Nord generation shares one file container, so OpenNord grows across the line one model at a time."
      />
      <div className="flex flex-wrap gap-6">
        <div className="flex-1 min-w-[240px] rounded-md border border-line fill-surface elev-1 p-4">
          <div className="mb-3 text-[9px] font-bold uppercase tracking-[1.4px] text-muted">Reads today</div>
          <div className="flex flex-wrap gap-2">
            {READS_TODAY.map((m) => (
              <span className={cn(covChip, covChipOn)} key={m}>{m}</span>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-[240px] rounded-md border border-line fill-surface elev-1 p-4">
          <div className="mb-3 text-[9px] font-bold uppercase tracking-[1.4px] text-muted">Mapped &amp; next</div>
          <div className="flex flex-wrap gap-2">
            {MAPPED_NEXT.map((m) => (
              <span className={covChip} key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Compatibility matrix ────────────────────────────────────────────────── */

// Status codes mirror src/lib/clavia/validation.ts. Only Stage 4 is
// hardware-validated; everything else is reverse-engineered (works in the app,
// not yet checked on the instrument) or inferred from a sibling model. The
// live, per-model source of truth is the in-app /compatibility matrix.
type Cell = 'v' | 're' | 'inf' | 'na';

const MATRIX_COLS = ['Read', 'Transfer', 'Back up', 'Samples'] as const;

const MATRIX: { model: string; cells: Cell[] }[] = [
  { model: 'Nord Stage 4', cells: ['v', 'v', 'v', 'v'] },
  { model: 'Nord Stage 3', cells: ['re', 're', 're', 're'] },
  { model: 'Nord Stage 2', cells: ['re', 're', 're', 're'] },
  { model: 'Nord Electro 6', cells: ['re', 'inf', 'inf', 're'] },
  { model: 'Nord Piano 5', cells: ['re', 'inf', 'inf', 're'] },
  { model: 'Nord Grand 2', cells: ['re', 'inf', 'inf', 're'] },
  { model: 'Nord Wave 2', cells: ['re', 'inf', 're', 're'] },
  { model: 'Nord Lead 4', cells: ['re', 'inf', 're', 'na'] },
];

const cellBase = 'inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs leading-none';
const CELL_META: Record<Cell, { glyph: string; label: string; cls: string }> = {
  v: { glyph: '✓', label: 'Validated on hardware', cls: 'text-connected bg-[color-mix(in_srgb,var(--connected)_15%,transparent)]' },
  re: { glyph: '●', label: 'Reverse-engineered — works in the app, not yet hardware-tested', cls: 'text-red-bright bg-[color-mix(in_srgb,var(--red)_15%,transparent)]' },
  inf: { glyph: '○', label: 'Inferred — likely, needs a tester', cls: 'text-dim bg-[color-mix(in_srgb,var(--lift)_6%,transparent)]' },
  na: { glyph: '–', label: 'Not applicable', cls: 'text-muted bg-transparent' },
};

function Matrix() {
  return (
    <section className={SEC}>
      <SectionHead
        overline="Honest by model"
        title="What works on which Nord"
        sub="Only the Stage 4 is validated on real hardware; the rest is reverse-engineered and gets promoted as owners test it. Nothing here is dressed up."
      />
      <div className="overflow-x-auto rounded-md border border-line fill-surface elev-1">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr>
              <th className="border-b border-line px-3 py-[11px] text-left text-[9px] font-bold uppercase tracking-[1px] text-muted" scope="col">Model</th>
              {MATRIX_COLS.map((c) => (
                <th
                  key={c}
                  className="border-b border-line px-3 py-[11px] text-center text-[9px] font-bold uppercase tracking-[1px] text-muted"
                  scope="col"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((row, ri) => {
              const last = ri === MATRIX.length - 1;
              return (
                <tr key={row.model}>
                  <th
                    className={cn(
                      'whitespace-nowrap px-3 py-[11px] text-left text-xs font-semibold text-ink',
                      !last && 'border-b border-[color-mix(in_srgb,var(--line)_55%,transparent)]',
                    )}
                    scope="row"
                  >
                    {row.model}
                  </th>
                  {row.cells.map((cell, i) => {
                    const meta = CELL_META[cell];
                    return (
                      <td
                        key={MATRIX_COLS[i]}
                        className={cn(
                          'px-3 py-[11px] text-center',
                          !last && 'border-b border-[color-mix(in_srgb,var(--line)_55%,transparent)]',
                        )}
                      >
                        <span
                          className={cn(cellBase, meta.cls)}
                          title={meta.label}
                          aria-label={`${MATRIX_COLS[i]}: ${meta.label}`}
                        >
                          {meta.glyph}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ul className="m-0 flex flex-wrap gap-4 p-0 list-none">
          <li className="inline-flex items-center gap-1.5 text-[11px] font-medium text-dim">
            <span className={cn(cellBase, 'h-[18px] w-[18px] text-[10px]', CELL_META.v.cls)}>✓</span> Validated on hardware
          </li>
          <li className="inline-flex items-center gap-1.5 text-[11px] font-medium text-dim">
            <span className={cn(cellBase, 'h-[18px] w-[18px] text-[10px]', CELL_META.re.cls)}>●</span> Reverse-engineered
          </li>
          <li className="inline-flex items-center gap-1.5 text-[11px] font-medium text-dim">
            <span className={cn(cellBase, 'h-[18px] w-[18px] text-[10px]', CELL_META.inf.cls)}>○</span> Likely · needs a tester
          </li>
          <li className="inline-flex items-center gap-1.5 text-[11px] font-medium text-dim">
            <span className={cn(cellBase, 'h-[18px] w-[18px] text-[10px]', CELL_META.na.cls)}>–</span> N/A
          </li>
        </ul>
        <Link to="/compatibility" className={covLink}>
          Open the live, per-model matrix →
        </Link>
      </div>
    </section>
  );
}

/* ── Why ─────────────────────────────────────────────────────────────────── */

function Why() {
  return (
    <section className={SEC}>
      <SectionHead
        overline="Why it exists"
        title="Community knowledge, given a lasting home"
        sub="Everything that makes OpenNord possible was figured out by the community, in the open. This gives that work a place that outlives any one person."
      />
      <div className="grid grid-cols-3 gap-6 max-[860px]:grid-cols-1 max-[860px]:gap-4">
        <WhyItem
          n="01"
          title="Traceable, not guessed"
          body="Every setting OpenNord shows is derived from real files and validated against actual hardware — accurate today and re-derivable tomorrow."
        />
        <WhyItem
          n="02"
          title="Works from a file alone"
          body="Reading, organizing and playing your patches all work without a keyboard connected. Device transfer is a bonus, never a requirement."
        />
        <WhyItem
          n="03"
          title="Your work stays yours"
          body="Programs describe your own settings and point to samples by name — OpenNord never copies Nord’s factory sounds. Your creative work stays yours."
        />
      </div>
    </section>
  );
}

function WhyItem({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="pt-0.5 font-mono text-[13px] font-extrabold text-red">{n}</div>
      <div>
        <div className="text-[15px] font-bold text-ink">{title}</div>
        <p className="mt-1.5 text-[13px] leading-[1.6] text-dim">{body}</p>
      </div>
    </div>
  );
}

/* ── Open source CTA ─────────────────────────────────────────────────────── */

function OpenSource() {
  return (
    <section className={SEC}>
      <div className="rounded-lg border border-line fill-raised elev-2 px-4 py-[clamp(24px,5vw,56px)] text-center">
        <SectionLabel>Open source</SectionLabel>
        <h2 className="m-0 mt-2 font-extrabold leading-[1.15] tracking-[-0.6px] text-ink text-[clamp(22px,3.4vw,30px)]">
          Built in the open, licensed AGPL-3.0
        </h2>
        <p className="mx-auto mt-3 max-w-[34rem] text-[15px] leading-[1.6] text-dim">
          OpenNord is free software, developed in public. Try it, read the code,
          file an issue, or help decode the next model in the family.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/library/programs" className={heroBtn}>
            Open the app
          </Link>
          <a
            className={buttonVariants({ variant: 'secondary', size: 'lg' })}
            href="https://github.com/simonflore/opennord"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contribute on GitHub
          </a>
          <BuyMeACoffeeButton />
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────────────────── */

const footerLink = 'text-xs font-semibold text-dim no-underline transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)] hover:text-ink';

function SiteFooter() {
  return (
    <footer className={cn(CONTENT, 'mt-6 border-t border-line py-6')}>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="text-[19px] font-extrabold tracking-[-0.3px] text-ink">
            Open<span className="italic text-red">Nord</span>
          </div>
          <p className="mt-2 max-w-[20rem] text-[13px] leading-[1.55] text-dim">
            An open companion for Nord® keyboards.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4" aria-label="Footer">
          <Link to="/library/programs" className={footerLink}>Open the app</Link>
          <Link to="/about" className={footerLink}>About &amp; legal</Link>
          <a
            className={footerLink}
            href="https://github.com/simonflore/opennord"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
      <p className="mt-6 text-[11px] leading-[1.6] text-muted">
        OpenNord is an independent, community-built project. It is{' '}
        <strong className="font-semibold text-dim">not affiliated with, endorsed by, or connected to Clavia DMI AB or
        Nord Keyboards.</strong> “Nord”, “Nord Stage” and related names are
        trademarks of their owner, used here only to describe compatibility.
        Free software under the GNU AGPL-3.0-or-later, provided as-is without
        warranty. Early alpha — features may change or break.
      </p>
    </footer>
  );
}

/* ── Shared ──────────────────────────────────────────────────────────────── */

function SectionHead({ overline, title, sub }: { overline: string; title: string; sub: string }) {
  return (
    <div className="mb-6 max-w-[40rem]">
      <SectionLabel>{overline}</SectionLabel>
      <h2 className="m-0 mt-2 font-extrabold leading-[1.15] tracking-[-0.6px] text-ink text-[clamp(22px,3.4vw,32px)]">
        {title}
      </h2>
      <p className="mt-3 text-[15px] leading-[1.6] text-dim">{sub}</p>
    </div>
  );
}

/* ── Icons (line, currentColor — premium over emoji) ─────────────────────── */

function svgProps() {
  return {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

function IconFile() {
  return (
    <svg {...svgProps()}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

function IconLibrary() {
  return (
    <svg {...svgProps()}>
      <rect x="3" y="4" width="7" height="16" rx="1" />
      <rect x="14" y="4" width="7" height="16" rx="1" />
      <path d="M6.5 8h0M17.5 8h0" />
    </svg>
  );
}

function IconWave() {
  return (
    <svg {...svgProps()}>
      <path d="M3 12h2l2-6 3 14 3-16 3 12 2-4h3" />
    </svg>
  );
}

function IconUsb() {
  return (
    <svg {...svgProps()}>
      <circle cx="12" cy="19" r="2" />
      <path d="M12 17V5" />
      <path d="M9 8l3-3 3 3" />
      <path d="M12 12l4-2v-2" />
      <circle cx="16" cy="8" r="1" />
      <path d="M12 14l-4-2V9" />
      <rect x="6.5" y="7" width="3" height="2.4" rx="0.4" />
    </svg>
  );
}

function IconConvert() {
  return (
    <svg {...svgProps()}>
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </svg>
  );
}

function IconBackup() {
  return (
    <svg {...svgProps()}>
      <path d="M12 3l7 3v5c0 4-3 6.5-7 8-4-1.5-7-4-7-8V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg {...svgProps()}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg {...svgProps()}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg {...svgProps()}>
      <path d="M12 4v11" />
      <path d="M8 11l4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

function IconDesktop() {
  return (
    <svg {...svgProps()}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg {...svgProps()}>
      <rect x="4.5" y="10" width="15" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2" />
    </svg>
  );
}

/** Filled glyphs for the download buttons (brand marks, not line icons). */
function IconApple() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2-.05 1.6-.75 3-.75s1.8.75 3 .72c1.2-.02 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.03-.01-2.4-.9-2.4-3.6zM14.3 5.9c.65-.8 1.1-1.9.95-3-1 .04-2.2.66-2.9 1.46-.6.7-1.15 1.83-1 2.9 1.1.08 2.3-.56 2.95-1.36z" />
    </svg>
  );
}

function IconWindows() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 5.5 10.5 4.4v7.1H3zM11.5 4.3 21 3v8.5h-9.5zM3 12.5h7.5v7.1L3 18.5zM11.5 12.5H21V21l-9.5-1.3z" />
    </svg>
  );
}
