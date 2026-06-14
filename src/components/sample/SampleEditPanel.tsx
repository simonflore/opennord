import { useState } from 'react';
import type { DecodedStrokeResult } from '../../lib/ns4/nsmp';
import { buildEditedNsmp, type EditModel } from '../../lib/ns4/sample-edit';
import { downloadBytes } from '../../lib/download';

/** Editable name + zone map (root/top/velocity) → rebuild + download a new .nsmp. */
export function SampleEditPanel({ initial, decoded, codec }: {
  initial: EditModel;
  decoded: DecodedStrokeResult[];
  codec: 3 | 4;
}) {
  const [name, setName] = useState(initial.name);
  const [zones, setZones] = useState(initial.zones);
  const [error, setError] = useState('');

  function setZone(i: number, patch: Partial<EditModel['zones'][number]>) {
    setZones((zs) => zs.map((z, j) => (j === i ? { ...z, ...patch } : z)));
  }

  function download() {
    setError('');
    try {
      const bytes = buildEditedNsmp({ name, zones }, decoded, codec);
      downloadBytes(bytes, `${name.trim() || 'sample'}.nsmp${codec}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const num = (v: number, on: (n: number) => void) => (
    <input type="number" min={0} max={127} value={v}
      onChange={(e) => on(Math.max(0, Math.min(127, Number(e.target.value) || 0)))}
      style={{ width: 56, padding: 2 }} />
  );

  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>EDIT</h4>
      <label className="ps-sub" style={{ display: 'block', marginBottom: 8 }}>
        Name:&nbsp;
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 4 }} />
      </label>
      <table className="ps-params">
        <thead><tr><th>zone</th><th>root</th><th>up to</th><th>vel ≤</th></tr></thead>
        <tbody>
          {zones.map((z, i) => (
            <tr key={i}>
              <td>{i}</td>
              <td>{num(z.rootKey, (n) => setZone(i, { rootKey: n }))}</td>
              <td>{num(z.keyHigh, (n) => setZone(i, { keyHigh: n }))}</td>
              <td>{num(z.velTop, (n) => setZone(i, { velTop: n }))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={download}
          style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, border: '1px solid var(--red)', background: 'var(--red)', color: '#fff' }}>
          Download edited .nsmp
        </button>
        <span className="ps-sub" style={{ margin: 0 }}>Rebuilds the whole sample — back up before loading.</span>
      </div>
      {error && <p className="ps-sub" style={{ color: 'var(--warn)' }}>{error}</p>}
    </div>
  );
}
