/**
 * Web MIDI wrapper: listen to the Nord's USB-MIDI input and stream decoded
 * control moves. Desktop Chromium only (same reach as WebUSB). Resilient — every
 * failure mode is a coded Error so the UI can explain it.
 */
import { MidiControlDecoder, type MidiControlEvent } from './control';

/** Reason codes thrown when listening can't start. */
export type MidiReason = 'unsupported' | 'denied' | 'no-port';

export interface NordMidiHandle {
  /** Friendly name of the input we attached to. */
  portName: string;
  stop: () => void;
}

/**
 * Attach to the first MIDI input that looks like a Nord and call `onEvent` for
 * each decoded CC/NRPN. Throws an Error whose message is a {@link MidiReason}.
 */
export async function listenToNordMidi(
  onEvent: (event: MidiControlEvent, raw: number[]) => void,
  opts: { match?: RegExp } = {},
): Promise<NordMidiHandle> {
  if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') {
    throw new Error('unsupported');
  }
  let access: MIDIAccess;
  try {
    access = await navigator.requestMIDIAccess({ sysex: false });
  } catch {
    throw new Error('denied');
  }
  const match = opts.match ?? /nord|clavia/i;
  const inputs = [...access.inputs.values()];
  const port = inputs.find((i) => match.test(i.name ?? '')) ?? inputs[0];
  if (!port) throw new Error('no-port');

  const decoder = new MidiControlDecoder();
  const handler = (ev: MIDIMessageEvent) => {
    const raw = Array.from(ev.data ?? []);
    const decoded = decoder.decode(raw);
    if (decoded) onEvent(decoded, raw);
  };
  port.addEventListener('midimessage', handler);
  return {
    portName: port.name ?? 'MIDI input',
    stop: () => port.removeEventListener('midimessage', handler),
  };
}
