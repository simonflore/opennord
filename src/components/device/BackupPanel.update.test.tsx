// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { BackupOptions, BackupProgress } from '../../lib/device/backup';
import { NordSession } from '../../lib/device/session';
import { MockTransport } from '../../lib/device/transport';
import { USER_PARTITIONS } from '../../lib/device/ns4b';

const calls: { opts?: BackupOptions }[] = [];
const reuse = { stats: { reused: 214, previousUnreadable: false } };
vi.mock('../../lib/device/backup', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/device/backup')>()),
  backup: async (_s: unknown, onProgress?: (p: BackupProgress) => void, _specs?: unknown, opts?: BackupOptions) => {
    calls.push({ opts });
    if (opts?.previous) opts.onReuse?.(reuse.stats);
    onProgress?.({ doneFiles: 1, totalFiles: 4, doneBytes: 50, totalBytes: 100 });
    return new Blob(['x']);
  },
}));
vi.mock('../../lib/download', () => ({ downloadBlob: vi.fn() }));
import { BackupPanel } from './BackupPanel';

afterEach(() => { cleanup(); calls.length = 0; reuse.stats = { reused: 214, previousUnreadable: false }; });

function panel() {
  const session = new NordSession(new MockTransport([]));
  session.allowWrites(USER_PARTITIONS.map((p) => p.partition));
  session.stage4Layout = true;
  return render(<BackupPanel session={session} deviceName="Nord" onAfterRestore={() => {}} />);
}

describe('BackupPanel: Update a backup…', () => {
  it('backs up with the picked earlier archive as `previous`', async () => {
    panel();
    const earlier = new File(['zip'], 'Earlier.ns4b');
    const input = screen.getByText('Update a backup…').closest('label')!.querySelector('input')!;
    fireEvent.change(input, { target: { files: [earlier] } });
    await screen.findByText(/Backup downloaded/);
    expect(calls).toHaveLength(1);
    expect(calls[0].opts?.previous).toBe(earlier);
  });

  it('“Back up Nord” passes no earlier archive', async () => {
    panel();
    fireEvent.click(screen.getByRole('button', { name: 'Back up Nord' }));
    await screen.findByText(/Backup downloaded/);
    expect(calls[0].opts?.previous).toBeUndefined();
  });

  async function update() {
    panel();
    const input = screen.getByText('Update a backup…').closest('label')!.querySelector('input')!;
    fireEvent.change(input, { target: { files: [new File(['zip'], 'Earlier.ns4b')] } });
    await screen.findByText(/Backup downloaded/);
  }

  it('explains next to the control what an update copies', () => {
    panel();
    expect(screen.getByText(/same name, place and size/)).toBeInTheDocument();
    expect(screen.getByText(/completely fresh copy, use Back up Nord/)).toBeInTheDocument();
  });

  it('says how many files were copied from the earlier backup', async () => {
    await update();
    expect(screen.getByText(/214 samples and pianos copied from your earlier backup; the rest read from your Nord/)).toBeInTheDocument();
  });

  it('says when nothing could be copied', async () => {
    reuse.stats = { reused: 0, previousUnreadable: false };
    await update();
    expect(screen.getByText(/Nothing could be copied from your earlier backup/)).toBeInTheDocument();
  });

  it('says when the picked backup couldn’t be read', async () => {
    reuse.stats = { reused: 0, previousUnreadable: true };
    await update();
    expect(screen.getByText(/Couldn’t read that backup, so everything was read from your Nord/)).toBeInTheDocument();
  });

  it('a plain backup says nothing about an earlier one', async () => {
    panel();
    fireEvent.click(screen.getByRole('button', { name: 'Back up Nord' }));
    await screen.findByText(/Backup downloaded/);
    expect(screen.queryByText(/earlier backup/)).toBeNull();
  });
});
