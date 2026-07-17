import { Link } from '@tanstack/react-router';
import { buttonVariants, SectionLabel } from '@/components/ui';
import { cn } from '@/lib/cn';
import { CONTENT } from './layout';
import { heroBtn } from './styles';

/**
 * The hero: eyebrow, a full-bleed display title, then the supporting copy and
 * the demo card in two columns beneath it.
 *
 * The title spans the whole content column on purpose. `text-display-1` is
 * calibrated against the column width (11vw, up to 148px), and it only reads as
 * intended when it has the full 1080px to run in — inside the old half-width
 * grid cell it set 140px type in a 529px box and stacked six lines deep.
 */
export function Hero() {
  return (
    <section className={cn(CONTENT, 'py-[clamp(48px,8vw,112px)]')}>
      <SectionLabel variant="eyebrow">Open source · in your browser</SectionLabel>
      {/* text-display-1 carries its own weight/leading/tracking — do not add
          font-*, leading-* or tracking-* here. Tailwind emits
          font-weight: var(--tw-font-weight, …), so any font-* on this element
          would silently override the scale. */}
      <h1 className="m-0 mt-6 text-display-1 text-ink">
        Know your Nord — <span className="text-dim">without the keyboard.</span>
      </h1>
      <div className="mt-10 grid grid-cols-[1.05fr_0.95fr] items-start gap-6 max-[860px]:grid-cols-1 max-[860px]:mt-8">
        <div>
          <p className="max-w-[34rem] text-[clamp(14px,1.6vw,17px)] leading-[1.6] text-dim max-[860px]:max-w-none">
            OpenNord reads your Nord Stage program and preset files right in the
            browser. Browse, understand and organize your patches — no keyboard, no
            Sound Manager, nothing to install.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/library/programs" className={heroBtn}>
              Open the app
            </Link>
            <a
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
              href="https://github.com/simonflore/opennord"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </div>
          <p className="mt-4 text-[11px] font-medium tracking-[0.2px] text-muted">
            Free &amp; open source · runs entirely on your device · works from a file alone
          </p>
        </div>
        <HeroCard />
      </div>
    </section>
  );
}

/** A stylized "program" card — a taste of what OpenNord shows when you open a file. */
function HeroCard() {
  return (
    <div className="flex justify-center" aria-hidden="true">
      <div className="w-full max-w-[340px] rounded-lg border border-line border-l-[3px] border-l-red fill-surface-accent elev-3 p-4">
        <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <div>
            <div className="text-base font-extrabold text-ink">Sunday Grand</div>
            <div className="mt-0.5 text-[11px] font-medium text-dim">Nord Stage 4 · Piano</div>
          </div>
          <span className="whitespace-nowrap rounded-full fill-raised px-[9px] py-[3px] text-[9px] font-bold tracking-[0.5px] text-text-tertiary edge-hi">
            A · B
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-px">
          <DemoRow k="Piano" v="Grand · Royal Grand XL" />
          <DemoRow k="Organ" v="B3 · perc 3rd" />
          <DemoRow k="Synth" v="Analog saw · unison" />
          <DemoRow k="Effects" v="Delay · Reverb Hall" />
        </div>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full border border-[color-mix(in_srgb,var(--connected)_40%,var(--line))] px-2 py-0.5 text-[9px] font-semibold text-connected">
            Read locally
          </span>
          <span className="rounded-full border border-[color-mix(in_srgb,var(--connected)_40%,var(--line))] px-2 py-0.5 text-[9px] font-semibold text-connected">
            No upload
          </span>
        </div>
      </div>
    </div>
  );
}

function DemoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[color-mix(in_srgb,var(--line)_55%,transparent)] py-[7px]">
      <span className="text-[10px] font-bold uppercase tracking-[0.6px] text-muted">{k}</span>
      <span className="text-right font-mono text-xs font-medium text-ink">{v}</span>
    </div>
  );
}
