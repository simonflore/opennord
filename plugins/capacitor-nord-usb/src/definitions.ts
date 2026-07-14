/**
 * Nord vendor-USB transfer, bridged from the app's NordTransport seam to a native
 * DriverKit DEXT on iPad (M1+). Bytes cross as base64 (Capacitor marshals JSON).
 */
export interface NordUsbPlugin {
  /** Open the Nord's vendor interface via the DEXT. Rejects if no device / DEXT absent. */
  open(): Promise<void>;
  /** Write one request frame to bulk OUT (0x03). `data` is base64. */
  bulkOut(options: { data: string }): Promise<void>;
  /** Read up to `maxLength` bytes from bulk IN (0x82); returns base64 in `data`. */
  bulkIn(options: { maxLength: number }): Promise<{ data: string }>;
  /** Release the interface and close the device. */
  close(): Promise<void>;
  /** True when a matching Nord is present and the DEXT is reachable. */
  isAvailable(): Promise<{ available: boolean }>;
}
