import { SectionLabel } from '@/components/ui';

/** The shared section heading: overline, title, standfirst. */
export function SectionHead({ overline, title, sub }: { overline: string; title: string; sub: string }) {
  return (
    <div className="mb-6 max-w-[40rem]">
      <SectionLabel>{overline}</SectionLabel>
      <h2 className="m-0 mt-2 font-extrabold leading-[1.15] tracking-[-0.6px] text-ink text-[clamp(22px,3.4vw,32px)]">
        {title}
      </h2>
      <p className="mt-3 text-[15px] leading-[1.6] text-dim">{sub}</p>
    </div>
  );
}
