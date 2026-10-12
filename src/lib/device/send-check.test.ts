import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildCbinHeader } from '../clavia/cbin';
import { ALL_MODELS } from '../clavia/partitions';
import { sendRefusal } from './send-check';

const model = (id: string) => ALL_MODELS.find((m) => m.id === id)!;
const stage4Program = new Uint8Array(readFileSync(new URL('../ns4/__fixtures__/BreakFree_chords.ns4p', import.meta.url)));
const header = (tag: string, versionRaw = 304) => {
  const out = new Uint8Array(0x200);
  out.set(buildCbinHeader({ formatType: 1, tag, bank: 0, location: 0, category: 0, versionRaw }));
  return out;
};

describe('sendRefusal', () => {
  it('lets a Stage 4 program go to a Stage 4', () => {
    expect(sendRefusal(stage4Program, model('stage-4'))).toBeUndefined();
  });

  it('asks to convert a Stage 3 program before sending it to a Stage 4', () => {
    expect(sendRefusal(header('ns3f'), model('stage-4'))).toMatch(/Stage 3 program\. Convert it to Stage 4 first/);
  });

  it('refuses a program of another kind of Nord', () => {
    expect(sendRefusal(stage4Program, model('stage-3'))).toMatch(/isn’t for a Nord Stage 3/);
  });

  it('keeps what Nord Sound Manager refuses, and leaves an unknown model to it', () => {
    expect(sendRefusal(new Uint8Array(64), model('stage-4'))).toMatch(/not a Nord file/);
    expect(sendRefusal(stage4Program, null)).toBeUndefined();
  });

  it('says a Live program can’t be sent yet, and only offers the conversion that exists (to Stage 4)', () => {
    expect(sendRefusal(header('ns4l'), model('stage-4'))).toMatch(/Live program/);
    expect(sendRefusal(header('ns3f'), model('stage-2'))).toBe('This is a Stage 3 program, so it can’t be sent to a Nord Stage 2.');
    expect(sendRefusal(header('ns2p'), model('stage-3'))).not.toMatch(/Convert/);
  });
});
