// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/folder/FolderContext', () => ({ useFolderOptional: vi.fn() }));
vi.mock('@/lib/clavia/backup/extract-entry', () => ({ extractBackupEntry: vi.fn() }));
vi.mock('@/components/sample/audioPlayer', () => ({ playPcm: vi.fn(() => () => {}), getSharedCtx: vi.fn() }));

import { ProgramPianoAudition } from './ProgramPianoAudition';
import { useFolderOptional } from '@/lib/folder/FolderContext';
import { extractBackupEntry } from '@/lib/clavia/backup/extract-entry';
import { getSharedCtx, playPcm } from '@/components/sample/audioPlayer';
import { makeNpno, tone } from '@/lib/ns4/nsp-synth.testing';
import { decodeNspStroke, readNspDirectory, NSP_SAMPLE_RATE } from '@/lib/ns4/nsp-audio';
import type { BackupRef } from '@/lib/clavia/backup/backup-index';

// Two key zones (root 48 below C4, root 72 from C4 up), each with a loud layer (attenuation
// floor 0) then a soft one (floor 100 = 20 dB down; the switch sits halfway, at 10 dB),
// loudest first as in real files.
// The synthetic header names it "Synth Piano", v6.10.
const layer = (velocityFrom: number, seed: number) => ({ pcm: [tone(2000, 0.02, 3000, seed)], velocityFrom, before: [[0, 0, 0, 0]] });
const PIANO = makeNpno([layer(0, 1), layer(100, 2), layer(0, 3), layer(100, 4)], 1, 0x2c);

const ref = (path: string): BackupRef => ({
  bundlePath: 'Stage 4 backup.ns4b', entry: { path, size: PIANO.length, compressedSize: PIANO.length, offset: 0, method: 0 }, kind: 'piano', native: true,
});

function linkFolder({ pianos = [], backupPianos = [] }: { pianos?: { id: string; name: string; bytes: Uint8Array }[]; backupPianos?: BackupRef[] }) {
  vi.mocked(useFolderOptional).mockReturnValue({
    result: { programs: [], presets: [], pianos, samples: [], errors: [], backupPianos, backupSamples: [] },
  } as unknown as ReturnType<typeof useFolderOptional>);
}

afterEach(cleanup);
beforeEach(() => {
  vi.mocked(useFolderOptional).mockReturnValue(null);
  vi.mocked(playPcm).mockClear();
  vi.mocked(getSharedCtx).mockClear();
  vi.mocked(extractBackupEntry).mockReset();
});

describe('ProgramPianoAudition', () => {
  it('adds nothing without a linked folder, or when the folder lacks this piano', () => {
    const { container, rerender } = render(<ProgramPianoAudition model="Synth Piano" />);
    expect(container).toBeEmptyDOMElement();
    linkFolder({ pianos: [{ id: 'folder:Other 6.1.npno', name: 'Other 6.1', bytes: makeNpno([layer(0, 1)], 1, 0x2c) }] });
    rerender(<ProgramPianoAudition model="White Grand XL" />);
    expect(container).toBeEmptyDOMElement();
    expect(extractBackupEntry).not.toHaveBeenCalled();
  });

  it('plays a few Cs of the matching folder piano, re-pitched, at the chosen touch', () => {
    linkFolder({ pianos: [{ id: 'folder:Synth Piano 6.1.npno', name: 'Synth Piano 6.1', bytes: PIANO }] });
    render(<ProgramPianoAudition model="Synth Piano" />);
    expect(screen.getByText('In your files · v6.1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Listen to Synth Piano' }));
    expect(screen.getAllByRole('button', { name: /^Play C\d, medium$/ }).map((b) => b.textContent))
      .toEqual(['C2', 'C3', 'C4', 'C5', 'C6']);

    const dir = readNspDirectory(PIANO)!;
    fireEvent.click(screen.getByRole('button', { name: 'Play C4, medium' }));
    // C4 plays zone 1 (root 72, sounding 76): 16 semitones down. Medium (80, ≈8 dB down)
    // stays short of the 10 dB switch, so it plays the loud layer.
    expect(playPcm).toHaveBeenLastCalledWith(decodeNspStroke(PIANO, dir, dir.strokes[2]), expect.any(Function), NSP_SAMPLE_RATE * 2 ** (-16 / 12));
    expect(screen.getByRole('button', { name: 'Stop C4, medium' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Soft' }));
    expect(screen.getByRole('button', { name: 'Soft' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Play C3, soft' }));
    // C3 is zone 0's root (48, sounding 52): 4 semitones down, from its soft layer (40 ≈ 20 dB).
    expect(playPcm).toHaveBeenLastCalledWith(decodeNspStroke(PIANO, dir, dir.strokes[1]), expect.any(Function), NSP_SAMPLE_RATE * 2 ** (-4 / 12));
  });

  it('can still stop a note after switching from another (the first note ends late)', () => {
    const voices: { stop: ReturnType<typeof vi.fn>; ended: () => void }[] = [];
    vi.mocked(playPcm).mockImplementation((_pcm, onEnded) => {
      const stop = vi.fn();
      voices.push({ stop, ended: onEnded ?? (() => {}) });
      return stop;
    });
    linkFolder({ pianos: [{ id: 'folder:Synth Piano 6.1.npno', name: 'Synth Piano 6.1', bytes: PIANO }] });
    render(<ProgramPianoAudition model="Synth Piano" />);
    fireEvent.click(screen.getByRole('button', { name: 'Listen to Synth Piano' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play C3, medium' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play C4, medium' }));
    act(() => voices[0].ended()); // Web Audio reports C3's end only after C4 started
    fireEvent.click(screen.getByRole('button', { name: 'Stop C4, medium' }));
    expect(voices[1].stop).toHaveBeenCalled();
  });

  it('opens a piano from a backup only when asked, then plays it', async () => {
    vi.mocked(extractBackupEntry).mockResolvedValue(PIANO);
    linkFolder({ backupPianos: [ref('Piano/Synth Piano 6.1.npno')] });
    render(<ProgramPianoAudition model="Synth Piano" />);
    expect(screen.getByText('In your backup · v6.1')).toBeInTheDocument();
    expect(extractBackupEntry).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Listen to Synth Piano' }));
    expect(getSharedCtx).toHaveBeenCalled(); // audio unlocked inside the tap
    expect(screen.getByText('Opening your piano…')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Play C5, medium' }));
    expect(playPcm).toHaveBeenCalledTimes(1);
  });

  it('says so when the backup can\'t be opened', async () => {
    vi.mocked(extractBackupEntry).mockRejectedValue(new Error('zip'));
    linkFolder({ backupPianos: [ref('Piano/Synth Piano 6.1.npno')] });
    render(<ProgramPianoAudition model="Synth Piano" />);
    fireEvent.click(screen.getByRole('button', { name: 'Listen to Synth Piano' }));
    expect(await screen.findByText("Couldn't open Synth Piano from your backup.")).toBeInTheDocument();
  });

  it('notes when Nord made the piano in more than one version', () => {
    linkFolder({ backupPianos: [ref('Piano/White Grand XL 6.3.npno')] });
    vi.mocked(extractBackupEntry).mockResolvedValue(PIANO);
    render(<ProgramPianoAudition model="White Grand XL" />);
    fireEvent.click(screen.getByRole('button', { name: 'Listen to White Grand XL' }));
    expect(screen.getByText(/more than one version of this piano/)).toBeInTheDocument();
  });
});
