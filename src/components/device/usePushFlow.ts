import { useState } from 'react';
import { focusFile, pushProgram } from '../../lib/device/transfer';
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
 * slot, and write it to the Nord. Owns its own error/busy so the confirm
 * panel reflects exactly this flow.
 */
export function usePushFlow(
  session: NordSession | null,
  refresh: (s: NordSession) => Promise<void>,
  /** Select the sent program on the Nord afterwards: only where the instrument is known to answer the request. */
  focusAfter = false,
) {
  const [pushSource, setPushSource] = useState<PushSource | null>(null);
  const [picked, setPicked] = useState<SlotTarget | null>(null);
  const { busy, error, setError, run } = useAsyncAction();

  function startPush(source: PushSource) {
    setError('');
    setPushSource(source);
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

  /** Write under `name`: the source's own, unless the caller had to number it. */
  async function confirmPush(name = pushSource?.name) {
    if (!session || !pushSource || !picked || busy) return;
    await run(async () => {
      await session.withSession(session.programPartition, async () => {
        await pushProgram(session, picked.bank, picked.slot, pushSource.bytes, name ?? pushSource.name);
        if (focusAfter) await focusFile(session, picked.bank, picked.slot); // the Nord jumps to what was just sent
      });
      await refresh(session);
      cancel();
    }, (e) => `Could not write to ${formatSlot(picked.bank, picked.slot)}: ${getErrorMessage(e)}`);
  }

  return { pushSource, picked, pickSlot, unpick, error, busy, startPush, startSendFile, confirmPush, cancel };
}
