import { describe, it, expect } from 'vitest';
import { writeNsmp } from './nsmp-write';
import { readNsmp, decodeNsmp } from './nsmp';

describe('writeNsmp → readNsmp/decodeNsmp round-trip', () => {
  const L = Int32Array.from({ length: 4000 }, (_, i) => (i < 80 ? 0 : Math.round(2000 * Math.sin(i / 9))));
  const R = Int32Array.from({ length: 4000 }, (_, i) => (i < 80 ? 0 : Math.round(1500 * Math.sin(i / 13))));

  it('produces a recognizable, checksum-valid codec-3 sample with the given name', () => {
    const bytes = writeNsmp({ name: 'My Sample', channels: [L, R] });
    const f = readNsmp(bytes);
    expect(f.recognized).toBe(true);
    expect(f.version).toBe('3.00');
    expect(f.codec).toBe(3);
    expect(f.checksumValid).toBe(true);
    expect(f.name).toBe('My Sample');
    expect(f.strokeCount).toBe(1);
    expect(f.sections.map((s) => s.tag)).toEqual(
      ['NSMP', '.hdr', '.cat', '.map', '.stk', '.sty', 'meta'],
    );
  });

  it('round-trips the PCM exactly through decodeNsmp', () => {
    const bytes = writeNsmp({ name: 'RT', channels: [L, R] });
    const strokes = decodeNsmp(bytes);
    expect(strokes.length).toBe(1);
    expect(strokes[0].channelCount).toBe(2);
    expect(Array.from(strokes[0].channels[0])).toEqual(Array.from(L));
    expect(Array.from(strokes[0].channels[1])).toEqual(Array.from(R));
  });

  it('works for mono too', () => {
    const mono = Int32Array.from({ length: 2500 }, (_, i) => i - 1250);
    const strokes = decodeNsmp(writeNsmp({ name: 'mono', channels: [mono] }));
    expect(strokes.length).toBe(1);
    expect(strokes[0].channelCount).toBe(1);
    expect(Array.from(strokes[0].channels[0])).toEqual(Array.from(mono));
  });
});
