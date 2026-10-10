/**
 * Raw MIDI 1.0 byte stream → complete messages.
 *
 * Web MIDI hands us one complete message per event, but a native transport
 * (CoreMIDI packet lists on iPad) can deliver several messages in one buffer,
 * use running status (data bytes that reuse the previous status), interleave
 * real-time bytes (clock, active sensing) mid-message, and split SysEx across
 * buffers. This parser is the one place that turns such a stream back into the
 * whole-message shape every consumer (note-input, control) already expects.
 *
 * Keep one parser per source: running status and SysEx continuation are
 * per-cable state, so two keyboards must never share one.
 *
 * Rules (MIDI 1.0 spec):
 *  - Channel status 0x80–0xEF sets running status; 0xC0/0xD0 take 1 data byte,
 *    the rest 2. Further data bytes reuse the running status.
 *  - System common (0xF1–0xF6) clears running status. 0xF1/0xF3 take 1 data
 *    byte, 0xF2 takes 2, 0xF6 none. Undefined 0xF4/0xF5 are dropped.
 *  - Real-time (0xF8–0xFF) is emitted on its own immediately and touches
 *    neither running status, a half-built message, nor an open SysEx.
 *  - SysEx: 0xF0 … 0xF7. Any non-real-time status byte aborts an open SysEx
 *    (the fragment is dropped). Over-long SysEx is dropped, not truncated.
 *  - Data bytes with no status to attach to are discarded.
 */

/** SysEx larger than this is dropped (a keyboard for playing never needs it). */
export const DEFAULT_MAX_SYSEX = 64 * 1024;

/** Data bytes expected after a channel or system-common status byte. */
export function dataLengthForStatus(status: number): number {
  if (status >= 0x80 && status < 0xf0) {
    const kind = status & 0xf0;
    return kind === 0xc0 || kind === 0xd0 ? 1 : 2;
  }
  switch (status) {
    case 0xf1:
    case 0xf3:
      return 1;
    case 0xf2:
      return 2;
    default:
      return 0; // 0xF6 tune request, real-time
  }
}

export class MidiStreamParser {
  private running = 0; // channel running status, 0 = none
  private status = 0; // status of the message being assembled, 0 = none
  private data: number[] = [];
  private needed = 0;
  private sysex: number[] | null = null;
  private sysexOverflow = false;
  private readonly maxSysex: number;

  constructor(opts: { maxSysex?: number } = {}) {
    this.maxSysex = opts.maxSysex ?? DEFAULT_MAX_SYSEX;
  }

  /** Feed a chunk; returns every message it completed, in arrival order. */
  push(bytes: ArrayLike<number>): Uint8Array[] {
    const out: Uint8Array[] = [];
    for (let i = 0; i < bytes.length; i++) this.byte(bytes[i] & 0xff, out);
    return out;
  }

  /** Forget all partial state (e.g. the source was unplugged). */
  reset(): void {
    this.running = 0;
    this.status = 0;
    this.data = [];
    this.needed = 0;
    this.sysex = null;
    this.sysexOverflow = false;
  }

  private byte(b: number, out: Uint8Array[]): void {
    // Real-time: emit immediately, leave every other piece of state alone.
    if (b >= 0xf8) {
      out.push(Uint8Array.of(b));
      return;
    }

    if (this.sysex) {
      if (b === 0xf7) {
        if (!this.sysexOverflow) {
          this.sysex.push(0xf7);
          out.push(Uint8Array.from(this.sysex));
        }
        this.sysex = null;
        this.sysexOverflow = false;
        return;
      }
      if (b < 0x80) {
        if (this.sysex.length + 1 >= this.maxSysex) this.sysexOverflow = true;
        else this.sysex.push(b);
        return;
      }
      // Any other status aborts the SysEx; fall through and handle it.
      this.sysex = null;
      this.sysexOverflow = false;
    }

    if (b >= 0x80) {
      this.status = 0;
      this.data = [];
      this.needed = 0;
      if (b === 0xf0) {
        this.running = 0;
        this.sysex = [0xf0];
        this.sysexOverflow = false;
        return;
      }
      if (b === 0xf7 || b === 0xf4 || b === 0xf5) {
        // Stray end-of-SysEx or undefined status: drop, clear running status.
        this.running = 0;
        return;
      }
      if (b >= 0xf0) {
        this.running = 0; // system common cancels running status
        const n = dataLengthForStatus(b);
        if (n === 0) {
          out.push(Uint8Array.of(b));
          return;
        }
        this.status = b;
        this.needed = n;
        return;
      }
      this.running = b;
      this.status = b;
      this.needed = dataLengthForStatus(b);
      return;
    }

    // Data byte.
    if (!this.status) {
      if (!this.running) return; // nothing to attach to
      this.status = this.running;
      this.needed = dataLengthForStatus(this.running);
      this.data = [];
    }
    this.data.push(b);
    if (this.data.length === this.needed) {
      out.push(Uint8Array.of(this.status, ...this.data));
      this.status = 0;
      this.data = [];
      this.needed = 0;
    }
  }
}
