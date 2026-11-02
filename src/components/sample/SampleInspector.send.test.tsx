// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SampleInspector } from './SampleInspector';
import { MidiProvider } from '../../lib/midi/MidiContext';
import { FolderProvider } from '../../lib/folder/FolderContext';
import { testSample } from '../../lib/device/wire-replies';
import type { ReactNode } from 'react';

// Node 26's own localStorage shadows jsdom's; give the inspector a plain in-memory one.
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const initial = { bytes: testSample({ name: 'MyPad' }), name: 'MyPad.nsmp4' };
const shell = (ui: ReactNode) => render(<FolderProvider><MidiProvider>{ui}</MidiProvider></FolderProvider>);

describe('SampleInspector Send to Nord', () => {
  it('offers Send to Nord when given, and calls it', async () => {
    const onSend = vi.fn();
    shell(<SampleInspector initial={initial} send={{ onSend }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Send to Nord' }));
    expect(onSend).toHaveBeenCalledOnce();
  });

  it('greys it with the reason beside it', async () => {
    shell(<SampleInspector initial={initial} send={{ onSend: vi.fn(), disabledReason: 'Not yet tried on a Nord: sending samples stays off until it has been.' }} />);
    expect(await screen.findByRole('button', { name: 'Send to Nord' })).toBeDisabled();
    expect(screen.getByText(/^Not yet tried on a Nord/)).toBeInTheDocument();
  });

  it('shows no Send to Nord without a send (no Nord connected)', async () => {
    shell(<SampleInspector initial={initial} />);
    await screen.findByRole('button', { name: 'Save to computer' });
    expect(screen.queryByRole('button', { name: 'Send to Nord' })).toBeNull();
  });

  it('shows how the send went, even with no send offered (the Nord was lost)', async () => {
    shell(<SampleInspector initial={initial} sendStatus="Sent “MyPad” to your Nord." />);
    expect(await screen.findByText('Sent “MyPad” to your Nord.')).toBeInTheDocument();
  });
});
