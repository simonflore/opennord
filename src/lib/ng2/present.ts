/**
 * Nord Grand 2 → DecodedProgram. Two piano layers and two sample-synth layers,
 * each with its own effect chain, plus the global reverb — from the
 * the program map (Grand 2 OS 1.22 registry; see types.ts).
 *
 * Display labels are the Grand 2 panel labels for the same OS
 * (…, shared with the Piano 6); the label-to-parameter pairing is by
 * value count (medium). Values without a known label (the 16-step EQ, touch)
 * are held back; effect settings show as their stored number on the effects panel. The layer-enable reading — bit 0 = layer A, bit 1 = layer B of
 * PnoCom/SynCom LayerEnable — follows the firmware defaults (piano 1 = A on,
 * synth 0 = off) and is medium confidence. The piano NAME comes from the
 * family-wide piano-hash table, injected by the composition root (presenters.ts).
 */
import { decodeNg2 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import {
  fwHeader, fxGroupsSection, headerOnly, label, levelPart, octavePart, parts, pianoParts,
  singleSplit, soundIdRow, splitSide, splitText, SPLIT_NOTES_FROM_F2, transposeText, type PianoNameResolver,
} from '../clavia/fw-present';
import { layerChainGroups, type FieldGet } from '../clavia/fx-lean';
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

function pianoLayer(g: Get, id: 'A' | 'B', on: boolean, resolve?: PianoNameResolver): DecodedSection {
  const blk = `piano${id}` as const;
  return {
    id: `P${id}`, label: `PIANO ${id}`,
    engines: [
      {
        label: 'Piano',
        parts: parts(
          ...pianoParts(g(`${blk}.nameHash`), label(NG2_PIANO_TYPE, g(`${blk}.bank`)), g(`${blk}.variation`), resolve),
          levelPart(g(`${blk}.layerLevel`)), octavePart(g(`${blk}.octaveShift`)), !on && '(off)'),
      },
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
    ],
  };
}

export function ng2Decoded(bytes: Uint8Array, resolvePianoName?: PianoNameResolver): DecodedProgram {
  const p = decodeNg2(bytes);
  const title = 'Nord Grand 2 · Program';
  if (!p.layoutMatched) return headerOnly(title, p, 'Grand 2');
  const g: Get = (k) => p.values[k];

  const splitOn = g('common.splitEnable') === 1;
  const splitNote = label(SPLIT_NOTES_FROM_F2, g('common.splitPosition'));
  const header = [
    ...fwHeader(p, transposeText(g('common.transposeEnable'), g('common.transposeValue'))),
    ['Split', splitText(splitOn, splitNote, g('common.splitWidth'))] as [string, string],
    ...soundIdRow('Piano A sound id', g('pianoA.nameHash')),
    ...soundIdRow('Piano B sound id', g('pianoB.nameHash')),
  ];

  const pianoOn = g('pianoCommon.layerEnable') ?? 0;
  const synthOn = g('synthCommon.layerEnable') ?? 0;
  const keyboard = singleSplit(splitOn, splitNote, g('common.splitWidth'), (['A', 'B'] as const).flatMap((id, i) => [
    { kind: 'piano' as const, id, on: (pianoOn & (1 << i)) !== 0, side: splitSide(g(`piano${id}.kbdZone`)) },
    { kind: 'synth' as const, id, on: (synthOn & (1 << i)) !== 0, side: splitSide(g(`synth${id}.kbdZone`)) },
  ]));

  return {
    title, header, keyboard,
    sections: [
      pianoLayer(g, 'A', (pianoOn & 1) !== 0, resolvePianoName),
      pianoLayer(g, 'B', (pianoOn & 2) !== 0, resolvePianoName),
      synthLayer(g, 'A', (synthOn & 1) !== 0),
      synthLayer(g, 'B', (synthOn & 2) !== 0),
      fxGroupsSection(layerChainGroups(g as FieldGet, [
        { blk: 'pianoFxA', label: 'Piano A', kind: 'piano', on: (pianoOn & 1) !== 0 },
        { blk: 'pianoFxB', label: 'Piano B', kind: 'piano', on: (pianoOn & 2) !== 0 },
        { blk: 'synthFxA', label: 'Synth A', kind: 'synth', on: (synthOn & 1) !== 0 },
        { blk: 'synthFxB', label: 'Synth B', kind: 'synth', on: (synthOn & 2) !== 0 },
      ], { fx1: NG2_FX1, fx2: NG2_FX2, amp: NG2_AMP, delayFilter: NG2_DELAY_FILTER, reverb: NG2_REVERB, reverbColor: NG2_REVERB_COLOR })),
    ],
    note: 'Grand 2: piano and sample-synth layers and their effects read with OpenNord’s map of Grand 2 OS 1.22 programs.',
    warnings: p.warnings,
  };
}
