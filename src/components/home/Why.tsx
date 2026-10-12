import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/cn';
import { SEC } from './layout';
import { SectionHead } from './SectionHead';
import { covLink, indexedRow, listIndex } from './styles';

// The manifesto's principles, in short (MANIFESTO.md, "What I believe").
const WHY: { title: string; body: string }[] = [
  {
    title: 'The instrument stays sovereign',
    body: 'No app, account or internet connection stands between you and your Nord. OpenNord reads your files and talks to the keyboard when you ask it to. Unplug it and nothing is missing.',
  },
  {
    title: 'Your work stays yours',
    body: 'A program describes your own settings and points to samples by name. OpenNord shares what you made and never copies Nord’s factory sounds.',
  },
  {
    title: 'The knowledge stays open',
    body: 'The file formats and the USB protocol are documented in public, and the code is free software. Every setting OpenNord shows traces back to real files or the instrument’s own software.',
  },
];

export function Why() {
  return (
    <section className={SEC}>
      <SectionHead
        overline="A companion, never a dependency"
        title="Built beside the instrument, not in front of it"
        sub="Your Nord works with nothing plugged into it, and nothing here changes that. OpenNord adds what the instrument can’t do alone."
      />
      {/* Ruled columns with a mono index, like Proof and the feature list. The
          numbers are muted: the accent means selected or active, not "first". */}
      <ol className="m-0 grid list-none grid-cols-3 gap-x-10 p-0 max-[860px]:grid-cols-1">
        {WHY.map((w, i) => (
          <li key={w.title} className={cn(indexedRow, 'border-t border-line')}>
            <span className={listIndex}>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <div className="text-[15px] font-bold text-ink">{w.title}</div>
              <p className="mt-1 text-[13px] leading-[1.55] text-dim">{w.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-xs">
        <Link to="/manifesto" className={covLink}>Read the manifesto →</Link>
      </p>
    </section>
  );
}
