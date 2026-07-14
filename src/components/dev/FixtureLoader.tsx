import { useEffect, useState } from 'react';
import { corpusAvailable, listCorpus, getCorpusFile, type CorpusModel } from '../../lib/dev/fixtures-client';
import { getErrorMessage } from '../../lib/errors';

const SEP = '\0';

/** DEV-only picker that loads a file straight from the local fixtures/<model>/ corpus. */
export function FixtureLoader({ onLoad }: { onLoad: (name: string, bytes: Uint8Array) => void }) {
  const [models, setModels] = useState<CorpusModel[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { if (corpusAvailable) void listCorpus().then(setModels); }, []);
  if (!corpusAvailable || models.length === 0) return null;

  async function pick(value: string) {
    if (!value) return;
    const i = value.indexOf(SEP);
    if (i < 0) return;
    const model = value.slice(0, i);
    const name = value.slice(i + 1);
    setError('');
    try { onLoad(name, await getCorpusFile(model, name)); }
    catch (e) { setError(getErrorMessage(e)); }
  }

  return (
    <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: 'var(--dim)', font: '12px var(--font)' }}>
      From corpus:
      <select defaultValue="" onChange={(e) => void pick(e.target.value)}>
        <option value="">— pick a fixture —</option>
        {models.map((m) => (
          <optgroup key={m.id} label={m.id}>
            {m.files.map((f) => <option key={f} value={`${m.id}${SEP}${f}`}>{f}</option>)}
          </optgroup>
        ))}
      </select>
      {error && <span className="on-error">{error}</span>}
    </label>
  );
}
