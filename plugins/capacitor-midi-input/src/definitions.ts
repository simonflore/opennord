import type { PluginListenerHandle } from '@capacitor/core';

/**
 * MIDI keyboard input on iPad via CoreMIDI. iPad Safari/WKWebView has no Web
 * MIDI, so the app's MIDI-input seam (src/lib/midi/midi-inputs.ts) uses this
 * plugin under Capacitor/iOS and Web MIDI everywhere else.
 *
 * The native side does no MIDI parsing: it forwards what CoreMIDI delivered,
 * one event per CoreMIDI callback, and the TS side splits it into messages
 * (src/lib/midi/ump.ts + midi-stream.ts) so that logic is testable in Node.
 */

/** How a source reaches the iPad (best effort, from the CoreMIDI driver owner). */
export type MidiSourceTransport = 'usb' | 'bluetooth' | 'network' | 'virtual' | 'unknown';

export interface MidiSourceInfo {
  /** Stable id for the session (CoreMIDI kMIDIPropertyUniqueID, as a string). */
  id: string;
  /** Display name the player recognises, e.g. "Keystation 49 MK3". */
  name: string;
  transport: MidiSourceTransport;
}

/**
 * One CoreMIDI read callback's worth of input from one source. Exactly one of
 * `ump` / `bytes` is set:
 *  - `ump`   — Universal MIDI Packet words (MIDIEventList, iOS 14+, the normal path),
 *  - `bytes` — a MIDI 1.0 byte stream (legacy MIDIPacketList fallback). May hold
 *              several messages, running status, or a SysEx fragment.
 */
export interface MidiInputEvent {
  sourceId: string;
  ump?: number[];
  bytes?: number[];
}

export interface MidiSourcesEvent {
  sources: MidiSourceInfo[];
}

export interface MidiInputPlugin {
  /**
   * Connect to every MIDI source (now and as they appear) and start emitting
   * `midiInput` events. Resolves with the sources present right now.
   * Rejects with code `UNAVAILABLE` where there is no CoreMIDI (web).
   */
  start(): Promise<MidiSourcesEvent>;
  /** Disconnect all sources and stop emitting. Idempotent. */
  stop(): Promise<void>;
  /** Sources present right now, without starting input. */
  listSources(): Promise<MidiSourcesEvent>;
  /**
   * Show the system Bluetooth MIDI pairing sheet (CABTMIDICentralViewController).
   * Resolves when the player closes it; a paired keyboard then shows up through
   * `sourcesChanged` like any hot-plugged device.
   */
  showBluetoothPairing(): Promise<void>;
  /** Whether native MIDI input (and the Bluetooth pairing sheet) exist here. */
  isAvailable(): Promise<{ available: boolean; bluetooth: boolean }>;

  addListener(
    eventName: 'midiInput',
    listener: (event: MidiInputEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'sourcesChanged',
    listener: (event: MidiSourcesEvent) => void,
  ): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}
