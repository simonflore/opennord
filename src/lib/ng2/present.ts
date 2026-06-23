/**
 * Nord Grand 2 → the shared DecodedProgram presentation. Surfaces the per-layer
 * piano CORE confirmed via the Stage-4 piano oracle (type, level, character flags,
 * sound id). Octave/timbre/touch are decoded but their value→label mapping is
 * unverified, so they're held back rather than shown as raw protocol numbers.
 * The FX chain is not yet decoded.
 */
import { decodeNg2 } from './decode';
import type { Ng2PianoLayer } from './types';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';

const hexId = (n: number) => `0x${(n >>> 0).toString(16).padStart(8, '0')}`;

function layerSection(id: string, label: string, L: Ng2PianoLayer, active: boolean): DecodedSection {
  const parts: string[] = [L.pianoType];
  if (L.pianoVariation > 0) parts.push(`variation ${L.pianoVariation + 1}`);
  parts.push(`level ${L.volume}`);
  if (!active) parts.push('(off)');

  const chips: string[] = [];
  if (L.stringRes) chips.push('String Res');
  if (L.pedalNoise) chips.push('Pedal Noise');
  if (L.softRelease) chips.push('Soft Release');
  if (L.pstick) chips.push('Pedal Stick');

  return { id, label, engines: [{ label: 'Piano', parts }], chips };
}

export function ng2Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNg2(bytes);
  return {
    title: 'Nord Grand 2 · Program',
    header: [
      ['Version', `v${p.version}`],
      ['Layer A sound id', hexId(p.layerA.pianoModelId)],
      ['Layer B sound id', hexId(p.layerB.pianoModelId)],
    ],
    sections: [
      layerSection('A', 'LAYER A', p.layerA, true),
      layerSection('B', 'LAYER B', p.layerB, p.layerBActiveFlag),
    ],
    note: 'Grand 2: per-layer piano core (type, level, character, sound id) confirmed via the Stage-4 piano oracle. FX chain and exact octave/timbre labels still to come.',
  };
}
