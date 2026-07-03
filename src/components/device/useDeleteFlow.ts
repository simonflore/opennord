import { useState } from 'react';
import { deleteProgram, type ProgramEntry } from '../../lib/device/transfer';
import type { NordSession } from '../../lib/device/session';
import { getErrorMessage } from '../../lib/errors';
import { useAsyncAction } from '../../hooks/useAsyncAction';

/** Delete flow: confirm, then remove a program from its slot. Owns its error/busy. */
export function useDeleteFlow(session: NordSession | null, refresh: (s: NordSession) => Promise<void>) {
  const [pendingDelete, setPendingDelete] = useState<ProgramEntry | null>(null);
  const { busy, error, run } = useAsyncAction();

  async function confirmDelete() {
    if (!session || !pendingDelete || busy) return;
    await run(async () => {
      await session.withSession(session.programPartition, () =>
        deleteProgram(session, pendingDelete.bank, pendingDelete.slot));
      await refresh(session);
      setPendingDelete(null);
    }, (e) => `Could not delete ${pendingDelete.name}: ${getErrorMessage(e)}`);
  }

  return { pendingDelete, setPendingDelete, error, busy, confirmDelete };
}
