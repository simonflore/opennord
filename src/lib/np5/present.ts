/**
 * Nord Piano 5 → DecodedProgram. Two piano layers and two sample-synth layers,
 * plus the global effect chain — from the firmware-derived layout (Piano 5 OS
 * 1.34 registry FUN_c00f8188; see types.ts).
 *
 * Display labels are the Piano 5 panel tables from the same firmware image
 * (c00f3c90…); the label-to-parameter pairing is by value count (medium).
 * Values without a known label (timbre, touch) are held back. The layer-enable
 * reading — bit 0 = layer A, bit 1 = layer B of Com_kSlotPnoEnable /
 * Com_kSlotSynEnable — follows the firmware defaults (piano 1 = A on, synth 0 =
 * off) and is medium confidence. The effects are one global block (each unit
 * routed to a layer by its source), shown once. The piano NAME comes from the
 * family-wide piano-hash table, injected by the composition root (presenters.ts).
 */
import { decodeNp5 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import {
  effectsSection, fwHeader, headerOnly, hexId, label, levelPart, octavePart, parts, transposeText, variationPart,
} from '../clavia/fw-present';
import type { Np5FieldKey } from './layout.generated';

/** Pno_kBank 0–5. */
export const NP5_PIANO_TYPE = ['Grand', 'Upright', 'Electric', 'Clavinet', 'Digital', 'Misc'] as const;
/** Effects_kFx1Type 0–7. */
export const NP5_FX1 = ['Tremolo 1', 'Tremolo 2', 'Tremolo 3', 'Panning 1', 'Panning 2', 'Panning 3', 'Wah-Wah', 'Ring Mod'] as const;
/** Effects_kFx2Type 0–5. */
export const NP5_FX2 = ['Phaser 1', 'Phaser 2', 'Flanger', 'Chorus 1', 'Chorus 2', 'Vibe'] as const;
/** Effects_kSpkType 0–4. */
export const NP5_SPEAKER = ['Small', 'JC', 'Twin', 'Dist', 'Comp'] as const;
/** Effects_kRvbType 0–4. */
export const NP5_REVERB = ['Booth', 'Room', 'Stage', 'Hall', 'Cathedral'] as const;
/** Effects_kRvbColor 0–2. */
export const NP5_REVERB_COLOR = ['Normal', 'Dark', 'Bright'] as const;

type Get = (key: Np5FieldKey) => number | undefined;

function pianoLayer(g: Get, id: 'A' | 'B', on: boolean, resolve?: (hash: number) => string | undefined): DecodedSection {
  const blk = `piano${id}` as const;
  const type = label(NP5_PIANO_TYPE, g(`${blk}.bank`));
  const hash = g(`${blk}.nameHash`);
  const name = hash !== undefined ? resolve?.(hash) : undefined;
  return {
    id: `P${id}`, label: `PIANO ${id}`,
    engines: [{
      label: 'Piano',
      parts: parts(name ?? type ?? 'Piano', name && type, variationPart(g(`${blk}.variation`)),
        levelPart(g(`${blk}.level`)), octavePart(g(`${blk}.octaveShift`)), !on && '(off)'),
    }],
    chips: parts(g(`${blk}.pedalNoise`) ? 'Pedal Noise' : undefined),
  };
}

function synthLayer(g: Get, id: 'A' | 'B', on: boolean): DecodedSection {
  const blk = `synth${id}` as const;
  return {
    id: `S${id}`, label: `SYNTH ${id}`,
    engines: [{
      label: 'Synth',
      parts: parts('Sample', levelPart(g(`${blk}.level`)), octavePart(g(`${blk}.octaveShift`)), !on && '(off)'),
    }],
  };
}

export function np5Decoded(
  bytes: Uint8Array,
  resolvePianoName?: (hash: number) => string | undefined,
): DecodedProgram {
  const p = decodeNp5(bytes);
  const title = 'Nord Piano 5 · Program';
  if (!p.layoutMatched) return headerOnly(title, p, 'Piano 5');
  const g: Get = (k) => p.values[k];

  const header = fwHeader(p, transposeText(g('common.transposeEnable'), g('common.transposeValue')));
  for (const id of ['A', 'B'] as const) {
    const h = g(`piano${id}.nameHash`);
    if (h !== undefined) header.push([`Piano ${id} sound id`, hexId(h)]);
  }

  const pianoOn = g('common.slotPnoEnable') ?? 0;
  const synthOn = g('common.slotSynEnable') ?? 0;
  const reverb = label(NP5_REVERB, g('effects.rvbType'));
  const color = label(NP5_REVERB_COLOR, g('effects.rvbColor'));

  return {
    title, header,
    sections: [
      pianoLayer(g, 'A', (pianoOn & 1) !== 0, resolvePianoName),
      pianoLayer(g, 'B', (pianoOn & 2) !== 0, resolvePianoName),
      synthLayer(g, 'A', (synthOn & 1) !== 0),
      synthLayer(g, 'B', (synthOn & 2) !== 0),
      effectsSection(parts(
        g('effects.fx1Enable') ? label(NP5_FX1, g('effects.fx1Type')) ?? 'Effect 1' : undefined,
        g('effects.fx2Enable') ? label(NP5_FX2, g('effects.fx2Type')) ?? 'Effect 2' : undefined,
        g('effects.dlyEnable') ? 'Delay' : undefined,
        g('effects.spkEnable') ? `Amp ${label(NP5_SPEAKER, g('effects.spkType')) ?? ''}`.trim() : undefined,
        g('effects.eqlEnable') ? 'EQ' : undefined,
        g('effects.rvbEnable')
          ? `Reverb ${reverb ?? ''}${color && color !== 'Normal' ? ` ${color}` : ''}`.trim() : undefined,
      )),
    ],
    note: 'Piano 5: piano and sample-synth layers and the effects read from the layout in the Piano 5 OS 1.34 firmware.',
    warnings: p.warnings,
  };
}
