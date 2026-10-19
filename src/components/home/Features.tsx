import { cn } from '@/lib/cn';
import { useCapabilities } from '../../lib/capabilities/CapabilitiesContext';
import { docsHref } from '../shell/nav';
import { SEC } from './layout';
import { covLink, indexedRow, listIndex, listRule } from './styles';
import { SectionHead } from './SectionHead';
import { FULLY_TESTED, READ_MODELS, READ_TESTED_ONLY, modelList } from './line';

/** One thing OpenNord does, and the docs page that shows how (`doc`, under /docs/). */
interface Feature { title: string; body: string; doc?: string }

const tested = modelList(FULLY_TESTED);

const FEATURES: Feature[] = [
  { title: 'Read programs', body: 'See a program’s settings: piano, organ, synth, effects and the keyboard split.', doc: 'guide/programs/' },
  { title: 'Library', body: 'Search the programs, presets, samples and pianos in a folder or on the keyboard.', doc: 'guide/library/' },
  { title: 'Samples', body: 'Play samples and pianos on screen or from a MIDI keyboard. Export them to WAV.', doc: 'guide/samples/' },
  { title: 'Convert to Stage 4', body: 'Turn a Stage 2 or 3 program into a Stage 4 program, with a list of what carried over.', doc: 'guide/convert/' },
  { title: 'USB transfer', body: `Copy programs to and from the keyboard, from Chrome, Edge or the desktop app. Tested on the ${tested}.`, doc: 'guide/connect/' },
  { title: 'Backup', body: `Save the whole keyboard to one file and restore it. Tested on the ${tested}.`, doc: 'guide/backup/' },
];
/** Shown where the build has the community library (the hosted app). */
const SHARE: Feature = { title: 'Share your programs', body: 'Publish programs you made and browse what other players share. Programs only: never Nord’s factory sounds.' };


export function Features() {
  const items = useCapabilities().community.available ? [...FEATURES, SHARE] : FEATURES;
  return (
    <section id="features" className={SEC}>
      <SectionHead
        overline="Features"
        title="What it does"
        sub="Reading, playing and converting work from a file. You only need the keyboard to copy sounds to and from it."
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
      <p className="mt-6 max-w-[44rem] text-xs leading-[1.6] text-muted">
        Tested on a real instrument: the Nord {tested} (everything above), and the
        Nord {modelList(READ_TESTED_ONLY)} (reading only; nothing that changes the
        keyboard has been tested on them). OpenNord also
        recognises files from {READ_MODELS.length - FULLY_TESTED.length - READ_TESTED_ONLY.length} other
        Nord models, but nothing has been tested on them yet. This is beta software:
        sending a program to the keyboard replaces what is in that slot, so back up
        first.{' '}
        <a href={docsHref('reference/instruments/')} className={covLink}>Supported instruments →</a>
      </p>
    </section>
  );
}
