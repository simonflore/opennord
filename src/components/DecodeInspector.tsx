/**
 * Decode Inspector — the in-browser reverse-engineering tool.
 *
 * Load a Nord file and see every byte: green where the file's own layout names
 * it (header, framing, a parameter), grey where that layout leaves it unused, red
 * only where no layout covers it (contribute/byte-map.ts). Load a SECOND file to diff — change one knob on the
 * Nord, re-export, and the changed bytes light up yellow, naming the parameter
 * if known or flagging a gap to decode. This is how the format gets filled in.
 */

import { useMemo, useState } from 'react';
import { fileTypeTag, hasCbinMagic } from '../lib/clavia/cbin';
import { buildParamMap } from '../lib/ns4/maps';
import { summarizeFile, type FileSummary } from '@/lib/clavia/identify-summary';
import { FixtureLoader } from '@/components/dev/FixtureLoader';
import { IdentifyPanel } from '@/components/decode/ProgramDecode';
import { cn } from '@/lib/cn';
import {
  decodeAllParams,
  gapRanges,
  coveragePercent,
  diffBytes,
  paramsCoveringByte,
  paramNamesByByte,
  groupOfByte,
} from '../lib/ns4/coverage';
import type { Ns4Group } from '../lib/ns4/maps';
import { readFileBytes } from '../lib/file';
import { fileByteMap, type ByteInfo } from '../lib/contribute/byte-map';
import { presetKindForTag } from '../lib/clavia/preset-kind';

// Engine-group colors — resolved from the --di-* data-viz tokens (tokens.css).
// Kept as two Records (bg for swatches, text for the parameter-table dot)
// since Tailwind needs the full utility class name as a literal in source.
const GROUP_BG: Record<Ns4Group, string> = {
  m: 'bg-[var(--di-m)]', // master / global
  o: 'bg-[var(--di-o)]', // organ
  p: 'bg-[var(--di-p)]', // piano
  y: 'bg-[var(--di-y)]', // synth
};
const GROUP_TEXT: Record<Ns4Group, string> = {
  m: 'text-[var(--di-m)]',
  o: 'text-[var(--di-o)]',
  p: 'text-[var(--di-p)]',
  y: 'text-[var(--di-y)]',
};
const GROUP_LABEL: Record<Ns4Group, string> = { m: 'master', o: 'organ', p: 'piano', y: 'synth' };

const cellCls = 'border-b border-line px-2 py-0.5';

async function readFile(file: File): Promise<Uint8Array> {
  return readFileBytes(file);
}

export function DecodeInspector() {
  const map = useMemo(() => buildParamMap(), []);
  const [a, setA] = useState<Uint8Array | null>(null);
  const [b, setB] = useState<Uint8Array | null>(null);
  const [summaryA, setSummaryA] = useState<FileSummary | null>(null);
  function loadA(_name: string, bytes: Uint8Array) { setA(bytes); setSummaryA(summarizeFile(_name, bytes)); }

  // The ns4decode parameter map places program offsets: it applies to a Stage 4 program, not to a preset.
  const isStage4 = summaryA?.finding.generation === 'Stage 4' && !presetKindForTag(summaryA.finding.tag ?? '');
  const modelGuess = summaryA?.modelGuess;
  const fileView = useMemo(() => {
    if (!a) return null;
    const layout = fileByteMap(a, modelGuess);
    // Stage 4 names a byte by the ns4decode parameter map first, then by its firmware layout.
    const owners = isStage4 ? paramNamesByByte(map, a.length) : [];
    const byteInfo: ByteInfo[] = layout.bytes.map((info, i) => (owners[i]?.length ? { role: 'field', labels: owners[i] } : info));
    return {
      layout,
      byteInfo,
      decoded: isStage4 ? decodeAllParams(a, map) : [],
      gaps: isStage4 ? gapRanges(map, a.length) : [],
      coverage: isStage4 ? coveragePercent(map, a.length) : 0,
      magic: hasCbinMagic(a),
      tag: fileTypeTag(a),
    };
  }, [a, map, modelGuess, isStage4]);
  const diff = useMemo(() => (a && b ? new Set(diffBytes(a, b)) : new Set<number>()), [a, b]);
  const view = fileView && { ...fileView, diff };

  return (
    <div className="mx-auto max-w-[980px] p-4 text-ink">
      <p className="text-dim">
        Load any Nord program to inspect. Load a second to diff — the changed bytes reveal where a parameter lives.
      </p>
      {summaryA && <IdentifyPanel summary={summaryA} />}
      <div className="mb-3 flex gap-4">
        <label>File A&nbsp;
          <input type="file"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) f.arrayBuffer().then((buf) => loadA(f.name, new Uint8Array(buf))); }} />
        </label>
        <label>File B (diff)&nbsp;
          <input type="file"
            onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0]).then(setB)} />
        </label>
        <FixtureLoader onLoad={loadA} />
      </div>

      {view && (
        <>
          <div className="mb-3 flex flex-wrap gap-5 text-[13px]">
            <span>type: <b>{view.tag}</b>{view.magic ? ' ✓' : ' (no CBIN magic)'}</span>
            <span>size: <b>{a!.length}</b> B</span>
            {/* Coverage/gaps come from the Stage 4 param map — meaningless for other models. */}
            {isStage4 && <span>known-byte coverage: <b>{view.coverage.toFixed(1)}%</b></span>}
            {isStage4 && <span>gap regions: <b>{view.gaps.length}</b></span>}
            {b && <span className="text-warn">diff bytes: <b>{view.diff.size}</b></span>}
          </div>

          {isStage4 ? (
            <>
              <h3 className="mx-0 mt-2 mb-1">Coverage by engine</h3>
              <CoverageStrip bytes={a!} map={map} />

              <h3 className="mt-5">Decoded parameters ({view.decoded.length})</h3>
              <div className="max-h-[260px] overflow-auto border border-line">
                <table className="w-full border-collapse text-xs">
                  <thead><tr className="bg-surface text-left">
                    <th className={cellCls}>parameter</th><th className={cellCls}>value</th><th className={cellCls}>raw</th><th className={cellCls}>bits</th>
                  </tr></thead>
                  <tbody>
                    {view.decoded.map((d, i) => (
                      <tr key={i}>
                        <td className={cellCls}><span className={GROUP_TEXT[d.group]}>●</span> {d.name}</td>
                        <td className={cn(cellCls, 'font-semibold')}>{d.display}</td>
                        <td className={cn(cellCls, 'text-muted tabular-nums')}>{Number.isNaN(d.value) ? '—' : d.value}</td>
                        <td className={cn(cellCls, 'text-dim')}>{d.begBit}–{d.endBit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : view.layout.layoutName ? (
            <>
              <h3 className="mt-5">Parameters as stored ({view.layout.fields.length}, {view.layout.layoutName} layout)</h3>
              <div className="max-h-[260px] overflow-auto border border-line">
                <table className="w-full border-collapse text-xs">
                  <thead><tr className="bg-surface text-left">
                    <th className={cellCls}>parameter</th><th className={cellCls}>value</th><th className={cellCls}>bits</th>
                  </tr></thead>
                  <tbody>
                    {view.layout.fields.map((f) => (
                      <tr key={f.key}>
                        <td className={cellCls}>{f.key}</td>
                        <td className={cn(cellCls, 'font-semibold tabular-nums')}>{f.value}</td>
                        <td className={cn(cellCls, 'text-dim')}>{f.fileBit}–{f.fileBit + f.width - 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-xs text-dim">{view.layout.note ?? 'No parameter layout for this file.'} Byte grid + diff only.</p>
          )}

          <h3 className="mt-4">Bytes</h3>
          <Legend unmapped={view.byteInfo.some((x) => x.role === 'unmapped')} />
          <ByteGrid bytes={a!} info={view.byteInfo} diff={view.diff} />

          {b && view.diff.size > 0 && <DiffList diff={[...view.diff]} info={view.byteInfo} />}
        </>
      )}
    </div>
  );
}

/** A small color-swatch + label, used by both legends below. `bgClass` is a
 *  literal Tailwind background-utility string (e.g. `bg-[var(--di-known)]`). */
function Swatch({ bgClass, label }: { bgClass: string; label: string }) {
  return (
    <span className="mr-3 inline-flex items-center gap-1">
      <span className={cn('inline-block h-3 w-3 rounded-[2px]', bgClass)} /> {label}
    </span>
  );
}

/** Grey: bits the layout reserves, which the instrument doesn't use. Red only appears where no layout covers a byte. */
const ROLE_BG: Record<ByteInfo['role'], string> = {
  header: 'bg-[var(--di-known)]', structure: 'bg-[var(--di-known)]', field: 'bg-[var(--di-known)]',
  unused: 'bg-surface-2', unmapped: 'bg-[var(--di-gap)]',
};

function Legend({ unmapped }: { unmapped: boolean }) {
  return (
    <div className="mb-1.5 text-xs">
      <Swatch bgClass="bg-[var(--di-known)]" label="known" />
      <Swatch bgClass="bg-surface-2" label="unused (reserved)" />
      {unmapped && <Swatch bgClass="bg-[var(--di-gap)]" label="not mapped" />}
      <Swatch bgClass="bg-[var(--di-changed)]" label="changed (diff)" />
    </div>
  );
}

/** How a diff line reads per role: only a byte no layout covers is flagged. */
const ROLE_TEXT: Partial<Record<ByteInfo['role'], string>> = { unused: 'italic text-dim', unmapped: 'italic text-danger' };

function describeByte(info: ByteInfo): string {
  if (info.role === 'unused') return `unused (${info.labels.join(', ')})`;
  if (info.role === 'unmapped') return 'not mapped (no layout for this byte)';
  return info.labels.join(', ');
}

// Section-colored coverage bar — the live, per-file equivalent of ns4decode's
// "Program file bits decoded" picture: each byte tinted by its engine, gaps
// pale. Hover a segment to see the byte and the parameter(s) that claim it.
function CoverageStrip({ bytes, map }: { bytes: Uint8Array; map: ReturnType<typeof buildParamMap> }) {
  const groups: Ns4Group[] = ['m', 'o', 'p', 'y'];
  return (
    <>
      <div className="flex h-[26px] w-full overflow-hidden rounded-[3px] border border-line">
        {Array.from(bytes).map((_, i) => {
          const g = groupOfByte(map, i);
          const owners = paramsCoveringByte(map, i).map((p) => p.name);
          const title = `byte ${i}` + (g ? ` — ${GROUP_LABEL[g]}\n${owners.join('\n')}` : '\n(gap — undecoded)');
          return <span key={i} title={title} className={cn('flex-1', g ? GROUP_BG[g] : 'bg-surface-2')} />;
        })}
      </div>
      <div className="mt-1 text-xs">
        {groups.map((g) => <Swatch key={g} bgClass={GROUP_BG[g]} label={GROUP_LABEL[g]} />)}
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-[2px] border border-line bg-surface-2" /> gap
        </span>
      </div>
    </>
  );
}

function ByteGrid({ bytes, info, diff }: { bytes: Uint8Array; info: ByteInfo[]; diff: Set<number> }) {
  return (
    <div className="flex flex-wrap gap-px font-mono text-[10px]">
      {Array.from(bytes).map((byteVal, i) => {
        const bg = diff.has(i) ? 'bg-[var(--di-changed)]' : ROLE_BG[info[i].role];
        const title = `byte ${i}: 0x${byteVal.toString(16).padStart(2, '0')}\n${describeByte(info[i])}`;
        return (
          <span key={i} title={title}
            className={cn('h-4 w-5 rounded-[2px] text-center leading-4', bg)}>
            {byteVal.toString(16).padStart(2, '0')}
          </span>
        );
      })}
    </div>
  );
}

function DiffList({ diff, info }: { diff: number[]; info: ByteInfo[] }) {
  return (
    <>
      <h3 className="mt-5">What changed</h3>
      <ul className="text-[13px]">
        {diff.map((i) => {
          const b = info[i];
          return (
            <li key={i}>
              byte {i} — <span className={ROLE_TEXT[b.role]}>{describeByte(b)}</span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
