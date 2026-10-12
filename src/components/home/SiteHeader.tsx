import { Link } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui';
import { cn } from '@/lib/cn';
import { CONTENT, scrollToSection } from './layout';
import { Wordmark } from '../shell/Wordmark';

const navLink = cn(
  'font-mono text-xs lowercase text-dim no-underline',
  'transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)] hover:text-ink',
  'max-[720px]:hidden',
);

/** `sections`: the links to the landing page's own sections, which only exist on that page. */
export function SiteHeader({ sections = true }: { sections?: boolean } = {}) {
  return (
    <header className={cn(CONTENT, 'flex items-center justify-between gap-4 py-4')}>
      <Link to="/" className="no-underline" aria-label="OpenNord home">
        <Wordmark className="text-lg" />
      </Link>
      <nav className="flex items-center gap-6 max-[720px]:gap-3" aria-label="Primary">
        {sections && (
          <>
            <a className={navLink} href="#features" onClick={scrollToSection('features')}>What it does</a>
            <a className={navLink} href="#coverage" onClick={scrollToSection('coverage')}>Keyboards</a>
            <a className={navLink} href="#download" onClick={scrollToSection('download')}>Download</a>
          </>
        )}
        <Link to="/manifesto" className={navLink}>Manifesto</Link>
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
