/**
 * EXPERIMENTAL — MIDI/SysEx scaffold for the Nord Stage 4.
 *
 * NOTE: program transfer is NOT SysEx. It's a vendor USB bulk protocol, fully
 * reverse-engineered and hardware-validated — see docs/PROTOCOL-RE.md and the
 * scripts/nord*.c tools (desktop, via WebUSB / node-usb).
 *
 * This module survives only for the *iOS retest*: the protocol has a Clavia
 * SysEx framing (F0 33 ...), but the Stage 4 didn't answer SysEx on its MIDI
 * port (likely Global SysEx-RX off). If that's enabled, the same FileTransfer
 * messages could ride CoreMIDI on iOS — these helpers capture/send that traffic.
 * See docs/SYSEX-SPIKE.md.
 *
 * Web MIDI requires `sysex: true`. On iOS, route through a native CoreMIDI
 * plugin (Web MIDI is Chromium-only).
 */

/** Clavia / Nord MIDI manufacturer id. A Nord SysEx message is F0 33 ... F7. */
export const CLAVIA_MANUFACTURER_ID = 0x33;

export interface SysexMessage {
  /** Full bytes including the F0 ... F7 framing. */
  data: Uint8Array;
  timestamp: number;
}

/** Is this a Nord (Clavia) SysEx message? */
export function isClaviaSysex(data: Uint8Array): boolean {
  return data.length >= 3 && data[0] === 0xf0 && data[1] === CLAVIA_MANUFACTURER_ID;
}

export interface SysexMonitor {
  stop(): void;
}

/**
 * Listen for Nord SysEx on all Web MIDI inputs and hand each message to
 * `onMessage`. Use this to log what the keyboard (or Nord Sound Manager) emits
 * while you operate it — that capture is the raw material for decoding the
 * protocol. Returns a handle to stop listening.
 *
 * Throws if Web MIDI / SysEx is unavailable (e.g. Safari, or sysex denied).
 */
export async function startSysexMonitor(
  onMessage: (msg: SysexMessage) => void,
): Promise<SysexMonitor> {
  const nav = navigator as Navigator & {
    requestMIDIAccess?: (opts?: { sysex?: boolean }) => Promise<MIDIAccess>;
  };
  if (!nav.requestMIDIAccess) {
    throw new Error('Web MIDI not available in this browser (use a native CoreMIDI bridge on iOS).');
  }

  const access = await nav.requestMIDIAccess({ sysex: true });
  const handler = (e: MIDIMessageEvent) => {
    const data = e.data ? new Uint8Array(e.data) : new Uint8Array();
    if (isClaviaSysex(data)) onMessage({ data, timestamp: e.timeStamp });
  };

  const inputs: MIDIInput[] = [];
  access.inputs.forEach((input) => {
    input.addEventListener('midimessage', handler as EventListener);
    inputs.push(input);
  });

  return {
    stop() {
      for (const input of inputs) {
        input.removeEventListener('midimessage', handler as EventListener);
      }
    },
  };
}

/**
 * Send a raw SysEx message to a named output. Used in the spike to (a) replay a
 * captured dump-request and (b) round-trip a captured program back to the
 * keyboard. The REQUEST/DUMP byte sequences themselves are unknown until the
 * spike captures them — this only puts bytes on the wire.
 */
export async function sendSysex(outputName: string, data: Uint8Array): Promise<void> {
  if (data[0] !== 0xf0 || data[data.length - 1] !== 0xf7) {
    throw new Error('SysEx message must start with 0xF0 and end with 0xF7.');
  }
  const nav = navigator as Navigator & {
    requestMIDIAccess?: (opts?: { sysex?: boolean }) => Promise<MIDIAccess>;
  };
  if (!nav.requestMIDIAccess) throw new Error('Web MIDI not available.');

  const access = await nav.requestMIDIAccess({ sysex: true });
  let target: MIDIOutput | undefined;
  access.outputs.forEach((out) => {
    if (!target && (out.name ?? '').toLowerCase().includes(outputName.toLowerCase())) target = out;
  });
  if (!target) throw new Error(`No MIDI output matching "${outputName}".`);
  target.send(Array.from(data));
}
