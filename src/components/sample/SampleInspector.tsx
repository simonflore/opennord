import { useState } from 'react';
import '../../styles/nord.css';
import { readNsmp, decodeNsmp, type NsmpFile } from '../../lib/ns4/nsmp';
import { sampleHeaderView, zoneMapRows, strokeSummary } from '../../lib/ns4/sample-view';
import { SampleHeader } from './SampleHeader';
import { ZoneMap } from './ZoneMap';
import { StrokeList, type InspectorStroke } from './StrokeList';

interface Loaded {
  bytes: Uint8Array;
  file: NsmpFile;
  strokes: InspectorStroke[];
}

export function SampleInspector() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function onFile(f: File) {
    const bytes = new Uint8Array(await f.arrayBuffer());
    const file = readNsmp(bytes);
    let strokes: InspectorStroke[] = [];
    if (file.codec === 3) {
      try {
        strokes = decodeNsmp(bytes).map((d) => ({ summary: strokeSummary(d), channels: d.channels }));
      } catch {
        strokes = [];
      }
    }
    setLoaded({ bytes, file, strokes });
  }

  return (
    <div>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
        style={{ display: 'block', padding: 24, borderRadius: 12, marginBottom: 16, cursor: 'pointer',
          border: `2px dashed ${dragOver ? '#c8102e' : '#ccc'}`, textAlign: 'center', color: '#666' }}
      >
        Drop a <code>.nsmp3</code> / <code>.nsmp4</code> here, or click to choose a file.
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
          <ZoneMap rows={zoneMapRows(loaded.bytes)} />
          <StrokeList strokes={loaded.strokes} playable={loaded.file.codec === 3} />
        </div>
      )}
    </div>
  );
}
