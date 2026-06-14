import { describe, it, expect } from 'vitest';
import { writeNsmp, writeNsmpMulti } from './nsmp-write';
import { readNsmp, decodeNsmp, readNsmpZones } from './nsmp';

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

  it('writes a multisample with splits/layers and round-trips zones + audio', () => {
    const z0 = Int32Array.from({ length: 1500 }, (_, i) => Math.round(1000 * Math.sin(i / 8)));
    const z1 = Int32Array.from({ length: 1800 }, (_, i) => Math.round(800 * Math.sin(i / 12)));
    const z2 = Int32Array.from({ length: 1200 }, (_, i) => i - 600); // ramp
    const bytes = writeNsmpMulti({
      name: 'Multi',
      zones: [
        { channels: [z0], keyHigh: 47, rootKey: 43, velTop: 127 }, // low split
        { channels: [z1], keyHigh: 71, rootKey: 60, velTop: 127 }, // mid split
        { channels: [z2], keyHigh: 127, rootKey: 84, velTop: 64 }, // high split, soft layer
      ],
    });
    const f = readNsmp(bytes);
    expect(f.strokeCount).toBe(3);

    const zones = readNsmpZones(bytes);
    expect(zones.map((z) => z.keyHigh)).toEqual([47, 71, 127]);
    expect(zones.map((z) => z.rootKey)).toEqual([43, 60, 84]);
    expect(zones.map((z) => z.strokeIndex)).toEqual([1, 2, 3]);
    expect(zones[2].velTop).toBe(64);

    const strokes = decodeNsmp(bytes);
    expect(strokes.length).toBe(3);
    expect(Array.from(strokes[0].channels[0])).toEqual(Array.from(z0));
    expect(Array.from(strokes[1].channels[0])).toEqual(Array.from(z1));
    expect(Array.from(strokes[2].channels[0])).toEqual(Array.from(z2));
  });

  it('writes a codec-4 (.nsmp4) file that round-trips (word-interleaved)', () => {
    const bytes = writeNsmp({ name: 'NSMP4', channels: [L, R], codec: 4 });
    const f = readNsmp(bytes);
    expect(f.codec).toBe(4);
    expect(f.version).toBe('4.00');
    expect(f.checksumValid).toBe(true);
    const strokes = decodeNsmp(bytes);
    expect(strokes.length).toBe(1);
    expect(strokes[0].channelCount).toBe(2);
    expect(Array.from(strokes[0].channels[0])).toEqual(Array.from(L));
    expect(Array.from(strokes[0].channels[1])).toEqual(Array.from(R));
  });

  it('writes a codec-4 multisample (splits/layers) that round-trips', () => {
    const z0 = Int32Array.from({ length: 1600 }, (_, i) => Math.round(900 * Math.sin(i / 6)));
    const z1 = Int32Array.from({ length: 1400 }, (_, i) => Math.round(700 * Math.cos(i / 9)));
    const bytes = writeNsmpMulti({
      name: 'M4',
      codec: 4,
      zones: [
        { channels: [z0], keyHigh: 59, rootKey: 48 },
        { channels: [z1], keyHigh: 127, rootKey: 72 },
      ],
    });
    expect(readNsmp(bytes).codec).toBe(4);
    const strokes = decodeNsmp(bytes);
    expect(strokes.length).toBe(2);
    expect(Array.from(strokes[0].channels[0])).toEqual(Array.from(z0));
    expect(Array.from(strokes[1].channels[0])).toEqual(Array.from(z1));
  });

  it('works for mono too', () => {
    const mono = Int32Array.from({ length: 2500 }, (_, i) => i - 1250);
    const strokes = decodeNsmp(writeNsmp({ name: 'mono', channels: [mono] }));
    expect(strokes.length).toBe(1);
    expect(strokes[0].channelCount).toBe(1);
    expect(Array.from(strokes[0].channels[0])).toEqual(Array.from(mono));
  });
});
