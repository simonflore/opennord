import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/cn';
import { SiteHeader } from '../home/SiteHeader';
import { SiteFooter } from '../home/SiteFooter';
import { CONTENT } from '../home/layout';
import { heroBtn } from '../home/styles';
import { inline, parseBlocks } from './markdown';
// The text itself: one file, shown here and in the repository.
import manifesto from '../../../MANIFESTO.md?raw';

const BLOCKS = parseBlocks(manifesto);
const strong = 'font-semibold text-ink';

/** The manifesto as a page of the site (`/manifesto`): full-bleed like the landing page. */
export function ManifestoView() {
  return (
    <div className="relative min-h-screen overflow-x-clip stage-backdrop text-ink">
      <SiteHeader sections={false} />
      <main className={cn(CONTENT, 'py-[clamp(32px,6vw,80px)]')}>
        <article className="mx-auto max-w-[42rem]">
          {BLOCKS.map((b, i) => {
            if (b.kind === 'rule') return <hr key={i} className="my-10 border-0 border-t border-line" />;
            // text-display-2 carries its own weight/leading/tracking (see SectionHead).
            if (b.kind === 'h1') return <h1 key={i} className="m-0 mb-8 text-display-2 text-ink">{b.text}</h1>;
            if (b.kind === 'h2') return <h2 key={i} className="m-0 mb-4 mt-2 text-[clamp(20px,3vw,26px)] font-bold leading-[1.2] text-ink">{b.text}</h2>;
            return <p key={i} className="my-4 text-[16px] leading-[1.7] text-dim max-[720px]:text-[15px]">{inline(b.text, strong)}</p>;
          })}
          <div className="mt-10">
            <Link to="/library/programs" className={heroBtn}>Open the app</Link>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
