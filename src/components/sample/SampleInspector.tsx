import { useEffect, useRef, useState } from 'react';
import '../../styles/nord.css';
import { readNsmp, decodeNsmp, readNsmpZones, type NsmpFile, type DecodedStrokeResult, type NsmpZone } from '../../lib/ns4/nsmp';
import { sampleHeaderView, zoneMapRows, strokeSummary } from '../../lib/ns4/sample-view';
import { editModel } from '../../lib/ns4/sample-edit';
import { SampleHeader } from './SampleHeader';
import { ZoneMap } from './ZoneMap';
import { StrokeList, type InspectorStroke } from './StrokeList';
import { SampleEditPanel } from './SampleEditPanel';
import { SampleConvert } from './SampleConvert';

interface Loaded {
  bytes: Uint8Array;
  file: NsmpFile;
  /** Source filename stem — display fallback when the file carries no name (OG). */
  name: string;
  decoded: DecodedStrokeResult[];
  /** Zone map parsed once at load (consumed by the editor's initial model). */
  zones: NsmpZone[];
  strokes: InspectorStroke[];
  /** Codec we can decode audio for — OG (legacy), 3 or 4. */
  decodable: boolean;
  /** Monotonic load id — keys the editor so it remounts per file (drops stale edits). */
  loadId: number;
}

export interface InspectorInput { bytes: Uint8Array; name: string; }

export function SampleInspector({ initial }: { initial?: InspectorInput } = {}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const loadCount = useRef(0);

  async function loadBytes(bytes: Uint8Array, name: string) {
    const file = readNsmp(bytes);
    const decodable = file.codec === 3 || file.codec === 4 || file.legacy;
    let decoded: DecodedStrokeResult[] = [];
    if (decodable) {
      try { decoded = decodeNsmp(bytes); } catch { decoded = []; }
    }
    const zones: NsmpZone[] = file.recognized ? readNsmpZones(bytes) : [];
    const strokes: InspectorStroke[] = decoded.map((d) => ({ summary: strokeSummary(d), channels: d.channels }));
    const stem = name.replace(/\.[^./]+$/, '');
    setLoaded({ bytes, file, name: stem, decoded, zones, strokes, decodable, loadId: ++loadCount.current });
  }

  async function onFile(f: File) {
    await loadBytes(new Uint8Array(await f.arrayBuffer()), f.name);
  }

  useEffect(() => {
    if (initial) void loadBytes(initial.bytes, initial.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  return (
    <div>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
        style={{ display: 'block', padding: 28, borderRadius: 'var(--r-lg)', marginBottom: 16, cursor: 'pointer',
          background: dragOver ? 'var(--surface)' : 'transparent',
          border: `2px dashed ${dragOver ? 'var(--red)' : 'var(--line)'}`, textAlign: 'center', color: 'var(--dim)' }}
      >
        <div style={{ color: 'var(--ink)', fontWeight: 600 }}>Drop a Nord sample here</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>or click to choose one — <code>.nsmp</code>, <code>.nsmp3</code> or <code>.nsmp4</code></div>
        <input type="file" accept=".nsmp,.nsmp3,.nsmp4" style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </label>

      {loaded && !loaded.file.recognized && (
        <div className="ps">
          <p>Not a recognized Nord sample.</p>
          <ul>{loaded.file.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}

      {loaded && loaded.file.recognized && (
        <div className="ps">
          <SampleHeader view={sampleHeaderView(loaded.file, loaded.bytes.length, loaded.name)} />

          {/* Keyboard-map editor leads once we've decoded the key map; edits patch
              back into the file in place (audio preserved). Otherwise a friendly
              note + the read-only key map. */}
          {(loaded.file.codec === 3 || loaded.file.codec === 4) && loaded.zones.length > 0
            ? <SampleEditPanel
                key={loaded.loadId}
                initial={editModel(loaded.file, loaded.zones)}
                bytes={loaded.bytes}
                codec={loaded.file.codec === 4 ? 4 : 3}
              />
            : (
              <div className="ps-card" style={{ marginTop: 12 }}>
                <p className="ps-sub" style={{ margin: 0 }}>
                  Editing isn't available yet — we couldn't read this sample's key map
                  {loaded.file.legacy ? '. Convert it to .nsmp3 / .nsmp4 below, then edit the result' : ''}.
                </p>
              </div>
            )}

          {loaded.decodable && <SampleConvert bytes={loaded.bytes} file={loaded.file} name={loaded.name} />}
          <StrokeList strokes={loaded.strokes} playable={loaded.decodable} name={loaded.file.name?.trim() || loaded.name} />

          {/* Raw key/velocity table — only when we couldn't build the editor. */}
          {!((loaded.file.codec === 3 || loaded.file.codec === 4) && loaded.zones.length > 0)
            && <ZoneMap rows={zoneMapRows(loaded.bytes)} />}
        </div>
      )}
    </div>
  );
}
