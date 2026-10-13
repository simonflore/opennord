/**
 * Nord Wave → DecodedProgram. The record layout comes from the Wave OS 2.14
 * parameter descriptors (see decode.ts), named from the instrument’s display
 * tables: per slot how many controls it morphs and whether slot B repeats
 * slot A, then the program effects (tube amp, delay, reverb) with their settings.
 */
import { decodeNw1 } from './decode';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';
import { fxKnobs, fxParam, fxSection, fxType, morphCountPart, shortRecord } from '../clavia/fw-present';
import { NW1_DELAY_MODES, NW1_REVERB_MODELS } from './labels';
import type { Nw1FieldKey, Nw1Section } from './types';

export const NW1_NOTE =
  'Wave: OpenNord’s program map (OS 2.14), alignment not yet checked on a real file. All parameters and morph amounts are read and named as the instrument shows them; the cards show the morphs and the effects that are on.';

const morphed = (s: Nw1Section) => Object.values(s.morphs).filter((d) => d.some((x) => x !== 0)).length;
const same = (a: Nw1Section, b: Nw1Section) =>
  a.params.every((v, i) => v === b.params[i]) &&
  Object.entries(a.morphs).every(([id, d]) => d.every((x, k) => x === b.morphs[Number(id)]?.[k]));

export function nw1Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNw1(bytes);
  const title = 'Nord Wave · Program';
  const header: [string, string][] = [['Version', `v${p.version}`]];
  if (!p.complete) return shortRecord(title, header, 'Wave', p.warnings);
  const g = (k: Nw1FieldKey) => p.values[k] ?? 0;
  const slot = (id: string, label: string, s: Nw1Section, copy: boolean): DecodedSection => ({
    id, label,
    engines: [{ label: 'Morph', parts: [morphCountPart(morphed(s))] }],
    chips: copy ? ['Same as slot A'] : undefined,
  });
  return {
    title, header,
    sections: [
      slot('A', 'SLOT A', p.slot1, false),
      slot('B', 'SLOT B', p.slot2, same(p.slot1, p.slot2)),
      // The Wave's three effects, with the settings its layout names (Tube Amp Drive, Delay Tempo /
      // Feedback / Amount, Reverb Dry/Wet), shown as stored at the registry's ranges.
      fxSection([
        {
          key: 'amp', label: 'Tube Amp', on: g('common.param0') === 1,
          params: fxKnobs(fxParam('Drive', g('common.param1'), 0, 127)),
        },
        {
          key: 'dly', label: 'Delay', on: g('common.param6') === 1, type: fxType(NW1_DELAY_MODES, g('common.param4')),
          params: fxKnobs(
            fxParam('Tempo', g('common.param2'), 0, 65535), fxParam('Feedback', g('common.param3'), 0, 3),
            fxParam('Amount', g('common.param5'), 0, 127),
          ),
        },
        {
          key: 'rvb', label: 'Reverb', on: g('common.param9') === 1, type: fxType(NW1_REVERB_MODELS, g('common.param7')),
          params: fxKnobs(fxParam('Amount', g('common.param8'), 0, 127)),
        },
      ]),
    ],
    note: NW1_NOTE,
    warnings: p.warnings,
  };
}
