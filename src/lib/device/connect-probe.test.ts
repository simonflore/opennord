import { describe, it, expect } from 'vitest';
import { encodeMessage } from './protocol';
import { ext2Type } from './opcodes';
import { NordSession } from './session';
import { MockTransport } from './transport';
import { confirmProgramPartition } from './connect-probe';
import type { ModelInfo } from '../clavia/partitions';
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

    expect(confirmed).toBe(4); // self-corrected for this session
    expect(events).toHaveLength(1);
    const ev = events[0];
    expect(ev.kind).toBe('device.partition-probe');
    expect(ev.detail).toMatchObject({ model: 'stage-3', programTag: 'ns3f', probed: 4, guessed: 6, adopted: 4, agrees: false });
  });

  it('keeps the guess and reports agreement when the probe confirms it', async () => {
    const t = new MockTransport(scanWithProgramAt(6, 'ns3f'));
    const { events, diagnostics } = recorder();
    const confirmed = await confirmProgramPartition(new NordSession(t), stage3, 6, diagnostics, at);
    expect(confirmed).toBe(6);
    expect(events[0].detail).toMatchObject({ probed: 6, adopted: 6, agrees: true });
  });

  it('falls back to the guess when the program tag is not found on the device', async () => {
    const t = new MockTransport(Array.from({ length: 28 }, () => reply(0x05, [1]))); // all absent
    const { events, diagnostics } = recorder();
    const confirmed = await confirmProgramPartition(new NordSession(t), stage3, 6, diagnostics, at);
    expect(confirmed).toBe(6);
    expect(events[0].ok).toBe(false);
    expect(events[0].detail).toMatchObject({ probed: undefined, adopted: 6 });
  });

  it('does nothing (returns the guess, no probe) when the model has no program tag', async () => {
    const t = new MockTransport([]);
    const { events, diagnostics } = recorder();
    const confirmed = await confirmProgramPartition(new NordSession(t), undefined, 6, diagnostics, at);
    expect(confirmed).toBe(6);
    expect(events).toHaveLength(0);
    expect(t.sent).toHaveLength(0); // never touched the device
  });
});
