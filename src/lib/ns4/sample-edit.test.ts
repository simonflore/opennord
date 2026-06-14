import { describe, it, expect } from 'vitest';
import { writeNsmpMulti } from './nsmp-write';
import { readNsmp, decodeNsmp, readNsmpZones } from './nsmp';
import { editModel, buildEditedNsmp } from './sample-edit';

/**
 * A deterministic 2-zone source .nsmp (no gitignored fixture needed). Audio is
 * long enough to clear the decoder's stroke-detection length gate (see
 * `decodeStrokeSection` in nsmp.ts) so the strokes round-trip back out.
 */
function srcNsmp(): Uint8Array {
  const a = Int32Array.from({ length: 1500 }, (_, i) => Math.round(1000 * Math.sin(i / 8)));
  const b = Int32Array.from({ length: 1800 }, (_, i) => Math.round(800 * Math.sin(i / 12)));
  return writeNsmpMulti({
    name: 'Src',
    codec: 3,
    zones: [
      { channels: [a], keyHigh: 60, rootKey: 48, velTop: 127 },
      { channels: [b], keyHigh: 96, rootKey: 72, velTop: 127 },
    ],
  });
}

describe('editModel', () => {
  it('derives name + per-zone fields from a loaded sample', () => {
    const src = srcNsmp();
    const m = editModel(readNsmp(src), readNsmpZones(src));
    expect(m.name).toBe('Src');
    expect(m.zones.length).toBe(2);
    expect(m.zones[0]).toMatchObject({ rootKey: 48, keyHigh: 60, velTop: 127 });
    expect(m.zones[1]).toMatchObject({ rootKey: 72, keyHigh: 96 });
  });
});

describe('buildEditedNsmp', () => {
  it('round-trips an edit: rename + change a zone root; audio preserved', () => {
    const src = srcNsmp();
    const decoded = decodeNsmp(src);
    const model = editModel(readNsmp(src), readNsmpZones(src));
    model.name = 'Edited';
    model.zones[0].rootKey = 36;

    const out = buildEditedNsmp(model, decoded, 3);

    expect(readNsmp(out).name).toBe('Edited');
    const z = readNsmpZones(out);
    expect(z[0].rootKey).toBe(36);
    expect(z[1].rootKey).toBe(72);
    // audio preserved exactly (positional pairing)
    const rd = decodeNsmp(out);
    expect([...rd[0].channels[0]]).toEqual([...decoded[0].channels[0]]);
    expect([...rd[1].channels[0]]).toEqual([...decoded[1].channels[0]]);
  });

  it('throws if a zone has no corresponding decoded stroke', () => {
    const src = srcNsmp();
    const decoded = decodeNsmp(src);
    const model = editModel(readNsmp(src), readNsmpZones(src));
    model.zones.push({ rootKey: 60, keyHigh: 100, velTop: 127 }); // extra zone, no stroke
    expect(() => buildEditedNsmp(model, decoded, 3)).toThrow();
  });
});
