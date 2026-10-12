import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/cn';
import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';
import { SEC } from './layout';
import { indexedRow, listGrid, listHead, listIndex, listRule, roadmapTag } from './styles';
import { SectionHead } from './SectionHead';

interface Feature { title: string; body: string; to?: string }

// The two front doors, side by side, so the page states the claim instead of
// listing cards: everything you can do with your sounds, and with the instrument.
const PATCHES: Feature[] = [
  { title: 'Open any program', body: 'Drop a program from a Stage, Electro, Piano, Grand, Lead, Wave or organ and see what’s inside: piano, organ, synth and effects, laid out the way the panel is. How sure OpenNord is of each model is in the table below.' },
  { title: 'Organize a library', body: 'Point OpenNord at a folder and it builds a searchable library of your Programs, Pianos, Samples and Presets, with the keyboard split on every row.' },
  { title: 'Play what you open', body: 'Play samples and pianos from an on-screen keyboard or a MIDI controller, and hear a program’s organ from its drawbars. A sketch of the sound for judging it, not the instrument itself.' },
  { title: 'Convert & export', body: 'Move sample instruments across Nord generations, including the downconverts the official editor won’t do, and export any sample to WAV. Turning a sample into a piano is experimental: not yet tried on a Nord.' },
  { title: 'Bring older patches to Stage 4', body: 'Turn a Stage 2 or 3 program into a loadable Stage 4 file, with a plain-language report of what carried over, what’s a close match and what to re-pick. Nothing is dropped silently.' },
];
/** Shown where the build has the community library (the hosted app). */
const SHARE: Feature = { title: 'Share your programs', body: 'Publish programs you made and browse what other players share. Programs only: never Nord’s factory sounds.' };

const KEYBOARD: Feature[] = [
  { title: 'Transfer over USB', body: 'On a computer with Chrome or Edge, pull programs off your Nord and write them back. Proven live on a Stage 4. Back up first.' },
  { title: 'Back up & restore', body: 'Save the whole keyboard to one file, then restore it with a preview of exactly what will change.' },
  { title: 'Check my Nord', body: 'A safe, read-only look over USB at what’s on your keyboard, and exactly what OpenNord supports for it.', to: '/compatibility' },
  { title: 'Find missing samples', body: 'When a program needs factory samples you don’t have, OpenNord points you to the official Nord downloads.' },
  { title: 'Reach older Nords', body: 'The desktop build talks to Stage 2-era instruments a browser can’t claim over USB.' },
];

export function Features() {
  const community = useCapabilities().community.available;
  const doors: { label: string; items: Feature[] }[] = [
    { label: 'Your patches', items: community ? [...PATCHES, SHARE] : PATCHES },
    { label: 'Your keyboard', items: KEYBOARD },
  ];
  return (
    <section id="features" className={SEC}>
      <SectionHead
        overline="Two front doors, both first-class"
        title="One companion for your patches and your keyboard"
        sub="Understand and organize your sounds, and manage the instrument itself — neither is an afterthought."
      />
      <div className={listGrid}>
        {doors.map((d) => (
          <div key={d.label}>
            <div className={listHead}>
              <span>{d.label}</span>
              <span className="text-muted">{d.items.length}</span>
            </div>
            <ol className="m-0 list-none p-0">
              {d.items.map((f, i) => (
                <li key={f.title} className={cn(indexedRow, listRule)}>
                  <span className={listIndex}>{String(i + 1).padStart(2, '0')}</span>
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
        {community ? '' : 'Community patch sharing, '}AI-assisted search &amp; explanations{community ? '' : ','} and
        USB transfer on iPad are designed, not shipped yet.
      </p>
    </section>
  );
}
