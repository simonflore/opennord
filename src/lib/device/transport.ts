/**
 * Minimal byte-pipe to the Nord's vendor interface. The session layer speaks
 * only through this interface, so it is testable (MockTransport) and
 * runtime-pluggable (WebUsbTransport now; node-usb / DriverKit later).
 */
export interface NordTransport {
  open(): Promise<void>;
  /** Send a request frame to bulk OUT (endpoint 0x03). */
  bulkOut(data: Uint8Array): Promise<void>;
  /** Read up to maxLength bytes from bulk IN (endpoint 0x82) — one reply frame. */
  bulkIn(maxLength: number): Promise<Uint8Array>;
  close(): Promise<void>;
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
