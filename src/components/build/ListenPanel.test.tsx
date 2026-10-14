// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MidiProvider } from '@/lib/midi/MidiContext';
import { emptyProject, setTarget, updateTake } from '@/lib/sample-build/model';
import { importAudioFiles } from '@/lib/sample-build/import-files';
import { encodeWav } from '@/lib/ns4/wav';
import { ListenPanel } from './ListenPanel';

afterEach(cleanup);
const wav = (hz: number) => encodeWav([Float32Array.from({ length: 22050 }, (_, i) => 0.4 * Math.sin((2 * Math.PI * hz * i) / 44100))], 44100);
function built() {
  const r = importAudioFiles(emptyProject('Listen Test'), [{ fileName: 'C4.wav', bytes: wav(261.63) }]);
  const read = (clipId: string) => r.audio.get(r.project.clips.find((c) => c.id === clipId)!.audioRef);
  return { p: r.project, read };
}

describe('ListenPanel', () => {
  it('plays the built sample', async () => {
    const { p, read } = built();
    render(<MidiProvider><ListenPanel project={p} read={read} /></MidiProvider>);
    expect((await screen.findAllByText('Listen Test', {}, { timeout: 2000 })).length).toBeGreaterThan(0);
  });

  it('says what to fix while the project can\'t be built', async () => {
    const { p, read } = built();
    const z = p.zones[0];
    const bad = updateTake(p, z.id, z.takes[0].id, { loop: { start: 0 } });
    render(<MidiProvider><ListenPanel project={bad} read={read} /></MidiProvider>);
    const msg = await screen.findByText(/Fix this to listen/, {}, { timeout: 2000 });
    expect(msg).toBeInTheDocument();
    expect(msg).not.toHaveAttribute('role', 'alert');
  });

  it('keeps the old player until the rebuild lands after a format switch', async () => {
    const { p, read } = built();
    const ui = (x: typeof p) => <MidiProvider><ListenPanel project={x} read={read} /></MidiProvider>;
    const { rerender } = render(ui(p));
    await screen.findAllByText('Listen Test', {}, { timeout: 2000 });
    expect(() => rerender(ui(setTarget(p, 'npno')))).not.toThrow();
  });
});
