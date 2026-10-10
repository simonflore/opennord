import { describe, it, expect } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { decodeReply, encodeMessage } from './protocol';
import {
  CQryFileInfo, CQryFileIterate, CQryPartList, CReqBegin, CReqEnd, CReqFileDelete,
  PARTITION_PIANO, PARTITION_SAMP_LIB, ext2Type,
} from './opcodes';
import { NordSession } from './session';
import { MockTransport, TransportTimeoutError, type NordTransport } from './transport';
import { confirmProgramPartition, hasTrustedLayout, identifyDevice, resolveDeviceAccess } from './connect-probe';
import { deleteProgram } from './transfer';
import { restore } from './backup';
import { buildMetaXml } from './ns4b';
import { WriteBlockedError } from './write-guard';
import { MODELS, type ModelInfo } from '../clavia/partitions';
import type { DiagnosticEvent, Diagnostics } from '../capabilities/types';

const reply = (msgId: number, words: number[], trailing?: Uint8Array) => encodeMessage(msgId, words, trailing);
const fileInfo = (fourcc: string) => reply(CQryFileInfo | 1, [0, 0, 0, 10, ext2Type(fourcc), 313, 0, 0, 0]);
const at = () => new Date('2026-06-20T00:00:00Z');

const stage3 = { id: 'stage-3', name: 'Nord Stage 3', programTag: 'ns3f', productId: 0x0026 } as ModelInfo;

function recorder() {
  const events: DiagnosticEvent[] = [];
  const diagnostics: Diagnostics = { record: (e) => void events.push(e) };
  return { events, diagnostics };
}

/** A reply the device never sends. */
const SILENT = Symbol('silent');

/**
 * A Nord that answers by what it is asked, not in a scripted order: `files` maps
 * each partition it has to the fourcc of its one file (null = present but
 * empty); any other index refuses begin. `partitionCount` answers the partition
 * list (undefined = a reply that carries no count); `silent` lists partitions
 * whose begin is never answered. A silent read rejects at once when the caller
 * gave a timeout (standing in for the transport's timer) and never settles
 * otherwise.
 */
class FakeNord implements NordTransport {
  readonly sent: Uint8Array[] = [];
  readonly begins: number[] = [];
  readonly timeouts: (number | undefined)[] = [];
  private pending: Uint8Array | typeof SILENT | undefined;
  private begun = -1;
  constructor(
    private readonly files: Record<number, string | null>,
    private readonly opts: { partitionCount?: number; silent?: number[] } = {},
  ) {}
  async open(): Promise<void> {}
  async close(): Promise<void> {}
  async bulkOut(frame: Uint8Array): Promise<void> {
    this.sent.push(frame);
    const { msgId, words } = decodeReply(frame);
    this.pending = this.answer(msgId, words);
  }
  bulkIn(_max: number, timeoutMs?: number): Promise<Uint8Array> {
    this.timeouts.push(timeoutMs);
    const next = this.pending;
    this.pending = undefined;
    if (next === SILENT) {
      return timeoutMs === undefined ? new Promise(() => {}) : Promise.reject(new TransportTimeoutError(timeoutMs));
    }
    if (!next) return Promise.reject(new Error('FakeNord: nothing was asked'));
    return Promise.resolve(next);
  }
  sentOps(): number[] {
    return this.sent.map((f) => decodeReply(f).msgId);
  }
  private answer(msgId: number, words: number[]): Uint8Array | typeof SILENT {
    switch (msgId) {
      case CReqBegin: {
        const index = words[0];
        this.begins.push(index);
        if (this.opts.silent?.includes(index)) return SILENT;
        const present = index in this.files;
        this.begun = present ? index : -1;
        return reply(CReqBegin | 1, [present ? 0 : 1]);
      }
      case CReqEnd:
        return reply(CReqEnd | 1, [0]);
      case CQryFileIterate: {
        const first = words[1] === 0xffffffff;
        const hasFile = this.begun >= 0 && this.files[this.begun] !== null;
        return reply(CQryFileIterate | 1, first && hasFile ? [0, 0, 0] : [2, 0, 0]);
      }
      case CQryFileInfo:
        return fileInfo(this.files[this.begun] as string);
      case CQryPartList:
        return this.opts.partitionCount === undefined
          ? reply(CQryPartList | 1, [1])
          : reply(CQryPartList | 1, [0], new Uint8Array([this.opts.partitionCount]));
      case CReqFileDelete:
        return reply(CReqFileDelete | 1, [0]);
      default:
        throw new Error(`FakeNord: unexpected request 0x${msgId.toString(16)}`);
    }
  }
}

describe('confirmProgramPartition', () => {
  it('adopts the probed index when it differs from the guess, and logs the map', async () => {
    // Stage 3 really holds ns3f at partition 4, but the registry guessed 6.
    const t = new FakeNord({ 2: 'nsmp', 4: 'ns3f', 6: 'ns3s' }, { partitionCount: 12 });
    const { events, diagnostics } = recorder();

    const confirmed = await confirmProgramPartition(new NordSession(t), stage3, 6, diagnostics, at);

    expect(confirmed).toEqual({ partition: 4, confirmed: true }); // self-corrected for this session
    expect(t.begins).toEqual([6, 5, 0, 1, 2, 3, 4]); // guess, guess−1, then the scan stops at the hit
    expect(events).toHaveLength(1);
    const ev = events[0];
    expect(ev.kind).toBe('device.partition-probe');
    expect(ev.detail).toMatchObject({
      model: 'stage-3', programTag: 'ns3f', probed: 4, guessed: 6, adopted: 4, agrees: false, partitionCount: 12,
    });
  });

  it('checks only the expected index when the programs are there — no scan', async () => {
    const t = new FakeNord({ 6: 'ns3f' }, { partitionCount: 12 });
    const { events, diagnostics } = recorder();
    const confirmed = await confirmProgramPartition(new NordSession(t), stage3, 6, diagnostics, at);
    expect(confirmed).toEqual({ partition: 6, confirmed: true });
    expect(t.begins).toEqual([6]);
    expect(t.sentOps()).not.toContain(CQryPartList); // never asked for the partition list
    expect(events[0].detail).toMatchObject({ probed: 6, adopted: 6, agrees: true });
  });

  it('bounds every probe read with the reply timeout', async () => {
    const t = new FakeNord({ 6: 'ns3f' });
    const { diagnostics } = recorder();
    await confirmProgramPartition(new NordSession(t), stage3, 6, diagnostics, at, 1234);
    expect(t.timeouts.length).toBeGreaterThan(0);
    expect(t.timeouts.every((ms) => ms === 1234)).toBe(true);
  });

  it('scans only as many partitions as the device reports', async () => {
    const t = new FakeNord({ 0: null, 1: null }, { partitionCount: 10 });
    const { diagnostics } = recorder();
    await confirmProgramPartition(new NordSession(t), stage3, 6, diagnostics, at);
    expect(Math.max(...t.begins)).toBe(9); // never asks for 10..13 on a 10-partition Nord
  });

  it('falls back to the guess when the program tag is not found on the device', async () => {
    const t = new FakeNord({}); // no partition list count either → the default scan
    const { events, diagnostics } = recorder();
    const confirmed = await confirmProgramPartition(new NordSession(t), stage3, 6, diagnostics, at);
    expect(confirmed).toEqual({ partition: 6, confirmed: false }); // a guess: no writes
    expect(t.begins).toEqual([6, 5, 0, 1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13]);
    expect(events[0].ok).toBe(false);
    expect(events[0].detail).toMatchObject({ probed: undefined, adopted: 6 });
  });

  it('a Nord that stops answering times out to read-only instead of hanging the connect', async () => {
    const t = new FakeNord({ 5: 'ns3f' }, { silent: [6] }); // begin(6) is never answered
    const { events, diagnostics } = recorder();
    const confirmed = await confirmProgramPartition(new NordSession(t), stage3, 6, diagnostics, at);
    expect(confirmed).toEqual({ partition: 6, confirmed: false });
    expect(t.begins).toEqual([6]); // stops asking once the device went quiet
    expect(events[0]).toMatchObject({ ok: false, detail: { model: 'stage-3', timedOut: true } });
  });

  it('does nothing (returns the guess, no probe) when the model has no program tag', async () => {
    const t = new MockTransport([]);
    const { events, diagnostics } = recorder();
    const confirmed = await confirmProgramPartition(new NordSession(t), undefined, 6, diagnostics, at);
    expect(confirmed).toEqual({ partition: 6, confirmed: false });
    expect(events).toHaveLength(0);
    expect(t.sent).toHaveLength(0); // never touched the device
  });
});

describe('identifyDevice', () => {
  it('trusts a hardware-confirmed product id', () => {
    expect(identifyDevice(0x002e)).toEqual({ model: MODELS['stage-4'], confirmed: true });
  });

  it('falls back to the NSM-recovered product id, unconfirmed (Electro 4 = 0x23)', () => {
    expect(identifyDevice(0x0023)).toEqual({ model: MODELS['electro-4'], confirmed: false });
  });

  it('knows nothing about an unknown product id', () => {
    expect(identifyDevice(0x9999)).toEqual({ model: undefined, confirmed: false });
  });
});

describe('hasTrustedLayout', () => {
  it('only a hardware-confirmed model with an OS-independent index skips the probe', () => {
    expect(hasTrustedLayout(identifyDevice(0x002e))).toBe(true);  // Stage 4
    expect(hasTrustedLayout(identifyDevice(0x0021))).toBe(false); // Stage 2: shifts on older OS
    expect(hasTrustedLayout(identifyDevice(0x0026))).toBe(false); // Stage 3: static index only
    expect(hasTrustedLayout(identifyDevice(0x0023))).toBe(false); // Electro 4: static PID only
    expect(hasTrustedLayout({ model: MODELS['stage-4'], confirmed: false })).toBe(false); // assumed (iPad)
  });
});

/** A Stage 2 on OS 3.00 (issue #31 map): Program at 6, Synth 7, Live 8, Settings 9. */
const stage2Current = () =>
  new FakeNord({ 0: 'npno', 1: null, 2: null, 3: null, 4: 'nsmp', 5: null, 6: 'ns2p', 7: 'ns2s', 8: null, 9: null },
    { partitionCount: 10 });

describe('resolveDeviceAccess', () => {
  it('Stage 4: trusts the hardware layout without probing; every user partition is writable', async () => {
    const t = new MockTransport([]);
    const { events, diagnostics } = recorder();
    const access = await resolveDeviceAccess(new NordSession(t), identifyDevice(0x002e), diagnostics, at);
    expect(access.programPartition).toBe(6);
    expect(access.writable).toEqual([1, 3, 5, 6, 7, 8, 9, 10, 11]); // never the factory 0/2/4
    expect(t.sent).toHaveLength(0);
    expect(events).toHaveLength(0);
  });

  it('Electro 4: probes from its static index and writes only where its programs were found', async () => {
    const t = new FakeNord({ 4: 'ne4p' });
    const { events, diagnostics } = recorder();
    const access = await resolveDeviceAccess(new NordSession(t), identifyDevice(0x0023), diagnostics, at);
    expect(access).toEqual({ programPartition: 4, writable: [4] });
    expect(events[0].detail).toMatchObject({ model: 'electro-4', programTag: 'ne4p', guessed: 4, probed: 4 });
  });

  it('Electro 4: stays read-only (and off the Stage-4 index 6 = its Settings) when the probe finds nothing', async () => {
    const t = new FakeNord({});
    const { diagnostics } = recorder();
    const access = await resolveDeviceAccess(new NordSession(t), identifyDevice(0x0023), diagnostics, at);
    expect(access).toEqual({ programPartition: 4, writable: [] });
  });

  it('Stage 2 on an older OS: finds Program one lower (5) right after the guess; only that is writable', async () => {
    const t = new FakeNord({ 5: 'ns2p', 6: 'ns2s' });
    const { diagnostics } = recorder();
    const access = await resolveDeviceAccess(new NordSession(t), identifyDevice(0x0021), diagnostics, at);
    expect(access).toEqual({ programPartition: 5, writable: [5] }); // layout shifted: libraries unconfirmed
    expect(t.begins).toEqual([6, 5]); // no wider scan
  });

  it('Stage 2 on a current OS: confirms the hardware index 6, and its sample and piano libraries', async () => {
    const t = stage2Current();
    const { diagnostics } = recorder();
    const access = await resolveDeviceAccess(new NordSession(t), identifyDevice(0x0021), diagnostics, at);
    expect(access).toEqual({ programPartition: 6, writable: [1, 5, 6] }); // never 7 Synth / 8 Live / 9 Settings
    expect(t.begins).toEqual([6]);
  });

  it('Stage 2 on a current OS can remove a sample and a piano, but a Stage-4-indexed restore is still refused', async () => {
    const t = stage2Current();
    const session = new NordSession(t);
    const { diagnostics } = recorder();
    const access = await resolveDeviceAccess(session, identifyDevice(0x0021), diagnostics, at);
    session.programPartition = access.programPartition;
    session.allowWrites(access.writable);

    // Remove unused samples / pianos: SamplesContext / PianosContext gate on these, then delete.
    expect(session.canWrite(PARTITION_SAMP_LIB)).toBe(true);
    expect(session.canWrite(PARTITION_PIANO)).toBe(true);
    await session.withSession(PARTITION_SAMP_LIB, () => deleteProgram(session, 0, 3));
    await session.withSession(PARTITION_PIANO, () => deleteProgram(session, 0, 7));
    expect(t.sentOps().filter((op) => op === CReqFileDelete)).toHaveLength(2);

    // A .ns4b addresses Stage 4 partitions: Organ Preset 7 is this Nord's Synth partition.
    const zip = zipSync({
      'meta.xml': strToU8(buildMetaXml(0)),
      'Program/Bank A/Song.ns4p': new Uint8Array(64),
      'Organ Preset/Bank 1/Drawbars.ns4o': new Uint8Array(64),
    }, { level: 0 });
    const before = t.sent.length;
    await expect(restore(session, zip)).rejects.toBeInstanceOf(WriteBlockedError);
    expect(t.sent).toHaveLength(before); // nothing reached the keyboard
  });

  it('an assumed Stage 4 (iPad placeholder) must be probed before it is writable', async () => {
    const t = new FakeNord({ 6: 'ns4p' });
    const { diagnostics } = recorder();
    const access = await resolveDeviceAccess(
      new NordSession(t), { model: MODELS['stage-4'], confirmed: false }, diagnostics, at);
    expect(access).toEqual({ programPartition: 6, writable: [6] }); // unconfirmed model: no libraries
    expect(t.sent.length).toBeGreaterThan(0); // it probed
  });

  it('a Stage 2 that never answers the probe connects read-only instead of hanging', async () => {
    const t = new FakeNord({ 6: 'ns2p' }, { silent: [6] });
    const { diagnostics } = recorder();
    const access = await resolveDeviceAccess(new NordSession(t), identifyDevice(0x0021), diagnostics, at);
    expect(access).toEqual({ programPartition: 6, writable: [] });
  });

  it('an unknown device connects read-only on the Stage-4 default, without probing', async () => {
    const t = new MockTransport([]);
    const { diagnostics } = recorder();
    const access = await resolveDeviceAccess(new NordSession(t), identifyDevice(0x9999), diagnostics, at);
    expect(access).toEqual({ programPartition: 6, writable: [] });
    expect(t.sent).toHaveLength(0);
  });
});
