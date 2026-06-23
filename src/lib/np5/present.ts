/**
 * Nord Piano 5 → DecodedProgram. Same per-layer piano core as Grand 2 (NW1-v4),
 * confirmed via the Stage-4 piano oracle. FX is per-program on the NP5 (not yet
 * decoded). Unverified octave/timbre labels held back.
 */
import { decodeNp5 } from './decode';
import type { Np5PianoCore } from './types';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';

const hexId = (n: number) => `0x${(n >>> 0).toString(16).padStart(8, '0')}`;

function coreSection(id: string, label: string, c: Np5PianoCore, active: boolean): DecodedSection {
  const parts: string[] = [c.pianoType];
  if (c.variation > 0) parts.push(`variation ${c.variation + 1}`);
  parts.push(`level ${c.volume}`);
  if (!active) parts.push('(off)');

  const chips: string[] = [];
  if (c.stringRes) chips.push('String Res');
  if (c.pedalNoise) chips.push('Pedal Noise');
  if (c.softRel) chips.push('Soft Release');
  if (c.pstick) chips.push('Pedal Stick');

  return { id, label, engines: [{ label: 'Piano', parts }], chips };
}

export function np5Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNp5(bytes);
  return {
    title: 'Nord Piano 5 · Program',
    header: [
      ['Version', `v${p.version}`],
      ['Layer A sound id', hexId(p.coreLayerA.pianoModelId)],
      ['Layer B sound id', hexId(p.coreLayerB.pianoModelId)],
    ],
    sections: [
      coreSection('A', 'LAYER A', p.coreLayerA, true),
      coreSection('B', 'LAYER B', p.coreLayerB, p.layerBActive),
    ],
    note: 'Piano 5: per-layer piano core (type, level, character, sound id) confirmed via the Stage-4 piano oracle. FX and exact octave/timbre labels still to come.',
  };
}
