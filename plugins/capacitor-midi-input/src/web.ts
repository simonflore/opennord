import { WebPlugin } from '@capacitor/core';
import type { MidiInputPlugin, MidiSourcesEvent } from './definitions';

const MSG = 'Native MIDI input is only available in the iPad app.';

/**
 * CoreMIDI isn't available on the web. The app never routes here on desktop (the MIDI-input
 * seam picks Web MIDI directly), so this only answers "not available".
 */
export class MidiInputWeb extends WebPlugin implements MidiInputPlugin {
  async start(): Promise<MidiSourcesEvent> {
    throw this.unavailable(MSG);
  }
  async stop(): Promise<void> {}
  async listSources(): Promise<MidiSourcesEvent> {
    return { sources: [] };
  }
  async showBluetoothPairing(): Promise<void> {
    throw this.unavailable(MSG);
  }
  async isAvailable(): Promise<{ available: boolean; bluetooth: boolean }> {
    return { available: false, bluetooth: false };
  }
}
