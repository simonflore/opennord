/** Shared contract of the MIDI-input seam (./midi-inputs.ts) and its backends. */

/** A live "listen to every MIDI keyboard" session. */
export interface MidiInputsHandle {
  /** Friendly names of the inputs present when listening started. */
  deviceNames: string[];
  /** Stop listening (idempotent). */
  stop(): void;
}

/**
 * Why listening could not start — the Error message a backend throws:
 *  - 'unsupported' no MIDI input on this host (e.g. Safari, iPhone browser),
 *  - 'denied'      the player refused the browser's MIDI permission prompt,
 *  - 'failed'      MIDI exists here but could not start (worth a retry).
 */
export type MidiInputErrorReason = 'unsupported' | 'denied' | 'failed';
