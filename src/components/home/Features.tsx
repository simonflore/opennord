import { cn } from '@/lib/cn';
import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';
import { docsHref } from '../shell/nav';
import { SEC } from './layout';
import { covLink, indexedRow, listIndex, listRule } from './styles';
import { SectionHead } from './SectionHead';
import { READ_FAMILIES, READ_MODELS } from './line';

/** One thing OpenNord does, and the docs page that shows how (`doc`, under /docs/). */
interface Feature { title: string; body: string; doc?: string }

const FEATURES: Feature[] = [
  { title: 'Read your programs', body: 'Open a program and see what’s inside: piano, organ, synth and effects, laid out like the panel.', doc: 'guide/programs/' },
  { title: 'Organize a library', body: 'Point OpenNord at a folder and search your programs, presets, samples and pianos in one place.', doc: 'guide/library/' },
  { title: 'Play your samples', body: 'Play samples and pianos on screen or from a MIDI keyboard, and export them to WAV.', doc: 'guide/samples/' },
  { title: 'Bring older patches to Stage 4', body: 'Turn a Stage 2 or 3 program into a Stage 4 file, with a report of what carried over.', doc: 'guide/convert/' },
  { title: 'Transfer over USB', body: 'Pull programs off your Nord and write them back, from Chrome or Edge on a computer or the desktop app.', doc: 'guide/connect/' },
  { title: 'Back up & restore', body: 'Save the whole keyboard to one file, and put it back when you need to.', doc: 'guide/backup/' },
];
/** Shown where the build has the community library (the hosted app). */
const SHARE: Feature = { title: 'Share your programs', body: 'Publish programs you made and browse what other players share. Programs only: never Nord’s factory sounds.' };

/** "Stage, Electro, Piano and Organ". */
const families = (() => {
  const names = READ_FAMILIES.map((f) => f.family);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
})();

export function Features() {
  const items = useCapabilities().community.available ? [...FEATURES, SHARE] : FEATURES;
  return (
    <section id="features" className={SEC}>
      <SectionHead
        overline="Your patches and your keyboard"
        title="What it does"
        sub="Everything here works from a file. The Nord itself is only needed to move sounds to and from it."
      />
      <ol className="m-0 grid list-none grid-cols-2 gap-x-10 p-0 max-[760px]:grid-cols-1">
        {items.map((f, i) => (
          <li key={f.title} className={cn(indexedRow, listRule)}>
            <span className={listIndex}>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <div className="text-[15px] font-bold text-ink">
                {f.doc ? <a href={docsHref(f.doc)} className="text-ink no-underline hover:text-red-bright">{f.title} →</a> : f.title}
              </div>
              <p className="mt-1 text-[13px] leading-[1.55] text-dim">{f.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-xs leading-[1.5] text-muted">
        Reads {READ_MODELS.length} Nord models across the {families} families, the Nord Stage first.{' '}
        <a href={docsHref('reference/instruments/')} className={covLink}>Supported instruments →</a>
      </p>
    </section>
  );
}
