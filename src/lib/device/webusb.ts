import type { NordTransport } from './transport';

/**
 * WebUSB transport for the Nord vendor interface (Chromium desktop only). Claims
 * interface 0; bulk OUT endpoint 0x03 (number 3), bulk IN endpoint 0x82
 * (number 2). The USBDevice comes from navigator.usb.requestDevice (a user
 * gesture), performed by the UI.
 */
export class WebUsbTransport implements NordTransport {
  constructor(private readonly device: USBDevice) {}

  async open(): Promise<void> {
    await this.device.open();
    if (this.device.configuration === null) await this.device.selectConfiguration(1);
    await this.device.claimInterface(0);
  }

  async bulkOut(data: Uint8Array): Promise<void> {
    // Copy into a fresh ArrayBuffer-backed view: WebUSB's BufferSource requires
    // an ArrayBuffer, while a generic Uint8Array may be backed by ArrayBufferLike.
    await this.device.transferOut(3, new Uint8Array(data));
  }

  async bulkIn(maxLength: number): Promise<Uint8Array> {
    const result = await this.device.transferIn(2, maxLength);
    if (!result.data) return new Uint8Array(0);
    return new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength);
  }

  async close(): Promise<void> {
    try {
      await this.device.releaseInterface(0);
    } finally {
      await this.device.close();
    }
  }
}
