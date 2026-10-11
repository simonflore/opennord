/**
 * Nord Piano 4 → DecodedProgram. Shows the piano and sample-synth layers and the
 * effect chain from the program map (Piano 4 OS 2.66 registry
 *; the Grand layout minus its 4-bit split point).
 *
 * Display labels are the Piano 4's own panel labels for the same OS
 * (…); the label-to-parameter pairing is by value count (medium). Values
 * without a known label are held back rather than shown as raw numbers. The piano
 * NAME comes from the family-wide piano-hash table, injected by the composition
 * root (presenters.ts) — this module never imports ns4.
 */
import { decodeNp4 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import {
  effectsSection, fwHeader, headerOnly, hexId, label, levelPart, octavePart, parts, transposeText, variationPart,
} from '../clavia/fw-present';

/** Pno_kBank 0–5 (Piano 4 OS 2.66 label table). */
export const NP4_PIANO_TYPE = ['Grand', 'Upright', 'Electric', 'Clav/Hps', 'Digital', 'Layer'] as const;
/** Pno_kEq for non-Clav pianos (Piano 4 label table; Clav/Hps uses its own combinations). */
export const NP4_TIMBRE = ['None', 'Soft', 'Mid', 'Bright', 'Dyno1', 'Dyno2'] as const;
/** Effects_kFx1Type 0–7. */
export const NP4_FX1 = ['Tremolo 1', 'Tremolo 2', 'Tremolo 3', 'Panning 1', 'Panning 2', 'Panning 3', 'Wah-Wah', 'Ring Mod'] as const;
/** Effects_kFx2Type 0–5. */
export const NP4_FX2 = ['Phaser 1', 'Phaser 2', 'Flanger', 'Chorus 1', 'Chorus 2', 'Vibe'] as const;
/** Effects_kSpkType 0–4. */
export const NP4_SPEAKER = ['Small', 'JC', 'Twin', 'Dist', 'Comp'] as const;
/** Effects_kRvbType 0–2 (+ the Bright switch). */
export const NP4_REVERB = ['Room', 'Stage', 'Hall'] as const;

const CLAV = 3;

export function np4Decoded(
  bytes: Uint8Array,
  resolvePianoName?: (hash: number) => string | undefined,
): DecodedProgram {
  const p = decodeNp4(bytes);
  const title = 'Nord Piano 4 · Program';
  if (!p.layoutMatched) return headerOnly(title, p, 'Piano 4');
  const v = p.values;
  const header = fwHeader(p, transposeText(v['common.transposeEnable'], v['common.transposeValue']));
  if (v['piano.nameHash'] !== undefined) header.push(['Piano sound id', hexId(v['piano.nameHash'])]);
  if (v['synth.smpNameHash'] !== undefined) header.push(['Sample sound id', hexId(v['synth.smpNameHash'])]);

  const bank = v['piano.bank'];
  const type = label(NP4_PIANO_TYPE, bank);
  const pianoName = v['piano.nameHash'] !== undefined ? resolvePianoName?.(v['piano.nameHash']) : undefined;
  const timbre = bank !== CLAV ? label(NP4_TIMBRE, v['piano.eq']) : undefined;
  const piano: DecodedSection = {
    id: 'P', label: 'PIANO',
    engines: [{
      label: 'Piano',
      parts: parts(
        pianoName ?? type ?? 'Piano',
        pianoName && type,
        variationPart(v['piano.variation']),
        levelPart(v['piano.level']),
        octavePart(v['piano.octaveShift']),
        timbre && timbre !== 'None' ? `Timbre ${timbre}` : undefined,
        !v['piano.enable'] && '(off)',
      ),
    }],
    chips: parts(v['piano.pedalNoise'] ? 'Pedal Noise' : undefined),
  };
  const synth: DecodedSection = {
    id: 'S', label: 'SAMPLE SYNTH',
    engines: [{
      label: 'Synth',
      parts: parts('Sample', levelPart(v['synth.level']), octavePart(v['synth.octaveShift']), !v['synth.enable'] && '(off)'),
    }],
  };

  const reverb = label(NP4_REVERB, v['effects.rvbType']);
  const fx = effectsSection(parts(
    v['effects.fx1Enable'] ? label(NP4_FX1, v['effects.fx1Type']) ?? 'Effect 1' : undefined,
    v['effects.fx2Enable'] ? label(NP4_FX2, v['effects.fx2Type']) ?? 'Effect 2' : undefined,
    v['effects.dlyEnable'] ? 'Delay' : undefined,
    v['effects.spkEnable'] ? `Amp ${label(NP4_SPEAKER, v['effects.spkType']) ?? ''}`.trim() : undefined,
    v['effects.eqlEnable'] ? 'EQ' : undefined,
    v['effects.rvbEnable'] ? `Reverb ${reverb ?? ''}${v['effects.rvbBright'] ? ' Bright' : ''}`.trim() : undefined,
  ));

  return {
    title, header,
    sections: [piano, synth, fx],
    note: 'Piano 4: piano, sample synth and effects read with OpenNord’s map of Piano 4 OS 2.66 programs.',
    warnings: p.warnings,
  };
}
