// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MidiProvider } from '../../lib/midi/MidiContext';
import { buildCbinHeader } from '../../lib/clavia/cbin';
import { SampleListen } from './SampleListen';

afterEach(cleanup);

/** A CBIN header tagged `nsmp` (codec 4) followed by an empty `NSMP` root section. */
function headerOnlySample(): Uint8Array {
  const head = buildCbinHeader({ formatType: 1, tag: 'nsmp', bank: 0, location: 0, category: 0, versionRaw: 400 });
  const out = new Uint8Array(head.length + 12);
  out.set(head);
  out.set([0x4e, 0x53, 0x4d, 0x50], head.length); // "NSMP", version 0, size 0
  return out;
}
const show = (bytes: Uint8Array) => render(<MidiProvider><SampleListen bytes={bytes} name="My Flute.nsmp4" /></MidiProvider>);

describe('SampleListen', () => {
  it('shows the sample, and none of the inspector\'s file actions', () => {
    show(headerOnlySample());
    expect(screen.getByText('My Flute')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save to computer' })).not.toBeInTheDocument();
    expect(screen.queryByText(/make it a piano/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/preview a sample/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/save edited copy/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/download/i)).not.toBeInTheDocument();
  });
  it('says so when the bytes are not a sample', () => {
    show(new Uint8Array(64));
    expect(screen.getByText(/not a recognized nord sample/i)).toBeInTheDocument();
  });
});
