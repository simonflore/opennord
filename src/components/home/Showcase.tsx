import { SEC } from './layout';
import { SectionHead } from './SectionHead';
import shot from './assets/program-full.webp';
import shot2x from './assets/program-full@2x.webp';

/**
 * The app itself, one program open across the full width: every engine module
 * as the panel draws it, each value printed. A real capture of the app (the
 * BreakFree_chords fixture, a user program — no Nord factory content), so the
 * page shows what OpenNord does instead of describing it.
 *
 * Re-capture it when the program view changes noticeably: 2000×1200 at 2×, the
 * program opened in the full view (F), saved as WebP at 1× and 2×.
 */
export function Showcase() {
  return (
    <section className={SEC}>
      <SectionHead
        overline="Read from the file, value for value"
        title="Every program, laid out like the panel"
        sub="Organ, piano and synths side by side, with each drawbar, knob and envelope showing its number, plus the effects and Scene II changes. All of it read from the file on your computer."
      />
      <figure className="m-0 overflow-hidden rounded-lg border border-line elev-2">
        {/* A link to the full-size capture: at phone width it's too small to read. */}
        <a href={shot2x} target="_blank" rel="noopener" className="block">
          <img
            src={shot}
            srcSet={`${shot} 2000w, ${shot2x} 4000w`}
            sizes="(min-width: 1128px) 1080px, calc(100vw - 48px)"
            width={2000}
            height={1200}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
            alt="OpenNord showing a Nord Stage 4 program: the organ's drawbars, the piano's timbre and touch, three synth layers with their oscillators, filter knobs and envelopes, and a row of layer effects. Opens full size."
          />
        </a>
      </figure>
    </section>
  );
}
