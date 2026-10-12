/**
 * The desktop app's USB bridge (electron/usb-backend.ts, electron/shell-policy.ts)
 * words some failures for the player itself, and the Connect screen shows those
 * as they are instead of wrapping them in "Could not connect: …".
 *
 * This is the one definition of which messages those are. The bridge's tests
 * check every message it words against it, so rewording one there without
 * updating this fails a test instead of quietly degrading what the player reads.
 */
const PLAYER_FACING = /^(Your Nord|This Nord|The UsbDk driver|Another program) /;

export function isPlayerFacing(message: string): boolean {
  return PLAYER_FACING.test(message);
}
