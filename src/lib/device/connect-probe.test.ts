import { describe, it, expect } from 'vitest';
import { encodeMessage } from './protocol';
import { ext2Type } from './opcodes';
import { NordSession } from './session';
import { MockTransport } from './transport';
import { confirmProgramPartition, hasTrustedLayout, identifyDevice, resolveDeviceAccess } from './connect-probe';
import { MODELS, type ModelInfo } from '../clavia/partitions';
import type { DiagnosticEvent, Diagnostics } from '../capabilities/types';

const reply = (msgId: number, words: number[]) => encodeMessage(msgId, words);
const fileInfo = (fourcc: string) => reply(0x1f, [0, 0, 0, 10, ext2Type(fourcc), 313, 0, 0, 0]);
const at = () => new Date('2026-06-20T00:00:00Z');

const stage3 = { id: 'stage-3', name: 'Nord Stage 3', programTag: 'ns3f', productId: 0x0026 } as ModelInfo;

function recorder() {
  const events: DiagnosticEvent[] = [];
  const diagnostics: Diagnostics = { record: (e) => void events.push(e) };
  return { events, diagnostics };
}

/** Replies for a probe scan (0..13) where the program tag sits at `progIndex`. */
function scanWithProgramAt(progIndex: number, fourcc: string) {
  const replies = [];
  for (let i = 0; i < 14; i++) {
    if (i === progIndex) {
      replies.push(
        reply(0x05, [0]),        // begin OK
        reply(0x21, [0, 0, 0]),  // one file
        fileInfo(fourcc),
        reply(0x21, [2, 0, 0]),  // terminal
        reply(0x07, [0]),        // end OK
      );
    } else {
      replies.push(reply(0x05, [1])); // absent
    }
  }
  return replies;
}

describe('confirmProgramPartition', () => {
  it('adopts the probed index when it differs from the guess, and logs the map', async () => {
    // Stage 3 really holds ns3f at partition 4, but the registry guessed 6.
    const t = new MockTransport(scanWithProgramAt(4, 'ns3f'));
    const { events, diagnostics } = recorder();

    const confirmed = await confirmProgramPartition(new NordSession(t), stage3, 6, diagnostics, at);

    expect(confirmed).toEqual({ partition: 4, confirmed: true }); // self-corrected for this session
    expect(events).toHaveLength(1);
    const ev = events[0];
    expect(ev.kind).toBe('device.partition-probe');
    expect(ev.detail).toMatchObject({ model: 'stage-3', programTag: 'ns3f', probed: 4, guessed: 6, adopted: 4, agrees: false });
  });

  it('keeps the guess and reports agreement when the probe confirms it', async () => {
    const t = new MockTransport(scanWithProgramAt(6, 'ns3f'));
    const { events, diagnostics } = recorder();
    const confirmed = await confirmProgramPartition(new NordSession(t), stage3, 6, diagnostics, at);
    expect(confirmed).toEqual({ partition: 6, confirmed: true });
    expect(events[0].detail).toMatchObject({ probed: 6, adopted: 6, agrees: true });
  });

  it('falls back to the guess when the program tag is not found on the device', async () => {
    const t = new MockTransport(Array.from({ length: 28 }, () => reply(0x05, [1]))); // all absent
    const { events, diagnostics } = recorder();
    const confirmed = await confirmProgramPartition(new NordSession(t), stage3, 6, diagnostics, at);
    expect(confirmed).toEqual({ partition: 6, confirmed: false }); // a guess: no writes
    expect(events[0].ok).toBe(false);
    expect(events[0].detail).toMatchObject({ probed: undefined, adopted: 6 });
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

/** Replies for a probe scan (0..13) where every partition is absent. */
const scanNothing = () => Array.from({ length: 14 }, () => reply(0x05, [1]));

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
    const t = new MockTransport(scanWithProgramAt(4, 'ne4p'));
    const { events, diagnostics } = recorder();
    const access = await resolveDeviceAccess(new NordSession(t), identifyDevice(0x0023), diagnostics, at);
    expect(access).toEqual({ programPartition: 4, writable: [4] });
    expect(events[0].detail).toMatchObject({ model: 'electro-4', programTag: 'ne4p', guessed: 4, probed: 4 });
  });

  it('Electro 4: stays read-only (and off the Stage-4 index 6 = its Settings) when the probe finds nothing', async () => {
    const t = new MockTransport(scanNothing());
    const { diagnostics } = recorder();
    const access = await resolveDeviceAccess(new NordSession(t), identifyDevice(0x0023), diagnostics, at);
    expect(access).toEqual({ programPartition: 4, writable: [] });
  });

  it('Stage 2 on an older OS: the probe finds Program one lower (5) and adopts it', async () => {
    const t = new MockTransport(scanWithProgramAt(5, 'ns2p'));
    const { diagnostics } = recorder();
    const access = await resolveDeviceAccess(new NordSession(t), identifyDevice(0x0021), diagnostics, at);
    expect(access).toEqual({ programPartition: 5, writable: [5] });
  });

  it('Stage 2 on a current OS: the probe confirms the hardware index 6', async () => {
    const t = new MockTransport(scanWithProgramAt(6, 'ns2p'));
    const { diagnostics } = recorder();
    const access = await resolveDeviceAccess(new NordSession(t), identifyDevice(0x0021), diagnostics, at);
    expect(access).toEqual({ programPartition: 6, writable: [6] });
  });

  it('an assumed Stage 4 (iPad placeholder) must be probed before it is writable', async () => {
    const t = new MockTransport(scanWithProgramAt(6, 'ns4p'));
    const { diagnostics } = recorder();
    const access = await resolveDeviceAccess(
      new NordSession(t), { model: MODELS['stage-4'], confirmed: false }, diagnostics, at);
    expect(access).toEqual({ programPartition: 6, writable: [6] });
    expect(t.sent.length).toBeGreaterThan(0); // it probed
  });

  it('an unknown device connects read-only on the Stage-4 default, without probing', async () => {
    const t = new MockTransport([]);
    const { diagnostics } = recorder();
    const access = await resolveDeviceAccess(new NordSession(t), identifyDevice(0x9999), diagnostics, at);
    expect(access).toEqual({ programPartition: 6, writable: [] });
    expect(t.sent).toHaveLength(0);
  });
});
