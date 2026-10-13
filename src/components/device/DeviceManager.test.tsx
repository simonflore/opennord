// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProgramEntry } from '../../lib/device/transfer';

const program = vi.fn();
const slot: ProgramEntry = { bank: 0, slot: 9, name: 'Wurli', categoryId: 0, version: 313, sizeBytes: 10, fourcc: 'ns4p' };
const session = { programPartition: 3, canWrite: () => true, withSession: vi.fn(() => new Promise(() => {})) };

const ensureListed = vi.fn();
vi.mock('../library/openEntry', () => ({ useOpenEntry: () => ({ program }) }));
vi.mock('../../lib/library/LibraryContext', () => ({ useLibraryData: () => ({ ensureListed }) }));
vi.mock('../../lib/device/DeviceContext', () => ({
  useDevice: () => ({
    session, entries: [slot], deviceName: 'Nord Stage 4', productId: 0x002e, capacity: null,
    setConnection: vi.fn(), setCapacity: vi.fn(), isCurrent: () => true, lost: false, refresh: vi.fn(),
  }),
}));
vi.mock('../../lib/folder/FolderContext', () => ({ useFolder: () => ({ bundles: [] }) }));
vi.mock('./DeviceBrowser', () => ({
  DeviceBrowser: ({ entries, onSelect }: { entries: ProgramEntry[]; onSelect: (e: ProgramEntry) => void }) =>
    <button onClick={() => onSelect(entries[0])}>{entries[0].name}</button>,
}));

import { DeviceManager } from './DeviceManager';

afterEach(cleanup);

describe('DeviceManager', () => {
  it('opens a slot’s program in the Library, which reads it from the Nord', () => {
    render(<DeviceManager />);
    fireEvent.click(screen.getByRole('button', { name: 'Wurli' }));
    expect(program).toHaveBeenCalledWith({ id: 'nord:A:22', name: 'Wurli', source: 'nord' });
    expect(ensureListed).toHaveBeenCalledWith('nord:A:22'); // a list filter doesn't hide its row
    expect(screen.queryByRole('button', { name: 'Send to Nord' })).not.toBeInTheDocument();
  });
});
