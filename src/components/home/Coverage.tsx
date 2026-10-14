import { cn } from '@/lib/cn';
import { SEC } from './layout';
import { SectionHead } from './SectionHead';
import { listHead, listRule } from './styles';
import { HARDWARE_VALIDATED, READ_FAMILIES, READ_MODELS } from './line';

/**
 * The reach across the line, counted from the registry (see line.ts) so it moves
 * with the readers; the matrix below has the detail. A list like the feature
 * list, with no accent: the accent means selected or active, and nothing on
 * this page is either.
 */
export function Coverage() {
  const names = HARDWARE_VALIDATED.map((m) => m.name.replace(/^Nord /, ''));
  // "Stage 4, Stage 3 and Stage 2 are" / "Stage 4 is".
  const validated = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} are` : `${names[0]} is`;
  return (
    <section id="coverage" className={SEC}>
      <SectionHead
        overline="One container, the whole line"
        title={`${READ_MODELS.length} Nord models read today`}
        sub={`Every Nord generation shares one file container, so one reader covers the line. The ${validated} validated on the real instrument; the others are built from each model’s own software and files, and marked as such below.`}
      />
      <div className="max-w-[26rem]">
        <div className={listHead}>
          <span>Reads today</span>
          <span className="text-muted">{READ_MODELS.length}</span>
        </div>
        <ul className="m-0 list-none p-0">
          {READ_FAMILIES.map(({ family, models }) => (
            <li key={family} className={cn('flex items-baseline justify-between py-3', listRule)}>
              <span className="text-[15px] font-bold text-ink">Nord {family}</span>
              <span className="font-mono text-[11px] uppercase tracking-[1px] text-muted">
                {models} {models === 1 ? 'model' : 'models'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
