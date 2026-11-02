import { describe, it, expect } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readCbinHeader } from '../clavia/cbin';
import { analyzeRestore, diffPrograms, listBackupProgramSlots, type ProgramSlot } from './restore-diff';
import { MockTransport } from './transport';
import { NordSession } from './session';
import { CReqBegin, CReqEnd } from './opcodes';
import { buildCbinHeader } from '../clavia/cbin';
import { ack, info, iter } from './wire-replies';

const p = (bank: number, slot: number, name: string): ProgramSlot => ({ bank, slot, name });

describe('diffPrograms', () => {
  it('counts a slot whose program name differs as changed', () => {
    const d = diffPrograms([p(0, 0, 'Old Lead')], [p(0, 0, 'New Lead')]);
    expect(d).toEqual({ changed: 1, added: 0, unchanged: 0, untouched: 0 });
  });

  it('counts the same name at a slot as unchanged', () => {
    const d = diffPrograms([p(0, 0, 'Lead')], [p(0, 0, 'Lead')]);
    expect(d).toEqual({ changed: 0, added: 0, unchanged: 1, untouched: 0 });
  });

  it('counts a backup program landing on an empty device slot as added', () => {
    const d = diffPrograms([], [p(1, 3, 'Pad')]);
    expect(d).toEqual({ changed: 0, added: 1, unchanged: 0, untouched: 0 });
  });

  it('counts a device program the backup does not write as untouched', () => {
    const d = diffPrograms([p(2, 5, 'Bass')], []);
    expect(d).toEqual({ changed: 0, added: 0, unchanged: 0, untouched: 1 });
  });

  it('tallies a mixed layout', () => {
    const device = [p(0, 0, 'A'), p(0, 1, 'B'), p(0, 2, 'KeepMe')];
    const backup = [p(0, 0, 'A'), p(0, 1, 'B2'), p(0, 9, 'New')];
    // 0:0 same → unchanged; 0:1 differs → changed; 0:9 empty → added; 0:2 not written → untouched
    expect(diffPrograms(device, backup)).toEqual({ changed: 1, added: 1, unchanged: 1, untouched: 1 });
  });

  it('handles both sides empty', () => {
    expect(diffPrograms([], [])).toEqual({ changed: 0, added: 0, unchanged: 0, untouched: 0 });
  });
});

const fixture = (name: string) =>
  new Uint8Array(readFileSync(fileURLToPath(new URL(`../ns4/__fixtures__/${name}`, import.meta.url))));

describe('listBackupProgramSlots', () => {
  it("reads each program file's {bank, slot} from its CBIN header + name from the path", async () => {
    const prog = fixture('BreakFreeSolo.ns4p');
    const h = readCbinHeader(prog); // ground truth: where this program actually lives
    const blob = new Blob([zipSync({
      'meta.xml': strToU8('<?xml version="1.0"?><backup product_id="46"/>'),
      'Program/Bank A/My Lead.ns4p': prog,
      'Samp Lib/Factory/Bell.nsmp4': new Uint8Array(8), // must be ignored (not a program)
    }).buffer as ArrayBuffer]);
    const slots = await listBackupProgramSlots(blob, 'TBM.ns4b');
    expect(slots).toEqual([{ bank: h.bank, slot: h.location, name: 'My Lead' }]);
  });
});

describe('analyzeRestore with samples', () => {
  const pad = new Uint8Array([...buildCbinHeader({ formatType: 1, tag: 'nsmp', bank: 0, location: 3, category: 0, versionRaw: 400 }), ...new Uint8Array(100)]);

  it('counts the samples a restore removes, when sample writes are on', async () => {
    const file = new File([zipSync({
      'meta.xml': strToU8('<?xml version="1.0"?><backup product_id="46"/>'),
      'Samp Lib/User 1/Pad.nsmp4': pad,
    }) as unknown as BlobPart], 'B.ns4b');
    const session = new NordSession(new MockTransport([
      ack(CReqBegin), iter(2, 0, 0), ack(CReqEnd), // programs: none
      ack(CReqBegin), iter(0, 0, 0), info('Old', 10), iter(1, 0, 0), iter(2, 1, 0), ack(CReqEnd), // samples: Old
    ]));
    session.allowWrites([5]);
    session.stage4Layout = true;
    const impact = await analyzeRestore(session, file, { sample: true, piano: false });
    expect(impact).toMatchObject({ samples: 1, writesSamples: true, writesPianos: false, removesSamples: 1, removesPianos: 0 });
  });

  it('counts no removals while sample writes are off', async () => {
    const file = new File([zipSync({ 'meta.xml': strToU8('<backup product_id="46"/>'), 'Samp Lib/User 1/Pad.nsmp4': new Uint8Array(60) }) as unknown as BlobPart], 'B.ns4b');
    const session = new NordSession(new MockTransport([ack(CReqBegin), iter(2, 0, 0), ack(CReqEnd)]));
    expect(await analyzeRestore(session, file, { sample: false, piano: false })).toMatchObject({ writesSamples: false, removesSamples: 0 });
  });

  it('counts no removals when a backup sample can’t be read, as the restore then changes nothing there', async () => {
    const file = new File([zipSync({
      'meta.xml': strToU8('<backup product_id="46"/>'),
      'Samp Lib/User 1/Pad.nsmp4': pad,
      'Samp Lib/User 1/Broken.nsmp4': new Uint8Array(60),
    }) as unknown as BlobPart], 'B.ns4b');
    const t = new MockTransport([ack(CReqBegin), iter(2, 0, 0), ack(CReqEnd)]);
    const session = new NordSession(t);
    session.allowWrites([5]);
    session.stage4Layout = true;
    expect(await analyzeRestore(session, file, { sample: true, piano: false })).toMatchObject({ writesSamples: true, removesSamples: 0 });
    expect(t.sent).toHaveLength(3); // the programs' listing only: begin, iterate, end
  });

  it('promises no sample writes where the restore would leave them out (not confirmed writable)', async () => {
    const file = new File([zipSync({ 'meta.xml': strToU8('<backup product_id="46"/>'), 'Samp Lib/User 1/Pad.nsmp4': pad }) as unknown as BlobPart], 'B.ns4b');
    const t = new MockTransport([ack(CReqBegin), iter(2, 0, 0), ack(CReqEnd)]);
    const session = new NordSession(t);
    session.stage4Layout = true;
    const impact = await analyzeRestore(session, file, { sample: true, piano: false });
    expect(impact).toMatchObject({ writesSamples: false, removesSamples: 0, leftOutWhy: { sample: 'read-only', piano: 'not-yet-tried' } });
  });

  it('says samples are left out on a keyboard that is not a Stage 4', async () => {
    const file = new File([zipSync({ 'meta.xml': strToU8('<backup product_id="46"/>'), 'Samp Lib/User 1/Pad.nsmp4': pad }) as unknown as BlobPart], 'B.ns4b');
    const t = new MockTransport([ack(CReqBegin), iter(2, 0, 0), ack(CReqEnd)]);
    const impact = await analyzeRestore(new NordSession(t), file, { sample: true, piano: false });
    expect(impact).toMatchObject({ writesSamples: false, leftOutWhy: { sample: 'stage4-only' } });
  });
});
