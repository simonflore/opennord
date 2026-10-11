/**
 * Nord Electro 3 / Electro 3 HP (`.nepg`) decoder.
 *
 * Legacy formatType-0 CBIN: the record sits at file 0x18 — a u16 record
 * version, then the 108-byte parameter bitstream from **file 0x1A** — and the
 * last two bytes are the trailer: 24 + 2 + 108 + 2 = 136. The field layouts
 * are the Electro 3 OS 3.14 and Electro 3 HP OS 3.16 descriptor maps,
 * generated into `layout.generated.ts` / `layout-hp.generated.ts` by
 * the maintainers’ tools and read through the shared legacy-record
 * reader (clavia/legacy-record.ts):
 *
 * | File      | Block (descriptors, reserved included)      |
 * |-----------|---------------------------------------------|
 * | 0x1A      | common (4): organ / piano focus             |
 * | 0x23      | organCommon (9): organ model, B3/Vox/Farf   |
 * | 0x2D      | organPresetI (39): B3 + Vox drawbars, tabs  |
 * | 0x3F      | organPresetII (39)                          |
 * | 0x51      | piano (20): type, a model per type, …       |
 * | 0x5F      | effectsShared (17)                          |
 * | 0x70      | effectsOrgan (8): 5 switches                |
 * | 0x7B      | effectsPiano (8): 5 switches                |
 * | 0x86      | trailer                                     |
 *
 * The piano and effects blocks start where the Electro 4's do (lib/ne4). Both
 * models write the same record; the HP layout (a superset) reads either.
 * Never throws.
 */
import { formatCbinVersion } from '../clavia/cbin';
import { readLegacyFile } from '../clavia/legacy-record';
import { storedTrailerChecksum } from '../clavia/crc16';
import { NE3_LAYOUT } from './layout.generated';
import { NE3HP_LAYOUT, type Ne3HpFieldKey } from './layout-hp.generated';
import type { Ne3OrganPreset, Ne3Program } from './types';

/** Record versions the firmware reads: 101, and 100 (upgraded on load). */
export const NE3_RECORD_VERSIONS = [100, 101] as const;

/** Parameters only the Electro 3 HP stores (in space the Electro 3 reserves). */
export const NE3_HP_ONLY_KEYS: readonly Ne3HpFieldKey[] = (() => {
  const plain = new Set<string>(NE3_LAYOUT.fields.map((f) => f.key));
  return NE3HP_LAYOUT.fields.map((f) => f.key).filter((k) => !plain.has(k));
})();

/** The model-number parameter for each piano type 0–5. */
const PIANO_MODEL_KEYS = [
  'piano.modelGrand', 'piano.modelUpright', 'piano.modelEPiano', 'piano.modelWurl', 'piano.modelClavHps', 'piano.modelSample',
] as const satisfies readonly Ne3HpFieldKey[];

type Get = (key: Ne3HpFieldKey) => number;

const NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function preset(g: Get, p: 'organPresetI' | 'organPresetII'): Ne3OrganPreset {
  return {
    b3Drawbars: NINE.map((i) => g(`${p}.b3Drawbar${i}`)),
    voxDrawbars: NINE.map((i) => g(`${p}.voxDrawbar${i}`)),
    farfTabs: NINE.map((i) => g(`${p}.farfTab${i}`)),
  };
}

/** Decode a Nord Electro 3 / 3 HP program (full file bytes including the CBIN header). */
export function decodeNe3(bytes: Uint8Array): Ne3Program {
  const r = readLegacyFile(bytes, NE3HP_LAYOUT, NE3_RECORD_VERSIONS);
  const values = r.values;
  //: a version-100 record is upgraded by copying piano 16 into piano 17.
  if (r.recordVersion === 100) values['piano.param17'] = values['piano.param16'];
  const g: Get = (key) => values[key] ?? 0;
  const pianoType = g('piano.type');
  const switches = (block: 'effectsOrgan' | 'effectsPiano') =>
    [0, 1, 2, 3, 4].map((i) => g(`${block}.param${i}` as Ne3HpFieldKey));

  return {
    parsed: true,
    version: formatCbinVersion(bytes),
    recordVersion: r.recordVersion,
    hp: r.complete && NE3_HP_ONLY_KEYS.some((k) => g(k) !== 0) ? true : null,
    focus: g('common.instrumentSelect') === 0 ? 'organ' : 'piano',
    organModel: g('organCommon.organModel'),
    presetI: preset(g, 'organPresetI'),
    presetII: preset(g, 'organPresetII'),
    pianoType,
    pianoModel: PIANO_MODEL_KEYS[pianoType] ? g(PIANO_MODEL_KEYS[pianoType]) : 0,
    effectSwitches: { organ: switches('effectsOrgan'), piano: switches('effectsPiano') },
    values,
    outOfRange: r.outOfRange,
    complete: r.complete,
    checksum: bytes.length >= 2 ? storedTrailerChecksum(bytes) : 0,
    _data: r.data,
    bytes,
    warnings: r.warnings,
  };
}
