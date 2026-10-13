import { SEC } from './layout';
import { SectionHead } from './SectionHead';
import programShot from './assets/program.webp';
import keymapShot from './assets/sample-keymap.webp';

/**
 * The app itself, two real captures: a program open with every engine module
 * as the panel draws it, and a user sample's keyboard map in the editor. The
 * page shows what OpenNord does instead of describing it.
 *
 * Re-capture them when those views change noticeably: 2000px wide, saved as
 * WebP, and update the width/height below to match.
 */
const SHOTS = [
  {
    src: programShot,
    width: 2000,
    height: 1458,
    caption: 'A program: organ, piano and three synth layers, with the keyboard split and Scene II.',
    alt: "OpenNord showing a Nord Stage 4 program: the keyboard split across organ, piano and synth layers, the organ's drawbars, the piano's timbre and touch, and three synth layers with their oscillators, filter knobs and envelopes. Opens full size.",
  },
  {
    src: keymapShot,
    width: 2000,
    height: 1453,
    caption: "A user sample's keyboard map: root, split and velocity for every zone, editable.",
    alt: 'OpenNord showing a user sample library and the keyboard map of a 16-sample file: each zone drawn over the keys, with a table of root notes, split points and velocity ranges to edit. Opens full size.',
  },
];

export function Showcase() {
  return (
    <section className={SEC}>
      <SectionHead
        overline="Read from the file, value for value"
        title="Every program, laid out like the panel"
        sub="Organ, piano and synths side by side, with each drawbar, knob and envelope showing its number, plus the effects and Scene II changes. Samples get their keyboard map. All of it read from the file on your computer."
      />
      <div className="flex flex-col gap-8">
        {SHOTS.map((s) => (
          <figure key={s.src} className="m-0">
            <div className="overflow-hidden rounded-lg border border-line elev-2">
              {/* A link to the full-size capture: at phone width it's too small to read. */}
              <a href={s.src} target="_blank" rel="noopener" className="block">
                <img
                  src={s.src}
                  width={s.width}
                  height={s.height}
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full"
                  alt={s.alt}
                />
              </a>
            </div>
            <figcaption className="mt-3 font-mono text-[11px] text-muted">{s.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
