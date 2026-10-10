/**
 * The MIDI-input seam: "listen to every MIDI keyboard, whatever the host".
 *
 * One contract — a whole-message stream, the device list, hot-plug updates, and
 * stop() — with the transport picked per host:
 *   - 'native'   the iPad app (Capacitor/iOS): CoreMIDI via the
 *                `capacitor-midi-input` plugin (USB, Bluetooth, network MIDI).
 *                iPad Safari/WKWebView has no Web MIDI, so this is the only way in.
 *   - 'web-midi' desktop Chromium / Firefox (and Electron): Web MIDI.
 *   - 'none'     anything else (Safari, iPhone browser) → Error('unsupported').
 *
 * Errors are Error objects whose message is a {@link MidiInputErrorReason}, so
 * the UI can explain them in the player's language. This is for playing
 * (notes/pedal/CC from any controller); Nord device transfer is vendor USB
 * (src/lib/device), never MIDI.
 */
import { getCapacitorPlatform, isCapacitorPlatform } from '@/lib/platform';
import type { MidiInputsHandle } from './midi-inputs-types';
import { listenToNativeMidiInputs, showNativeBluetoothPairing } from './native-midi-inputs';
import { listenToWebMidiInputs, webMidiInputSupported } from './web-midi-inputs';

export type { MidiInputErrorReason, MidiInputsHandle } from './midi-inputs-types';

export type MidiInputBackend = 'native' | 'web-midi' | 'none';

/** Pick the MIDI-input transport for this host. Native wins inside the iPad app. */
export function midiInputBackend(): MidiInputBackend {
  if (isCapacitorPlatform() && getCapacitorPlatform() === 'ios') return 'native';
  if (webMidiInputSupported()) return 'web-midi';
  return 'none';
}

/** True when a MIDI keyboard can be played on this host at all. */
export function midiInputSupported(): boolean {
  return midiInputBackend() !== 'none';
}

/** True when the host can pair a Bluetooth MIDI keyboard from inside the app. */
export function bluetoothMidiPairingSupported(): boolean {
  return midiInputBackend() === 'native';
}

/**
 * Show the system Bluetooth MIDI pairing sheet (iPad app only). Resolves when
 * the player closes it; a paired keyboard then arrives through hot-plug.
 */
export async function pairBluetoothMidi(): Promise<void> {
  if (!bluetoothMidiPairingSupported()) throw new Error('unsupported');
  await showNativeBluetoothPairing();
}

/** Attach to every MIDI input and stream raw whole messages, following hot-plug. */
export async function listenToAllMidiInputs(
  onMessage: (data: Uint8Array) => void,
  onDevicesChanged?: (names: string[]) => void,
): Promise<MidiInputsHandle> {
  switch (midiInputBackend()) {
    case 'native':
      return listenToNativeMidiInputs(onMessage, onDevicesChanged);
    case 'web-midi':
      return listenToWebMidiInputs(onMessage, onDevicesChanged);
    default:
      throw new Error('unsupported');
  }
}
