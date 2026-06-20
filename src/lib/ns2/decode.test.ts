import { describe, it, expect } from 'vitest';
import { decodeNs2 } from './decode';

// Header-type-1 buffers (versionOffset 0) keep the offsets direct for tests.
const t1 = () => { const b = new Uint8Array(600); b[0x04] = 1; return b; };

describe('decodeNs2', () => {
  it('selects active slots from the 0x2E flag (0=A, 1=B, 2/3=both)', () => {
    const at = (flag: number) => { const b = t1(); b[0x2e] = flag << 6; return decodeNs2(b).slots.map((s) => s.id); };
    expect(at(0)).toEqual(['A']);
    expect(at(1)).toEqual(['B']);
    expect(at(2)).toEqual(['A', 'B']);
    expect(at(3)).toEqual(['A', 'B']);
  });

  it('decodes piano on + Clavinet in slot A', () => {
    const b = t1();
    b[0x2e] = 0;        // A only
    b[0x48] = 0x80;     // piano enable (b7)
    b[0xcd] = 0x80;     // type (0xcd & 0xe0) >>> 5 = 4 → Clavinet
    expect(decodeNs2(b).slots[0].piano).toMatchObject({ on: true, type: 'Clavinet' });
  });

  it('decodes synth on + SAW oscillator', () => {
    const b = t1();
    b[0x4d] = 0x40;            // synth enable (b6)
    b[0xe1] = 0x00; b[0xe2] = 0x80; // osc (u16(0xe1) & 0x0380) >>> 7 = 1 → SAW
    expect(decodeNs2(b).slots[0].synth).toMatchObject({ on: true, osc: 'SAW' });
  });

  it('reads slot B fields shifted by 249 bytes', () => {
    const b = t1();
    b[0x2e] = 1 << 6;          // B only
    b[0x48 + 249] = 0x80;      // piano on in slot B
    b[0xcd + 249] = 0x00;      // type 0 → Grand
    const s = decodeNs2(b).slots[0];
    expect(s.id).toBe('B');
    expect(s.piano).toMatchObject({ on: true, type: 'Grand' });
  });

  it('applies versionOffset -20 for the legacy header (0x04 ≠ 1)', () => {
    const b = new Uint8Array(600); // 0x04 = 0 → legacy → all body offsets -20
    b[0x2e - 20] = 0;          // slot flag → A only
    b[0x48 - 20] = 0x80;       // piano on
    b[0xcd - 20] = 0x00;       // Grand
    expect(decodeNs2(b).slots[0].piano).toMatchObject({ on: true, type: 'Grand' });
  });
});
