import { useState } from 'react';
import { patchEditedNsmp, type EditModel } from '../../lib/ns4/sample-edit';
import { tileZones } from '../../lib/ns4/keyboard-view';
import { noteName, gainDetuneView } from '../../lib/ns4/sample-view';
import { downloadBytes } from '../../lib/download';
import { Button } from '../ui';
import { KeyboardZoneMap } from './KeyboardZoneMap';

/** One decimal place, dropping a trailing ".0" (e.g. -6, 2.9). */
const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Keyboard-map editor: drag the splits on the keybed, or edit any field of any
 *  zone in the synced table below; rename, then patch + download a new .nsmp.
 *  Edits are written back into the original file in place — audio and everything
 *  we don't model are preserved exactly. */
export function SampleEditPanel({ initial, bytes, codec, onPlayZone }: {
  initial: EditModel;
  bytes: Uint8Array;
  codec: 3 | 4;
  /** Audition a zone's sample by index — wired to the keyboard + table rows. */
  onPlayZone?: (index: number) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [zones, setZones] = useState(initial.zones);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState('');
  // Global gain (dB) + detune (cents), read from the file and editable. Strings
  // so a transient "−" or empty field is allowed mid-typing; parsed on download.
  const gd = gainDetuneView(bytes);
  const [gainDb, setGainDb] = useState(gd ? String(round1(gd.gainDb)) : '0');
  const [detuneCents, setDetuneCents] = useState(gd ? String(gd.detuneCents) : '0');

  function setZone(i: number, patch: Partial<EditModel['zones'][number]>) {
    setZones((zs) => zs.map((z, j) => (j === i ? { ...z, ...patch } : z)));
  }

  function download() {
    setError('');
    try {
      const out = patchEditedNsmp(bytes, {
        name, zones,
        globalGainDb: gd ? (Number(gainDb) || 0) : undefined,
        globalDetuneCents: gd ? Math.round(Number(detuneCents) || 0) : undefined,
      });
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
        onPlayZone={onPlayZone}
      />

      <table className="ps-params ps-zone-tbl">
        <thead><tr>
          <th>sample</th><th>root</th><th>from</th><th>up to (split)</th><th>vel ≥</th><th>vel ≤</th>
        </tr></thead>
        <tbody>
          {/* Rows in keyboard order (left→right) so S-numbers match the map above;
              edits still address the original zone by its index (tz.index). */}
          {tileZones(zones).map((tz, pos) => {
            const i = tz.index;
            const z = zones[i];
            return (
              <tr key={i} className={i === selected ? 'sel' : ''} onClick={() => { setSelected(i); onPlayZone?.(i); }}>
                <td>S{pos + 1}</td>
                <td>{num(z.rootKey, (n) => setZone(i, { rootKey: n }))}<em>{noteName(z.rootKey)}</em></td>
                <td>{num(z.keyLow, (n) => setZone(i, { keyLow: n }))}<em>{noteName(z.keyLow)}</em></td>
                <td>{num(z.keyHigh, (n) => setZone(i, { keyHigh: n }))}<em>{noteName(z.keyHigh)}</em></td>
                <td>{num(z.velLow, (n) => setZone(i, { velLow: n }))}</td>
                <td>{num(z.velTop, (n) => setZone(i, { velTop: n }))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {gd && (
        <div className="ps-sub" style={{ display: 'flex', gap: 18, alignItems: 'center', margin: '12px 0 0', flexWrap: 'wrap' }}>
          <label>Gain&nbsp;
            <input type="number" step={0.1} value={gainDb} className="ps-kbd-num" style={{ width: 64 }}
              onChange={(e) => setGainDb(e.target.value)} /> dB
          </label>
          <label>Detune&nbsp;
            <input type="number" step={1} value={detuneCents} className="ps-kbd-num" style={{ width: 64 }}
              onChange={(e) => setDetuneCents(e.target.value)} /> ¢
          </label>
        </div>
      )}

      <label className="ps-sub" style={{ display: 'block', margin: '12px 0 8px' }}>
        Name:&nbsp;
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 4 }} />
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={download}>Download edited .nsmp{codec}</Button>
        <span className="ps-sub" style={{ margin: 0 }}>
          Edits root / split / velocity / gain / detune and name; audio and all other settings are preserved. Back up first.
        </span>
      </div>
      {error && <p className="ps-sub on-error">{error}</p>}
    </div>
  );
}
