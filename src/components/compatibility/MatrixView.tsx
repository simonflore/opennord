import { useState, Fragment } from 'react';
import { ProbePanel } from './ProbePanel';
import { ALL_MODELS } from '../../lib/clavia/partitions';
import { MATRIX_COLUMNS, CAPABILITY_LABEL, statusFor, type ValidationStatus } from '../../lib/clavia/validation';
import { decodeForModel, getModelProgress, DECODE_LABEL, type DecodeStatus } from '../../lib/contribute/coverage';
import { ByteMapView } from './ByteMapView';
import { cn } from '@/lib/cn';

const CHIP: Record<ValidationStatus, string> = {
  validated: 'Works', re: 'Ready to test', inferred: 'Likely', unsupported: '—', unknown: 'Needs a tester',
};

/** What each chip means, for the legend under the intro. */
const FULL_MAP_TITLE = "Every parameter the instrument stores in a program, from its own firmware; not yet checked against a real file";
const FULL_MAP_CHIP = 'ml-1.5 rounded-sm border border-current px-1 py-px text-[9px] font-semibold uppercase tracking-[0.5px]';

const LEGEND: [ValidationStatus, string][] = [
  ['validated', 'tried on a real instrument'],
  ['re', 'built from this model’s own software or files; not yet tried on one'],
  ['inferred', 'assumed from a sibling model'],
  ['unsupported', 'the instrument can’t do it'],
];

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
        See your model marked <em>Ready to test</em>?{' '}
        <a className="text-red-bright hover:text-red" href="#/contribute">Help confirm it →</a> — a quick read-only check and a few of your own programs, about 10 minutes.
      </p>
      {/* role="list": Safari drops list semantics from a list-style:none <ul>. */}
      <ul role="list" aria-label="What each status means" className="m-0 mb-4 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[12px] text-dim">
        {LEGEND.map(([s, text]) => (
          <li key={s}><span className={cn('font-bold', CELL_COLOR[s])}>{CHIP[s]}</span> {text}</li>
        ))}
        <li><span className={cn(FULL_MAP_CHIP, 'ml-0', CELL_COLOR.re)}>full map</span> reads every parameter a program stores</li>
      </ul>
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
                      // A model with no reachable files at all (the C1) has nothing to decode.
                      if (statusFor(m.id, 'file-read').status === 'unsupported') {
                        return <td className={cn(cell, CELL_COLOR.unsupported)} title="No program files">—</td>;
                      }
                      const text =
                        d.paramCount != null ? `${d.paramCount} params`
                        : d.status === 'partial' ? 'Partial'
                        : d.status === 'started' ? (d.pct != null ? `${d.pct}%` : `${d.controlCount}✓`)
                        : 'Not yet';
                      // Stage 4 (validated) is already green; elsewhere the full-map mark says the
                      // reader covers every stored parameter even though no real file confirmed it yet.
                      const fullMap = d.fullMap && d.status !== 'full';
                      return (
                        <td
                          className={cn(cell, CELL_COLOR[DECODE_CELL[d.status]])}
                          title={fullMap ? FULL_MAP_TITLE : DECODE_LABEL[d.status]}
                        >
                          {text}
                          {fullMap && <span className={FULL_MAP_CHIP}>full map</span>}
                        </td>
                      );
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
                            ? <p className="m-0 text-xs text-dim">Body is {progress.bodyBytes} bytes — body map coming soon. <a className="text-red-bright hover:text-red" href="#/contribute">Share a few programs →</a></p>
                            : <p className="m-0 text-xs text-dim">No body data yet for this format. <a className="text-red-bright hover:text-red" href="#/contribute">Share a few programs →</a></p>
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
