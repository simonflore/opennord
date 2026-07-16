import { Link } from '@tanstack/react-router';
import { buttonVariants, SectionLabel } from '@/components/ui';
import { cn } from '@/lib/cn';
import { CONTENT } from './layout';
import { heroBtn } from './styles';

export function Hero() {
  return (
    <section
      className={cn(
        CONTENT,
        'grid grid-cols-[1.05fr_0.95fr] items-center gap-6 py-[clamp(24px,8vw,88px)]',
        'max-[860px]:grid-cols-1 max-[860px]:py-6',
      )}
    >
      <div>
        <SectionLabel>Open source · in your browser</SectionLabel>
        <h1 className="m-0 mt-3 font-extrabold leading-[1.05] tracking-[-1px] text-ink text-[clamp(30px,5.4vw,52px)]">
          Know your Nord — <span className="text-dim">without the keyboard.</span>
        </h1>
        <p className="mt-4 max-w-[30rem] text-[clamp(14px,1.6vw,17px)] leading-[1.6] text-dim max-[860px]:max-w-none">
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
