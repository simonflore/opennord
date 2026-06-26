import { useEffect, useState, useCallback, useRef } from 'react';
import '../../styles/nord.css';
import { Button, FilterChip } from '../ui';
import type { NordSession } from '../../lib/device/session';
import { enumeratePrograms, pullProgram, type ProgramEntry } from '../../lib/device/transfer';
import { readPartitionCapacity } from '../../lib/device/capacity';
import { useDevice } from '../../lib/device/DeviceContext';
import { PARTITION_PROGRAM } from '../../lib/device/opcodes';
import { parseClaviaFile, type NordProgram } from '../../lib/formats';
import { slotLabel } from '../../lib/clavia/slot';
import { ProgramView } from '../program/ProgramView';
import { ConnectPanel } from './ConnectPanel';
import { BackupOrganizer } from './BackupOrganizer';
import { BundleChooser } from './BundleChooser';
import { DeviceBrowser } from './DeviceBrowser';
import { TargetSlotPicker } from './TargetSlotPicker';
import { ConfirmPanel } from './ConfirmPanel';
import { BackupPanel } from './BackupPanel';
import { DeviceSampleBrowser } from './DeviceSampleBrowser';
import { SampleInspector } from '../sample/SampleInspector';
import { usePushFlow } from './usePushFlow';
import { useDeleteFlow } from './useDeleteFlow';
import { useSamplesFlow } from './useSamplesFlow';
import { useReorgFlow } from './useReorgFlow';
import { planMove, isPlanError, buildOccupancy, type Addr } from '../../lib/device/reorg';
import { PlanReview } from './PlanReview';
import { PlanProgress } from './PlanProgress';
import { backup } from '../../lib/device/backup';
import { downloadBytes } from '../../lib/download';
import { getErrorMessage } from '../../lib/errors';
import { useFolder } from '../../lib/folder/FolderContext';

/**
 * Orchestrates the device screen: connect, browse, and view a pulled program.
 * The push / delete / samples flows live in their own hooks (usePushFlow,
 * useDeleteFlow, useSamplesFlow); this component is the switch between them.
 */
export function DeviceManager() {
  const { session, entries, deviceName, capacity, setConnection, setEntries, setCapacity } = useDevice();
  const folder = useFolder();
  // Program-open (pull-to-view) state stays local — it's this component's own concern.
  const [program, setProgram] = useState<NordProgram | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [organizingBackup, setOrganizingBackup] = useState(false);
  // When set, the Organizer opens this specific folder backup (picked on the landing).
  const [organizingBundlePath, setOrganizingBundlePath] = useState<string | undefined>(undefined);

  async function refresh(s: NordSession) {
    await s.withSession(PARTITION_PROGRAM, async () => {
      setEntries(await enumeratePrograms(s));
      // Best-effort: a failed capacity read shouldn't break the program list.
      setCapacity(await readPartitionCapacity(s, PARTITION_PROGRAM).catch(() => null));
    });
  }

  // Load the storage readout once on connect (entries arrive from ConnectPanel,
  // but capacity needs its own query). Best-effort — leaves capacity null on failure.
  const loadCapacity = useCallback(
    async (s: NordSession) => {
      try {
        setCapacity(await s.withSession(PARTITION_PROGRAM, () => readPartitionCapacity(s, PARTITION_PROGRAM)));
      } catch {
        /* ignore — the readout simply doesn't show */
      }
    },
    [setCapacity],
  );
  useEffect(() => {
    if (session) void loadCapacity(session);
  }, [session, loadCapacity]);

  // Re-arm session-start backup whenever the session changes (reconnect).
  useEffect(() => { backedUp.current = false; }, [session]);

  const push = usePushFlow(session, refresh);
  const del = useDeleteFlow(session, refresh);
  const samples = useSamplesFlow(session);

  const [backupWanted, setBackupWanted] = useState(true);
  const [reorgError, setReorgError] = useState('');
  const backedUp = useRef(false);
  const backupOnce = useCallback(async () => {
    if (!session || !backupWanted || backedUp.current) return;
    const bytes = await backup(session);
    downloadBytes(bytes, `OpenNord Safety Backup ${new Date().toISOString().slice(0, 10)}.ns4b`);
    backedUp.current = true;
  }, [session, backupWanted]);
  const reorg = useReorgFlow(session, refresh, backupOnce, entries);
  function onGesture(g: { kind: 'move'; from: Addr; to: Addr }) {
    reorg.clearResult();
    setReorgError('');
    const plan = planMove(buildOccupancy(entries), g.from, g.to);
    if (isPlanError(plan)) { setReorgError(plan.error); return; }
    reorg.setPendingPlan(plan);
  }

  async function open(entry: ProgramEntry) {
    if (!session || busy) return;
    setError(''); setBusy(true);
    try {
      const bytes = await session.withSession(PARTITION_PROGRAM, () => pullProgram(session, entry));
      const prog = parseClaviaFile(bytes).program;
      prog.name = entry.name;
      setProgram(prog);
    } catch (e) {
      setError(`Could not read ${entry.name}: ${getErrorMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  function toggleView(next: 'programs' | 'samples') {
    setProgram(null);
    void samples.switchView(next);
  }

  if (!session) {
    if (organizingBackup) {
      return (
        <BackupOrganizer
          initialBundlePath={organizingBundlePath}
          onBack={() => { setOrganizingBackup(false); setOrganizingBundlePath(undefined); }}
        />
      );
    }
    const openBundle = (path: string) => { setOrganizingBundlePath(path); setOrganizingBackup(true); };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {folder.bundles.length > 0 && (
          <BundleChooser
            title={`Backups in ${folder.folderName ?? 'your folder'}`}
            bundles={folder.bundles}
            onPick={openBundle}
          />
        )}
        <ConnectPanel
          onConnected={(s, e, name, pid) => setConnection(s, e, name, pid)}
          onOpenBackup={() => { setOrganizingBundlePath(undefined); setOrganizingBackup(true); }}
        />
      </div>
    );
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

  // Reorg confirm.
  if (reorg.pendingPlan) {
    return (
      <>
        <PlanReview
          plan={reorg.pendingPlan}
          backup={backupWanted}
          onBackupChange={setBackupWanted}
          busy={reorg.busy}
          onConfirm={reorg.confirmReorg}
          onCancel={() => reorg.setPendingPlan(null)}
        />
        <PlanProgress progress={reorg.progress} />
      </>
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
  const reorgFail = reorg.result && !reorg.result.ok
    ? `Move failed; your Nord was restored.${reorg.result.warnings.length ? ` (${reorg.result.warnings.join('; ')})` : ''}`
    : '';
  const browserError = error || samples.error || reorgError || reorg.error || reorgFail;
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
            capacity={capacity}
            onSelect={open}
            onDelete={del.setPendingDelete}
            onSendFile={push.startSendFile}
            onReorg={onGesture}
          />
        </>
      ) : (
        <DeviceSampleBrowser
          entries={samples.sampleEntries}
          deviceName={deviceName}
          sampleCapacity={samples.sampleCapacity}
          pianoCapacity={samples.pianoCapacity}
          onSelect={samples.openSample}
        />
      )}
    </div>
  );
}
