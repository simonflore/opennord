/**
 * Nord Grand → DecodedProgram. Shows the piano and sample-synth layers and the
 * effect chain from the program map (Grand OS 1.68 registry
 *, the Piano 4 layout plus `Com_kSplPos`).
 *
 * Display labels are the Grand's own panel labels for the same OS
 * (Piano 4 labels, with "Clav" and "Misc" for the Grand); the label-to-parameter
 * pairing is by value count (medium). Values without a known label are held back
 * rather than shown as raw numbers. The piano NAME comes from the family-wide
 * piano-hash table, injected by the composition root (presenters.ts).
 */
import { decodeNg } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { effectsSection, fwHeader, headerOnly, hexId, label, levelPart, octavePart, parts, transposeText } from '../clavia/fw-present';

/** Pno_kBank 0–5 (Grand OS 1.68 label table). */
export const NG_PIANO_TYPE = ['Grand', 'Upright', 'Electric', 'Clav', 'Digital', 'Misc'] as const;
/** Pno_kEq for non-Clav pianos (Piano 4 / Grand label table; Clav uses its own combinations). */
export const NG_TIMBRE = ['None', 'Soft', 'Mid', 'Bright', 'Dyno1', 'Dyno2'] as const;
/** Effects_kFx1Type 0–7. */
export const NG_FX1 = ['Tremolo 1', 'Tremolo 2', 'Tremolo 3', 'Panning 1', 'Panning 2', 'Panning 3', 'Wah-Wah', 'Ring Mod'] as const;
/** Effects_kFx2Type 0–5. */
export const NG_FX2 = ['Phaser 1', 'Phaser 2', 'Flanger', 'Chorus 1', 'Chorus 2', 'Vibe'] as const;
/** Effects_kSpkType 0–4. */
export const NG_SPEAKER = ['Small', 'JC', 'Twin', 'Dist', 'Comp'] as const;
/** Effects_kRvbType 0–2 (+ the Bright switch). */
export const NG_REVERB = ['Room', 'Stage', 'Hall'] as const;

const CLAV = 3;

export function ngDecoded(
  bytes: Uint8Array,
  resolvePianoName?: (hash: number) => string | undefined,
): DecodedProgram {
  const p = decodeNg(bytes);
  const title = 'Nord Grand · Program';
  if (!p.layoutMatched) return headerOnly(title, p, 'Grand');
  const v = p.values;
  const header = fwHeader(p, transposeText(v['common.transposeEnable'], v['common.transposeValue']));
  if (v['piano.nameHash'] !== undefined) header.push(['Piano sound id', hexId(v['piano.nameHash'])]);
  if (v['synth.smpNameHash'] !== undefined) header.push(['Sample sound id', hexId(v['synth.smpNameHash'])]);

  const bank = v['piano.bank'];
  const type = label(NG_PIANO_TYPE, bank);
  const pianoName = v['piano.nameHash'] !== undefined ? resolvePianoName?.(v['piano.nameHash']) : undefined;
  const timbre = bank !== CLAV ? label(NG_TIMBRE, v['piano.eq']) : undefined;
  const piano: DecodedSection = {
    id: 'P', label: 'PIANO',
    engines: [{
      label: 'Piano',
      parts: parts(
        pianoName ?? type ?? 'Piano',
        pianoName && type,
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

  const reverb = label(NG_REVERB, v['effects.rvbType']);
  const fx = effectsSection(parts(
    v['effects.fx1Enable'] ? label(NG_FX1, v['effects.fx1Type']) ?? 'Effect 1' : undefined,
    v['effects.fx2Enable'] ? label(NG_FX2, v['effects.fx2Type']) ?? 'Effect 2' : undefined,
    v['effects.dlyEnable'] ? 'Delay' : undefined,
    v['effects.spkEnable'] ? `Amp ${label(NG_SPEAKER, v['effects.spkType']) ?? ''}`.trim() : undefined,
    v['effects.eqlEnable'] ? 'EQ' : undefined,
    v['effects.rvbEnable'] ? `Reverb ${reverb ?? ''}${v['effects.rvbBright'] ? ' Bright' : ''}`.trim() : undefined,
  ));

  return {
    title, header,
    sections: [piano, synth, fx],
    note: 'Grand: read with OpenNord’s map of Grand OS 1.68 programs (the Piano 4 layout plus a 9-step split point). Not yet checked against a real Grand file.',
    warnings: p.warnings,
  };
}
