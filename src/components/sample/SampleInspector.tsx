import { useRef, useState } from 'react';
import '../../styles/nord.css';
import { readNsmp, decodeNsmp, readNsmpZones, type NsmpFile, type DecodedStrokeResult, type NsmpZone } from '../../lib/ns4/nsmp';
import { sampleHeaderView, zoneMapRows, strokeSummary } from '../../lib/ns4/sample-view';
import { editModel } from '../../lib/ns4/sample-edit';
import { SampleHeader } from './SampleHeader';
import { ZoneMap } from './ZoneMap';
import { StrokeList, type InspectorStroke } from './StrokeList';
import { SampleEditPanel } from './SampleEditPanel';

interface Loaded {
  bytes: Uint8Array;
  file: NsmpFile;
  decoded: DecodedStrokeResult[];
  /** Zone map parsed once at load (consumed by the editor's initial model). */
  zones: NsmpZone[];
  strokes: InspectorStroke[];
  /** Codec we can decode audio for (3 or 4). */
  decodable: boolean;
  /** Monotonic load id — keys the editor so it remounts per file (drops stale edits). */
  loadId: number;
}

export function SampleInspector() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const loadCount = useRef(0);

  async function onFile(f: File) {
    const bytes = new Uint8Array(await f.arrayBuffer());
    const file = readNsmp(bytes);
    // Codec 3 and 4 both decode (4 via the word-interleaved path); legacy 1/2 don't.
    const decodable = file.codec === 3 || file.codec === 4;
    let decoded: DecodedStrokeResult[] = [];
    if (decodable) {
      try {
        decoded = decodeNsmp(bytes);
      } catch {
        decoded = [];
      }
    }
    const zones: NsmpZone[] = file.recognized ? readNsmpZones(bytes) : [];
    const strokes: InspectorStroke[] = decoded.map((d) => ({ summary: strokeSummary(d), channels: d.channels }));
    setLoaded({ bytes, file, decoded, zones, strokes, decodable, loadId: ++loadCount.current });
  }

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
        <div style={{ fontSize: 12, marginTop: 4 }}>or click to choose one — <code>.nsmp3</code> or <code>.nsmp4</code></div>
        <input type="file" accept=".nsmp3,.nsmp4" style={{ display: 'none' }}
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
          <SampleHeader view={sampleHeaderView(loaded.file, loaded.bytes.length)} />
          {/* Editor only when every zone has decoded audio (positional pairing needs
              one stroke per zone) — otherwise fall back to the read-only zone map. */}
          {loaded.decodable && loaded.zones.length > 0 && loaded.decoded.length === loaded.zones.length
            ? <SampleEditPanel
                key={loaded.loadId}
                initial={editModel(loaded.file, loaded.zones)}
                decoded={loaded.decoded}
                codec={loaded.file.codec === 4 ? 4 : 3}
              />
            : <ZoneMap rows={zoneMapRows(loaded.bytes)} />}
          <StrokeList strokes={loaded.strokes} playable={loaded.decodable} />
        </div>
      )}
    </div>
  );
}
