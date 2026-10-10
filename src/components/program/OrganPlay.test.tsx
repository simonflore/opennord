// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NS4Layer } from '@/lib/ns4/types';
import { MidiProvider } from '@/lib/midi/MidiContext';

const voice = {
  output: {} as AudioNode,
  backend: 'worklet' as const,
  noteOn: vi.fn(), noteOff: vi.fn(), setParams: vi.fn(), allNotesOff: vi.fn(), dispose: vi.fn(),
};
const createOrganVoice = vi.fn(async (_ctx: unknown, _opts: unknown) => voice);
vi.mock('@/lib/engine/organ/organ-voice', () => ({ createOrganVoice }));
vi.mock('@/components/sample/audioPlayer', () => ({ getSharedCtx: () => ({}) }));

const { OrganPlay } = await import('./OrganPlay');

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const b3: NS4Layer = {
  id: 'A', kind: 'organ', organModel: 'B3',
  drawbars: ['8', '8', '8', '0', '0', '0', '0', '0', '0'].map((value) => ({ value })),
  percussion: { on: true, harm3rd: true },
};

describe('OrganPlay', () => {
  it('starts the organ with the layer settings on first press, then stops it', async () => {
    render(<OrganPlay layer={b3} />);
    expect(screen.getByText(/tonewheel model/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play this organ' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Stop/ })).toBeInTheDocument());
    const opts = createOrganVoice.mock.calls[0][1] as { params: { model: string; drawbars: number[]; percussion: { harm3rd: boolean } } };
    expect(opts.params.model).toBe('B3');
    expect(opts.params.drawbars).toEqual([8, 8, 8, 0, 0, 0, 0, 0, 0]);
    expect(opts.params.percussion.harm3rd).toBe(true);
    expect(screen.getByRole('group', { name: 'Keyboard zone map' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Stop/ }));
    await waitFor(() => expect(voice.dispose).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Play this organ' })).toBeInTheDocument();
  });

  it('works inside the app MIDI provider and labels other models as a sketch', async () => {
    render(<MidiProvider><OrganPlay layer={{ ...b3, organModel: 'VOX' }} /></MidiProvider>);
    expect(screen.getByText(/simplified sketch/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play this organ' }));
    await waitFor(() => expect(screen.getByText(/play this organ\./)).toBeInTheDocument());
  });
});
