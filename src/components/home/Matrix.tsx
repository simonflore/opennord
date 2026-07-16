import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/cn';
import { SEC } from './layout';
import { covLink } from './styles';
import { SectionHead } from './SectionHead';

// Status codes mirror src/lib/clavia/validation.ts. Only Stage 4 is
// hardware-validated; everything else is reverse-engineered (works in the app,
// not yet checked on the instrument) or inferred from a sibling model. The
// live, per-model source of truth is the in-app /compatibility matrix.
type Cell = 'v' | 're' | 'inf' | 'na';

const MATRIX_COLS = ['Read', 'Transfer', 'Back up', 'Samples'] as const;

const MATRIX: { model: string; cells: Cell[] }[] = [
  { model: 'Nord Stage 4', cells: ['v', 'v', 'v', 'v'] },
  { model: 'Nord Stage 3', cells: ['re', 're', 're', 're'] },
  { model: 'Nord Stage 2', cells: ['re', 're', 're', 're'] },
  { model: 'Nord Electro 6', cells: ['re', 'inf', 'inf', 're'] },
  { model: 'Nord Piano 5', cells: ['re', 'inf', 'inf', 're'] },
  { model: 'Nord Grand 2', cells: ['re', 'inf', 'inf', 're'] },
  { model: 'Nord Wave 2', cells: ['re', 'inf', 're', 're'] },
  { model: 'Nord Lead 4', cells: ['re', 'inf', 're', 'na'] },
];

const cellBase = 'inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs leading-none';
const CELL_META: Record<Cell, { glyph: string; label: string; cls: string }> = {
  v: { glyph: '✓', label: 'Validated on hardware', cls: 'text-connected bg-[color-mix(in_srgb,var(--connected)_15%,transparent)]' },
  re: { glyph: '●', label: 'Reverse-engineered — works in the app, not yet hardware-tested', cls: 'text-red-bright bg-[color-mix(in_srgb,var(--red)_15%,transparent)]' },
  inf: { glyph: '○', label: 'Inferred — likely, needs a tester', cls: 'text-dim bg-[color-mix(in_srgb,var(--lift)_6%,transparent)]' },
  na: { glyph: '–', label: 'Not applicable', cls: 'text-muted bg-transparent' },
};

export function Matrix() {
  return (
    <section className={SEC}>
      <SectionHead
        overline="Honest by model"
        title="What works on which Nord"
        sub="Only the Stage 4 is validated on real hardware; the rest is reverse-engineered and gets promoted as owners test it. Nothing here is dressed up."
      />
      <div className="overflow-x-auto rounded-md border border-line fill-surface elev-1">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr>
              <th className="border-b border-line px-3 py-[11px] text-left text-[9px] font-bold uppercase tracking-[1px] text-muted" scope="col">Model</th>
              {MATRIX_COLS.map((c) => (
                <th
                  key={c}
                  className="border-b border-line px-3 py-[11px] text-center text-[9px] font-bold uppercase tracking-[1px] text-muted"
                  scope="col"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((row, ri) => {
              const last = ri === MATRIX.length - 1;
              return (
                <tr key={row.model}>
                  <th
                    className={cn(
                      'whitespace-nowrap px-3 py-[11px] text-left text-xs font-semibold text-ink',
                      !last && 'border-b border-[color-mix(in_srgb,var(--line)_55%,transparent)]',
                    )}
                    scope="row"
                  >
                    {row.model}
                  </th>
                  {row.cells.map((cell, i) => {
                    const meta = CELL_META[cell];
                    return (
                      <td
                        key={MATRIX_COLS[i]}
                        className={cn(
                          'px-3 py-[11px] text-center',
                          !last && 'border-b border-[color-mix(in_srgb,var(--line)_55%,transparent)]',
                        )}
                      >
                        <span
                          className={cn(cellBase, meta.cls)}
                          title={meta.label}
                          aria-label={`${MATRIX_COLS[i]}: ${meta.label}`}
                        >
                          {meta.glyph}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ul className="m-0 flex flex-wrap gap-4 p-0 list-none">
          <li className="inline-flex items-center gap-1.5 text-[11px] font-medium text-dim">
            <span className={cn(cellBase, 'h-[18px] w-[18px] text-[10px]', CELL_META.v.cls)}>✓</span> Validated on hardware
          </li>
          <li className="inline-flex items-center gap-1.5 text-[11px] font-medium text-dim">
            <span className={cn(cellBase, 'h-[18px] w-[18px] text-[10px]', CELL_META.re.cls)}>●</span> Reverse-engineered
          </li>
          <li className="inline-flex items-center gap-1.5 text-[11px] font-medium text-dim">
            <span className={cn(cellBase, 'h-[18px] w-[18px] text-[10px]', CELL_META.inf.cls)}>○</span> Likely · needs a tester
          </li>
          <li className="inline-flex items-center gap-1.5 text-[11px] font-medium text-dim">
            <span className={cn(cellBase, 'h-[18px] w-[18px] text-[10px]', CELL_META.na.cls)}>–</span> N/A
          </li>
        </ul>
        <Link to="/compatibility" className={covLink}>
          Open the live, per-model matrix →
        </Link>
      </div>
    </section>
  );
}
