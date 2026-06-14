import { useState } from 'react';
import '../../styles/nord.css';
import type { NordSession } from '../../lib/device/session';
import { enumeratePrograms, pullProgram, pushProgram, deleteProgram, type ProgramEntry } from '../../lib/device/transfer';
import { parseNs4Program } from '../../lib/ns4/parse';
import { formatSlot } from '../../lib/ns4/slot';
import type { NS4Program } from '../../lib/ns4/types';
import { ProgramView } from '../program/ProgramView';
import { ConnectPanel } from './ConnectPanel';
import { DeviceBrowser } from './DeviceBrowser';
import { TargetSlotPicker, type SlotTarget } from './TargetSlotPicker';
import { ConfirmPanel } from './ConfirmPanel';

interface PushSource { bytes: Uint8Array; name: string; }

/** Orchestrates connect → browse → pull/view, plus push (file or open program) and delete. */
export function DeviceManager() {
  const [session, setSession] = useState<NordSession | null>(null);
  const [entries, setEntries] = useState<ProgramEntry[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [program, setProgram] = useState<NS4Program | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Push flow
  const [pushSource, setPushSource] = useState<PushSource | null>(null);
  const [pushName, setPushName] = useState('');
  const [picked, setPicked] = useState<SlotTarget | null>(null);
  // Delete flow
  const [pendingDelete, setPendingDelete] = useState<ProgramEntry | null>(null);

  async function refresh(s: NordSession) {
    setEntries(await enumeratePrograms(s));
  }

  async function open(entry: ProgramEntry) {
    if (!session || busy) return;
    setError(''); setBusy(true);
    try {
      const bytes = await pullProgram(session, entry);
      const prog = parseNs4Program(bytes);
      prog.name = entry.name;
      setProgram(prog);
    } catch (e) {
      setError(`Could not read ${entry.name}: ${msg(e)}`);
    } finally {
      setBusy(false);
    }
  }

  function startPush(source: PushSource) {
    setPushSource(source);
    setPushName(source.name);
    setPicked(null);
  }

  function cancelPush() {
    setPushSource(null);
    setPicked(null);
  }

  async function confirmPush() {
    if (!session || !pushSource || !picked || busy) return;
    setError(''); setBusy(true);
    try {
      await pushProgram(session, picked.bank, picked.slot, pushSource.bytes, pushName.trim() || pushSource.name);
      await refresh(session);
      cancelPush();
    } catch (e) {
      setError(`Could not write to ${formatSlot(picked.bank, picked.slot)}: ${msg(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!session || !pendingDelete || busy) return;
    setError(''); setBusy(true);
    try {
      await deleteProgram(session, pendingDelete.bank, pendingDelete.slot);
      await refresh(session);
      setPendingDelete(null);
    } catch (e) {
      setError(`Could not delete ${pendingDelete.name}: ${msg(e)}`);
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return <ConnectPanel onConnected={(s, e, name) => { setSession(s); setEntries(e); setDeviceName(name); }} />;
  }

  // Push flow: pick a slot, then confirm.
  if (pushSource) {
    if (!picked) {
      return <TargetSlotPicker entries={entries} onPick={setPicked} onCancel={cancelPush} />;
    }
    const where = formatSlot(picked.bank, picked.slot);
    return (
      <ConfirmPanel
        title="Send to the Nord?"
        message={picked.occupiedBy
          ? `This replaces "${picked.occupiedBy}" at ${where}.`
          : `Write to ${where} (currently empty).`}
        confirmLabel="Write"
        busy={busy}
        onConfirm={confirmPush}
        onCancel={() => setPicked(null)}
      >
        <label className="ps-sub" style={{ display: 'block' }}>
          Name on the Nord:&nbsp;
          <input value={pushName} onChange={(ev) => setPushName(ev.target.value)} style={{ padding: 4 }} />
        </label>
        {error && <p className="ps-sub" style={{ color: '#ffb454' }}>{error}</p>}
      </ConfirmPanel>
    );
  }

  // Delete confirm.
  if (pendingDelete) {
    return (
      <ConfirmPanel
        title="Delete this program?"
        message={`Permanently remove "${pendingDelete.name}" from ${formatSlot(pendingDelete.bank, pendingDelete.slot)}.`}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        {error && <p className="ps-sub" style={{ color: '#ffb454' }}>{error}</p>}
      </ConfirmPanel>
    );
  }

  // Viewing a pulled program — offer "Send to Nord".
  if (program) {
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setProgram(null)}
            style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid #ddd' }}
          >
            ← Back to programs
          </button>
          <button
            onClick={() => startPush({ bytes: program.bytes, name: program.name ?? 'Program' })}
            style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, border: '1px solid #c8102e', background: '#c8102e', color: '#fff' }}
          >
            Send to Nord
          </button>
        </div>
        <ProgramView program={program} />
      </div>
    );
  }

  return (
    <div>
      {error && <p className="ps-sub" style={{ color: '#ffb454' }}>{error}</p>}
      {busy && <p className="ps-sub">Working with the Nord…</p>}
      <DeviceBrowser
        entries={entries}
        deviceName={deviceName}
        onSelect={open}
        onDelete={setPendingDelete}
        onSendFile={(bytes, name) => startPush({ bytes, name })}
      />
    </div>
  );
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
