import { useState } from 'react';
import '../../styles/nord.css';
import { Button } from '../ui';
import type { NordSession } from '../../lib/device/session';
import { enumeratePrograms, pullProgram, pushProgram, deleteProgram, type ProgramEntry } from '../../lib/device/transfer';
import { useDevice } from '../../lib/device/DeviceContext';
import { PARTITION_PROGRAM } from '../../lib/device/opcodes';
import { parseNs4Program } from '../../lib/ns4/parse';
import { programNameFromFilename } from '../../lib/ns4/name';
import { formatSlot } from '../../lib/ns4/slot';
import type { NS4Program } from '../../lib/ns4/types';
import { ProgramView } from '../program/ProgramView';
import { ConnectPanel } from './ConnectPanel';
import { DeviceBrowser } from './DeviceBrowser';
import { TargetSlotPicker, type SlotTarget } from './TargetSlotPicker';
import { ConfirmPanel } from './ConfirmPanel';
import { BackupPanel } from './BackupPanel';

interface PushSource { bytes: Uint8Array; name: string; }

/** Orchestrates connect → browse → pull/view, plus push (file or open program) and delete. */
export function DeviceManager() {
  const { session, entries, deviceName, setConnection, setEntries } = useDevice();
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
    setEntries(await s.withSession(PARTITION_PROGRAM, () => enumeratePrograms(s)));
  }

  async function open(entry: ProgramEntry) {
    if (!session || busy) return;
    setError(''); setBusy(true);
    try {
      const bytes = await session.withSession(PARTITION_PROGRAM, () => pullProgram(session, entry));
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
    setError('');
    setPushSource(source);
    setPushName(source.name);
    setPicked(null);
  }

  /** Read a picked .ns4p (error handling lives here, where the error state is). */
  async function startSendFile(file: File) {
    setError('');
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      startPush({ bytes, name: programNameFromFilename(file.name) });
    } catch (e) {
      setError(`Could not read ${file.name}: ${msg(e)}`);
    }
  }

  function cancelPush() {
    setPushSource(null);
    setPicked(null);
  }

  async function confirmPush() {
    if (!session || !pushSource || !picked || busy) return;
    setError(''); setBusy(true);
    try {
      await session.withSession(PARTITION_PROGRAM, () =>
        pushProgram(session, picked.bank, picked.slot, pushSource.bytes, pushName.trim() || pushSource.name));
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
      await session.withSession(PARTITION_PROGRAM, () =>
        deleteProgram(session, pendingDelete.bank, pendingDelete.slot));
      await refresh(session);
      setPendingDelete(null);
    } catch (e) {
      setError(`Could not delete ${pendingDelete.name}: ${msg(e)}`);
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return <ConnectPanel onConnected={(s, e, name) => setConnection(s, e, name)} />;
  }

  // Push flow: pick a slot, then confirm.
  if (pushSource) {
    if (!picked) {
      return <TargetSlotPicker entries={entries} onPick={(t) => { setError(''); setPicked(t); }} onCancel={cancelPush} />;
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
        {error && <p className="ps-sub on-error">{error}</p>}
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
        {error && <p className="ps-sub on-error">{error}</p>}
      </ConfirmPanel>
    );
  }

  // Viewing a pulled program — offer "Send to Nord".
  if (program) {
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Button variant="ghost" onClick={() => setProgram(null)}>← Back to programs</Button>
          <Button variant="primary" onClick={() => startPush({ bytes: program.bytes, name: program.name ?? 'Program' })}>Send to Nord</Button>
        </div>
        <ProgramView program={program} />
      </div>
    );
  }

  return (
    <div>
      {error && <p className="ps-sub on-error">{error}</p>}
      {busy && <p className="ps-sub">Working with the Nord…</p>}
      <div style={{ marginBottom: 12 }}>
        <BackupPanel
          session={session}
          deviceName={deviceName}
          onAfterRestore={() => { void refresh(session); }}
        />
      </div>
      <DeviceBrowser
        entries={entries}
        deviceName={deviceName}
        onSelect={open}
        onDelete={setPendingDelete}
        onSendFile={startSendFile}
      />
    </div>
  );
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
