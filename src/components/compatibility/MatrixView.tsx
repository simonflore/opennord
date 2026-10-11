import { useState, Fragment } from 'react';
import { ProbePanel } from './ProbePanel';
import { ALL_MODELS } from '../../lib/clavia/partitions';
import { MATRIX_COLUMNS, CAPABILITY_LABEL, statusFor, type ValidationStatus } from '../../lib/clavia/validation';
import { decodeForModel, getModelProgress, DECODE_LABEL, type DecodeStatus } from '../../lib/contribute/coverage';
import { ByteMapView } from './ByteMapView';
import { cn } from '@/lib/cn';

/** What each status means: the label doubles as the icon's accessible name and tooltip. */
const STATUS: Record<ValidationStatus, { label: string; glyph: string; hint: string }> = {
  validated: { label: 'Works', glyph: '✓', hint: 'tried on a real instrument' },
  re: { label: 'Ready to test', glyph: '●', hint: 'built from its own files' },
  inferred: { label: 'Likely', glyph: '○', hint: 'assumed from a sibling model' },
  unsupported: { label: 'Not available', glyph: '–', hint: 'the instrument can’t do it' },
  unknown: { label: 'Needs a tester', glyph: '?', hint: 'not known yet' },
};

/** Program Parameters marks. */
const FULL_MAP = { glyph: '◆', label: 'Full map', hint: 'reads every setting a program stores' };
const FULL_MAP_TITLE = 'Full map: every setting the instrument stores in a program; not yet checked against a real file';

const LEGEND: ValidationStatus[] = ['validated', 're', 'inferred', 'unsupported'];

const DECODE_CELL: Record<DecodeStatus, ValidationStatus> = { full: 'validated', partial: 're', started: 're', none: 'unknown' };

// Status colors mirror validation.ts's ValidationStatus, mapped onto the
// token vocabulary (tailwind-baseline.md): connected/warn/dim/muted/danger.
const CELL_COLOR: Record<ValidationStatus, string> = {
  validated: 'text-connected',
  re: 'text-warn',
  inferred: 'text-dim',
  unsupported: 'text-muted',
  unknown: 'text-danger',
};

/** The round badge behind a status glyph, tinted with the status colour itself. */
const BADGE = cn(
  'inline-flex h-[18px] w-[18px] items-center justify-center rounded-full text-[11px] leading-none font-bold',
  'bg-[color-mix(in_srgb,currentColor_14%,transparent)]',
);

function StatusIcon({ status, label }: { status: ValidationStatus; label?: string }) {
  const s = STATUS[status];
  const name = label ? `${label}: ${s.label}` : s.label;
  return (
    <span role="img" aria-label={name} title={name} className={cn(BADGE, CELL_COLOR[status])}>
      <span aria-hidden="true">{s.glyph}</span>
    </span>
  );
}

const cellBase = 'border-b border-line px-1.5 py-1.5 whitespace-nowrap max-[560px]:px-1 max-[560px]:py-1';
const thModel = cn(cellBase, 'text-left text-ink font-bold');
const thCap = cn(
  cellBase,
  'w-[64px] text-center align-bottom text-[10px] leading-tight font-semibold text-dim whitespace-normal max-[560px]:w-[46px] max-[560px]:text-[9px]',
);
const cell = cn(cellBase, 'text-center');

export function MatrixView() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div>
      <h1 className="m-0 text-[18px] font-extrabold text-ink">Nord compatibility</h1>
      <p className="mt-1 mb-4 text-[13px] text-dim">What OpenNord can do with each Nord — and where we need your help.</p>
      <p className="mt-1 mb-4 text-[13px] text-dim">
        See <StatusIcon status="re" /> on your model?{' '}
        <a className="text-red-bright hover:text-red" href="#/contribute">Help confirm it →</a> — a quick read-only check and a few of your own programs, about 10 minutes.
      </p>
      {/* role="list": Safari drops list semantics from a list-style:none <ul>. */}
      <ul
        role="list"
        aria-label="What each status means"
        className="m-0 mb-4 grid list-none grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-x-4 gap-y-1.5 p-0 text-[12px] text-dim"
      >
        {LEGEND.map((s) => (
          <li key={s} className="flex items-center gap-2">
            <StatusIcon status={s} />
            <span><span className="font-semibold text-ink">{STATUS[s].label}</span> · {STATUS[s].hint}</span>
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="w-[18px] text-center text-[11px] text-warn">{FULL_MAP.glyph}</span>
          <span><span className="font-semibold text-ink">{FULL_MAP.label}</span> · {FULL_MAP.hint}</span>
        </li>
      </ul>
      <ProbePanel />
      <div className="overflow-x-auto">
        <table className="w-full max-w-[880px] border-collapse text-[12px] max-[560px]:text-[11px]">
          <thead>
            <tr>
              <th className={thModel}>Model</th>
              <th className={cn(thCap, 'w-[84px] max-[560px]:w-[60px]')}>Program Parameters</th>
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
                        return <td className={cell}><StatusIcon status="unsupported" label="Program parameters" /></td>;
                      }
                      if (d.status === 'none') {
                        return <td className={cell}><StatusIcon status="unknown" label="Program parameters" /></td>;
                      }
                      const text =
                        d.paramCount != null ? String(d.paramCount)
                        : d.status === 'partial' ? 'Partial'
                        : d.pct != null ? `${d.pct}%` : `${d.controlCount}✓`;
                      // Stage 4 (validated) is already green; elsewhere the full-map mark says the
                      // reader covers every stored parameter even though no real file confirmed it yet.
                      const fullMap = d.fullMap && d.status !== 'full';
                      const title = fullMap ? FULL_MAP_TITLE : DECODE_LABEL[d.status];
                      return (
                        <td className={cn(cell, 'font-bold tabular-nums', CELL_COLOR[DECODE_CELL[d.status]])} title={title}>
                          <span className="sr-only">{d.paramCount != null ? `${text} parameters` : text}{fullMap ? ', full map' : ''}</span>
                          <span aria-hidden="true">
                            {text}
                            {fullMap && <span className="ml-1 text-[9px] align-[1px]">{FULL_MAP.glyph}</span>}
                          </span>
                        </td>
                      );
                    })()}
                    {MATRIX_COLUMNS.map((c) => {
                      const s = statusFor(m.id, c).status;
                      return <td key={c} className={cell}><StatusIcon status={s} label={CAPABILITY_LABEL[c]} /></td>;
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
