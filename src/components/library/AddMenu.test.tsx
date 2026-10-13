// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AddMenu } from './AddMenu';
import { FolderMenu } from './FolderMenu';
import type { FolderLibrary } from '@/lib/folder/useFolderLibrary';

afterEach(cleanup);

const folder = (over: Partial<FolderLibrary> = {}) => ({
  folderName: null, busy: false, canPersist: true, needsReconnect: false,
  result: { programs: [{}, {}], samples: [{}], presets: [], pianos: [], errors: [], backupPianos: [], backupSamples: [] },
  choose: vi.fn(async () => {}), refresh: vi.fn(async () => {}), reconnect: vi.fn(async () => {}), forget: vi.fn(async () => {}),
  ...over,
}) as unknown as FolderLibrary;

/** Radix opens its menus on pointerdown, not click. */
const open = (name: RegExp | string) => fireEvent.pointerDown(screen.getByRole('button', { name }), { button: 0, ctrlKey: false });

describe('AddMenu', () => {
  it('imports a file, previews one, or chooses a folder', () => {
    const f = folder();
    const onImport = vi.fn(), preview = vi.fn();
    render(<AddMenu folder={f} noun="a sample file" onImport={onImport} preview={preview} />);
    open('+ Add');
    expect(screen.getByRole('menuitem', { name: /Preview a file/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: /Choose a folder/ }));
    expect(f.choose).toHaveBeenCalled();
    open('+ Add');
    fireEvent.click(screen.getByRole('menuitem', { name: /Import a file/ }));
    expect(onImport).toHaveBeenCalled();
  });

  it('offers to change the folder once one is connected, and no folder without a provider', () => {
    render(<AddMenu folder={folder({ folderName: 'Patches' })} noun="a program file" onImport={() => {}} />);
    open('+ Add');
    expect(screen.getByRole('menuitem', { name: /Change folder/ })).toBeInTheDocument();
    cleanup();
    render(<AddMenu folder={null} noun="a program file" onImport={() => {}} />);
    open('+ Add');
    expect(screen.queryByRole('menuitem', { name: /folder/ })).not.toBeInTheDocument();
  });
});

describe('FolderMenu', () => {
  it('shows nothing without a folder', () => {
    const { container } = render(<FolderMenu folder={folder()} place="rail" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('rescans, changes or forgets the folder', () => {
    const f = folder({ folderName: 'Patches' });
    render(<FolderMenu folder={f} place="rail" />);
    expect(screen.getByRole('button', { name: /Patches.*3 files/ })).toBeInTheDocument();
    open(/Patches/);
    fireEvent.click(screen.getByRole('menuitem', { name: /Rescan folder/ }));
    expect(f.refresh).toHaveBeenCalled();
    open(/Patches/);
    fireEvent.click(screen.getByRole('menuitem', { name: /Forget folder/ }));
    expect(f.forget).toHaveBeenCalled();
  });

  it('asks to reconnect after a reload, and keeps Forget open while busy', () => {
    const f = folder({ folderName: 'Patches', needsReconnect: true, busy: true });
    render(<FolderMenu folder={f} place="toolbar" />);
    expect(screen.getByRole('button', { name: /Patches.*reconnect/ })).toBeInTheDocument();
    open(/Patches/);
    expect(screen.queryByRole('menuitem', { name: /Rescan/ })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Reconnect folder/ })).toHaveAttribute('data-disabled');
    expect(screen.getByRole('menuitem', { name: /Forget folder/ })).not.toHaveAttribute('data-disabled');
  });
});
