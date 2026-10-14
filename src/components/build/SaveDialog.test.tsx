// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyProject, updateTake } from '@/lib/sample-build/model';
import { importAudioFiles } from '@/lib/sample-build/import-files';
import { encodeWav } from '@/lib/ns4/wav';
import { readNsmp } from '@/lib/ns4/nsmp';

let folderName: string | null = null;
const writeBack = vi.fn(async (name: string) => ({ target: 'folder' as const, path: name }));
const importSample = vi.fn(async (_f: File) => 'local:1');
vi.mock('@/lib/library/SamplesContext', () => ({ useSamplesState: () => ({ importSample }) }));
vi.mock('@/lib/folder/FolderContext', () => ({ useFolder: () => ({ folderName, writeBack }) }));
vi.mock('@/lib/download', () => ({ downloadBytes: vi.fn() }));
import { downloadBytes } from '@/lib/download';
import { SaveDialog } from './SaveDialog';

// Node 26's jsdom has no working localStorage, and the real useFolderWrite reads the overwrite preference from it.
beforeEach(() => {
  folderName = null;
  const m = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k),
  });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });
const wav = (hz: number) => encodeWav([Float32Array.from({ length: 22050 }, (_, i) => 0.4 * Math.sin((2 * Math.PI * hz * i) / 44100))], 44100);
function built() {
  const r = importAudioFiles(emptyProject('Saved Pad'), [{ fileName: 'C4.wav', bytes: wav(261.63) }]);
  const read = (clipId: string) => r.audio.get(r.project.clips.find((c) => c.id === clipId)!.audioRef);
  return { p: r.project, read };
}

describe('SaveDialog', () => {
  it('without a folder, saves the sample into the Library', async () => {
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save sample' }));
    await waitFor(() => expect(importSample).toHaveBeenCalled());
    const file = importSample.mock.calls[0][0] as File;
    expect(file.name).toBe('Saved_Pad.nsmp4');
    expect(readNsmp(new Uint8Array(await file.arrayBuffer())).recognized).toBe(true);
    expect(await screen.findByRole('status')).toHaveTextContent('Library');
  });

  it('downloads the project file', async () => {
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save project file' }));
    await waitFor(() => expect(downloadBytes).toHaveBeenCalledWith(expect.any(Uint8Array), 'Saved_Pad.onsample'));
  });

  it('blocks saving while the project has errors', () => {
    const { p, read } = built();
    const z = p.zones[0];
    const bad = updateTake(p, z.id, z.takes[0].id, { loop: { start: 0 } });
    render(<SaveDialog project={bad} read={read} onClose={vi.fn()} />);
    expect(screen.getByText('Fix these before saving')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save sample' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save project file' })).toBeDisabled();
  });

  it('says in plain words when the project file cannot be written', async () => {
    const { p } = built();
    const missing = () => undefined;
    render(<SaveDialog project={p} read={missing} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save project file' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/Couldn’t save: The audio for “C4.wav” couldn’t be read, so the project file wasn’t written\.$/);
    expect(screen.queryByText(/Couldn.t convert/)).toBeNull();
    expect(downloadBytes).not.toHaveBeenCalled();
  });

  it('says a Library failure as a save failure, and saves once on a double click', async () => {
    importSample.mockRejectedValueOnce(new Error('Storage is full.'));
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Save sample' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(await screen.findByText('Couldn’t save: Storage is full.')).toBeInTheDocument();
    expect(importSample).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Couldn.t convert/)).toBeNull();
  });

  it('with a linked folder, writes there and not to the Library', async () => {
    folderName = 'Nord';
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save sample' }));
    await waitFor(() => expect(importSample).not.toHaveBeenCalled());
    // The saved-before question (new file or overwrite) is the shared one from useSaveBytes.
    expect(await screen.findByRole('button', { name: /new/i })).toBeInTheDocument();
  });

  it('with a linked folder, also saves the project file next to the sample', async () => {
    folderName = 'Nord';
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    expect(screen.getByText(/Also saves the project file/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save sample' }));
    fireEvent.click(await screen.findByRole('button', { name: /new/i }));
    await waitFor(() => expect(writeBack).toHaveBeenCalledTimes(2));
    expect(writeBack.mock.calls.map((c) => c[0])).toEqual(['Saved_Pad.nsmp4', 'Saved_Pad.onsample']);
    expect(await screen.findByText(/Saved_Pad.onsample/)).toBeInTheDocument();
  });

  it('without a folder, saving the sample does not write a project file', async () => {
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    expect(screen.queryByText(/Also saves the project file/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save sample' }));
    await waitFor(() => expect(importSample).toHaveBeenCalled());
    expect(downloadBytes).not.toHaveBeenCalled();
  });
});
