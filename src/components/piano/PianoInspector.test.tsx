// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/folder/FolderContext', () => ({ useFolder: () => ({}) }));
vi.mock('@/lib/clavia/backup/extract-entry', () => ({ extractBackupEntry: vi.fn() }));
vi.mock('@/lib/download', () => ({ downloadBytes: vi.fn() }));
vi.mock('@/components/sample/audioPlayer', () => ({ playPcm: vi.fn(() => () => {}), getSharedCtx: vi.fn() }));

import { PianoInspector } from './PianoInspector';
import { extractBackupEntry } from '@/lib/clavia/backup/extract-entry';
import type { PianoEntry } from '@/lib/library/piano-entries';
import type { BackupRef } from '@/lib/clavia/backup/backup-index';
import { makeNpno, tone } from '@/lib/ns4/nsp-synth.testing';

afterEach(() => { cleanup(); vi.mocked(extractBackupEntry).mockReset(); });

const PIANO = makeNpno([{ pcm: [tone(2000, 0.02, 3000, 1)], velocityFrom: 0, before: [[0, 0, 0, 0]] }], 1, 0x2c);
const backup = (name: string): PianoEntry => {
  const ref: BackupRef = {
    bundlePath: 'b.ns4b', entry: { path: `Piano/${name}.npno`, size: 1, compressedSize: 1, offset: 0, method: 0 }, kind: 'piano', native: true,
  };
  return { id: `backup:b.ns4b!Piano/${name}.npno`, name, source: 'backup', factory: null, backupRef: ref };
};

describe('PianoInspector', () => {
  it('drops a backup load that finishes after another piano was picked', async () => {
    let finish!: (b: Uint8Array) => void;
    vi.mocked(extractBackupEntry).mockImplementationOnce(() => new Promise((res) => { finish = res; }));
    const a = backup('Piano A'), b = backup('Piano B');
    const { rerender } = render(<PianoInspector entry={a} session={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Load sounds' }));
    rerender(<PianoInspector entry={b} session={null} />);
    await act(async () => { finish(PIANO); });
    expect(screen.getByText('Piano B')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Play / })).not.toBeInTheDocument(); // A's sounds are not shown as B's
    expect(screen.getByRole('button', { name: 'Load sounds' })).toBeInTheDocument();
  });

  it('shows the sounds of the piano it loaded', async () => {
    vi.mocked(extractBackupEntry).mockResolvedValueOnce(PIANO);
    render(<PianoInspector entry={backup('Piano A')} session={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Load sounds' }));
    expect(await screen.findByRole('button', { name: /^Play / })).toBeInTheDocument();
  });

  it('can play a piano it saved to the computer', async () => {
    vi.mocked(extractBackupEntry).mockResolvedValueOnce(PIANO);
    render(<PianoInspector entry={backup('Piano A')} session={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save to computer' }));
    expect(await screen.findByRole('button', { name: /^Play / })).toBeInTheDocument();
  });

  it('offers Share to community when given onShare, and not otherwise', () => {
    const entry: PianoEntry = { id: 'folder:Mine.npno', name: 'Mine', source: 'local', factory: null, bytes: PIANO };
    const onShare = vi.fn();
    render(<PianoInspector entry={entry} session={null} onShare={onShare} />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'More actions' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share to community' }));
    expect(onShare).toHaveBeenCalledTimes(1);
    cleanup();
    render(<PianoInspector entry={entry} session={null} />);
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
  });
});
