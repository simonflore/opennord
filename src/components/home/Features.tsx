import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { SEC } from './layout';
import { iconTile } from './styles';
import { SectionHead } from './SectionHead';
import { IconFile, IconLibrary, IconWave, IconConvert, IconUsb, IconBackup, IconUpgrade } from './icons';

/** `wide` cards span the whole row — the grid holds 7, so the last one closes it
 *  out full-width instead of sitting alone in a three-column row. */
const FEATURES: { icon: ReactNode; title: string; body: string; wide?: boolean }[] = [
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
    title: 'Convert & export',
    body: 'Convert sample instruments across Nord generations — even the downconverts the official editor won’t do — and export any sample to WAV or a zip.',
  },
  {
    icon: <IconUsb />,
    title: 'Transfer over USB',
    body: 'On a computer with Chrome or Edge, pull programs off your Nord and write them back — a transfer path proven live on real hardware. Back up first.',
  },
  {
    icon: <IconBackup />,
    title: 'Back up & restore',
    body: 'Save your whole keyboard to a single file, then restore it with a preview of exactly what will change — a safety net before you experiment.',
  },
  {
    icon: <IconUpgrade />,
    title: 'Bring older patches to Stage 4',
    body: 'Turn a Stage 2 or 3 program into a real, loadable Stage 4 file. Every conversion comes with a plain-language report — what carried over cleanly, what’s a close match, and what you’ll want to re-pick on the instrument. Nothing is dropped silently.',
    wide: true,
  },
];

export function Features() {
  return (
    <section id="features" className={SEC}>
      <SectionHead
        overline="Two front doors, both first-class"
        title="One companion for your patches and your keyboard"
        sub="Two equal front doors: understand and organize your sounds, and manage the instrument itself."
      />
      <div className="grid grid-cols-3 gap-4 max-[860px]:grid-cols-2 max-[560px]:grid-cols-1">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className={cn(
              'rounded-md border border-line fill-surface elev-1 p-4',
              'transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(.2,.6,.2,1)]',
              'hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--red)_40%,var(--line))] hover:elev-2',
              f.wide && 'col-span-3 max-[860px]:col-span-2 max-[560px]:col-span-1',
            )}
          >
            <div className={iconTile} aria-hidden="true">{f.icon}</div>
            <div className="text-[15px] font-bold text-ink">{f.title}</div>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-dim">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
