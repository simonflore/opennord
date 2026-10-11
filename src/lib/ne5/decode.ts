/**
 * Nord Electro 5 (`.ne5p`) reader — the Electro 5 OS 2.04 parameter containers
 * (`layout.generated.ts`, generated) read
 * through the shared legacy program reader: the u16 record version at 0x18
 * (4; version 3 is converted as the firmware converts it, 1 and 2 refused), the 119-byte
 * data from file 0x1A, the 2-byte trailer. See types.ts for the layout and
 * how it renames the fields of the earlier corpus decoder. Never throws.
 */
import { decodeLegacyProgram } from '../clavia/legacy-program';
import { recordEditor, type RecordConverter } from '../clavia/record-convert';
import { storedTrailerChecksum } from '../clavia/crc16';
import { DRAWBAR_NUMBERS } from '../clavia/fw-present';
import { NE5_LAYOUT, type Ne5FieldKey } from './layout.generated';
import type { Ne5DrawbarPreset, Ne5OrganSet, Ne5OrganType, Ne5Program } from './types';

/** Record versions the firmware converts to 4 on load (v1 and v2 are refused). */
const CONVERTED = [3] as const;

/**
 * Version 3 → 4 (OS 2.04 load path): the EQ source was one bit (data bit 854,
 * 0 = Part L, 1 = Part U, now `effects.param15`); version 4 keeps it in the
 * 2-bit `effects.equalizerSource` (which adds Part L+U) and clears the old bit.
 */
export const convertNe5: RecordConverter = (data, from) => {
  if (from === 3) {
    const r = recordEditor<Ne5FieldKey>(data, NE5_LAYOUT);
    r.set('effects.equalizerSource', r.get('effects.param15'));
    r.set('effects.param15', 0);
  }
  return [];
};

type Get = (key: Ne5FieldKey) => number;

function preset(get: Get, type: Ne5OrganType, which: 'I' | 'II'): Ne5DrawbarPreset {
  const p = `${type}Preset${which}` as const;
  const drawbars = DRAWBAR_NUMBERS.map((i) => get(`${p}.drawbar${i}` as Ne5FieldKey));
  const vibrato = get(`${p}.${type === 'b3' ? 'vibChorusOn' : 'vibratoOn'}` as Ne5FieldKey) === 1;
  if (type === 'b3') {
    return {
      drawbars, vibrato, percussion: get(`b3Preset${which}.percussionOn`) === 1,
      bass: [get(`b3Preset${which}.bassDrawbar16`), get(`b3Preset${which}.bassDrawbar8`)],
    };
  }
  if (type === 'church') return { drawbars, vibrato, percussion: get(`churchPreset${which}.percOn`) === 1 };
  return { drawbars, vibrato };
}

function organSet(get: Get, type: Ne5OrganType): Ne5OrganSet {
  return {
    upperPreset: get(`${type}Upper.presetSelect` as Ne5FieldKey),
    lowerPreset: get(`${type}Lower.presetSelect` as Ne5FieldKey),
    presetI: preset(get, type, 'I'),
    presetII: preset(get, type, 'II'),
  };
}

/** Decode a Nord Electro 5 program (full file bytes including the CBIN header). */
export function decodeNe5(bytes: Uint8Array): Ne5Program {
  const p = decodeLegacyProgram(bytes, NE5_LAYOUT, { model: 'Electro 5', converted: CONVERTED, convert: convertNe5 });
  const get: Get = (key) => p.values[key] ?? 0;
  return {
    ...p,
    format: 'ne5p',
    organModel: get('common.organModel'),
    organ: {
      b3: organSet(get, 'b3'),
      vox: organSet(get, 'vox'),
      farf: organSet(get, 'farf'),
      church: organSet(get, 'church'),
    },
    piano: {
      type: get('piano.pianoType'),
      model: get('piano.pianoModel'),
      ids: [get('piano.pianoIdA'), get('piano.pianoIdB')],
    },
    sampleSynth: {
      sample: get('sampleSynth.sampleSelect'),
      ids: [get('sampleSynth.sampleIdA'), get('sampleSynth.sampleIdB')],
    },
    checksum: bytes.length >= 2 ? storedTrailerChecksum(bytes) : 0,
  };
}
