import { useState } from 'react';
import '../../styles/nord.css';
import type { NordSession } from '../../lib/device/session';
import { pullProgram, type ProgramEntry } from '../../lib/device/transfer';
import { parseNs4Program } from '../../lib/ns4/parse';
import type { NS4Program } from '../../lib/ns4/types';
import { ProgramView } from '../program/ProgramView';
import { ConnectPanel } from './ConnectPanel';
import { DeviceBrowser } from './DeviceBrowser';

/** Orchestrates connect → browse → pull → view, all within the Device tab. */
export function DeviceManager() {
  const [session, setSession] = useState<NordSession | null>(null);
  const [entries, setEntries] = useState<ProgramEntry[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [program, setProgram] = useState<NS4Program | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function open(entry: ProgramEntry) {
    if (!session || busy) return; // one pull at a time — the session is single-threaded
    setError('');
    setBusy(true);
    try {
      const bytes = await pullProgram(session, entry);
      const prog = parseNs4Program(bytes);
      prog.name = entry.name;
      setProgram(prog);
    } catch (e) {
      setError(`Could not read ${entry.name}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return <ConnectPanel onConnected={(s, e, name) => { setSession(s); setEntries(e); setDeviceName(name); }} />;
  }

  if (program) {
    return (
      <div>
        <button
          onClick={() => setProgram(null)}
          style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid #ddd', marginBottom: 12 }}
        >
          ← Back to programs
        </button>
        <ProgramView program={program} />
      </div>
    );
  }

  return (
    <div>
      {error && <p className="ps-sub" style={{ color: '#ffb454' }}>{error}</p>}
      {busy && <p className="ps-sub">Reading from the Nord…</p>}
      <DeviceBrowser entries={entries} deviceName={deviceName} onSelect={open} />
    </div>
  );
}
