/**
 * Nord Grand 2 → DecodedProgram. Two piano layers and two sample-synth layers,
 * each with its own effect chain, plus the global reverb — from the
 * firmware-derived layout (Grand 2 OS 1.22 registry FUN_c01125f8; see types.ts).
 *
 * Display labels are the Grand 2 panel tables from the same firmware image
 * (c01d6c7c…, shared with the Piano 6); the label-to-parameter pairing is by
 * value count (medium). Values without a known label (the 16-step EQ, touch)
 * are held back. The layer-enable reading — bit 0 = layer A, bit 1 = layer B of
 * PnoCom/SynCom LayerEnable — follows the firmware defaults (piano 1 = A on,
 * synth 0 = off) and is medium confidence. The piano NAME comes from the
 * family-wide piano-hash table, injected by the composition root (presenters.ts).
 */
import { decodeNg2 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import {
  effectsSection, fwHeader, headerOnly, hexId, label, levelPart, noneOn, octavePart, parts, transposeText, variationPart,
} from '../clavia/fw-present';
import type { Ng2FieldKey } from './layout.generated';

/** Pno_kBank 0–5. */
export const NG2_PIANO_TYPE = ['Grand', 'Upright', 'Electric', 'Clavinet', 'Digital', 'Misc'] as const;
/** Effects_kFx1Type 0–5. */
export const NG2_FX1 = ['Tremolo', 'Pan 1 Soft', 'Pan 2 Hard', 'Spin', 'Wah', 'Ring Mod'] as const;
/** Effects_kFx2Type 0–5. */
export const NG2_FX2 = ['Phaser 1', 'Phaser 2', 'Flanger', 'Chorus 1', 'Chorus 2', 'Vibe'] as const;
/** Effects_kAmpType 0–3. */
export const NG2_AMP = ['Clean', 'Twin', 'JC', 'Small Speaker'] as const;
/** Com_kEffectsRvbType 0–5. */
export const NG2_REVERB = ['Spring', 'Booth', 'Room', 'Stage', 'Hall', 'Cathedral'] as const;
/** Com_kEffectsRvbColor 0–2. */
export const NG2_REVERB_COLOR = ['Normal', 'Dark', 'Bright'] as const;
/** Effects_kDlyFltType 0–3. */
export const NG2_DELAY_FILTER = ['Bypass', 'LP', 'HP', 'BP'] as const;

type Get = (key: Ng2FieldKey) => number | undefined;

function layerFx(g: Get, blk: `${'piano' | 'synth'}Fx${'A' | 'B'}`): string[] {
  const filter = label(NG2_DELAY_FILTER, g(`${blk}.dlyFltType`));
  return parts(
    g(`${blk}.fx1Enable`) ? label(NG2_FX1, g(`${blk}.fx1Type`)) ?? 'Effect 1' : undefined,
    g(`${blk}.fx2Enable`) ? label(NG2_FX2, g(`${blk}.fx2Type`)) ?? 'Effect 2' : undefined,
    g(`${blk}.dlyEnable`) ? `Delay${filter && filter !== 'Bypass' ? ` ${filter}` : ''}` : undefined,
    g(`${blk}.ampEnable`) ? `Amp ${label(NG2_AMP, g(`${blk}.ampType`)) ?? ''}`.trim() : undefined,
    g(`${blk}.cmpEnable`) ? 'Comp' : undefined,
    g(`${blk}.eqEnable`) ? 'EQ' : undefined,
  );
}

function pianoLayer(g: Get, id: 'A' | 'B', on: boolean, resolve?: (hash: number) => string | undefined): DecodedSection {
  const blk = `piano${id}` as const;
  const type = label(NG2_PIANO_TYPE, g(`${blk}.bank`));
  const hash = g(`${blk}.nameHash`);
  const name = hash !== undefined ? resolve?.(hash) : undefined;
  return {
    id: `P${id}`, label: `PIANO ${id}`,
    engines: [
      {
        label: 'Piano',
        parts: parts(name ?? type ?? 'Piano', name && type, variationPart(g(`${blk}.variation`)),
          levelPart(g(`${blk}.layerLevel`)), octavePart(g(`${blk}.octaveShift`)), !on && '(off)'),
      },
      { label: 'Effects', parts: on ? noneOn(layerFx(g, `pianoFx${id}`)) : ['—'] },
    ],
    chips: parts(g(`${blk}.pedalNoise`) ? 'Pedal Noise' : undefined),
  };
}

function synthLayer(g: Get, id: 'A' | 'B', on: boolean): DecodedSection {
  const blk = `synth${id}` as const;
  return {
    id: `S${id}`, label: `SYNTH ${id}`,
    engines: [
      {
        label: 'Synth',
        parts: parts('Sample', levelPart(g(`${blk}.layerLevel`)), octavePart(g(`${blk}.octaveShift`)), !on && '(off)'),
      },
      { label: 'Effects', parts: on ? noneOn(layerFx(g, `synthFx${id}`)) : ['—'] },
    ],
  };
}

export function ng2Decoded(
  bytes: Uint8Array,
  resolvePianoName?: (hash: number) => string | undefined,
): DecodedProgram {
  const p = decodeNg2(bytes);
  const title = 'Nord Grand 2 · Program';
  if (!p.layoutMatched) return headerOnly(title, p, 'Grand 2');
  const g: Get = (k) => p.values[k];

  const header = fwHeader(p, transposeText(g('common.transposeEnable'), g('common.transposeValue')));
  for (const id of ['A', 'B'] as const) {
    const h = g(`piano${id}.nameHash`);
    if (h !== undefined) header.push([`Piano ${id} sound id`, hexId(h)]);
  }

  const pianoOn = g('pianoCommon.layerEnable') ?? 0;
  const synthOn = g('synthCommon.layerEnable') ?? 0;
  const reverb = label(NG2_REVERB, g('common.effectsRvbType'));
  const color = label(NG2_REVERB_COLOR, g('common.effectsRvbColor'));

  return {
    title, header,
    sections: [
      pianoLayer(g, 'A', (pianoOn & 1) !== 0, resolvePianoName),
      pianoLayer(g, 'B', (pianoOn & 2) !== 0, resolvePianoName),
      synthLayer(g, 'A', (synthOn & 1) !== 0),
      synthLayer(g, 'B', (synthOn & 2) !== 0),
      effectsSection(parts(
        g('common.effectsRvbEnable')
          ? `Reverb ${reverb ?? ''}${color && color !== 'Normal' ? ` ${color}` : ''}`.trim() : undefined,
      ), 'RV', 'REVERB'),
    ],
    note: 'Grand 2: piano and sample-synth layers and their effects read from the layout in the Grand 2 OS 1.22 firmware.',
    warnings: p.warnings,
  };
}
