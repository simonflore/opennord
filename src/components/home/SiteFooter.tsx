import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/cn';
import { GigmeisterFooterNote } from '@/components/sibling/Gigmeister';
import { CONTENT } from './layout';
import { Wordmark } from '../shell/Wordmark';

const footerLink = 'text-xs font-semibold text-dim no-underline transition-colors duration-[120ms] ease-[cubic-bezier(.2,.6,.2,1)] hover:text-ink';

export function SiteFooter() {
  return (
    <footer className={cn(CONTENT, 'mt-6 border-t border-line py-6')}>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <Wordmark className="text-lg" />
          <p className="mt-2 max-w-[20rem] text-[13px] leading-[1.55] text-dim">
            An open companion for Nord® keyboards.
          </p>
          {/* Copy lives in components/sibling/Gigmeister.tsx with every other
              mention, so the surfaces can't drift apart. */}
          <GigmeisterFooterNote className="mt-3 max-w-[22rem]" />
        </div>
        <nav className="flex flex-wrap gap-4" aria-label="Footer">
          <Link to="/library/programs" className={footerLink}>Open the app</Link>
          <Link to="/manifesto" className={footerLink}>Manifesto</Link>
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
        warranty. Beta — features may change or break.
      </p>
    </footer>
  );
}
