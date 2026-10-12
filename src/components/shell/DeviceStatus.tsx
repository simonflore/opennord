import { useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Dialog, Menu, MenuItem, MenuLabel, MenuSeparator } from '../ui';
import { useDevice } from '../../lib/device/DeviceContext';
import type { NordSession } from '../../lib/device/session';
import { canRestore } from '../../lib/device/backup';
import { BackupPanel } from '../device/BackupPanel';
import { useConnectNord } from '../device/useConnectNord';
import { Led } from './Led';

/**
 * The Nord, as the top bar shows it, and everything you do to the keyboard as a
 * whole. One place for it:
 *
 * - Not connected: an LED and Connect, which connects right here (the same
 *   connect as the Device page's card, shared through the device context, so
 *   only one runs at a time). Where this host can't reach a Nord (no WebUSB, an
 *   iPhone), Connect opens the Device page, which says why.
 * - Connected: the Nord's name opens its menu — Back up Nord, Restore Nord…,
 *   Check my Nord, Manage slots, Disconnect.
 *
 * At phone width the label folds to the LED (and its screen-reader text), and
 * Connect stays only where the phone can reach the Nord over USB.
 */
export function DeviceStatus({ onManage }: { onManage: () => void }) {
  const { session, deviceName, entries, setConnection, disconnect, refresh } = useDevice();
  const navigate = useNavigate();
  const { status, message, connect, reachable } = useConnectNord(setConnection);
  // A dialog belongs to the session it was opened for: after an unplug and a
  // reconnect it must not come back (and start another backup by itself).
  const [dialog, setDialog] = useState<{ kind: 'backup' | 'restore'; for: NordSession } | null>(null);
  // A backup or restore keeps running on the Nord if its dialog closes, so it can't close mid-way.
  const [busy, setBusy] = useState(false);
  // Only a connect started here speaks up here; the Device page's card shows its own.
  const [askedHere, setAskedHere] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  // The family is wider than the Stage 4: without a product name, just "Nord".
  const name = deviceName || 'Nord';

  async function onConnect() {
    if (!reachable) { onManage(); return; }
    setAskedHere(true);
    await connect();
  }
  const failed = askedHere && status === 'error' ? message : '';

  if (!session) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-2 font-mono text-xs text-dim">
          <Led on={false} tone="connected" />
          <span className="max-[720px]:sr-only">No Nord connected</span>
        </span>
        <span className={reachable ? undefined : 'max-[720px]:hidden'}>
          <Button variant="secondary" onClick={() => void onConnect()} disabled={status === 'connecting'}>
            {status === 'connecting' ? 'Connecting…' : 'Connect'}
          </Button>
        </span>
        {failed && (
          <Dialog
            open
            portal
            onClose={() => setAskedHere(false)}
            title="Couldn’t connect your Nord"
            footer={(
              <>
                <Button variant="ghost" onClick={() => { setAskedHere(false); onManage(); }}>Help connecting</Button>
                <Button variant="primary" onClick={() => void onConnect()}>Try again</Button>
              </>
            )}
          >
            <p className="m-0 text-[13px] leading-[1.55] text-dim">{failed}</p>
          </Dialog>
        )}
      </div>
    );
  }

  const open = dialog?.for === session ? dialog.kind : null;
  // A Nord lost mid-backup leaves no panel to report "done": start each dialog idle.
  const openDialog = (kind: 'backup' | 'restore') => { setBusy(false); setDialog({ kind, for: session }); };
  const close = () => { if (!busy) setDialog(null); };
  // Restore needs every partition a backup writes to be confirmed writable.
  const restorable = canRestore(session);
  return (
    <>
      <Menu
        label={`Your ${name}`}
        trigger={(
          <button
            ref={trigger}
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-line bg-transparent px-2.5 py-1 font-mono text-xs text-dim hover:border-muted hover:text-ink"
            title={`${name} · ${entries.length} programs`}
          >
            <Led on tone="connected" />
            <span>{name}<span className="max-[720px]:hidden"> · USB</span></span>
            <span aria-hidden="true" className="text-muted">▾</span>
          </button>
        )}
      >
        <MenuLabel>{name} · {entries.length} programs</MenuLabel>
        <MenuItem onSelect={() => openDialog('backup')} hint="Saves the whole keyboard to one file">Back up Nord</MenuItem>
        <MenuItem
          onSelect={() => openDialog('restore')}
          disabled={!restorable}
          hint={restorable ? 'Puts a backup file back on the keyboard' : 'Off on this keyboard: OpenNord can’t confirm where everything in a backup belongs'}
        >
          Restore Nord…
        </MenuItem>
        <MenuItem onSelect={() => void navigate({ to: '/compatibility' })} hint="What OpenNord supports on this model">Check my Nord</MenuItem>
        <MenuItem onSelect={onManage} hint="Move, sort and delete programs in their slots">Manage slots</MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={disconnect} tone="quiet">Disconnect</MenuItem>
      </Menu>
      {open && (
        <Dialog
          open
          portal
          returnFocus={trigger}
          onClose={close}
          title={open === 'backup' ? `Back up ${name}` : `Restore ${name}`}
          footer={<Button variant="ghost" onClick={close} disabled={busy}>Close</Button>}
        >
          <BackupPanel
            session={session}
            deviceName={name}
            startBackup={open === 'backup'}
            onBusyChange={setBusy}
            onAfterRestore={() => { refresh(session).catch(() => undefined); }}
          />
        </Dialog>
      )}
    </>
  );
}
