import { WebPlugin } from '@capacitor/core';
import type { NordUsbPlugin } from './definitions';

const MSG = 'Nord USB transfer is not available on the web.';

/** Web has no vendor-USB DEXT path — every I/O op reports unavailable. */
export class NordUsbWeb extends WebPlugin implements NordUsbPlugin {
  async open(): Promise<void> {
    throw this.unavailable(MSG);
  }
  async bulkOut(_options: { data: string }): Promise<void> {
    throw this.unavailable(MSG);
  }
  async bulkIn(_options: { maxLength: number }): Promise<{ data: string }> {
    throw this.unavailable(MSG);
  }
  async close(): Promise<void> {}
  async isAvailable(): Promise<{ available: boolean }> {
    return { available: false };
  }
}
