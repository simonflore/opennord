import { SectionLabel } from '@/components/ui';

/**
 * The shared section heading: eyebrow, title, standfirst.
 *
 * `overline` must state the section's CLAIM, not its name — "Stage first,
 * family next", not "Coverage". An eyebrow that merely labels its section is a
 * review failure. See the maintainers’ notes
 */
export function SectionHead({ overline, title, sub }: { overline: string; title: string; sub: string }) {
  return (
    <div className="mb-8 max-w-[40rem]">
      <SectionLabel variant="eyebrow">{overline}</SectionLabel>
      {/* text-display-2 carries its own weight/leading/tracking — adding a
          font-*, leading-* or tracking-* here would silently override it. */}
      <h2 className="m-0 mt-4 text-display-2 text-ink">{title}</h2>
      <p className="mt-4 text-[15px] leading-[1.6] text-dim">{sub}</p>
    </div>
  );
}
