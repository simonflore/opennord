import { describe, expect, it } from 'vitest';
import { NordUsbWeb } from './web';

describe('NordUsbWeb', () => {
  it('open rejects as unavailable', async () => {
    await expect(new NordUsbWeb().open()).rejects.toThrow(/not available/i);
  });
  it('bulkOut rejects as unavailable', async () => {
    await expect(new NordUsbWeb().bulkOut({ data: '' })).rejects.toThrow(/not available/i);
  });
  it('bulkIn rejects as unavailable', async () => {
    await expect(new NordUsbWeb().bulkIn({ maxLength: 8 })).rejects.toThrow(/not available/i);
  });
  it('isAvailable reports false', async () => {
    await expect(new NordUsbWeb().isAvailable()).resolves.toEqual({ available: false });
  });
  it('close resolves', async () => {
    await expect(new NordUsbWeb().close()).resolves.toBeUndefined();
  });
});
