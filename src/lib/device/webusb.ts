import type { NordTransport } from './transport';
import { findBulkInterface } from './usb-descriptors';

/**
 * WebUSB transport for the Nord vendor interface (Chromium desktop only).
 *
 * The Stage 4 layout is interface 0, bulk OUT endpoint 3, bulk IN endpoint 2
 * (docs/PROTOCOL-RE.md). Rather than hardcode that — which fails on older models
 * like the Stage 2 EX whose vendor interface/endpoints differ — `open()`
 * discovers the bulk interface and its endpoints from the device descriptors
 * (`findBulkInterface`), falling back to the Stage 4 layout only when discovery
 * finds nothing. The USBDevice comes from navigator.usb.requestDevice (a user
 * gesture), performed by the UI.
 */
export class WebUsbTransport implements NordTransport {
  private interfaceNumber = 0;
  private outEndpoint = 3;
  private inEndpoint = 2;

  constructor(private readonly device: USBDevice) {}

  async open(): Promise<void> {
    await this.device.open();
    if (this.device.configuration === null) await this.device.selectConfiguration(1);
    const bulk = findBulkInterface(this.device);
    if (bulk) {
      this.interfaceNumber = bulk.interfaceNumber;
      this.outEndpoint = bulk.outEndpoint;
      this.inEndpoint = bulk.inEndpoint;
    }
    await this.device.claimInterface(this.interfaceNumber);
  }

  async bulkOut(data: Uint8Array): Promise<void> {
    // Copy into a fresh ArrayBuffer-backed view: WebUSB's BufferSource requires
    // an ArrayBuffer, while a generic Uint8Array may be backed by ArrayBufferLike.
    await this.device.transferOut(this.outEndpoint, new Uint8Array(data));
  }

  async bulkIn(maxLength: number): Promise<Uint8Array> {
    const result = await this.device.transferIn(this.inEndpoint, maxLength);
    if (!result.data) return new Uint8Array(0);
    return new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength);
  }

  async close(): Promise<void> {
    try {
      await this.device.releaseInterface(this.interfaceNumber);
    } finally {
      await this.device.close();
    }
  }
}
