import { Link } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui';
import { cn } from '@/lib/cn';
import { CONTENT, scrollToSection } from './layout';

const navLink = cn(
  'text-xs font-semibold text-dim no-underline',
  'transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)] hover:text-ink',
  'max-[720px]:hidden',
);

export function SiteHeader() {
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
        {/* No "Download" item while DesktopApp is parked — it would scroll to
            nothing. Restore it with the section (see DesktopApp.tsx). */}
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
