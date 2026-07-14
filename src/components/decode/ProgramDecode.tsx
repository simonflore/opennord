import { useState } from 'react';
import { parseClaviaFile, type NordProgram } from '@/lib/formats';
import { summarizeFile, type FileSummary } from '@/lib/clavia/identify-summary';
import { FixtureLoader } from '@/components/dev/FixtureLoader';
import { readFileBytes } from '@/lib/file';

/** Identify summary — which Nord, tag/version/kind, and whether it matches the registry. */
export function IdentifyPanel({ summary }: { summary: FileSummary }) {
  const { finding, modelGuess, cross } = summary;
  return (
    <div style={{ font: '12px var(--mono)', color: 'var(--ink)', margin: '8px 0' }}>
      <span>{modelGuess ?? 'unknown model'}</span>{' · '}
      <span>{finding.tag ?? finding.ext}</span>{' · '}
      <span>{finding.generation ?? '—'}</span>{' · '}
      <span>v{finding.version ?? '—'}</span>{' · '}
      <span>{finding.kind}</span>
      {cross && (cross.ok
        ? <span style={{ color: 'var(--connected)' }}> · matches registry ✓</span>
        : <span style={{ color: 'var(--warn)' }}> · {cross.issues.join('; ')}</span>)}
      {!finding.headerOk && finding.error && <span style={{ color: 'var(--warn)' }}> · {finding.error}</span>}
    </div>
  );
}

/** Developer tool: drop or pick any Nord file and dump its parsed structure as JSON. */
export function ProgramDecode() {
  const [program, setProgram] = useState<NordProgram | null>(null);
  const [fileName, setFileName] = useState('');
  const [summary, setSummary] = useState<FileSummary | null>(null);

  function load(name: string, bytes: Uint8Array) {
    setFileName(name);
    setSummary(summarizeFile(name, bytes));
    setProgram(parseClaviaFile(bytes).program);
  }
  async function onFile(file: File) {
    load(file.name, await readFileBytes(file));
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="file"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <FixtureLoader onLoad={load} />
      </div>
      {summary && <IdentifyPanel summary={summary} />}
      {program && (
        <section style={{ marginTop: 16 }}>
          <h3>{fileName}</h3>
          <p>{program.parsed
            ? `Recognized ${'kind' in program ? program.kind : program.version} — ${program.bytes.length} bytes`
            : `Recognized ${program.bytes.length} bytes; structured decode in progress (docs/FORMAT.md).`}</p>
          <pre style={{ background: 'var(--surface)', padding: 12, overflow: 'auto' }}>
            {JSON.stringify(program, (k, v) => (k === 'bytes' ? `<${(v as Uint8Array).length} bytes>` : v), 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
