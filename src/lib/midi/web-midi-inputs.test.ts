// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { listenToWebMidiInputs } from './web-midi-inputs';

/** Minimal MIDIInput/MIDIAccess fakes — just what the backend touches. */
class FakeInput extends EventTarget {
  constructor(public name: string) { super(); }
  send(data: number[]) {
    this.dispatchEvent(Object.assign(new Event('midimessage'), { data: Uint8Array.from(data) }));
  }
}
function fakeAccess(inputs: FakeInput[]) {
  const map = new Map<string, FakeInput>(inputs.map((i, k) => [String(k), i]));
  return { inputs: map, onstatechange: null as null | (() => void) };
}
type Nav = { requestMIDIAccess?: unknown };
afterEach(() => { delete (navigator as unknown as Nav).requestMIDIAccess; });

describe('listenToWebMidiInputs', () => {
  it("throws 'unsupported' without Web MIDI", async () => {
    await expect(listenToWebMidiInputs(() => {})).rejects.toThrow('unsupported');
  });

  it("throws 'denied' when the permission prompt is refused", async () => {
    (navigator as unknown as Nav).requestMIDIAccess = () => Promise.reject(new DOMException('no', 'SecurityError'));
    await expect(listenToWebMidiInputs(() => {})).rejects.toThrow('denied');
  });

  it('streams every input, re-binds on hot-plug, and stops cleanly', async () => {
    const a = new FakeInput('Keys A');
    const access = fakeAccess([a]);
    (navigator as unknown as Nav).requestMIDIAccess = () => Promise.resolve(access);
    const got: number[][] = [];
    const devices: string[][] = [];
    const handle = await listenToWebMidiInputs((m) => got.push(Array.from(m)), (n) => devices.push(n));
    expect(handle.deviceNames).toEqual(['Keys A']);

    const b = new FakeInput('Keys B');
    access.inputs.set('1', b);
    access.onstatechange?.();
    expect(devices.at(-1)).toEqual(['Keys A', 'Keys B']);

    a.send([0x90, 60, 100]);
    b.send([0x80, 60, 0]);
    expect(got).toEqual([[0x90, 60, 100], [0x80, 60, 0]]);

    handle.stop();
    a.send([0x90, 61, 100]);
    expect(got).toHaveLength(2);
    expect(access.onstatechange).toBeNull();
  });
});
