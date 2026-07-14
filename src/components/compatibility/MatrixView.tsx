import { useState, Fragment } from 'react';
import { ProbePanel } from './ProbePanel';
import { ALL_MODELS } from '../../lib/clavia/partitions';
import { MATRIX_COLUMNS, CAPABILITY_LABEL, statusFor, type ValidationStatus } from '../../lib/clavia/validation';
import { decodeForModel, getModelProgress, DECODE_LABEL, type DecodeStatus } from '../../lib/contribute/coverage';
import { ByteMapView } from './ByteMapView';
import { cn } from '@/lib/cn';

const CHIP: Record<ValidationStatus, string> = {
  validated: 'Works', re: 'In progress', inferred: 'Likely', unsupported: '—', unknown: 'Needs a tester',
};

const DECODE_CELL: Record<DecodeStatus, ValidationStatus> = { full: 'validated', partial: 're', started: 're', none: 'unknown' };

// Status colors mirror validation.ts's ValidationStatus, mapped onto the
// token vocabulary (tailwind-baseline.md): connected/warn/dim/muted/red-bright.
const CELL_COLOR: Record<ValidationStatus, string> = {
  validated: 'text-connected',
  re: 'text-warn',
  inferred: 'text-dim',
  unsupported: 'text-muted',
  unknown: 'text-red-bright',
};

const cellBase = 'border-b border-line px-2 py-1.5 text-left whitespace-nowrap max-[560px]:px-1.5 max-[560px]:py-1';
const thModel = cn(cellBase, 'text-ink font-bold');
const thCap = cn(cellBase, 'text-dim font-semibold');
const cell = cn(cellBase, 'font-bold');

export function MatrixView() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div>
      <h1 className="m-0 text-[18px] font-extrabold text-ink">Nord compatibility</h1>
      <p className="mt-1 mb-4 text-[13px] text-dim">What OpenNord can do with each Nord — and where we need your help.</p>
      <p className="mt-1 mb-4 text-[13px] text-dim">
        See your model marked <em>In progress</em> or <em>Needs a tester</em>?{' '}
        <a className="text-red-bright hover:text-red" href="#/contribute">Help decode it →</a> — change one control at a time and OpenNord learns the format.
      </p>
      <ProbePanel />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px] max-[560px]:text-[10px]">
          <thead>
            <tr>
              <th className={thModel}>Model</th>
              <th className={thCap}>Program Parameters</th>
              {MATRIX_COLUMNS.map((c) => <th key={c} className={thCap}>{CAPABILITY_LABEL[c]}</th>)}
            </tr>
          </thead>
          <tbody>
            {ALL_MODELS.map((m) => {
              const isOpen = expanded === m.id;
              const progress = getModelProgress(m.id);
              const d = decodeForModel(m.id);
              return (
                <Fragment key={m.id}>
                  <tr
                    className={cn(
                      'cursor-pointer select-none hover:bg-surface focus-visible:-outline-offset-2',
                      isOpen && 'bg-surface',
                    )}
                    onClick={() => toggle(m.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(m.id)}
                    aria-expanded={isOpen}
                  >
                    <th className={thModel} scope="row">
                      <span
                        className={cn(
                          'mr-[5px] inline-block align-middle text-[9px] leading-none text-muted',
                          'transition-transform duration-150 ease-[var(--ease)]',
                          isOpen && 'rotate-90',
                        )}
                      >
                        ▸
                      </span>
                      {m.name}
                    </th>
                    {(() => {
                      const text =
                        d.status === 'full' ? `${d.paramCount} params`
                        : d.status === 'partial' ? 'Partial'
                        : d.status === 'started' ? (d.pct != null ? `${d.pct}%` : `${d.controlCount}✓`)
                        : '—';
                      return <td className={cn(cell, CELL_COLOR[DECODE_CELL[d.status]])} title={DECODE_LABEL[d.status]}>{text}</td>;
                    })()}
                    {MATRIX_COLUMNS.map((c) => {
                      const s = statusFor(m.id, c).status;
                      return <td key={c} className={cn(cell, CELL_COLOR[s])} title={CHIP[s]}>{CHIP[s]}</td>;
                    })}
                  </tr>

                  {isOpen && (
                    <tr>
                      <td className="border-b border-line p-0" colSpan={MATRIX_COLUMNS.length + 2}>
                        <div className="bg-surface-2 px-4 py-3">
                          {progress?.regions
                            ? <ByteMapView progress={progress} />
                            : d.status !== 'none'
                            ? <p className="m-0 text-xs text-dim">Decoded by the {m.name} reader — open one of its programs from your Library to view it. A byte-coverage map for this format isn’t built yet.</p>
                            : progress?.bodyBytes
                            ? <p className="m-0 text-xs text-dim">Body is {progress.bodyBytes} bytes — body map coming soon. <a className="text-red-bright hover:text-red" href="#/contribute">Help decode it →</a></p>
                            : <p className="m-0 text-xs text-dim">No body data yet for this format. <a className="text-red-bright hover:text-red" href="#/contribute">Be the first to map it →</a></p>
                          }
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
