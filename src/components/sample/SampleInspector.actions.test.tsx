// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SampleInspector } from './SampleInspector';
import { MidiProvider } from '../../lib/midi/MidiContext';
import { FolderProvider } from '../../lib/folder/FolderContext';
import { patchNs4Checksum } from '../../lib/clavia/checksum';

afterEach(cleanup);

/** Minimal recognized `.nsmp` (CBIN header + NSMP + hdr sections) with an embedded name. */
function makeSyntheticNsmp(name: string): Uint8Array {
  const hdrPay = new Uint8Array(8);
  for (let i = 0; i < name.length && i < 8; i++) hdrPay[i] = name.charCodeAt(i);
  const buf = new Uint8Array(0x2c + 16 + (12 + hdrPay.length));
  const ascii = (s: string, at: number) => { for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i); };
  const u32be = (v: number, at: number) => { buf[at] = (v >>> 24) & 0xff; buf[at + 1] = (v >>> 16) & 0xff; buf[at + 2] = (v >>> 8) & 0xff; buf[at + 3] = v & 0xff; };
  ascii('CBIN', 0x00);
  buf[0x04] = 1;
  ascii('nsmp', 0x08);
  buf[0x14] = 300 & 0xff; buf[0x15] = (300 >> 8) & 0xff; // version 3.00
  u32be(0x4e534d50, 0x2c); u32be(30, 0x30); u32be(4, 0x34); // NSMP section
  u32be(0x00686472, 0x3c); u32be(10, 0x40); u32be(hdrPay.length, 0x44); // .hdr
  buf.set(hdrPay, 0x48);
  return patchNs4Checksum(buf);
}

describe('SampleInspector', () => {
  it('shows the sample with its actions in one row, and no preview drop zone', async () => {
    const bytes = makeSyntheticNsmp('Strings');
    render(<FolderProvider><MidiProvider><SampleInspector initial={{ bytes, name: 'Strings.nsmp' }} /></MidiProvider></FolderProvider>);
    await waitFor(() => expect(screen.getByText('Strings')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Save to computer' })).toBeInTheDocument();
    expect(screen.queryByText(/preview a sample/i)).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });
});
