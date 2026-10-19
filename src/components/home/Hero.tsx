import { Link } from '@tanstack/react-router';
import { buttonVariants, SectionLabel } from '@/components/ui';
import { cn } from '@/lib/cn';
import { CONTENT } from './layout';
import { heroBtn } from './styles';
import { HeroInstrument } from './HeroInstrument';
import { FULLY_TESTED, modelList } from './line';
import { docsHref } from '../shell/nav';

/**
 * The hero: eyebrow, a full-bleed display title, then the supporting copy and
 * a program drawn with the real instrument widgets, in two columns beneath it.
 *
 * The title spans the whole content column on purpose. `text-display-1` is
 * calibrated against the column width (11vw, up to 148px), and it only reads as
 * intended when it has the full 1080px to run in — inside the old half-width
 * grid cell it set 140px type in a 529px box and stacked six lines deep.
 */
export function Hero() {
  return (
    <section className={cn(CONTENT, 'py-[clamp(48px,8vw,112px)]')}>
      <SectionLabel variant="eyebrow">Free and open source · beta</SectionLabel>
      {/* text-display-1 carries its own weight/leading/tracking — do not add
          font-*, leading-* or tracking-* here. Tailwind emits
          font-weight: var(--tw-font-weight, …), so any font-* on this element
          would silently override the scale. */}
      <h1 className="m-0 mt-6 text-display-1 text-ink">
        Open your Nord’s sounds <span className="text-dim">on your computer.</span>
      </h1>
      <div className="mt-10 grid grid-cols-[0.85fr_1.15fr] items-start gap-10 max-[860px]:grid-cols-1 max-[860px]:mt-8">
        <div>
          <p className="max-w-[34rem] text-[clamp(14px,1.6vw,17px)] leading-[1.6] text-dim max-[860px]:max-w-none">
            OpenNord opens Nord program, sample and piano files and shows their
            settings. With a USB cable it can also copy programs to and from the
            keyboard and back it up. It is not made by Nord.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/library/programs" className={heroBtn}>
              Open the app
            </Link>
            <a className={buttonVariants({ variant: 'outline', size: 'lg' })} href={docsHref('start/quickstart/')}>
              Read the docs
            </a>
          </div>
          <p className="mt-4 text-[11px] font-medium tracking-[0.2px] text-muted">
            Tested on the Nord {modelList(FULLY_TESTED)}. Other models are untested.
          </p>
        </div>
        <HeroInstrument />
      </div>
    </section>
  );
}
