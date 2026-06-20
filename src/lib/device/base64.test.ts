import { describe, expect, it } from 'vitest';
import { base64ToBytes, bytesToBase64 } from './base64';

describe('base64 byte helpers', () => {
  it('encodes known bytes', () => {
    expect(bytesToBase64(new Uint8Array([0x00, 0x0c, 0xff, 0x10]))).toBe('AAz/EA==');
  });
  it('decodes back to the exact bytes', () => {
    expect(Array.from(base64ToBytes('AAz/EA=='))).toEqual([0x00, 0x0c, 0xff, 0x10]);
  });
  it('round-trips an arbitrary frame', () => {
    const frame = new Uint8Array(257);
    for (let i = 0; i < frame.length; i++) frame[i] = (i * 7) & 0xff;
    expect(Array.from(base64ToBytes(bytesToBase64(frame)))).toEqual(Array.from(frame));
  });
  it('handles empty input', () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe('');
    expect(base64ToBytes('').length).toBe(0);
  });
});
