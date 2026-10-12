import { NordError } from './protocol';

/**
 * Shown when a write (send, delete, organize, restore, remove) is refused
 * because OpenNord hasn't confirmed which part of the keyboard's memory it
 * would land in. Musician-facing: no partition numbers, no protocol words.
 */
/** Why a write action is greyed on a keyboard OpenNord won't change (shown beside the action). */
export const READ_ONLY_REASON = 'OpenNord only reads this keyboard: it couldn’t confirm where it keeps its programs.';

export const WRITE_BLOCKED_MESSAGE =
  'To keep your sounds safe, OpenNord only changes what’s on a Nord once it has confirmed ' +
  'where this model keeps them — and it couldn’t confirm that on this keyboard. Nothing was ' +
  'changed. You can still browse, listen and back up as usual.';

/**
 * A write was refused before any frame reached the device: the target
 * partition was never confirmed (by a hardware-confirmed registry index, or by
 * the connect probe finding the model's program files there). See
 * `NordSession.allowWrites` and `resolveDeviceAccess` (connect-probe.ts).
 */
export class WriteBlockedError extends NordError {
  constructor() {
    super(WRITE_BLOCKED_MESSAGE);
    this.name = 'WriteBlockedError';
  }
}
