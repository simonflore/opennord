import { describe, it, expect } from 'vitest';
import { MidiControlDecoder } from './control';

describe('MidiControlDecoder', () => {
  it('decodes a plain Control Change', () => {
    const d = new MidiControlDecoder();
    expect(d.decode([0xb0, 70, 0])).toEqual({ kind: 'cc', channel: 0, controller: 70, value: 0, label: 'CC 70' });
    // channel is taken from the low nibble
    expect(d.decode([0xb3, 1, 64])).toMatchObject({ channel: 3, controller: 1, value: 64 });
  });

  it('ignores non-Control-Change messages', () => {
    const d = new MidiControlDecoder();
    expect(d.decode([0x90, 60, 100])).toBeNull(); // note on
    expect(d.decode([0xe0, 0, 64])).toBeNull();   // pitch bend
    expect(d.decode([0xb0, 70])).toBeNull();      // truncated
  });

  it('assembles an NRPN from its CC sequence (param MSB/LSB + data MSB)', () => {
    const d = new MidiControlDecoder();
    expect(d.decode([0xb0, 99, 1])).toBeNull();  // NRPN param MSB
    expect(d.decode([0xb0, 98, 23])).toBeNull(); // NRPN param LSB
    expect(d.decode([0xb0, 6, 100])).toEqual({
      kind: 'nrpn', channel: 0, controller: (1 << 7) | 23, value: 100, label: 'NRPN 1:23',
    });
  });

  it('refines an NRPN to 14-bit when the data LSB follows', () => {
    const d = new MidiControlDecoder();
    d.decode([0xb0, 99, 1]);
    d.decode([0xb0, 98, 23]);
    d.decode([0xb0, 6, 2]);                       // data MSB
    expect(d.decode([0xb0, 38, 9])).toEqual({     // data LSB → 14-bit value
      kind: 'nrpn', channel: 0, controller: 151, value: (2 << 7) | 9, label: 'NRPN 1:23',
    });
  });

  it('treats data-entry CCs as plain CC when no NRPN is selected', () => {
    const d = new MidiControlDecoder();
    expect(d.decode([0xb0, 6, 100])).toMatchObject({ kind: 'cc', controller: 6 });
  });
});
