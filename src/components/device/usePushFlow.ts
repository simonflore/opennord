import { useState } from 'react';
import { pushProgram } from '../../lib/device/transfer';
import { programNameFromFilename } from '../../lib/clavia/name';
import { formatSlot } from '../../lib/clavia/slot';
import { PARTITION_PROGRAM } from '../../lib/device/opcodes';
import type { NordSession } from '../../lib/device/session';
import type { SlotTarget } from './TargetSlotPicker';

export interface PushSource { bytes: Uint8Array; name: string; }

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Push flow: choose a program (a picked .ns4p or an open program), pick a target
 * slot, name it, and write it to the Nord. Owns its own error/busy so the confirm
 * panel reflects exactly this flow.
 */
export function usePushFlow(session: NordSession | null, refresh: (s: NordSession) => Promise<void>) {
  const [pushSource, setPushSource] = useState<PushSource | null>(null);
  const [pushName, setPushName] = useState('');
  const [picked, setPicked] = useState<SlotTarget | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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

  function pickSlot(target: SlotTarget) {
    setError('');
    setPicked(target);
  }

  /** Step back from the confirm screen to the slot picker. */
  function unpick() {
    setPicked(null);
  }

  function cancel() {
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
      cancel();
    } catch (e) {
      setError(`Could not write to ${formatSlot(picked.bank, picked.slot)}: ${msg(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return { pushSource, pushName, setPushName, picked, pickSlot, unpick, error, busy, startPush, startSendFile, confirmPush, cancel };
}
