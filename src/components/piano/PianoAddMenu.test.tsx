// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/folder/FolderContext', () => ({ useFolderOptional: vi.fn() }));
vi.mock('../sample/MakePiano', () => ({
  MakePiano: ({ name, storedName }: { name?: string; storedName?: string }) => <p>make {name} ({storedName})</p>,
}));
vi.mock('@/lib/ns4/nsmp', async (orig) => ({ ...(await orig<typeof import('@/lib/ns4/nsmp')>()), readNsmp: vi.fn() }));

import { PianoAddMenu } from './PianoAddMenu';
import { useFolderOptional } from '@/lib/folder/FolderContext';
import { readNsmp } from '@/lib/ns4/nsmp';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

/** Radix opens its menus on pointerdown, not click. */
const open = () => fireEvent.pointerDown(screen.getByRole('button', { name: '+ Add' }), { button: 0, ctrlKey: false });

/** Answer the next file picker with `file`. */
function pickNext(file: File) {
  vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
    Object.defineProperty(this, 'files', { value: [file] });
    this.onchange?.(new Event('change'));
  });
}

describe('PianoAddMenu', () => {
  it('makes a piano from a sample picked here', async () => {
    (useFolderOptional as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (readNsmp as ReturnType<typeof vi.fn>).mockReturnValue({ recognized: true, codec: 4, legacy: false, name: 'Stored' });
    pickNext(new File([new Uint8Array(8)], 'Rhodes.nsmp4'));
    render(<PianoAddMenu />);
    open();
    await act(async () => { fireEvent.click(screen.getByRole('menuitem', { name: /make a piano from a sample/i })); });
    expect(await screen.findByText('make Rhodes.nsmp4 (Stored)')).toBeInTheDocument();
    expect(screen.getByText(/the piano downloads/i)).toBeInTheDocument();
  });

  it('says so when the file is not a sample it can read', async () => {
    (useFolderOptional as ReturnType<typeof vi.fn>).mockReturnValue(null);
    pickNext(new File([new Uint8Array(8)], 'Grand.npno'));
    render(<PianoAddMenu />);
    open();
    await act(async () => { fireEvent.click(screen.getByRole('menuitem', { name: /make a piano from a sample/i })); });
    expect(await screen.findByRole('alert')).toHaveTextContent(/isn’t a Nord sample/);
  });

  it('chooses a folder to list its pianos', () => {
    const choose = vi.fn(async () => {});
    (useFolderOptional as ReturnType<typeof vi.fn>).mockReturnValue({ folderName: null, busy: false, choose });
    render(<PianoAddMenu />);
    open();
    fireEvent.click(screen.getByRole('menuitem', { name: /choose a folder/i }));
    expect(choose).toHaveBeenCalled();
  });
});
