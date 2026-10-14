// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { encodeWav } from '@/lib/ns4/wav';
import { MidiProvider } from '@/lib/midi/MidiContext';
import { createProject } from '@/lib/library/useSampleProject';
import { loadProject } from '@/lib/library/sampleProjectStore';
import { BuildScreen } from './BuildScreen';

afterEach(cleanup);
const wavFile = (name: string, hz: number) =>
  new File([encodeWav([Float32Array.from({ length: 22050 }, (_, i) => 0.4 * Math.sin((2 * Math.PI * hz * i) / 44100))], 44100) as BlobPart], name);

async function open() {
  const id = await createProject('Upright Rhodes');
  render(<MidiProvider><BuildScreen projectId={id} onClose={vi.fn()} /></MidiProvider>);
  await screen.findByDisplayValue('Upright Rhodes');
  return id;
}

describe('BuildScreen', () => {
  it('adds WAV files from the file picker and lists them as clips', async () => {
    await open();
    const input = screen.getByLabelText('Add files…');
    fireEvent.change(input, { target: { files: [wavFile('Rhodes_C3.wav', 130.81), wavFile('Rhodes_C4.wav', 261.63)] } });
    // The first zone is selected at once, so its take names a file too: look in the clip list.
    const clips = await screen.findByRole('complementary', { name: 'Clips' });
    expect(await within(clips).findByText('Rhodes_C3.wav')).toBeInTheDocument();
    expect(within(clips).getByText('Rhodes_C4.wav')).toBeInTheDocument();
    expect(screen.getAllByText(/zone C3|zone C4/)).toHaveLength(2);
  });

  it('names files it could not read', async () => {
    await open();
    fireEvent.change(screen.getByLabelText('Add files…'), { target: { files: [new File(['ID3'], 'song.wav')] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('song.wav');
  });

  it('renames the build and saves it', async () => {
    const id = await open();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Mk I' } });
    await waitFor(async () => expect((await loadProject(id))?.name).toBe('Mk I'));
  });

  it('switches the format, marking the piano as untried', async () => {
    await open();
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Format' })).getByRole('radio', { name: 'Piano' }));
    expect(screen.getByText(/not yet tried on a Nord/i)).toBeInTheDocument();
  });

  it('undoes a rename', async () => {
    await open();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Mk I' } });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Upright Rhodes');
  });

  it('undoes typing a name in one step', async () => {
    await open();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Mk' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Mk I' } });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Upright Rhodes');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('splitting a one-note file that is already a take adds nothing again', async () => {
    await open();
    fireEvent.change(screen.getByLabelText('Add files…'), { target: { files: [wavFile('long.wav', 261.63)] } });
    fireEvent.click(await screen.findByRole('button', { name: 'Split long.wav into notes' }));
    expect(await screen.findByText('already zone C4’s take')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add 0 zones and 0 takes' })).toBeDisabled();
  });

  it('counts one zone in the singular', async () => {
    await open();
    fireEvent.change(screen.getByLabelText('Add files…'), { target: { files: [wavFile('Rhodes_C4.wav', 261.63)] } });
    expect(await screen.findByText(/^1 zone · drag a split/)).toBeInTheDocument();
  });

  it('says a pitch it could not hear as a status, not an alert', async () => {
    await open();
    const silence = new File([encodeWav([new Float32Array(22050)], 44100) as BlobPart], 'quiet.wav');
    fireEvent.change(screen.getByLabelText('Add files…'), { target: { files: [silence] } });
    expect(await screen.findByRole('status')).toHaveTextContent('No clear pitch in “quiet.wav”');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
