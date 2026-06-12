import { useState } from 'react';
import { parseNs4Program } from './lib/ns4/parse';
import type { NS4Program } from './lib/ns4/types';

/**
 * Pre-alpha shell: drop a .ns4p and see what we can decode so far. This is the
 * smallest honest thing — reading a program from a file, no keyboard required.
 * Visualization, the community library, AI search, and device transfer build
 * out from here (see docs/ROADMAP.md).
 */
export function App() {
  const [program, setProgram] = useState<NS4Program | null>(null);
  const [fileName, setFileName] = useState<string>('');

  async function onFile(file: File) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    setFileName(file.name);
    setProgram(parseNs4Program(bytes));
  }

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1>OpenNord</h1>
      <p style={{ color: '#666' }}>
        Open, AI-native companion for the Nord Stage 4 — pre-alpha. Drop a{' '}
        <code>.ns4p</code> program file to inspect it.
      </p>

      <input
        type="file"
        accept=".ns4p,.ns4o,.ns4n,.ns4y"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />

      {program && (
        <section style={{ marginTop: 24 }}>
          <h2>{fileName}</h2>
          <p>
            {program.parsed
              ? `Decoded "${program.name ?? '(unnamed)'}" — ${program.bytes.length} bytes`
              : `Recognized ${program.bytes.length} bytes, but format decoding is still in progress (see docs/FORMAT.md).`}
          </p>
          <pre style={{ background: '#f6f6f6', padding: 12, overflow: 'auto' }}>
            {JSON.stringify(program, (k, v) => (k === 'bytes' ? `<${(v as Uint8Array).length} bytes>` : v), 2)}
          </pre>
        </section>
      )}

      <footer style={{ marginTop: 48, fontSize: 12, color: '#999' }}>
        Not affiliated with Clavia DMI AB / Nord Keyboards. AGPL-3.0.
      </footer>
    </main>
  );
}
