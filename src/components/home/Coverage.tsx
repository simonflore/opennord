import { cn } from '@/lib/cn';
import { SEC } from './layout';
import { SectionHead } from './SectionHead';
import { listGrid, listHead, listRule } from './styles';

// Two lists, read like the feature list: what reads today in ink, what is
// mapped and next in muted. No accent — the accent means selected or active,
// and nothing on this page is either.
const GROUPS: { label: string; state: string; models: string[]; cls: string }[] = [
  { label: 'Reads today', state: 'reads', models: ['Nord Stage 4', 'Nord Stage 3', 'Nord Stage 2'], cls: 'text-ink' },
  { label: 'Mapped & next', state: 'next', models: ['Nord Electro', 'Nord Piano', 'Nord Lead', 'Nord Wave'], cls: 'text-dim' },
];

export function Coverage() {
  return (
    <section id="coverage" className={SEC}>
      <SectionHead
        overline="Stage first, family next"
        title="The Nord Stage series first — the rest of the family next"
        sub="Every Nord generation shares one file container, so OpenNord grows across the line one model at a time."
      />
      <div className={listGrid}>
        {GROUPS.map((g) => (
          <div key={g.label}>
            <div className={listHead}>
              <span>{g.label}</span>
              <span className="text-muted">{g.models.length}</span>
            </div>
            <ul className="m-0 list-none p-0">
              {g.models.map((m) => (
                <li key={m} className={cn('flex items-baseline justify-between py-3', listRule)}>
                  <span className={cn('text-[15px] font-bold', g.cls)}>{m}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[1px] text-muted">{g.state}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
