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

  it('decodes engine volume via the shared Nord dB curve', () => {
    const b = t1();
    b[0x48] = 0x80;    // piano on
    b[0x4b] = 0x7f;    // volume midi 127 → "0.0 dB"
    expect(decodeNs2(b).slots[0].piano.volume).toBe('0.0 dB');
    const z = t1(); z[0x48] = 0x80; // piano on, volume midi 0 → "Off"
    expect(decodeNs2(z).slots[0].piano.volume).toBe('Off');
  });

  it('decodes B3/Vox organ drawbars (4-bit fields from base 0x5F)', () => {
    const b = t1();
    b[0x60] = 0x00; b[0x61] = 0xe0;   // drawbar 1: (u16(0x60) & 0x01e0) >>> 5 = 7
    const dr = decodeNs2(b).slots[0].organ.drawbars;
    expect(dr).toHaveLength(9);
    expect(dr[0]).toBe(7);
    expect(dr.every((d) => d >= 0 && d <= 8)).toBe(true);
  });

  it('lists active per-slot FX with types (effect 2 + delay)', () => {
    const b = t1();
    b[0x11a] = 0x24;   // effect 2 on (0x20) + type 4 → Chorus 1
    b[0x125] = 0x20;   // delay on
    const fx = decodeNs2(b).slots[0].fx;
    expect(fx.map((f) => f.name)).toEqual(['Effect 2', 'Delay']); // signal order
    expect(fx.find((f) => f.name === 'Effect 2')?.type).toBe('Chorus 1');
  });

  it('decodes piano sampleId (0 = program init) and clavinet variation', () => {
    const b = t1();
    b[0x48] = 0x80;      // piano on
    b[0xcf] = 0x80;      // clav variation: (u16(0xce) & 0x0180) >>> 7 = 1
    const p = decodeNs2(b).slots[0].piano;
    expect(p.sampleId).toBe(0);    // empty sample field → program-init id 0
    expect(p.clavVariation).toBe(1);
  });

  it('applies versionOffset -20 for the legacy header (0x04 ≠ 1)', () => {
    const b = new Uint8Array(600); // 0x04 = 0 → legacy → all body offsets -20
    b[0x2e - 20] = 0;          // slot flag → A only
    b[0x48 - 20] = 0x80;       // piano on
    b[0xcd - 20] = 0x00;       // Grand
    expect(decodeNs2(b).slots[0].piano).toMatchObject({ on: true, type: 'Grand' });
  });
});
