import { useEffect, useState, useCallback, useRef } from 'react';
import '../../styles/nord.css';
import { Button, FilterChip } from '../ui';
import type { NordSession } from '../../lib/device/session';
import type { ProgramEntry } from '../../lib/device/transfer';
import { readPartitionCapacity } from '../../lib/device/capacity';
import { useDevice } from '../../lib/device/DeviceContext';
import { PARTITION_PROGRAM } from '../../lib/device/opcodes';
import { slotLabel } from '../../lib/clavia/slot';
import { NS4_PRODUCT_ID } from '../../lib/device/negotiate';
import { ConnectPanel } from './ConnectPanel';
import { BackupOrganizer } from './BackupOrganizer';
import { BundleChooser } from './BundleChooser';
import { DeviceBrowser } from './DeviceBrowser';
import { PushFlowPanel } from './PushFlowPanel';
import { ConfirmPanel } from './ConfirmPanel';
import { DeviceSampleBrowser } from './DeviceSampleBrowser';
import { SampleInspector } from '../sample/SampleInspector';
import { usePushFlow } from './usePushFlow';
import { useDeleteFlow } from './useDeleteFlow';
import { useSamplesFlow } from './useSamplesFlow';
import { useReorg } from './useReorg';
import { sessionDeviceIO } from '../../lib/device/device-io';
import { backup, backupFilename } from '../../lib/device/backup';
import { downloadBytes } from '../../lib/download';
import { useFolder } from '../../lib/folder/FolderContext';
import { useOpenEntry } from '../library/openEntry';
import { useLibraryData } from '../../lib/library/LibraryContext';
import { nordEntryId } from '../../lib/library/entries';

/**
 * Orchestrates the device screen: connect, then manage the Nord's slots
 * (arrange, send a file in, delete) and browse its samples. A program opens in
 * the Library, read from the keyboard there. The push / delete / samples flows
 * live in their own hooks (usePushFlow, useDeleteFlow, useSamplesFlow); this
 * component is the switch between them.
 */
export function DeviceManager() {
  const { session, entries, deviceName, productId, capacity, setConnection, setCapacity, isCurrent, lost, refresh } = useDevice();
  const folder = useFolder();
  const openEntry = useOpenEntry();
  const { ensureListed } = useLibraryData();
  const [organizingBackup, setOrganizingBackup] = useState(false);
  // When set, the Organizer opens this specific folder backup (picked on the landing).
  const [organizingBundlePath, setOrganizingBundlePath] = useState<string | undefined>(undefined);

  // Load the storage readout once on connect (entries arrive with the connection,
  // but capacity needs its own query). Best-effort — leaves capacity null on failure.
  const loadCapacity = useCallback(
    async (s: NordSession) => {
      try {
        const cap = await s.withSession(s.programPartition, () => readPartitionCapacity(s, s.programPartition));
        if (isCurrent(s)) setCapacity(cap);
      } catch {
        /* ignore — the readout simply doesn't show */
      }
    },
    [setCapacity, isCurrent],
  );
  useEffect(() => {
    if (session) void loadCapacity(session);
  }, [session, loadCapacity]);

  // Re-arm session-start backup whenever the session changes (reconnect).
  useEffect(() => { backedUp.current = false; }, [session]);

  const push = usePushFlow(session, refresh, productId === NS4_PRODUCT_ID); // seen to answer on a Stage 4 only
  const del = useDeleteFlow(session, refresh);
  const samples = useSamplesFlow(session);

  const [backupWanted, setBackupWanted] = useState(true);
  const backedUp = useRef(false);
  const backupOnce = useCallback(async () => {
    if (!session || !backupWanted || backedUp.current) return;
    const bytes = await backup(session);
    downloadBytes(bytes, backupFilename(session, 'OpenNord Safety Backup'));
    backedUp.current = true;
  }, [session, backupWanted]);
  const reorg = useReorg({
    io: sessionDeviceIO(session!),
    partition: session?.programPartition ?? PARTITION_PROGRAM,
    entries,
    refresh: () => refresh(session!),
    backupOnce,
    run: (fn) => session!.withSession(session!.programPartition, fn),
  });
  const reorgConfirmExtra = (
    <label className="ps-sub" style={{ display: 'block', marginTop: 8 }}>
      <input type="checkbox" checked={backupWanted} onChange={(e) => setBackupWanted(e.target.checked)} /> Back up my Nord first
    </label>
  );

  // A program opens in the Library, which reads it from the Nord (useNordReads),
  // with its row showing in the list beside it.
  const open = (entry: ProgramEntry) => {
    const id = nordEntryId(entry);
    ensureListed(id);
    void openEntry.program({ id, name: entry.name, source: 'nord' });
  };

  const toggleView = (next: 'programs' | 'samples') => void samples.switchView(next);

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
        {lost && <p className="on-error" role="status">Your Nord was disconnected. Connect it again to carry on.</p>}
        <ConnectPanel
          onConnected={(s, e, name, pid) => setConnection(s, e, name, pid)}
          onOpenBackup={() => { setOrganizingBundlePath(undefined); setOrganizingBackup(true); }}
        />
      </div>
    );
  }

  // A keyboard OpenNord can't safely write to: Organize and Send are greyed with
  // the reason and Delete is hidden, instead of failing after a click.
  const writable = session.canWrite(session.programPartition);

  // Push flow: pick a slot, then confirm.
  if (push.pushSource) return <PushFlowPanel push={push} entries={entries} />;

  // Delete confirm.
  if (del.pendingDelete) {
    return (
      <ConfirmPanel
        title="Delete from Nord?"
        message={`Permanently deletes "${del.pendingDelete.name}" from ${slotLabel(del.pendingDelete.bank, del.pendingDelete.slot)}. Back up your Nord first if you may want it back.`}
        confirmLabel="Delete from Nord"
        busy={del.busy}
        onConfirm={del.confirmDelete}
        onCancel={() => del.setPendingDelete(null)}
      >
        {del.error && <p className="ps-sub on-error">{del.error}</p>}
      </ConfirmPanel>
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

  const browserError = samples.error || reorg.error;
  const browserBusy = samples.busy;
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
          {!writable && (
            <div className="mb-3 rounded-md border border-line bg-surface-2 px-3 py-2.5" role="note">
              <p className="m-0 mb-1 text-xs font-bold text-ink">Browsing only on this keyboard</p>
              <p className="m-0 text-xs leading-[1.55] text-dim">
                OpenNord couldn’t confirm where this Nord keeps its programs, so it won’t change
                anything on it — sending, deleting, rearranging and restoring stay off. You can still
                browse, listen and back up as usual.
              </p>
            </div>
          )}
          {/* Back up and Restore act on the whole keyboard, so they live in the
              Nord's menu in the top bar (DeviceStatus); this page arranges slots. */}
          <p className="ps-sub mb-3">Back up or restore your Nord from its menu in the top bar.</p>
          <DeviceBrowser
            entries={entries}
            deviceName={deviceName}
            capacity={capacity}
            onSelect={open}
            onDelete={del.setPendingDelete}
            onSendFile={push.startSendFile}
            writable={writable}
            reorg={reorg}
            reorgConfirmExtra={reorgConfirmExtra}
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
