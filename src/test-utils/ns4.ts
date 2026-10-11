import type { NS4Program } from '../lib/ns4/types';
import { buildParamMap } from '../lib/ns4/maps';
import { writeField } from '../lib/ns4/bits';

/**
 * A Stage 4 program with only what the Library's zone views read: each layer's
 * zone flags, and the Split switch (its bit set in otherwise empty bytes).
 */
export function zonedProgram(layers: { kind: string; kbZones: string }[], split = true): NS4Program {
  const bytes = new Uint8Array(1024);
  if (split) {
    const { begBit, endBit } = buildParamMap().find((p) => p.name === 'split on/off')!.layers[0];
    writeField(bytes, begBit, endBit, 1);
  }
  return { kind: 'program', bytes, layers: layers.map((l, i) => ({ id: 'ABC'[i], enabled: true, ...l })) } as unknown as NS4Program;
}
