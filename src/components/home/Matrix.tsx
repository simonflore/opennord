import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/cn';
import { SEC } from './layout';
import { covLink } from './styles';
import { SectionHead } from './SectionHead';
import { ALL_MODELS, type NordModelId } from '../../lib/clavia/partitions';
import { statusFor, type Capability, type ValidationStatus } from '../../lib/clavia/validation';

// A short sample of the line, read live from src/lib/clavia/validation.ts (the
// same source as the in-app /compatibility matrix). Stage 4 and Stage 3 are
// hardware-validated, the Stage 2 in part; the rest is built from each model's own
// software or files (ready to test) or assumed from a sibling model.
type Cell = 'v' | 're' | 'inf' | 'na';

const SAMPLE_MODELS: NordModelId[] = ['stage-4', 'stage-3', 'stage-2', 'electro-6', 'piano-5', 'grand-2', 'wave-2', 'lead-4'];

/** Each column and the capabilities it summarises; a column shows its weakest one. */
const MATRIX_COLS: { label: string; caps: Capability[] }[] = [
  { label: 'Read', caps: ['file-read'] },
  { label: 'Transfer', caps: ['pull', 'push', 'delete'] },
  { label: 'Back up', caps: ['backup'] },
  { label: 'Samples', caps: ['samples'] },
];

const RANK: Record<ValidationStatus, number> = { validated: 3, re: 2, inferred: 1, unknown: 0, unsupported: -1 };
const CELL_OF: Record<ValidationStatus, Cell> = { validated: 'v', re: 're', inferred: 'inf', unknown: 'inf', unsupported: 'na' };

function cellFor(id: NordModelId, caps: Capability[]): Cell {
  const statuses = caps.map((c) => statusFor(id, c).status);
  return CELL_OF[statuses.reduce((a, b) => (RANK[b] < RANK[a] ? b : a))];
}

const MATRIX = SAMPLE_MODELS.map((id) => ({
  model: ALL_MODELS.find((m) => m.id === id)?.name ?? id,
  cells: MATRIX_COLS.map((c) => cellFor(id, c.caps)),
}));

// One ladder of brightness, no status colours: green means "Nord connected" and
// the accent means selected, so neither belongs in a table of claims.
const cellBase = 'inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs leading-none';
const CELL_META: Record<Cell, { glyph: string; label: string; cls: string }> = {
  v: { glyph: '✓', label: 'Validated on hardware', cls: 'font-bold text-ink bg-[color-mix(in_srgb,var(--lift)_16%,transparent)]' },
  re: { glyph: '●', label: "Ready to test — built from this model's own software or files, not yet tried on one", cls: 'text-muted bg-transparent' },
  inf: { glyph: '○', label: 'Likely — assumed from a sibling model', cls: 'text-muted bg-transparent' },
  na: { glyph: '–', label: 'Not applicable', cls: 'text-muted bg-transparent' },
};

export function Matrix() {
  return (
    <section className={SEC}>
      <SectionHead
        overline="Honest by model"
        title="What works on which Nord"
        sub="The Stage 4 and Stage 3 are validated on real hardware, and the Stage 2 for its files and samples. The rest is built from each model's own software and gets promoted as owners test it. Nothing here is dressed up."
      />
      <div className="overflow-x-auto rounded-md border border-line fill-surface elev-1">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr>
              <th className="border-b border-line px-3 py-[11px] text-left text-[9px] font-bold uppercase tracking-[1px] text-muted" scope="col">Model</th>
              {MATRIX_COLS.map(({ label: c }) => (
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
                        key={MATRIX_COLS[i].label}
                        className={cn(
                          'px-3 py-[11px] text-center',
                          !last && 'border-b border-[color-mix(in_srgb,var(--line)_55%,transparent)]',
                        )}
                      >
                        <span
                          className={cn(cellBase, meta.cls)}
                          title={meta.label}
                          aria-label={`${MATRIX_COLS[i].label}: ${meta.label}`}
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
            <span className={cn(cellBase, 'h-[18px] w-[18px] text-[10px]', CELL_META.re.cls)}>●</span> Ready to test
          </li>
          <li className="inline-flex items-center gap-1.5 text-[11px] font-medium text-dim">
            <span className={cn(cellBase, 'h-[18px] w-[18px] text-[10px]', CELL_META.inf.cls)}>○</span> Likely
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
