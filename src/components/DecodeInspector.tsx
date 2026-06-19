/**
 * Decode Inspector — the in-browser reverse-engineering tool.
 *
 * Load a .ns4p and see every byte: green where a known parameter claims it, red
 * where it's still a gap. Load a SECOND file to diff — change one knob on the
 * Nord, re-export, and the changed bytes light up yellow, naming the parameter
 * if known or flagging a gap to decode. This is how the format gets filled in.
 */

import { useMemo, useState, type CSSProperties } from 'react';
import './decode-inspector.css';
import { bytesToBitString, fileTypeTag, hasCbinMagic } from '../lib/ns4/bits';
import { buildParamMap } from '../lib/ns4/maps';
import {
  decodeAllParams,
  claimedByteSet,
  gapRanges,
  coveragePercent,
  diffBytes,
  paramsCoveringByte,
  groupOfByte,
} from '../lib/ns4/coverage';
import type { Ns4Group } from '../lib/ns4/maps';

// Engine-group dot/segment colors — resolved from the --di-* data-viz tokens
// defined on the `.di` container in decode-inspector.css.
const GROUP_COLOR: Record<Ns4Group, string> = {
  m: 'var(--di-m)', // master / global
  o: 'var(--di-o)', // organ
  p: 'var(--di-p)', // piano
  y: 'var(--di-y)', // synth
};
const GROUP_LABEL: Record<Ns4Group, string> = { m: 'master', o: 'organ', p: 'piano', y: 'synth' };

async function readFile(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

export function DecodeInspector() {
  const map = useMemo(() => buildParamMap(), []);
  const [a, setA] = useState<Uint8Array | null>(null);
  const [b, setB] = useState<Uint8Array | null>(null);

  const view = useMemo(() => {
    if (!a) return null;
    const claimed = claimedByteSet(map, a.length);
    const diff = b ? new Set(diffBytes(a, b)) : new Set<number>();
    return {
      bits: bytesToBitString(a),
      decoded: decodeAllParams(a, map),
      claimed,
      diff,
      gaps: gapRanges(map, a.length),
      coverage: coveragePercent(map, a.length),
      magic: hasCbinMagic(a),
      tag: fileTypeTag(a),
    };
  }, [a, b, map]);

  return (
    <div className="di" style={{ maxWidth: 980, margin: '0 auto', padding: 16 }}>
      <p style={{ color: 'var(--dim)' }}>
        Load a <code>.ns4p</code> to inspect. Load a second one to diff — the changed bytes
        reveal where a parameter lives.
      </p>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <label>File A&nbsp;
          <input type="file" accept=".ns4p,.ns4o,.ns4n,.ns4y"
            onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0]).then(setA)} />
        </label>
        <label>File B (diff)&nbsp;
          <input type="file" accept=".ns4p,.ns4o,.ns4n,.ns4y"
            onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0]).then(setB)} />
        </label>
      </div>

      {view && (
        <>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12, fontSize: 13 }}>
            <span>type: <b>{view.tag}</b>{view.magic ? ' ✓' : ' (no CBIN magic)'}</span>
            <span>size: <b>{a!.length}</b> B</span>
            <span>known-byte coverage: <b>{view.coverage.toFixed(1)}%</b></span>
            <span>gap regions: <b>{view.gaps.length}</b></span>
            {b && <span style={{ color: 'var(--warn)' }}>diff bytes: <b>{view.diff.size}</b></span>}
          </div>

          <h3 style={{ margin: '8px 0 4px' }}>Coverage by engine</h3>
          <CoverageStrip bytes={a!} map={map} />

          <h3 style={{ marginTop: 16 }}>Bytes</h3>
          <Legend />
          <ByteGrid bytes={a!} claimed={view.claimed} diff={view.diff} map={map} />

          <h3 style={{ marginTop: 20 }}>Decoded parameters ({view.decoded.length})</h3>
          <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid var(--line)' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
              <thead><tr style={{ textAlign: 'left', background: 'var(--surface)' }}>
                <th style={cell}>parameter</th><th style={cell}>value</th><th style={cell}>raw</th><th style={cell}>bits</th>
              </tr></thead>
              <tbody>
                {view.decoded.map((d, i) => (
                  <tr key={i}>
                    <td style={cell}><span style={{ color: GROUP_COLOR[d.group] }}>●</span> {d.name}</td>
                    <td style={{ ...cell, fontWeight: 600 }}>{d.display}</td>
                    <td style={{ ...cell, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{Number.isNaN(d.value) ? '—' : d.value}</td>
                    <td style={{ ...cell, color: 'var(--dim)' }}>{d.begBit}–{d.endBit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {b && view.diff.size > 0 && <DiffList diff={[...view.diff]} map={map} />}
        </>
      )}
    </div>
  );
}

const cell: CSSProperties = { padding: '2px 8px', borderBottom: '1px solid var(--line)' };

function Legend() {
  const sw = (c: string, label: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
      <span style={{ width: 12, height: 12, background: c, display: 'inline-block', borderRadius: 2 }} /> {label}
    </span>
  );
  return (
    <div style={{ fontSize: 12, marginBottom: 6 }}>
      {sw('var(--di-known)', 'known')}{sw('var(--di-gap)', 'gap')}{sw('var(--di-changed)', 'changed (diff)')}
    </div>
  );
}

// Section-colored coverage bar — the live, per-file equivalent of ns4decode's
// "Program file bits decoded" picture: each byte tinted by its engine, gaps
// pale. Hover a segment to see the byte and the parameter(s) that claim it.
function CoverageStrip({ bytes, map }: { bytes: Uint8Array; map: ReturnType<typeof buildParamMap> }) {
  const groups: Ns4Group[] = ['m', 'o', 'p', 'y'];
  return (
    <>
      <div style={{ display: 'flex', width: '100%', height: 26, borderRadius: 3, overflow: 'hidden', border: '1px solid var(--line)' }}>
        {Array.from(bytes).map((_, i) => {
          const g = groupOfByte(map, i);
          const owners = paramsCoveringByte(map, i).map((p) => p.name);
          const title = `byte ${i}` + (g ? ` — ${GROUP_LABEL[g]}\n${owners.join('\n')}` : '\n(gap — undecoded)');
          return <span key={i} title={title} style={{ flex: 1, background: g ? GROUP_COLOR[g] : 'var(--surface-2)' }} />;
        })}
      </div>
      <div style={{ fontSize: 12, marginTop: 4 }}>
        {groups.map((g) => (
          <span key={g} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
            <span style={{ width: 12, height: 12, background: GROUP_COLOR[g], display: 'inline-block', borderRadius: 2 }} /> {GROUP_LABEL[g]}
          </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, background: 'var(--surface-2)', display: 'inline-block', borderRadius: 2, border: '1px solid var(--line)' }} /> gap
        </span>
      </div>
    </>
  );
}

function ByteGrid({ bytes, claimed, diff, map }: {
  bytes: Uint8Array; claimed: Set<number>; diff: Set<number>; map: ReturnType<typeof buildParamMap>;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1, fontFamily: 'ui-monospace, monospace', fontSize: 10 }}>
      {Array.from(bytes).map((byteVal, i) => {
        const bg = diff.has(i) ? 'var(--di-changed)' : claimed.has(i) ? 'var(--di-known)' : 'var(--di-gap)';
        const owners = paramsCoveringByte(map, i).map((p) => p.name);
        const title = `byte ${i}: 0x${byteVal.toString(16).padStart(2, '0')}` +
          (owners.length ? `\n${owners.join('\n')}` : '\n(unclaimed — gap)');
        return (
          <span key={i} title={title}
            style={{ width: 20, height: 16, lineHeight: '16px', textAlign: 'center', background: bg, borderRadius: 2 }}>
            {byteVal.toString(16).padStart(2, '0')}
          </span>
        );
      })}
    </div>
  );
}

function DiffList({ diff, map }: { diff: number[]; map: ReturnType<typeof buildParamMap> }) {
  return (
    <>
      <h3 style={{ marginTop: 20 }}>What changed</h3>
      <ul style={{ fontSize: 13 }}>
        {diff.map((i) => {
          const owners = paramsCoveringByte(map, i).map((p) => p.name);
          return (
            <li key={i}>
              byte {i} — {owners.length ? owners.join(', ') : <em style={{ color: 'var(--red)' }}>unknown (gap to decode)</em>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
