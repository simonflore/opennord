import { useState, type ReactNode } from 'react';
import { parseNs4Program } from './lib/ns4/parse';
import { programNameFromFilename } from './lib/ns4/name';
import type { NS4Program } from './lib/ns4/types';
import { DecodeInspector } from './components/DecodeInspector';
import { ProgramView } from './components/program/ProgramView';

type Tab = 'studio' | 'inspect' | 'decode';

/**
 * App shell. Three views:
 *  - Studio:  the read-only Program Studio patch view (the product).
 *  - Inspect: the reverse-engineering tool — known vs. gap bytes, diff files.
 *  - Decode:  raw NS4Program JSON (debugging).
 * See docs/ROADMAP.md and docs/FORMAT.md.
 */
export function App() {
  const [tab, setTab] = useState<Tab>('studio');

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h1>OpenNord</h1>
      <nav style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <TabButton active={tab === 'studio'} onClick={() => setTab('studio')}>Program Studio</TabButton>
        <TabButton active={tab === 'inspect'} onClick={() => setTab('inspect')}>Decode Inspector</TabButton>
        <TabButton active={tab === 'decode'} onClick={() => setTab('decode')}>Program Decode</TabButton>
      </nav>

      {tab === 'studio' && <ProgramStudio />}
      {tab === 'inspect' && <DecodeInspector />}
      {tab === 'decode' && <ProgramDecode />}

      <footer style={{ marginTop: 48, fontSize: 12, color: '#999' }}>
        Not affiliated with Clavia DMI AB / Nord Keyboards. AGPL-3.0. Format decoding ported
        from ns4decode by Randy (MIT) — see THIRD_PARTY_LICENSES.md.
      </footer>
    </main>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
      border: '1px solid #ddd', background: active ? '#111' : '#fff', color: active ? '#fff' : '#111',
    }}>{children}</button>
  );
}

function ProgramStudio() {
  const [program, setProgram] = useState<NS4Program | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function onFile(file: File) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const p = parseNs4Program(bytes);
    p.name = programNameFromFilename(file.name);
    setProgram(p);
  }

  return (
    <div>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        style={{
          display: 'block', padding: 24, borderRadius: 12, marginBottom: 16, cursor: 'pointer',
          border: `2px dashed ${dragOver ? '#c8102e' : '#ccc'}`, textAlign: 'center', color: '#666',
        }}
      >
        Drop a <code>.ns4p</code> here, or click to choose a file.
        <input type="file" accept=".ns4p,.ns4o,.ns4n,.ns4y" style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </label>
      {program && <ProgramView program={program} />}
    </div>
  );
}

function ProgramDecode() {
  const [program, setProgram] = useState<NS4Program | null>(null);
  const [fileName, setFileName] = useState('');

  async function onFile(file: File) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    setFileName(file.name);
    setProgram(parseNs4Program(bytes));
  }

  return (
    <div>
      <input type="file" accept=".ns4p,.ns4o,.ns4n,.ns4y"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {program && (
        <section style={{ marginTop: 16 }}>
          <h3>{fileName}</h3>
          <p>{program.parsed
            ? `Recognized ${program.kind} — ${program.bytes.length} bytes`
            : `Recognized ${program.bytes.length} bytes; structured decode in progress (docs/FORMAT.md).`}</p>
          <pre style={{ background: '#f6f6f6', padding: 12, overflow: 'auto' }}>
            {JSON.stringify(program, (k, v) => (k === 'bytes' ? `<${(v as Uint8Array).length} bytes>` : v), 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
