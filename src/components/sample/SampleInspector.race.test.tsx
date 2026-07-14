// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, act, waitFor } from '@testing-library/react';
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

/** A File whose arrayBuffer resolves only when told to — simulates a slow read. */
function gatedFile(name: string, bytes: Uint8Array): { file: File; release: () => void } {
  const file = new File([bytes as unknown as BlobPart], name);
  let release!: () => void;
  const gate = new Promise<ArrayBuffer>((res) => {
    release = () => res(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  });
  Object.defineProperty(file, 'arrayBuffer', { value: () => gate });
  return { file, release };
}

describe('SampleInspector file-load race', () => {
  it('keeps the most recently picked file when an earlier slow read resolves late', async () => {
    const slow = gatedFile('slow.nsmp', makeSyntheticNsmp('SlowOne'));
    const fast = gatedFile('fast.nsmp', makeSyntheticNsmp('FastOne'));

    render(<FolderProvider><MidiProvider><SampleInspector /></MidiProvider></FolderProvider>);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Pick the big/slow file, then immediately pick another. The second pick
    // must win even though the first read finishes after it.
    await act(async () => {
      Object.defineProperty(input, 'files', { value: [slow.file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
      Object.defineProperty(input, 'files', { value: [fast.file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
      fast.release();
    });
    await waitFor(() => expect(screen.getByText('FastOne')).toBeInTheDocument());

    await act(async () => { slow.release(); });
    expect(screen.queryByText('SlowOne')).not.toBeInTheDocument();
    expect(screen.getByText('FastOne')).toBeInTheDocument();
  });
});
