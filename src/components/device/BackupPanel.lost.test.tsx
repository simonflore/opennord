// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { zipSync, strToU8 } from 'fflate';
import type { RestoreResult } from '../../lib/device/backup';
import { NordSession } from '../../lib/device/session';
import { MockTransport } from '../../lib/device/transport';
import { USER_PARTITIONS, buildMetaXml } from '../../lib/device/ns4b';

const outcome = { sessionLost: true };
vi.mock('../../lib/device/backup', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/device/backup')>()),
  restore: async (): Promise<RestoreResult> => ({
    restored: 3, unchanged: 0, removed: 1, skipped: 0, skippedFiles: [], leftOut: [], failures: [],
    removedFiles: ['Old Pad'], notRewritten: [], sessionLost: outcome.sessionLost, libraryReasons: [], sayNoneRemoved: false,
  }),
}));
import { BackupPanel } from './BackupPanel';

afterEach(() => { cleanup(); outcome.sessionLost = true; });

const backupFile = () =>
  new File([zipSync({ 'meta.xml': strToU8(buildMetaXml(0)) }, { level: 0 }) as unknown as BlobPart], 'B.ns4b');

async function restoreWith(handlers: { onAfterRestore: () => void; onSessionLost: () => void }) {
  const session = new NordSession(new MockTransport([]));
  session.allowWrites(USER_PARTITIONS.map((p) => p.partition));
  render(
    <BackupPanel session={session} deviceName="Nord" libraryWrites={{ sample: true, piano: false }} {...handlers} />,
  );
  fireEvent.change(screen.getByText('Restore Nord…').closest('label')!.querySelector('input')!, { target: { files: [backupFile()] } });
  await screen.findByText(/Couldn't preview changes/); // the mock Nord answers nothing; that never blocks the restore
  fireEvent.click(screen.getByRole('button', { name: 'Restore Nord' }));
}

describe('BackupPanel: a Nord that stopped answering mid-restore', () => {
  it('hands the lost session back to be dropped, keeps the summary, and offers nothing more on it', async () => {
    const onAfterRestore = vi.fn();
    const onSessionLost = vi.fn();
    await restoreWith({ onAfterRestore, onSessionLost });
    expect(await screen.findByText(/Your Nord stopped answering/)).toBeInTheDocument();
    expect(screen.getByText(/Old Pad|Restored 3/)).toBeInTheDocument();
    expect(onSessionLost).toHaveBeenCalledTimes(1);
    expect(onAfterRestore).not.toHaveBeenCalled(); // never read again
    expect(screen.queryByRole('button', { name: /Back up Nord/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Restore Nord…/)).not.toBeInTheDocument();
  });

  it('a restore that ends normally doesn’t drop the session', async () => {
    outcome.sessionLost = false;
    const onAfterRestore = vi.fn();
    const onSessionLost = vi.fn();
    await restoreWith({ onAfterRestore, onSessionLost });
    await screen.findByRole('button', { name: /Back up Nord/ });
    expect(onSessionLost).not.toHaveBeenCalled();
    expect(onAfterRestore).toHaveBeenCalledTimes(1);
  });
});
