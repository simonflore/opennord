import { describe, expect, it, vi } from 'vitest';
import type { MidiInputEvent, MidiInputPlugin, MidiSourceInfo, MidiSourcesEvent } from 'capacitor-midi-input';
import { listenToNativeMidiInputs, MidiSourceTracker, nativeErrorReason, showNativeBluetoothPairing } from './native-midi-inputs';

const keys: MidiSourceInfo = { id: '101', name: 'Keystation 49', transport: 'usb' };
const bt: MidiSourceInfo = { id: '202', name: 'Nord Stage 4', transport: 'bluetooth' };
const w = (b0: number, b1: number, b2: number, b3: number) => ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
const arr = (ms: Uint8Array[]) => ms.map((m) => Array.from(m));

/** A scriptable stand-in for the native plugin. */
function fakePlugin(initial: MidiSourceInfo[] = [keys]) {
  const listeners = { midiInput: new Set<(e: MidiInputEvent) => void>(), sourcesChanged: new Set<(e: MidiSourcesEvent) => void>() };
  const plugin = {
    start: vi.fn(async () => ({ sources: initial })),
    stop: vi.fn(async () => {}),
    listSources: vi.fn(async () => ({ sources: initial })),
    showBluetoothPairing: vi.fn(async () => {}),
    isAvailable: vi.fn(async () => ({ available: true, bluetooth: true })),
    removeAllListeners: vi.fn(async () => {}),
    addListener: vi.fn(async (name: 'midiInput' | 'sourcesChanged', fn: (e: never) => void) => {
      const set = listeners[name] as Set<(e: never) => void>;
      set.add(fn);
      return { remove: async () => { set.delete(fn); } };
    }),
  };
  return {
    plugin: plugin as unknown as MidiInputPlugin,
    raw: plugin,
    listeners,
    input: (e: MidiInputEvent) => listeners.midiInput.forEach((fn) => fn(e)),
    sources: (sources: MidiSourceInfo[]) => listeners.sourcesChanged.forEach((fn) => fn({ sources })),
  };
}

describe('MidiSourceTracker', () => {
  it('reports a change only when the visible list changes', () => {
    const t = new MidiSourceTracker();
    expect(t.setSources([keys])).toBe(true);
    expect(t.setSources([keys])).toBe(false);
    expect(t.setSources([{ ...keys, name: 'Keystation 49 MK3' }])).toBe(true);
    expect(t.setSources([{ ...keys, name: 'Keystation 49 MK3' }, bt])).toBe(true);
    expect(t.names()).toEqual(['Keystation 49 MK3', 'Nord Stage 4']);
  });

  it('keeps running status per source, not shared across keyboards', () => {
    const t = new MidiSourceTracker();
    t.setSources([keys, bt]);
    expect(arr(t.ingest({ sourceId: keys.id, bytes: [0x90, 60, 100] }))).toEqual([[0x90, 60, 100]]);
    expect(arr(t.ingest({ sourceId: bt.id, bytes: [0xb0, 64, 127] }))).toEqual([[0xb0, 64, 127]]);
    // Running-status data on each cable continues that cable's own status.
    expect(arr(t.ingest({ sourceId: keys.id, bytes: [62, 90] }))).toEqual([[0x90, 62, 90]]);
    expect(arr(t.ingest({ sourceId: bt.id, bytes: [64, 0] }))).toEqual([[0xb0, 64, 0]]);
  });

  it('drops a removed source’s parser state (unplug mid-message)', () => {
    const t = new MidiSourceTracker();
    t.setSources([keys, bt]);
    t.ingest({ sourceId: keys.id, bytes: [0x90, 60] }); // half a note-on
    t.ingest({ sourceId: bt.id, bytes: [0x90, 61, 1] });
    expect(t.parserCount).toBe(2);
    t.setSources([bt]);
    expect(t.parserCount).toBe(1);
    t.setSources([bt, keys]); // replugged: must not complete the stale half message
    expect(t.ingest({ sourceId: keys.id, bytes: [100] })).toEqual([]);
  });

  it('converts UMP events and filters SysEx (parity with Web MIDI sysex:false)', () => {
    const t = new MidiSourceTracker();
    t.setSources([keys]);
    const out = t.ingest({
      sourceId: keys.id,
      ump: [w(0x30, 0x02, 0x7e, 0x7f), 0, w(0x20, 0x90, 60, 100), w(0x10, 0xf8, 0, 0)],
    });
    expect(arr(out)).toEqual([[0x90, 60, 100], [0xf8]]);
  });

  it('accepts packets from a source not yet listed (start-up race)', () => {
    const t = new MidiSourceTracker();
    expect(arr(t.ingest({ sourceId: '999', bytes: [0x90, 60, 1] }))).toEqual([[0x90, 60, 1]]);
  });

  it('falls back to a friendly name for a nameless source', () => {
    const t = new MidiSourceTracker();
    t.setSources([{ id: '1', name: '', transport: 'unknown' }]);
    expect(t.names()).toEqual(['MIDI keyboard']);
  });
});

describe('nativeErrorReason', () => {
  it('maps plugin-absent codes to unsupported, anything else to failed', () => {
    expect(nativeErrorReason({ code: 'UNAVAILABLE' })).toBe('unsupported');
    expect(nativeErrorReason({ code: 'UNIMPLEMENTED' })).toBe('unsupported');
    expect(nativeErrorReason(new Error('CoreMIDI status -10830'))).toBe('failed');
    expect(nativeErrorReason(null)).toBe('failed');
  });
});

describe('listenToNativeMidiInputs', () => {
  it('starts, reports devices, and streams whole messages from batched packets', async () => {
    const f = fakePlugin();
    const messages: number[][] = [];
    const devices: string[][] = [];
    const handle = await listenToNativeMidiInputs((m) => messages.push(Array.from(m)), (n) => devices.push(n), f.plugin);
    expect(handle.deviceNames).toEqual(['Keystation 49']);
    expect(devices).toEqual([['Keystation 49']]);
    // Listeners are attached before start(), so no early packet is lost.
    expect(f.raw.addListener.mock.invocationCallOrder[0]).toBeLessThan(f.raw.start.mock.invocationCallOrder[0]);

    f.input({ sourceId: keys.id, bytes: [0x90, 60, 100, 64, 100, 0xb0, 64, 127] });
    expect(messages).toEqual([[0x90, 60, 100], [0x90, 64, 100], [0xb0, 64, 127]]);
    handle.stop();
  });

  it('follows hot-plug, notifying only real changes', async () => {
    const f = fakePlugin([]);
    const devices: string[][] = [];
    const handle = await listenToNativeMidiInputs(() => {}, (n) => devices.push(n), f.plugin);
    expect(handle.deviceNames).toEqual([]);
    f.sources([bt]);
    f.sources([bt]); // duplicate notification: ignored
    f.sources([]);
    expect(devices).toEqual([[], ['Nord Stage 4'], []]);
    handle.stop();
  });

  it('stop() detaches listeners and stops the native session; idempotent', async () => {
    const f = fakePlugin();
    const messages: Uint8Array[] = [];
    const handle = await listenToNativeMidiInputs((m) => messages.push(m), undefined, f.plugin);
    handle.stop();
    handle.stop();
    f.input({ sourceId: keys.id, bytes: [0x90, 60, 100] });
    expect(messages).toEqual([]);
    expect(f.listeners.midiInput.size).toBe(0);
    expect(f.listeners.sourcesChanged.size).toBe(0);
    expect(f.raw.stop).toHaveBeenCalledTimes(1);
  });

  it('keeps native input running until the last listener stops', async () => {
    const f = fakePlugin();
    const a = await listenToNativeMidiInputs(() => {}, undefined, f.plugin);
    const b = await listenToNativeMidiInputs(() => {}, undefined, f.plugin);
    a.stop();
    expect(f.raw.stop).not.toHaveBeenCalled();
    b.stop();
    expect(f.raw.stop).toHaveBeenCalledTimes(1);
  });

  it('maps a web-fallback rejection to "unsupported" and cleans up listeners', async () => {
    const f = fakePlugin();
    f.raw.start.mockRejectedValueOnce(Object.assign(new Error('nope'), { code: 'UNAVAILABLE' }));
    await expect(listenToNativeMidiInputs(() => {}, undefined, f.plugin)).rejects.toThrow('unsupported');
    expect(f.listeners.midiInput.size).toBe(0);
    expect(f.listeners.sourcesChanged.size).toBe(0);
  });

  it('maps a CoreMIDI start failure to "failed"', async () => {
    const f = fakePlugin();
    f.raw.start.mockRejectedValueOnce(new Error('MIDI input could not start'));
    await expect(listenToNativeMidiInputs(() => {}, undefined, f.plugin)).rejects.toThrow('failed');
  });
});

describe('showNativeBluetoothPairing', () => {
  it('opens the pairing sheet', async () => {
    const f = fakePlugin();
    await showNativeBluetoothPairing(f.plugin);
    expect(f.raw.showBluetoothPairing).toHaveBeenCalledTimes(1);
  });
  it('maps an unavailable sheet to "unsupported"', async () => {
    const f = fakePlugin();
    f.raw.showBluetoothPairing.mockRejectedValueOnce({ code: 'UNAVAILABLE' });
    await expect(showNativeBluetoothPairing(f.plugin)).rejects.toThrow('unsupported');
  });
});
