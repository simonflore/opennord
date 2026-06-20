import { describe, it, expect } from 'vitest';
import { decodeNs3 } from './decode';

describe('decodeNs3', () => {
  it('selects active panels from the 0x31 flag (0=A, 1=B, 2=both)', () => {
    const at = (flag: number) => { const b = new Uint8Array(600); b[0x31] = flag << 5; return decodeNs3(b).panels.map((p) => p.id); };
    expect(at(0)).toEqual(['A']);
    expect(at(1)).toEqual(['B']);
    expect(at(2)).toEqual(['A', 'B']);
  });

  it('decodes piano on + Grand (organ/synth off) in panel A', () => {
    const b = new Uint8Array(600);
    b[0x31] = 0;        // panel A only
    b[0x43] = 0x80;     // piano enable (b7)
    b[0x48] = 0x00;     // piano type bits 5-3 = 0 → Grand
    const a = decodeNs3(b).panels[0];
    expect(a.piano).toEqual({ on: true, type: 'Grand' });
    expect(a.organ.on).toBe(false);
    expect(a.synth.on).toBe(false);
  });

  it('decodes synth osc + filter type (Sample / Mini Moog)', () => {
    const b = new Uint8Array(600);
    b[0x52] = 0x80;     // synth enable (b7)
    b[0x8d] = 0x02;     // osc type: (u16(0x8d) & 0x0380) >>> 7 = 4 → Sample
    b[0x98] = 0x08;     // filter type: (0x98 & 0x1c) >>> 2 = 2 → Mini Moog
    expect(decodeNs3(b).panels[0].synth).toEqual({ on: true, osc: 'Sample', filter: 'Mini Moog' });
  });

  it('reads panel B fields shifted by 263 bytes', () => {
    const b = new Uint8Array(600);
    b[0x31] = 1 << 5;        // panel B only
    b[0xb6 + 263] = 0x80;    // organ enable in panel B
    b[0xbb + 263] = 0x10;    // organ type bits 6-4 = 1 → Vox
    const bPanel = decodeNs3(b).panels[0];
    expect(bPanel.id).toBe('B');
    expect(bPanel.organ).toEqual({ on: true, type: 'Vox' });
  });
});
