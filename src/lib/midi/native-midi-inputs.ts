/**
 * Native (CoreMIDI, iPad app) backend of the MIDI-input seam (./midi-inputs.ts),
 * over the `capacitor-midi-input` plugin. The plugin forwards what CoreMIDI
 * delivered per callback — UMP words, or a raw MIDI 1.0 byte stream on the
 * legacy path — and this module turns it into the whole-message stream the Web
 * MIDI backend produces, so consumers (note-input, the rompler) can't tell the
 * two apart.
 */
import type { PluginListenerHandle } from '@capacitor/core';
import { MidiInput, type MidiInputEvent, type MidiInputPlugin, type MidiSourceInfo } from 'capacitor-midi-input';
import type { MidiInputErrorReason, MidiInputsHandle } from './midi-inputs-types';
import { MidiStreamParser } from './midi-stream';
import { umpToMidi1Bytes } from './ump';

/**
 * Hot-plug bookkeeping: the current source list plus one stream parser per
 * source (running status and SysEx continuation are per-cable state). Pure — no
 * plugin, no timers — so it is unit-tested directly.
 */
export class MidiSourceTracker {
  private sources: MidiSourceInfo[] = [];
  private readonly parsers = new Map<string, MidiStreamParser>();

  /** Replace the source list. Returns true when what the player sees changed. */
  setSources(next: readonly MidiSourceInfo[]): boolean {
    const before = this.signature();
    this.sources = [...next];
    const ids = new Set(next.map((s) => s.id));
    for (const id of [...this.parsers.keys()]) {
      if (!ids.has(id)) this.parsers.delete(id); // unplugged: drop half-built state
    }
    return this.signature() !== before;
  }

  names(): string[] {
    return this.sources.map((s) => s.name || 'MIDI keyboard');
  }

  /**
   * Split one native event into complete MIDI 1.0 messages. SysEx is dropped,
   * matching the Web MIDI backend (which asks for `sysex: false`). A packet from
   * a source not yet in the list (start-up race) is still parsed.
   */
  ingest(event: MidiInputEvent): Uint8Array[] {
    const bytes = event.ump ? umpToMidi1Bytes(event.ump) : (event.bytes ?? []);
    if (bytes.length === 0) return [];
    let parser = this.parsers.get(event.sourceId);
    if (!parser) {
      parser = new MidiStreamParser();
      this.parsers.set(event.sourceId, parser);
    }
    return parser.push(bytes).filter((m) => m[0] !== 0xf0);
  }

  clear(): void {
    this.sources = [];
    this.parsers.clear();
  }

  /** Number of per-source parsers held (for tests / leak checks). */
  get parserCount(): number {
    return this.parsers.size;
  }

  private signature(): string {
    return this.sources.map((s) => `${s.id}\u0000${s.name}`).join('\u0001');
  }
}

/** Map a plugin rejection to the seam's musician-facing reason codes. */
export function nativeErrorReason(error: unknown): MidiInputErrorReason {
  const code = (error as { code?: unknown } | null)?.code;
  // UNAVAILABLE: the web fallback. UNIMPLEMENTED: plugin not registered natively.
  if (code === 'UNAVAILABLE' || code === 'UNIMPLEMENTED') return 'unsupported';
  return 'failed';
}

// Several listeners may share the one native session; only the last stop()
// actually stops CoreMIDI input.
const sessions = new WeakMap<MidiInputPlugin, number>();

export async function listenToNativeMidiInputs(
  onMessage: (data: Uint8Array) => void,
  onDevicesChanged?: (names: string[]) => void,
  plugin: MidiInputPlugin = MidiInput,
): Promise<MidiInputsHandle> {
  const tracker = new MidiSourceTracker();
  const listeners: PluginListenerHandle[] = [];
  let stopped = false;
  const removeListeners = () => {
    for (const l of listeners.splice(0)) void l.remove().catch(() => {});
  };

  try {
    // Listen before starting so no early packet or hot-plug is missed.
    listeners.push(await plugin.addListener('midiInput', (event) => {
      if (stopped) return;
      for (const message of tracker.ingest(event)) onMessage(message);
    }));
    listeners.push(await plugin.addListener('sourcesChanged', (event) => {
      if (stopped) return;
      if (tracker.setSources(event.sources)) onDevicesChanged?.(tracker.names());
    }));
    const { sources } = await plugin.start();
    tracker.setSources(sources);
  } catch (error) {
    stopped = true;
    removeListeners();
    throw new Error(nativeErrorReason(error));
  }

  sessions.set(plugin, (sessions.get(plugin) ?? 0) + 1);
  onDevicesChanged?.(tracker.names());

  return {
    deviceNames: tracker.names(),
    stop() {
      if (stopped) return;
      stopped = true;
      removeListeners();
      tracker.clear();
      const remaining = (sessions.get(plugin) ?? 1) - 1;
      sessions.set(plugin, remaining);
      if (remaining <= 0) void plugin.stop().catch(() => {});
    },
  };
}

/** Open the Bluetooth MIDI pairing sheet; resolves when the player closes it. */
export async function showNativeBluetoothPairing(plugin: MidiInputPlugin = MidiInput): Promise<void> {
  try {
    await plugin.showBluetoothPairing();
  } catch (error) {
    throw new Error(nativeErrorReason(error));
  }
}
