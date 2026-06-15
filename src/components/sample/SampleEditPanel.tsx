import { useState } from 'react';
import type { DecodedStrokeResult } from '../../lib/ns4/nsmp';
import { buildEditedNsmp, type EditModel } from '../../lib/ns4/sample-edit';
import { noteName } from '../../lib/ns4/sample-view';
import { downloadBytes } from '../../lib/download';
import { Button } from '../ui';
import { KeyboardZoneMap } from './KeyboardZoneMap';

/** Keyboard-map editor: drag the splits to remap, fine-tune the selected sample,
 *  rename, and rebuild + download a new .nsmp. */
export function SampleEditPanel({ initial, decoded, codec }: {
  initial: EditModel;
  decoded: DecodedStrokeResult[];
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
      const bytes = buildEditedNsmp({ name, zones }, decoded, codec);
      downloadBytes(bytes, `${name.trim() || 'sample'}.nsmp${codec}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const num = (v: number, on: (n: number) => void) => (
    <input type="number" min={0} max={127} value={v} className="ps-kbd-num"
      onChange={(e) => on(Math.max(0, Math.min(127, Number(e.target.value) || 0)))} />
  );

  const sel = zones[selected];

  return (
    <div className="ps-card" style={{ marginTop: 12 }}>
      <h4>EDIT · KEYBOARD MAP</h4>

      <KeyboardZoneMap
        zones={zones}
        selected={selected}
        onSelect={setSelected}
        onChangeKeyHigh={(i, keyHigh) => setZone(i, { keyHigh })}
      />

      {sel && (
        <div className="ps-kbd-edit">
          <span className="ps-kbd-edit__t">Sample {selected + 1}</span>
          <label>root {num(sel.rootKey, (n) => setZone(selected, { rootKey: n }))} <em>{noteName(sel.rootKey)}</em></label>
          <label>up to {num(sel.keyHigh, (n) => setZone(selected, { keyHigh: n }))} <em>{noteName(sel.keyHigh)}</em></label>
          <label>vel ≤ {num(sel.velTop, (n) => setZone(selected, { velTop: n }))}</label>
        </div>
      )}

      <label className="ps-sub" style={{ display: 'block', margin: '12px 0 8px' }}>
        Name:&nbsp;
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 4 }} />
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={download}>Download edited .nsmp{codec}</Button>
        <span className="ps-sub" style={{ margin: 0 }}>Rebuilds the whole sample — back up before loading.</span>
      </div>
      {error && <p className="ps-sub on-error">{error}</p>}
    </div>
  );
}
