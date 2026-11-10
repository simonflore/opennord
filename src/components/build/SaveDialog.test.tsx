// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyProject, setTarget, updateTake } from '@/lib/sample-build/model';
import { strFromU8, unzipSync } from 'fflate';
import { importAudioFiles } from '@/lib/sample-build/import-files';
import { encodeWav } from '@/lib/ns4/wav';
import { readNsmp } from '@/lib/ns4/nsmp';

let folderName: string | null = null;
const writeBack = vi.fn(async (name: string) => ({ target: 'folder' as const, path: name }));
const importSample = vi.fn(async (_f: File) => 'local:1');
vi.mock('@/lib/library/SamplesContext', () => ({ useSamplesState: () => ({ importSample }) }));
vi.mock('@/lib/folder/FolderContext', () => ({ useFolder: () => ({ folderName, writeBack }) }));
vi.mock('@/lib/download', () => ({ downloadBytes: vi.fn() }));
const send = {
  connected: false, busy: false, status: '',
  refusal: vi.fn((_bytes?: Uint8Array): string | undefined => undefined),
  send: vi.fn(async (_bytes: Uint8Array, _name: string) => {}),
  clear: vi.fn(),
};
vi.mock('@/components/device/useSendSample', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/device/useSendSample')>()),
  useSendSample: () => send,
}));
const space: { capacity: unknown; places: { bank: number; slot: number; label: string }[] } = { capacity: null, places: [] };
vi.mock('@/components/device/useSampleSpace', () => ({ useSampleSpace: () => space }));
import { downloadBytes } from '@/lib/download';
import { SaveDialog } from './SaveDialog';
import type { LastBuild } from './useBuiltFile';
import { NOT_YET_TRIED } from '@/lib/device/write-guard';

// Node 26's jsdom has no working localStorage, and the real useFolderWrite reads the overwrite preference from it.
beforeEach(() => {
  folderName = null;
  send.connected = false; send.busy = false; send.status = ''; send.refusal.mockReturnValue(undefined);
  space.capacity = null; space.places = [];
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

  it('saves a Nord Sample Editor project with its recordings as one zip', async () => {
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save for Nord Sample Editor' }));
    await waitFor(() => expect(downloadBytes).toHaveBeenCalled());
    const [bytes, name] = vi.mocked(downloadBytes).mock.calls[0];
    expect(name).toBe('Saved_Pad (Nord Sample Editor).zip');
    const files = unzipSync(bytes as Uint8Array);
    expect(Object.keys(files).sort()).toEqual(['C4.wav', 'Saved_Pad.nsmpproj']);
    expect(strFromU8(files['Saved_Pad.nsmpproj'])).toContain('m_fullName = C4.wav');
  });

  it('offers no Nord Sample Editor project for a piano', () => {
    const { p, read } = built();
    render(<SaveDialog project={setTarget(p, 'npno')} read={read} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Save for Nord Sample Editor' })).toBeNull();
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

  it('saving the sample writes only the sample, never a project file', async () => {
    folderName = 'Nord';
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save sample' }));
    fireEvent.click(await screen.findByRole('button', { name: /new/i }));
    await waitFor(() => expect(writeBack).toHaveBeenCalledTimes(1));
    expect(writeBack.mock.calls.map((c) => c[0])).toEqual(['Saved_Pad.nsmp4']);
  });

  it('shows no Send to Nord without a connected Nord', () => {
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Send to Nord' })).toBeNull();
  });

  it('sends the built sample under the project name, once on a double click', async () => {
    send.connected = true;
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Send to Nord' });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(send.send).toHaveBeenCalledTimes(1));
    expect(send.send).toHaveBeenCalledWith(expect.any(Uint8Array), 'Saved Pad');
  });

  it('never sends an empty name to the Nord', async () => {
    send.connected = true;
    const { p, read } = built();
    const file = { bytes: new Uint8Array([1, 2, 3]), fileName: 'Sample.nsmp4', warnings: [] } as unknown as LastBuild['file'];
    const unnamed = { ...p, name: '   ' };
    render(<SaveDialog project={unnamed} read={read} built={{ project: unnamed, file }} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send to Nord' }));
    await waitFor(() => expect(send.send).toHaveBeenCalledWith(file.bytes, 'Sample'));
  });

  it('sends the file Listen already built when the project is unchanged', async () => {
    send.connected = true;
    const { p, read } = built();
    const file = { bytes: new Uint8Array([1, 2, 3]), fileName: 'Saved_Pad.nsmp4', warnings: [] } as unknown as LastBuild['file'];
    render(<SaveDialog project={p} read={read} built={{ project: p, file }} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send to Nord' }));
    await waitFor(() => expect(send.send).toHaveBeenCalledWith(file.bytes, 'Saved Pad'));
  });

  it('greys Send with the reason the hook gives', () => {
    send.connected = true;
    send.refusal.mockReturnValue(NOT_YET_TRIED.sample);
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Send to Nord' })).toBeDisabled();
    expect(screen.getByText(/^Not yet tried on a Nord/)).toBeInTheDocument();
  });

  it('greys Send for an .nsmp3 build', () => {
    send.connected = true;
    const { p, read } = built();
    render(<SaveDialog project={{ ...p, target: 'nsmp3' }} read={read} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Send to Nord' })).toBeDisabled();
    expect(screen.getByText(/Only \.nsmp4 samples/)).toBeInTheDocument();
  });

  it('shows the piano text and no Send button for a piano', () => {
    send.connected = true;
    const { p, read } = built();
    render(<SaveDialog project={{ ...p, target: 'npno' }} read={read} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Send to Nord' })).toBeNull();
    expect(screen.getByText(NOT_YET_TRIED.piano)).toBeInTheDocument();
  });

  it('shows how the send went, in the one status region', () => {
    send.connected = true;
    send.status = 'Sent “Saved Pad” to your Nord.';
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Sent “Saved Pad” to your Nord.');
  });

  it('keeps the send status in view after the Nord drops', () => {
    send.connected = false;
    send.status = 'Couldn’t send: Your Nord stopped answering. Unplug it and plug it back in. The sample may be on your Nord now; check it there before sending again.';
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Send to Nord' })).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(/stopped answering.*may be on your Nord/);
  });

  it('says a build failure plainly instead of sending', async () => {
    send.connected = true;
    const { p } = built();
    render(<SaveDialog project={p} read={() => undefined} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send to Nord' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/^Couldn’t send: /);
    expect(send.send).not.toHaveBeenCalled();
  });

  it('with a Nord connected, shows its sample memory and sends to the empty place chosen', async () => {
    send.connected = true;
    space.capacity = { fileCount: 1, usedBlocks: 300, freeBlocks: 700, reservedBlocks: 0, banks: [], totalSlots: 0, freeSlots: 0, blockSizeBytes: 65536 };
    space.places = [{ bank: 0, slot: 1, label: 'A:12' }, { bank: 0, slot: 2, label: 'A:13' }];
    const { p, read } = built();
    render(<SaveDialog project={p} read={read} onClose={vi.fn()} />);
    expect(screen.getByText('Sample memory on the Nord')).toBeInTheDocument();
    expect(screen.getByText(/43\.8 MB free|43\.75 MB free|44 MB free|45\.9 MB free/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Location on the Nord' }), { target: { value: '0:2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send to Nord, A:13' }));
    await waitFor(() => expect(send.send).toHaveBeenCalledWith(expect.any(Uint8Array), 'Saved Pad', { bank: 0, slot: 2 }));
  });
});
