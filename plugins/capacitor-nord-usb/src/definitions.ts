/**
 * Nord vendor-USB transfer, bridged from the app's NordTransport seam to a native
 * DriverKit DEXT on iPad (M1+). Bytes cross as base64 (Capacitor marshals JSON).
 */
export interface NordUsbPlugin {
  /**
   * Open the Nord's vendor interface via the DEXT; a no-op when already open.
   * Reports the Nord's USB product id (0 when the driver couldn't read it).
   * Rejects if no device / DEXT absent.
   */
  open(): Promise<{ productId: number }>;
  /** Write one request frame to bulk OUT. `data` is base64. */
  bulkOut(options: { data: string }): Promise<void>;
  /**
   * Read up to `maxLength` bytes from bulk IN; returns base64 in `data`. With
   * `timeoutMs`, resolves `timedOut: true` once that long passes without a reply,
   * leaving no read pending. Without it, waits until the Nord answers or `close()`.
   */
  bulkIn(options: { maxLength: number; timeoutMs?: number }): Promise<{ data: string; timedOut?: boolean }>;
  /** End any read still waiting, release the interface and close the device. */
  close(): Promise<void>;
  /** True when a Nord is plugged in and the driver is switched on for it. */
  isAvailable(): Promise<{ available: boolean }>;
}
