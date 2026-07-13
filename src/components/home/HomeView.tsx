import './home.css';
import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';

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
    <div className="home">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <Coverage />
        <Why />
        <OpenSource />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ── Header ──────────────────────────────────────────────────────────────── */

function SiteHeader() {
  return (
    <header className="home-hd">
      <Link to="/" className="home-brand" aria-label="OpenNord home">
        Open<span className="home-brand__accent">Nord</span>
      </Link>
      <nav className="home-hd__nav" aria-label="Primary">
        <a className="home-hd__link" href="#features">What it does</a>
        <a className="home-hd__link" href="#coverage">Keyboards</a>
        <a
          className="home-hd__link"
          href="https://github.com/simonflore/opennord"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <Link to="/library/programs" className="on-btn on-btn--primary home-hd__cta">
          Open the app
        </Link>
      </nav>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="home-hero">
      <div className="home-hero__copy">
        <span className="on-overline">Open source · in your browser</span>
        <h1 className="home-hero__title">
          Know your Nord — <span className="home-hero__title-em">without the keyboard.</span>
        </h1>
        <p className="home-hero__sub">
          OpenNord reads your Nord Stage program and preset files right in the
          browser. Browse, understand and organize your patches — no keyboard, no
          Sound Manager, nothing to install.
        </p>
        <div className="home-hero__actions">
          <Link to="/library/programs" className="on-btn on-btn--primary home-hero__btn">
            Open the app
          </Link>
          <a
            className="on-btn on-btn--outline home-hero__btn"
            href="https://github.com/simonflore/opennord"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>
        <p className="home-hero__note">
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
    <div className="home-demo" aria-hidden="true">
      <div className="home-demo__card">
        <div className="home-demo__top">
          <div>
            <div className="home-demo__name">Sunday Grand</div>
            <div className="home-demo__meta">Nord Stage 4 · Piano</div>
          </div>
          <span className="home-demo__badge">A · B</span>
        </div>
        <div className="home-demo__rows">
          <DemoRow k="Piano" v="Grand · Royal Grand XL" />
          <DemoRow k="Organ" v="B3 · perc 3rd" />
          <DemoRow k="Synth" v="Analog saw · unison" />
          <DemoRow k="Effects" v="Delay · Reverb Hall" />
        </div>
        <div className="home-demo__foot">
          <span className="home-demo__tag">Read locally</span>
          <span className="home-demo__tag">No upload</span>
        </div>
      </div>
    </div>
  );
}

function DemoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="home-demo__row">
      <span className="home-demo__k">{k}</span>
      <span className="home-demo__v">{v}</span>
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
    title: 'Convert & import',
    body: 'Convert samples across Nord generations, import your own WAVs, and export anything — your imports become a local sample library.',
  },
  {
    icon: <IconUsb />,
    title: 'Talk to your Nord',
    body: 'On desktop and iPad, pull programs off the keyboard and write them back over USB — a hardware-validated transfer path. Back up your instrument first.',
  },
  {
    icon: <IconLock />,
    title: 'Private by design',
    body: 'Everything runs in your browser. Your files are read on your own device — nothing is uploaded, and there’s no tracking.',
  },
];

function Features() {
  return (
    <section id="features" className="home-sec">
      <SectionHead
        overline="What it does"
        title="One companion for your patches and your keyboard"
        sub="Two equal front doors: understand and organize your sounds, and manage the instrument itself."
      />
      <div className="home-grid">
        {FEATURES.map((f) => (
          <div className="home-feat" key={f.title}>
            <div className="home-feat__icon" aria-hidden="true">{f.icon}</div>
            <div className="home-feat__title">{f.title}</div>
            <p className="home-feat__body">{f.body}</p>
          </div>
        ))}
      </div>
      <p className="home-roadmap">
        <span className="home-roadmap__tag">On the roadmap</span>
        Community patch sharing and AI-assisted search &amp; explanations are
        designed — not shipped yet.
      </p>
    </section>
  );
}

/* ── Coverage ────────────────────────────────────────────────────────────── */

const READS_TODAY = ['Nord Stage 4', 'Nord Stage 3', 'Nord Stage 2'];
const MAPPED_NEXT = ['Nord Electro', 'Nord Piano', 'Nord Lead', 'Nord Wave'];

function Coverage() {
  return (
    <section id="coverage" className="home-sec">
      <SectionHead
        overline="Built for the whole line"
        title="The Nord Stage series first — the rest of the family next"
        sub="Every Nord generation shares one file container, so OpenNord grows across the line one model at a time."
      />
      <div className="home-cov">
        <div className="home-cov__group">
          <div className="home-cov__label">Reads today</div>
          <div className="home-cov__chips">
            {READS_TODAY.map((m) => (
              <span className="home-chip home-chip--on" key={m}>{m}</span>
            ))}
          </div>
        </div>
        <div className="home-cov__group">
          <div className="home-cov__label">Mapped &amp; next</div>
          <div className="home-cov__chips">
            {MAPPED_NEXT.map((m) => (
              <span className="home-chip" key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Why ─────────────────────────────────────────────────────────────────── */

function Why() {
  return (
    <section className="home-sec">
      <SectionHead
        overline="Why it exists"
        title="Community knowledge, given a lasting home"
        sub="Everything that makes OpenNord possible was figured out by the community, in the open. This gives that work a place that outlives any one person."
      />
      <div className="home-why">
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
    <div className="home-why__item">
      <div className="home-why__n">{n}</div>
      <div>
        <div className="home-why__title">{title}</div>
        <p className="home-why__body">{body}</p>
      </div>
    </div>
  );
}

/* ── Open source CTA ─────────────────────────────────────────────────────── */

function OpenSource() {
  return (
    <section className="home-sec">
      <div className="home-os">
        <span className="on-overline">Open source</span>
        <h2 className="home-os__title">Built in the open, licensed AGPL-3.0</h2>
        <p className="home-os__sub">
          OpenNord is free software, developed in public. Try it, read the code,
          file an issue, or help decode the next model in the family.
        </p>
        <div className="home-os__actions">
          <Link to="/library/programs" className="on-btn on-btn--primary home-hero__btn">
            Open the app
          </Link>
          <a
            className="on-btn on-btn--secondary home-hero__btn"
            href="https://github.com/simonflore/opennord"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contribute on GitHub
          </a>
          <a
            className="bmc-btn"
            href="https://buymeacoffee.com/simonflore"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy me a coffee on Buy Me a Coffee"
          >
            <span className="bmc-btn__icon" aria-hidden="true">☕</span>
            Buy me a coffee
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────────────────── */

function SiteFooter() {
  return (
    <footer className="home-ft">
      <div className="home-ft__cols">
        <div className="home-ft__brand-col">
          <div className="home-brand">
            Open<span className="home-brand__accent">Nord</span>
          </div>
          <p className="home-ft__tagline">
            An open companion for Nord® keyboards.
          </p>
        </div>
        <nav className="home-ft__links" aria-label="Footer">
          <Link to="/library/programs" className="home-ft__link">Open the app</Link>
          <Link to="/about" className="home-ft__link">About &amp; legal</Link>
          <a
            className="home-ft__link"
            href="https://github.com/simonflore/opennord"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
      <p className="home-ft__legal">
        OpenNord is an independent, community-built project. It is{' '}
        <strong>not affiliated with, endorsed by, or connected to Clavia DMI AB or
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
    <div className="home-sec__head">
      <span className="on-overline">{overline}</span>
      <h2 className="home-sec__title">{title}</h2>
      <p className="home-sec__sub">{sub}</p>
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

function IconLock() {
  return (
    <svg {...svgProps()}>
      <rect x="4.5" y="10" width="15" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v2" />
    </svg>
  );
}
