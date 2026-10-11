/**
 * Nord Electro 4 (`.ne4p`) decoder.
 *
 * Legacy formatType-0 CBIN: the u16 at 0x14 is the version, the parameter
 * bitstream runs from **file 0x1A** for 864 bits (108 bytes), and the last two
 * bytes are the CRC-16 trailer — 26 + 108 + 2 = 136, the `.ne4p` size (the
 * trailer is exposed as stored: its CRC coverage is unverified, see types.ts).
 * The field layout is the Electro 4 OS 1.22 descriptor map (serialiser
 *, container builder), generated into
 * `layout.generated.ts` generated and read through the
 * shared legacy-record reader (clavia/legacy-record.ts):
 *
 * | File      | Block (descriptors)                     | Old corpus "body" |
 * |-----------|-----------------------------------------|-------------------|
 * | 0x1A      | programCommon (6)                       | −18               |
 * | 0x21-0x26 | B3 / Vox / Farfisa Common (3 each)      | −11 … −6          |
 * | 0x27      | B3 Preset I (17): drawbars 0x27-0x2B    | −5 … 4            |
 * | 0x30      | Vox Preset I (12): drawbars 0x30-0x34   | 4-8               |
 * | 0x37      | Farfisa Preset I (13): tabs 0x37-0x38   | 11-12             |
 * | 0x3C      | B3 Preset II (17): drawbars 0x3C-0x40   | 16-21             |
 * | 0x45      | Vox Preset II (12)                      | 25-29             |
 * | 0x4C      | Farfisa Preset II (13)                  | 32-33             |
 * | 0x51      | pianoSample (21)                        | 37-50             |
 * | 0x5F      | effects (22)                            | 51-67             |
 * | 0x70      | blockX1 (8)                             | 68-78             |
 * | 0x7B      | blockX2 (8)                             | 79-89             |
 * | 0x86      | CRC-16 trailer                          | 90-91             |
 *
 * Drawbars are the firmware's 4-bit descriptors (0-8), MSB-first — the same
 * nibble packing the corpus RE found. Never throws.
 */
import { formatCbinVersion } from '../clavia/cbin';
import { LEGACY_DATA_OFFSET, legacyData, readLegacyRecord } from '../clavia/legacy-record';
import { storedTrailerChecksum } from '../clavia/crc16';
import { NE4_LAYOUT, type Ne4FieldKey } from './layout.generated';
import type { Ne4B3Preset, Ne4FarfisaPreset, Ne4Program, Ne4VoxPreset } from './types';

const NE4P_FILE_BYTES = LEGACY_DATA_OFFSET + NE4_LAYOUT.dataBytes + 2; // 136

type Block = 'b3PresetI' | 'b3PresetII' | 'voxPresetI' | 'voxPresetII' | 'farfPresetI' | 'farfPresetII' | 'pianoSample';
type Get = (block: Block, index: number) => number;

const nine = (get: Get, block: Block): number[] => Array.from({ length: 9 }, (_, i) => get(block, i));

function b3(get: Get, block: 'b3PresetI' | 'b3PresetII'): Ne4B3Preset {
  return {
    drawbars: nine(get, block),
    vibratoType: get(block, 9),
    flag10: get(block, 10),
    percussion: [get(block, 11), get(block, 12), get(block, 13), get(block, 14)],
    mode: get(block, 15),
  };
}

function vox(get: Get, block: 'voxPresetI' | 'voxPresetII'): Ne4VoxPreset {
  return { drawbars: nine(get, block), flag9: get(block, 9), mode: get(block, 10) };
}

function farf(get: Get, block: 'farfPresetI' | 'farfPresetII'): Ne4FarfisaPreset {
  return { tabs: nine(get, block), vibrato: get(block, 9), flag10: get(block, 10), mode: get(block, 11) };
}

/** Decode a Nord Electro 4 program (full file bytes including the CBIN header). */
export function decodeNe4(bytes: Uint8Array): Ne4Program {
  const warnings: string[] = [];
  if (bytes.length < LEGACY_DATA_OFFSET + 2) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ${NE4P_FILE_BYTES})`);
  } else if (bytes.length !== NE4P_FILE_BYTES) {
    warnings.push(`Program file is ${bytes.length} bytes, the firmware record makes ${NE4P_FILE_BYTES}`);
  }
  const data = legacyData(bytes);
  const { values, outOfRange } = readLegacyRecord(data, NE4_LAYOUT);
  const get: Get = (block, index) => values[`${block}.${index}` as Ne4FieldKey] ?? 0;

  return {
    parsed: true,
    version: formatCbinVersion(bytes),
    organ: {
      b3PresetI: b3(get, 'b3PresetI'),
      b3PresetII: b3(get, 'b3PresetII'),
      voxPresetI: vox(get, 'voxPresetI'),
      voxPresetII: vox(get, 'voxPresetII'),
      farfPresetI: farf(get, 'farfPresetI'),
      farfPresetII: farf(get, 'farfPresetII'),
    },
    pianoSample: {
      type: get('pianoSample', 0),
      model: get('pianoSample', 1),
      variation: get('pianoSample', 2),
      refIds: [get('pianoSample', 3), get('pianoSample', 4)],
    },
    values,
    outOfRange,
    checksum: bytes.length >= 2 ? storedTrailerChecksum(bytes) : 0,
    _data: data,
    bytes,
    warnings,
  };
}
