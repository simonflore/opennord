import { describe, it, expect } from 'vitest';
import { fileCaptureSource, slotCaptureSource } from './source';
import { buildCbinHeader } from '../clavia/cbin';
import type { ProgramEntry } from '../device/transfer';
import type { NordSession } from '../device/session';

function fakeFile(bodyByte: number): Uint8Array {
  const header = buildCbinHeader({ formatType: 1, tag: 'ns4p', bank: 0, location: 0, category: 0, versionRaw: 400 });
  const file = new Uint8Array(header.length + 3);
  file.set(header, 0);
  file.set([bodyByte, bodyByte, bodyByte], header.length);
  return file;
}

describe('fileCaptureSource', () => {
  it('identifies the model and returns the header-stripped body', async () => {
    const cap = await fileCaptureSource(fakeFile(7)).capture();
    expect(cap.model.tag).toBe('ns4p');
    expect([...cap.body]).toEqual([7, 7, 7]);
  });
});

describe('slotCaptureSource', () => {
  it('reads the slot via the injected reader and strips the header', async () => {
    const entry = { bank: 0, slot: 0 } as ProgramEntry;
    const readFile = async () => fakeFile(9);
    const cap = await slotCaptureSource({} as NordSession, entry, readFile).capture();
    expect(cap.model.tag).toBe('ns4p');
    expect([...cap.body]).toEqual([9, 9, 9]);
  });
});
