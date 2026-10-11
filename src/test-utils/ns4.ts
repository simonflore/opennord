import type { NS4Program } from '../lib/ns4/types';
import { buildParamMap } from '../lib/ns4/maps';

/**
 * A Stage 4 program with only what the Library's zone views read: each layer's
 * zone flags, and the Split switch (its bit set in otherwise empty bytes).
 */
export function zonedProgram(layers: { kind: string; kbZones: string }[], split = true): NS4Program {
  const bytes = new Uint8Array(1024);
  if (split) {
    const bit = buildParamMap().find((p) => p.name === 'split on/off')!.layers[0].begBit;
    bytes[bit >>> 3] |= 0x80 >>> (bit & 7); // MSB-first
  }
  return { kind: 'program', bytes, layers: layers.map((l, i) => ({ id: 'ABC'[i], enabled: true, ...l })) } as unknown as NS4Program;
}
