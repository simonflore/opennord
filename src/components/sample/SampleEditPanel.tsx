import { useState } from 'react';
import { patchEditedNsmp, type EditModel } from '../../lib/ns4/sample-edit';
import { noteName } from '../../lib/ns4/sample-view';
import { downloadBytes } from '../../lib/download';
import { Button } from '../ui';
import { KeyboardZoneMap } from './KeyboardZoneMap';

/** Keyboard-map editor: drag the splits on the keybed, or edit any field of any
 *  zone in the synced table below; rename, then patch + download a new .nsmp.
 *  Edits are written back into the original file in place — audio and everything
 *  we don't model are preserved exactly. */
export function SampleEditPanel({ initial, bytes, codec }: {
  initial: EditModel;
  bytes: Uint8Array;
  codec: 3 | 4;
}) {
  const [name, setName] = useState(initial.name);
  const [zones, setZones] = useState(initial.zones);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState('');

  function setZone(i: number, patch: Partial<EditModel['zones'][number]>) {
    setZones((zs) => zs.map((z, j) => (j === i ? { ...z, ...patch } : z)));
  }

  function download() {
    setError('');
    try {
      const out = patchEditedNsmp(bytes, { name, zones });
      downloadBytes(out, `${name.trim() || 'sample'}.nsmp${codec}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const num = (v: number, on: (n: number) => void) => (
    <input type="number" min={0} max={127} value={v} className="ps-kbd-num"
      onChange={(e) => on(Math.max(0, Math.min(127, Number(e.target.value) || 0)))}
      onClick={(e) => e.stopPropagation()} />
  );

  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>EDIT · KEYBOARD MAP</h4>

      <KeyboardZoneMap
        zones={zones}
        selected={selected}
        onSelect={setSelected}
        onChangeKeyHigh={(i, keyHigh) => setZone(i, { keyHigh })}
      />

      <table className="ps-params ps-zone-tbl">
        <thead><tr><th>sample</th><th>root</th><th>up to (split)</th><th>vel ≤</th></tr></thead>
        <tbody>
          {zones.map((z, i) => (
            <tr key={i} className={i === selected ? 'sel' : ''} onClick={() => setSelected(i)}>
              <td>S{i + 1}</td>
              <td>{num(z.rootKey, (n) => setZone(i, { rootKey: n }))}<em>{noteName(z.rootKey)}</em></td>
              <td>{num(z.keyHigh, (n) => setZone(i, { keyHigh: n }))}<em>{noteName(z.keyHigh)}</em></td>
              <td>{num(z.velTop, (n) => setZone(i, { velTop: n }))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <label className="ps-sub" style={{ display: 'block', margin: '12px 0 8px' }}>
        Name:&nbsp;
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 4 }} />
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={download}>Download edited .nsmp{codec}</Button>
        <span className="ps-sub" style={{ margin: 0 }}>
          Edits root / split / velocity and name; audio and all other settings are preserved. Back up first.
        </span>
      </div>
      {error && <p className="ps-sub on-error">{error}</p>}
    </div>
  );
}
