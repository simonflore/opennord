// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RecordDialog } from './RecordDialog';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

/** A fake microphone: the processor's handler is kept so a test can feed it blocks. */
function fakeInput() {
  let handler: ((e: { inputBuffer: { numberOfChannels: number; getChannelData: (c: number) => Float32Array } }) => void) | null = null;
  const node = () => ({ connect: vi.fn() });
  class FakeContext {
    sampleRate = 1000;
    destination = {};
    createMediaStreamSource() { return node(); }
    createGain() { return { ...node(), gain: { value: 1 } }; }
    createScriptProcessor() {
      const p = { ...node(), set onaudioprocess(f: typeof handler) { handler = f; } };
      return p;
    }
    close() { return Promise.resolve(); }
  }
  vi.stubGlobal('AudioContext', FakeContext);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn(async () => ({ getTracks: () => [] })),
      enumerateDevices: vi.fn(async () => [{ kind: 'audioinput', deviceId: 'mic', label: 'Studio mic' }]),
    },
  });
  const feed = (value: number) => act(() => {
    handler?.({ inputBuffer: { numberOfChannels: 2, getChannelData: () => new Float32Array(500).fill(value) } });
  });
  return { feed };
}

describe('RecordDialog', () => {
  it('records a take when the sound gets louder than the start level, and stops on silence', async () => {
    const { feed } = fakeInput();
    const onRecorded = vi.fn(async () => 'added to zone C3');
    render(<RecordDialog zoneRoot={48} onClose={vi.fn()} onRecorded={onRecorded} />);
    expect(await screen.findByRole('option', { name: 'Studio mic' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /A new take on zone C3/ })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Start recording' }));
    feed(0.001); // −60 dB: still waiting
    expect(screen.getByRole('status')).toHaveTextContent('Armed: waiting for you to play');
    feed(0.5);
    expect(screen.getByRole('status')).toHaveTextContent('Recording');
    for (let k = 0; k < 6; k++) feed(0); // 2 s of silence at 1 kHz
    await waitFor(() => expect(onRecorded).toHaveBeenCalled());
    const [audio, into] = onRecorded.mock.calls[0] as unknown as [{ channels: Float32Array[] }, string];
    expect(into).toBe('take');
    expect(audio.channels).toHaveLength(2);
    expect(await screen.findByText('added to zone C3')).toBeInTheDocument();
  });

  it('says so when the browser can’t use a microphone', () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined });
    render(<RecordDialog onClose={vi.fn()} onRecorded={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/microphone/);
    expect(screen.getByRole('button', { name: 'Start recording' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /A new zone on the note you play/ })).toBeChecked();
  });
});
