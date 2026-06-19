import { useState } from 'react';
import { parseNs4Program } from '@/lib/ns4/parse';
import type { NS4Program } from '@/lib/ns4/types';

/** Developer tool: drop a .ns4p and dump its parsed structure as JSON. */
export function ProgramDecode() {
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
          <pre style={{ background: 'var(--surface)', padding: 12, overflow: 'auto' }}>
            {JSON.stringify(program, (k, v) => (k === 'bytes' ? `<${(v as Uint8Array).length} bytes>` : v), 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
