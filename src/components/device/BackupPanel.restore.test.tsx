// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { zipSync, strToU8 } from 'fflate';
import { BackupPanel } from './BackupPanel';
import { NordSession } from '../../lib/device/session';
import { MockTransport } from '../../lib/device/transport';
import { USER_PARTITIONS, buildMetaXml } from '../../lib/device/ns4b';
import type { LibraryKind } from '../../lib/device/write-guard';

afterEach(cleanup);

const backupFile = (files: Record<string, Uint8Array>) =>
  new File([zipSync({ 'meta.xml': strToU8(buildMetaXml(0)), ...files }, { level: 0 }) as unknown as BlobPart], 'B.ns4b');

/** Pick `file` for restore; the preview then fails (the mock Nord answers nothing), which never blocks the restore. */
function pick(file: File, libraryWrites: Record<LibraryKind, boolean>) {
  const session = new NordSession(new MockTransport([]));
  session.allowWrites(USER_PARTITIONS.map((p) => p.partition));
  session.stage4Layout = true;
  render(
    <BackupPanel session={session} deviceName="Nord" onAfterRestore={() => {}} libraryWrites={libraryWrites} />,
  );
  fireEvent.change(screen.getByText('Restore Nord…').closest('label')!.querySelector('input')!, { target: { files: [file] } });
}

const previewDone = () => screen.findByText(/Couldn't preview changes/);

describe('BackupPanel restore confirmation', () => {
  it('warns that samples are removed and replaced by name when sample writes are on, without waiting for the preview', async () => {
    pick(backupFile({ 'Samp Lib/User 1/Pad.nsmp4': new Uint8Array(60) }), { sample: true, piano: false });
    expect(await screen.findByText(
      /Samples on your Nord that aren’t in this backup are removed, and ones with the same name are replaced\. Make a fresh backup first\./,
    )).toBeInTheDocument();
    await previewDone();
    expect(screen.queryByText(/Pianos on your Nord/)).not.toBeInTheDocument();
  });

  it('names both when the backup holds samples and pianos and both are on', async () => {
    pick(backupFile({ 'Samp Lib/User 1/Pad.nsmp4': new Uint8Array(60), 'Piano/Bank 1/Grand.npno': new Uint8Array(60) }), { sample: true, piano: true });
    expect(await screen.findByText(/Samples and pianos on your Nord that aren’t in this backup are removed/)).toBeInTheDocument();
    await previewDone();
  });

  it('gives no removal warning while sample writes are off', async () => {
    pick(backupFile({ 'Samp Lib/User 1/Pad.nsmp4': new Uint8Array(60) }), { sample: false, piano: false });
    await previewDone();
    expect(screen.queryByText(/aren’t in this backup are removed/)).not.toBeInTheDocument();
  });

  it('keeps Restore off while the preview is loading', async () => {
    pick(backupFile({ 'Samp Lib/User 1/Pad.nsmp4': new Uint8Array(60) }), { sample: true, piano: false });
    expect(screen.getByRole('button', { name: /Restore Nord/ })).toBeDisabled();
    await previewDone();
    expect(screen.getByRole('button', { name: /Restore Nord/ })).toBeEnabled();
  });
});
