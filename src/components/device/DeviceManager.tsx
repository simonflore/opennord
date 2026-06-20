import { useState } from 'react';
import '../../styles/nord.css';
import { Button, FilterChip } from '../ui';
import type { NordSession } from '../../lib/device/session';
import { enumeratePrograms, pullProgram, type ProgramEntry } from '../../lib/device/transfer';
import { useDevice } from '../../lib/device/DeviceContext';
import { PARTITION_PROGRAM } from '../../lib/device/opcodes';
import { parseClaviaFile } from '../../lib/formats';
import { slotLabel } from '../../lib/clavia/slot';
import type { NS4Program } from '../../lib/ns4/types';
import { ProgramView } from '../program/ProgramView';
import { ConnectPanel } from './ConnectPanel';
import { DeviceBrowser } from './DeviceBrowser';
import { TargetSlotPicker } from './TargetSlotPicker';
import { ConfirmPanel } from './ConfirmPanel';
import { BackupPanel } from './BackupPanel';
import { DeviceSampleBrowser } from './DeviceSampleBrowser';
import { SampleInspector } from '../sample/SampleInspector';
import { usePushFlow } from './usePushFlow';
import { useDeleteFlow } from './useDeleteFlow';
import { useSamplesFlow } from './useSamplesFlow';

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Orchestrates the device screen: connect, browse, and view a pulled program.
 * The push / delete / samples flows live in their own hooks (usePushFlow,
 * useDeleteFlow, useSamplesFlow); this component is the switch between them.
 */
export function DeviceManager() {
  const { session, entries, deviceName, setConnection, setEntries } = useDevice();
  // Program-open (pull-to-view) state stays local — it's this component's own concern.
  const [program, setProgram] = useState<NS4Program | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh(s: NordSession) {
    setEntries(await s.withSession(PARTITION_PROGRAM, () => enumeratePrograms(s)));
  }

  const push = usePushFlow(session, refresh);
  const del = useDeleteFlow(session, refresh);
  const samples = useSamplesFlow(session);

  async function open(entry: ProgramEntry) {
    if (!session || busy) return;
    setError(''); setBusy(true);
    try {
      const bytes = await session.withSession(PARTITION_PROGRAM, () => pullProgram(session, entry));
      const prog = parseClaviaFile(bytes).program;
      prog.name = entry.name;
      setProgram(prog);
    } catch (e) {
      setError(`Could not read ${entry.name}: ${msg(e)}`);
    } finally {
      setBusy(false);
    }
  }

  function toggleView(next: 'programs' | 'samples') {
    setProgram(null);
    void samples.switchView(next);
  }

  if (!session) {
    return <ConnectPanel onConnected={(s, e, name) => setConnection(s, e, name)} />;
  }

  // Push flow: pick a slot, then confirm.
  if (push.pushSource) {
    if (!push.picked) {
      return <TargetSlotPicker entries={entries} onPick={push.pickSlot} onCancel={push.cancel} />;
    }
    const where = slotLabel(push.picked.bank, push.picked.slot);
    return (
      <ConfirmPanel
        title="Send to the Nord?"
        message={push.picked.occupiedBy
          ? `This replaces "${push.picked.occupiedBy}" at ${where}.`
          : `Write to ${where} (currently empty).`}
        confirmLabel="Write"
        busy={push.busy}
        onConfirm={push.confirmPush}
        onCancel={push.unpick}
      >
        <label className="ps-sub" style={{ display: 'block' }}>
          Name on the Nord:&nbsp;
          <input value={push.pushName} onChange={(ev) => push.setPushName(ev.target.value)} style={{ padding: 4 }} />
        </label>
        {push.error && <p className="ps-sub on-error">{push.error}</p>}
      </ConfirmPanel>
    );
  }

  // Delete confirm.
  if (del.pendingDelete) {
    return (
      <ConfirmPanel
        title="Delete this program?"
        message={`Permanently remove "${del.pendingDelete.name}" from ${slotLabel(del.pendingDelete.bank, del.pendingDelete.slot)}.`}
        confirmLabel="Delete"
        busy={del.busy}
        onConfirm={del.confirmDelete}
        onCancel={() => del.setPendingDelete(null)}
      >
        {del.error && <p className="ps-sub on-error">{del.error}</p>}
      </ConfirmPanel>
    );
  }

  // Viewing a pulled program — offer "Send to Nord".
  if (program) {
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Button variant="ghost" onClick={() => setProgram(null)}>← Back to programs</Button>
          <Button variant="primary" onClick={() => push.startPush({ bytes: program.bytes, name: program.name ?? 'Program' })}>Send to Nord</Button>
        </div>
        <ProgramView program={program} />
      </div>
    );
  }

  // Viewing a pulled sample (read-only — edit + download live in the inspector; no write-back yet).
  if (samples.sampleInput) {
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Button variant="ghost" onClick={() => samples.setSampleInput(null)}>← Back to samples</Button>
        </div>
        <SampleInspector key={`${samples.sampleInput.name}-${samples.sampleInput.bytes.length}`} initial={samples.sampleInput} />
      </div>
    );
  }

  // Default browser. error/busy here come from the program-open action or the
  // samples flow — only one is ever active at a time in this branch.
  const browserError = error || samples.error;
  const browserBusy = busy || samples.busy;
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <FilterChip active={samples.view === 'programs'} onClick={() => toggleView('programs')}>Programs</FilterChip>
        <FilterChip active={samples.view === 'samples'} onClick={() => toggleView('samples')}>Samples</FilterChip>
      </div>
      {browserError && <p className="ps-sub on-error">{browserError}</p>}
      {browserBusy && <p className="ps-sub">{samples.pullPct !== null ? `Pulling sample… ${samples.pullPct}%` : 'Working with the Nord…'}</p>}
      {samples.view === 'programs' ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <BackupPanel session={session} deviceName={deviceName} onAfterRestore={() => { void refresh(session); }} />
          </div>
          <DeviceBrowser
            entries={entries}
            deviceName={deviceName}
            onSelect={open}
            onDelete={del.setPendingDelete}
            onSendFile={push.startSendFile}
          />
        </>
      ) : (
        <DeviceSampleBrowser entries={samples.sampleEntries} deviceName={deviceName} onSelect={samples.openSample} />
      )}
    </div>
  );
}
