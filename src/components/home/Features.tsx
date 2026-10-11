import { Link } from '@tanstack/react-router';
import { SEC } from './layout';
import { roadmapTag } from './styles';
import { SectionHead } from './SectionHead';

interface Feature { title: string; body: string; to?: string }

// The two front doors, side by side, so the page states the claim instead of
// listing cards: everything you can do with your sounds, and with the instrument.
const DOORS: { label: string; items: Feature[] }[] = [
  {
    label: 'Your patches',
    items: [
      { title: 'Read any program', body: 'Drop a Stage 2, 3 or 4 file and see what’s inside — piano, organ, synth and effects, laid out the way the panel is. No hardware required.' },
      { title: 'Organize a library', body: 'Point OpenNord at a folder and it builds a searchable library of your Programs, Samples and Presets, with the keyboard split on every row.' },
      { title: 'Play your samples', body: 'Audition sample instruments on an on-screen keyboard or from a MIDI controller — a lightweight rompler with no Nord plugged in.' },
      { title: 'Convert & export', body: 'Move sample instruments across Nord generations — even the downconverts the official editor won’t do — and export any sample to WAV.' },
      { title: 'Bring older patches to Stage 4', body: 'Turn a Stage 2 or 3 program into a loadable Stage 4 file, with a plain-language report of what carried over, what’s a close match and what to re-pick. Nothing is dropped silently.' },
    ],
  },
  {
    label: 'Your keyboard',
    items: [
      { title: 'Transfer over USB', body: 'On a computer with Chrome or Edge, pull programs off your Nord and write them back — proven live on real hardware. Back up first.' },
      { title: 'Back up & restore', body: 'Save the whole keyboard to one file, then restore it with a preview of exactly what will change.' },
      { title: 'Check my Nord', body: 'A safe, read-only look over USB at what’s on your keyboard, and exactly what OpenNord supports for it.', to: '/compatibility' },
      { title: 'Find missing samples', body: 'When a program needs factory samples you don’t have, OpenNord points you to the official Nord downloads.' },
      { title: 'Reach older Nords', body: 'The desktop build talks to Stage 2-era instruments a browser can’t claim over USB.' },
    ],
  },
];

export function Features() {
  return (
    <section id="features" className={SEC}>
      <SectionHead
        overline="Two front doors, both first-class"
        title="One companion for your patches and your keyboard"
        sub="Understand and organize your sounds, and manage the instrument itself — neither is an afterthought."
      />
      <div className="grid grid-cols-2 gap-x-10 max-[760px]:grid-cols-1 max-[760px]:gap-y-8">
        {DOORS.map((d) => (
          <div key={d.label}>
            <div className="flex items-baseline justify-between border-b border-line pb-2 font-mono text-[11px] uppercase tracking-[1px] text-dim">
              <span>{d.label}</span>
              <span className="text-muted">{d.items.length}</span>
            </div>
            <ol className="m-0 list-none p-0">
              {d.items.map((f, i) => (
                <li key={f.title} className="grid grid-cols-[28px_1fr] gap-3 border-b border-[color-mix(in_srgb,var(--line)_55%,transparent)] py-4">
                  <span className="pt-[3px] font-mono text-[11px] text-muted">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <div className="text-[15px] font-bold text-ink">
                      {f.to ? <Link to={f.to} className="text-ink no-underline hover:text-red-bright">{f.title} →</Link> : f.title}
                    </div>
                    <p className="mt-1 text-[13px] leading-[1.55] text-dim">{f.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="mt-6 flex flex-wrap items-center gap-2 text-xs leading-[1.5] text-muted">
        <span className={roadmapTag}>On the roadmap</span>
        Community patch sharing, AI-assisted search &amp; explanations, and USB
        transfer on iPad are designed — not shipped yet.
      </p>
    </section>
  );
}
