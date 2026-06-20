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
    expect(a.piano).toMatchObject({ on: true, type: 'Grand' });
    expect(a.organ.on).toBe(false);
    expect(a.synth.on).toBe(false);
  });

  it('decodes synth osc + filter type (Sample / Mini Moog)', () => {
    const b = new Uint8Array(600);
    b[0x52] = 0x80;     // synth enable (b7)
    b[0x8d] = 0x02;     // osc type: (u16(0x8d) & 0x0380) >>> 7 = 4 → Sample
    b[0x98] = 0x08;     // filter type: (0x98 & 0x1c) >>> 2 = 2 → Mini Moog
    expect(decodeNs3(b).panels[0].synth).toMatchObject({ on: true, osc: 'Sample', filter: 'Mini Moog' });
  });

  it('decodes synth filter cutoff frequency (bits @0x98.b1-0 + 0x99.b7-3)', () => {
    const b = new Uint8Array(600);
    b[0x52] = 0x80;                    // synth on
    b[0x98] = 0x03; b[0x99] = 0xf8;    // cutoff midi 127 → "21 kHz"
    expect(decodeNs3(b).panels[0].synth.cutoff).toBe('21 kHz');
  });

  it('decodes engine volume from the Nord dB curve (bits 10-4 of the enable word)', () => {
    const b = new Uint8Array(600);
    b[0x43] = 0x07; b[0x44] = 0xf0;   // piano volume word bits 10-4 = 127 → "0.0 dB"
    expect(decodeNs3(b).panels[0].piano.volume).toBe('0.0 dB');
    const z = new Uint8Array(600);     // all zero → midi 0 → "Off"
    expect(decodeNs3(z).panels[0].piano.volume).toBe('Off');
  });

  it('decodes the 9 organ drawbars (each 0-8) from the 0xBE block', () => {
    const b = new Uint8Array(600);
    b[0xbe] = 0x60;   // drawbar 1: (0x60 & 0xf0) >>> 4 = 6
    b[0xc0] = 0x10;   // drawbar 2: (0x10 & 0x1e) >>> 1 = 8
    const dr = decodeNs3(b).panels[0].organ.drawbars;
    expect(dr).toHaveLength(9);
    expect(dr[0]).toBe(6);
    expect(dr[1]).toBe(8);
    expect(dr.every((d) => d >= 0 && d <= 8)).toBe(true);
  });

  it('decodes organ vibrato/chorus + percussion (preset 1)', () => {
    const b = new Uint8Array(600);
    b[0x34] = 0x04;   // vib/chorus mode: (0x04 & 0x0e) >>> 1 = 2 → V2
    b[0xd3] = 0x1c;   // vib on (0x10) + perc on (0x08) + 3rd (0x04); fast/soft off
    const org = decodeNs3(b).panels[0].organ;
    expect(org.vibChorus).toEqual({ on: true, mode: 'V2' });
    expect(org.percussion).toEqual({ on: true, third: true, fast: false, soft: false });
  });

  it('lists active FX with types (reverb + delay)', () => {
    const b = new Uint8Array(600);
    b[0x134] = 0x02;   // reverb enable; type (u16 & 0x01c0)>>>6 = 0 → Room 1
    b[0x119] = 0x08;   // delay enable
    const fx = decodeNs3(b).panels[0].fx;
    expect(fx.map((f) => f.name)).toEqual(['Delay', 'Reverb']); // signal order
    expect(fx.find((f) => f.name === 'Reverb')?.type).toBe('Room 1');
  });

  it('reads panel B fields shifted by 263 bytes', () => {
    const b = new Uint8Array(600);
    b[0x31] = 1 << 5;        // panel B only
    b[0xb6 + 263] = 0x80;    // organ enable in panel B
    b[0xbb + 263] = 0x10;    // organ type bits 6-4 = 1 → Vox
    const bPanel = decodeNs3(b).panels[0];
    expect(bPanel.id).toBe('B');
    expect(bPanel.organ).toMatchObject({ on: true, type: 'Vox' });
  });
});
