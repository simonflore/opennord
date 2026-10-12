/**
 * Minimal byte-pipe to the Nord's vendor interface. The session layer speaks
 * only through this interface, so it is testable (MockTransport) and
 * runtime-pluggable (WebUsbTransport now; node-usb / DriverKit later).
 */
export interface NordTransport {
  open(): Promise<void>;
  /** Send a request frame to bulk OUT (endpoint 0x03). */
  bulkOut(data: Uint8Array): Promise<void>;
  /**
   * Read up to maxLength bytes from bulk IN (endpoint 0x82) — one reply frame.
   * With `timeoutMs`, a transport that can cancel its read rejects with
   * {@link TransportTimeoutError} once that long passes without a reply, and
   * leaves no read pending (so it can't swallow a later reply).
   */
  bulkIn(maxLength: number, timeoutMs?: number): Promise<Uint8Array>;
  close(): Promise<void>;
  /** Register `cb` to run once when the device is gone (unplugged, switched
   *  off). Optional: a transport that can't tell leaves it out. */
  onLost?(cb: () => void): void;
}

/** The device didn't reply within the read timeout (see {@link NordTransport.bulkIn}). */
export class TransportTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`The Nord didn't answer within ${timeoutMs} ms.`);
    this.name = 'TransportTimeoutError';
  }
}

/** The device is gone (unplugged, switched off): a transport reports a transfer that failed for that reason as this. */
export class TransportLostError extends Error {
  constructor() {
    super('Your Nord was disconnected.');
    this.name = 'TransportLostError';
  }
}

/** In-memory transport for tests: records sent frames, replays queued replies. */
export class MockTransport implements NordTransport {
  readonly sent: Uint8Array[] = [];
  private replies: Uint8Array[];
  constructor(replies: Uint8Array[]) {
    this.replies = [...replies];
  }
  async open(): Promise<void> {}
  async close(): Promise<void> {}
  async bulkOut(data: Uint8Array): Promise<void> {
    this.sent.push(data);
  }
  async bulkIn(_maxLength: number): Promise<Uint8Array> {
    const next = this.replies.shift();
    if (!next) throw new Error('MockTransport: no more queued replies');
    return next;
  }
}
