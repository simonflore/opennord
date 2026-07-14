import { useState } from 'react';
import { pushProgram } from '../../lib/device/transfer';
import { programNameFromFilename } from '../../lib/clavia/name';
import { formatSlot } from '../../lib/clavia/slot';
import type { NordSession } from '../../lib/device/session';
import type { SlotTarget } from './TargetSlotPicker';

import { getErrorMessage } from '../../lib/errors';
import { readFileBytes } from '../../lib/file';
import { useAsyncAction } from '../../hooks/useAsyncAction';

export interface PushSource { bytes: Uint8Array; name: string; }

/**
 * Push flow: choose a program (a picked .ns4p or an open program), pick a target
 * slot, name it, and write it to the Nord. Owns its own error/busy so the confirm
 * panel reflects exactly this flow.
 */
export function usePushFlow(session: NordSession | null, refresh: (s: NordSession) => Promise<void>) {
  const [pushSource, setPushSource] = useState<PushSource | null>(null);
  const [pushName, setPushName] = useState('');
  const [picked, setPicked] = useState<SlotTarget | null>(null);
  const { busy, error, setError, run } = useAsyncAction();

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
      const bytes = await readFileBytes(file);
      startPush({ bytes, name: programNameFromFilename(file.name) });
    } catch (e) {
      setError(`Could not read ${file.name}: ${getErrorMessage(e)}`);
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
    await run(async () => {
      await session.withSession(session.programPartition, () =>
        pushProgram(session, picked.bank, picked.slot, pushSource.bytes, pushName.trim() || pushSource.name));
      await refresh(session);
      cancel();
    }, (e) => `Could not write to ${formatSlot(picked.bank, picked.slot)}: ${getErrorMessage(e)}`);
  }

  return { pushSource, pushName, setPushName, picked, pickSlot, unpick, error, busy, startPush, startSendFile, confirmPush, cancel };
}
