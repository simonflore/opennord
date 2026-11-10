// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addClip, addZone, emptyProject } from '../../lib/sample-build/model';
import { buildProject } from '../../lib/sample-build/build';
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

  it('opens a sample of your own in Build a sample, and says when it can’t', async () => {
    const ch = Float32Array.from({ length: 22050 }, (_, i) => 0.3 * Math.sin(i / 20));
    const c = addClip(emptyProject('Pad'), { label: 'a', source: { kind: 'file', fileName: 'a.wav' }, audioRef: 'a', sampleRate: 44100, channels: 1, frames: ch.length });
    const p = addZone(c.project, 60, { clipId: c.clipId, start: 0, end: ch.length, loop: null, loopDecaySeconds: null, gainDb: 0, tuneCents: 0 }).project;
    const bytes = buildProject(p, () => ({ sampleRate: 44100, channels: [ch] })).bytes;
    const onOpenInBuild = vi.fn(async () => { throw new Error('storage is full'); });
    render(<FolderProvider><MidiProvider><SampleInspector initial={{ bytes, name: 'Pad.nsmp4' }} onOpenInBuild={onOpenInBuild} /></MidiProvider></FolderProvider>);
    fireEvent.keyDown(await screen.findByRole('button', { name: 'More actions' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Open in Build a sample' }));
    expect(onOpenInBuild).toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t open it as a build: storage is full');
  });

  it('offers no Open in Build a sample for factory content', async () => {
    const bytes = makeSyntheticNsmp('Strings');
    render(<FolderProvider><MidiProvider><SampleInspector initial={{ bytes, name: 'Strings.nsmp' }} factory onOpenInBuild={vi.fn()} /></MidiProvider></FolderProvider>);
    await waitFor(() => expect(screen.getByText('Strings')).toBeInTheDocument());
    expect(screen.queryByRole('menuitem', { name: 'Open in Build a sample' })).toBeNull();
  });
});
