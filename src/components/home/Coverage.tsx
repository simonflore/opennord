import { cn } from '@/lib/cn';
import { SEC } from './layout';
import { SectionHead } from './SectionHead';

const READS_TODAY = ['Nord Stage 4', 'Nord Stage 3', 'Nord Stage 2'];
const MAPPED_NEXT = ['Nord Electro', 'Nord Piano', 'Nord Lead', 'Nord Wave'];

const covChip = 'rounded-full border border-line fill-raised px-[13px] py-1.5 text-xs font-semibold text-text-tertiary edge-hi';
const covChipOn = 'text-ink border-[color-mix(in_srgb,var(--red)_45%,var(--line))]';

export function Coverage() {
  return (
    <section id="coverage" className={SEC}>
      <SectionHead
        overline="Stage first, family next"
        title="The Nord Stage series first — the rest of the family next"
        sub="Every Nord generation shares one file container, so OpenNord grows across the line one model at a time."
      />
      <div className="flex flex-wrap gap-6">
        <div className="flex-1 min-w-[240px] rounded-md border border-line fill-surface elev-1 p-4">
          <div className="mb-3 text-[9px] font-bold uppercase tracking-[1.4px] text-muted">Reads today</div>
          <div className="flex flex-wrap gap-2">
            {READS_TODAY.map((m) => (
              <span className={cn(covChip, covChipOn)} key={m}>{m}</span>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-[240px] rounded-md border border-line fill-surface elev-1 p-4">
          <div className="mb-3 text-[9px] font-bold uppercase tracking-[1.4px] text-muted">Mapped &amp; next</div>
          <div className="flex flex-wrap gap-2">
            {MAPPED_NEXT.map((m) => (
              <span className={covChip} key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
