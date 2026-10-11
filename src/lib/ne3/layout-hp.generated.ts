// AUTO-GENERATED (electro-3-hp) — DO NOT EDIT MANUALLY.
//
// Provenance: Electro 3 HP OS 3.16 parameter containers; Electro 3 HP OS 3.16 record version 101: the Electro 3 record plus 5 parameters in its reserved space.
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). `bit` is relative to the record data (file 0x1A).
import type { LegacyLayout } from '../clavia/legacy-record';

export type Ne3HpFieldKey =
  | 'common.instrumentSelect'
  | 'organCommon.organModel'
  | 'organCommon.param1'
  | 'organCommon.param2'
  | 'organCommon.b3Common'
  | 'organCommon.voxCommon'
  | 'organCommon.farfCommon'
  | 'organPresetI.b3Drawbar1'
  | 'organPresetI.b3Drawbar2'
  | 'organPresetI.b3Drawbar3'
  | 'organPresetI.b3Drawbar4'
  | 'organPresetI.b3Drawbar5'
  | 'organPresetI.b3Drawbar6'
  | 'organPresetI.b3Drawbar7'
  | 'organPresetI.b3Drawbar8'
  | 'organPresetI.b3Drawbar9'
  | 'organPresetI.voxDrawbar1'
  | 'organPresetI.voxDrawbar2'
  | 'organPresetI.voxDrawbar3'
  | 'organPresetI.voxDrawbar4'
  | 'organPresetI.voxDrawbar5'
  | 'organPresetI.voxDrawbar6'
  | 'organPresetI.voxDrawbar7'
  | 'organPresetI.voxDrawbar8'
  | 'organPresetI.voxDrawbar9'
  | 'organPresetI.farfTab1'
  | 'organPresetI.farfTab2'
  | 'organPresetI.farfTab3'
  | 'organPresetI.farfTab4'
  | 'organPresetI.farfTab5'
  | 'organPresetI.farfTab6'
  | 'organPresetI.farfTab7'
  | 'organPresetI.farfTab8'
  | 'organPresetI.farfTab9'
  | 'organPresetI.b3VibratoType'
  | 'organPresetI.b3Flag'
  | 'organPresetI.voxVibrato'
  | 'organPresetI.farfVibratoType'
  | 'organPresetI.farfVibrato'
  | 'organPresetI.b3Percussion1'
  | 'organPresetI.b3Percussion2'
  | 'organPresetI.b3Percussion3'
  | 'organPresetI.b3Percussion4'
  | 'organPresetI.mode'
  | 'organPresetII.b3Drawbar1'
  | 'organPresetII.b3Drawbar2'
  | 'organPresetII.b3Drawbar3'
  | 'organPresetII.b3Drawbar4'
  | 'organPresetII.b3Drawbar5'
  | 'organPresetII.b3Drawbar6'
  | 'organPresetII.b3Drawbar7'
  | 'organPresetII.b3Drawbar8'
  | 'organPresetII.b3Drawbar9'
  | 'organPresetII.voxDrawbar1'
  | 'organPresetII.voxDrawbar2'
  | 'organPresetII.voxDrawbar3'
  | 'organPresetII.voxDrawbar4'
  | 'organPresetII.voxDrawbar5'
  | 'organPresetII.voxDrawbar6'
  | 'organPresetII.voxDrawbar7'
  | 'organPresetII.voxDrawbar8'
  | 'organPresetII.voxDrawbar9'
  | 'organPresetII.farfTab1'
  | 'organPresetII.farfTab2'
  | 'organPresetII.farfTab3'
  | 'organPresetII.farfTab4'
  | 'organPresetII.farfTab5'
  | 'organPresetII.farfTab6'
  | 'organPresetII.farfTab7'
  | 'organPresetII.farfTab8'
  | 'organPresetII.farfTab9'
  | 'organPresetII.b3VibratoType'
  | 'organPresetII.b3Flag'
  | 'organPresetII.voxVibrato'
  | 'organPresetII.farfVibratoType'
  | 'organPresetII.farfVibrato'
  | 'organPresetII.b3Percussion1'
  | 'organPresetII.b3Percussion2'
  | 'organPresetII.b3Percussion3'
  | 'organPresetII.b3Percussion4'
  | 'organPresetII.mode'
  | 'piano.type'
  | 'piano.modelGrand'
  | 'piano.modelUpright'
  | 'piano.modelEPiano'
  | 'piano.modelWurl'
  | 'piano.modelClavHps'
  | 'piano.modelSample'
  | 'piano.param7'
  | 'piano.param8'
  | 'piano.param9'
  | 'piano.param10'
  | 'piano.param11'
  | 'piano.param12'
  | 'piano.param13'
  | 'piano.param14'
  | 'piano.param15'
  | 'piano.param16'
  | 'piano.param17'
  | 'piano.param18'
  | 'piano.param19'
  | 'effectsShared.param0'
  | 'effectsShared.param1'
  | 'effectsShared.param2'
  | 'effectsShared.param3'
  | 'effectsShared.param4'
  | 'effectsShared.param5'
  | 'effectsShared.param6'
  | 'effectsShared.param7'
  | 'effectsShared.param8'
  | 'effectsShared.param9'
  | 'effectsShared.param10'
  | 'effectsShared.param11'
  | 'effectsShared.param12'
  | 'effectsShared.param13'
  | 'effectsShared.param14'
  | 'effectsShared.param15'
  | 'effectsShared.param16'
  | 'effectsShared.param17'
  | 'effectsOrgan.param0'
  | 'effectsOrgan.param1'
  | 'effectsOrgan.param2'
  | 'effectsOrgan.param3'
  | 'effectsOrgan.param4'
  | 'effectsPiano.param0'
  | 'effectsPiano.param1'
  | 'effectsPiano.param2'
  | 'effectsPiano.param3'
  | 'effectsPiano.param4';

export const NE3HP_LAYOUT: LegacyLayout<Ne3HpFieldKey> = {
  model: 'Nord Electro 3 HP',
  source: 'Electro 3 HP OS 3.16 parameter containers',
  container: 'Electro 3 HP OS 3.16 record version 101: the Electro 3 record plus 5 parameters in its reserved space',
  recordVersion: 101,
  dataBytes: 108,
  fields: [
    { key: 'common.instrumentSelect', name: 'common.instrumentSelect', id: 0, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · common 0', cc: 13 },
    { key: 'organCommon.organModel', name: 'organCommon.organModel', id: 0, bit: 72, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organCommon 0', cc: 9 },
    { key: 'organCommon.param1', name: 'organCommon.param1', id: 1, bit: 74, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organCommon 1' },
    { key: 'organCommon.param2', name: 'organCommon.param2', id: 2, bit: 75, width: 7, min: 0, max: 127, def: 59, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organCommon 2' },
    { key: 'organCommon.b3Common', name: 'organCommon.b3Common', id: 3, bit: 82, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organCommon 3', cc: 3 },
    { key: 'organCommon.voxCommon', name: 'organCommon.voxCommon', id: 4, bit: 83, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organCommon 4', cc: 3 },
    { key: 'organCommon.farfCommon', name: 'organCommon.farfCommon', id: 5, bit: 84, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organCommon 5', cc: 3 },
    { key: 'organPresetI.b3Drawbar1', name: 'organPresetI.b3Drawbar1', id: 0, bit: 152, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 0' },
    { key: 'organPresetI.b3Drawbar2', name: 'organPresetI.b3Drawbar2', id: 1, bit: 156, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 1' },
    { key: 'organPresetI.b3Drawbar3', name: 'organPresetI.b3Drawbar3', id: 2, bit: 160, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 2' },
    { key: 'organPresetI.b3Drawbar4', name: 'organPresetI.b3Drawbar4', id: 3, bit: 164, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 3' },
    { key: 'organPresetI.b3Drawbar5', name: 'organPresetI.b3Drawbar5', id: 4, bit: 168, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 4' },
    { key: 'organPresetI.b3Drawbar6', name: 'organPresetI.b3Drawbar6', id: 5, bit: 172, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 5' },
    { key: 'organPresetI.b3Drawbar7', name: 'organPresetI.b3Drawbar7', id: 6, bit: 176, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 6' },
    { key: 'organPresetI.b3Drawbar8', name: 'organPresetI.b3Drawbar8', id: 7, bit: 180, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 7' },
    { key: 'organPresetI.b3Drawbar9', name: 'organPresetI.b3Drawbar9', id: 8, bit: 184, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 8' },
    { key: 'organPresetI.voxDrawbar1', name: 'organPresetI.voxDrawbar1', id: 9, bit: 188, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 9' },
    { key: 'organPresetI.voxDrawbar2', name: 'organPresetI.voxDrawbar2', id: 10, bit: 192, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 10' },
    { key: 'organPresetI.voxDrawbar3', name: 'organPresetI.voxDrawbar3', id: 11, bit: 196, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 11' },
    { key: 'organPresetI.voxDrawbar4', name: 'organPresetI.voxDrawbar4', id: 12, bit: 200, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 12' },
    { key: 'organPresetI.voxDrawbar5', name: 'organPresetI.voxDrawbar5', id: 13, bit: 204, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 13' },
    { key: 'organPresetI.voxDrawbar6', name: 'organPresetI.voxDrawbar6', id: 14, bit: 208, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 14' },
    { key: 'organPresetI.voxDrawbar7', name: 'organPresetI.voxDrawbar7', id: 15, bit: 212, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 15' },
    { key: 'organPresetI.voxDrawbar8', name: 'organPresetI.voxDrawbar8', id: 16, bit: 216, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 16' },
    { key: 'organPresetI.voxDrawbar9', name: 'organPresetI.voxDrawbar9', id: 17, bit: 220, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 17' },
    { key: 'organPresetI.farfTab1', name: 'organPresetI.farfTab1', id: 18, bit: 224, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 18' },
    { key: 'organPresetI.farfTab2', name: 'organPresetI.farfTab2', id: 19, bit: 225, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 19' },
    { key: 'organPresetI.farfTab3', name: 'organPresetI.farfTab3', id: 20, bit: 226, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 20' },
    { key: 'organPresetI.farfTab4', name: 'organPresetI.farfTab4', id: 21, bit: 227, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 21' },
    { key: 'organPresetI.farfTab5', name: 'organPresetI.farfTab5', id: 22, bit: 228, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 22' },
    { key: 'organPresetI.farfTab6', name: 'organPresetI.farfTab6', id: 23, bit: 229, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 23' },
    { key: 'organPresetI.farfTab7', name: 'organPresetI.farfTab7', id: 24, bit: 230, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 24' },
    { key: 'organPresetI.farfTab8', name: 'organPresetI.farfTab8', id: 25, bit: 231, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 25' },
    { key: 'organPresetI.farfTab9', name: 'organPresetI.farfTab9', id: 26, bit: 232, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 26' },
    { key: 'organPresetI.b3VibratoType', name: 'organPresetI.b3VibratoType', id: 27, bit: 233, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 27', cc: 84 },
    { key: 'organPresetI.b3Flag', name: 'organPresetI.b3Flag', id: 28, bit: 236, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 28' },
    { key: 'organPresetI.voxVibrato', name: 'organPresetI.voxVibrato', id: 29, bit: 237, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 29', cc: 85 },
    { key: 'organPresetI.farfVibratoType', name: 'organPresetI.farfVibratoType', id: 30, bit: 238, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 30', cc: 84 },
    { key: 'organPresetI.farfVibrato', name: 'organPresetI.farfVibrato', id: 31, bit: 240, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 31', cc: 85 },
    { key: 'organPresetI.b3Percussion1', name: 'organPresetI.b3Percussion1', id: 32, bit: 241, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 32', cc: 88 },
    { key: 'organPresetI.b3Percussion2', name: 'organPresetI.b3Percussion2', id: 33, bit: 242, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 33', cc: 89 },
    { key: 'organPresetI.b3Percussion3', name: 'organPresetI.b3Percussion3', id: 34, bit: 243, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 34', cc: 95 },
    { key: 'organPresetI.b3Percussion4', name: 'organPresetI.b3Percussion4', id: 35, bit: 244, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 35', cc: 87 },
    { key: 'organPresetI.mode', name: 'organPresetI.mode', id: 36, bit: 245, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetI 36' },
    { key: 'organPresetII.b3Drawbar1', name: 'organPresetII.b3Drawbar1', id: 0, bit: 296, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 0' },
    { key: 'organPresetII.b3Drawbar2', name: 'organPresetII.b3Drawbar2', id: 1, bit: 300, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 1' },
    { key: 'organPresetII.b3Drawbar3', name: 'organPresetII.b3Drawbar3', id: 2, bit: 304, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 2' },
    { key: 'organPresetII.b3Drawbar4', name: 'organPresetII.b3Drawbar4', id: 3, bit: 308, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 3' },
    { key: 'organPresetII.b3Drawbar5', name: 'organPresetII.b3Drawbar5', id: 4, bit: 312, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 4' },
    { key: 'organPresetII.b3Drawbar6', name: 'organPresetII.b3Drawbar6', id: 5, bit: 316, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 5' },
    { key: 'organPresetII.b3Drawbar7', name: 'organPresetII.b3Drawbar7', id: 6, bit: 320, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 6' },
    { key: 'organPresetII.b3Drawbar8', name: 'organPresetII.b3Drawbar8', id: 7, bit: 324, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 7' },
    { key: 'organPresetII.b3Drawbar9', name: 'organPresetII.b3Drawbar9', id: 8, bit: 328, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 8' },
    { key: 'organPresetII.voxDrawbar1', name: 'organPresetII.voxDrawbar1', id: 9, bit: 332, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 9' },
    { key: 'organPresetII.voxDrawbar2', name: 'organPresetII.voxDrawbar2', id: 10, bit: 336, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 10' },
    { key: 'organPresetII.voxDrawbar3', name: 'organPresetII.voxDrawbar3', id: 11, bit: 340, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 11' },
    { key: 'organPresetII.voxDrawbar4', name: 'organPresetII.voxDrawbar4', id: 12, bit: 344, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 12' },
    { key: 'organPresetII.voxDrawbar5', name: 'organPresetII.voxDrawbar5', id: 13, bit: 348, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 13' },
    { key: 'organPresetII.voxDrawbar6', name: 'organPresetII.voxDrawbar6', id: 14, bit: 352, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 14' },
    { key: 'organPresetII.voxDrawbar7', name: 'organPresetII.voxDrawbar7', id: 15, bit: 356, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 15' },
    { key: 'organPresetII.voxDrawbar8', name: 'organPresetII.voxDrawbar8', id: 16, bit: 360, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 16' },
    { key: 'organPresetII.voxDrawbar9', name: 'organPresetII.voxDrawbar9', id: 17, bit: 364, width: 4, min: 0, max: 8, def: 8, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 17' },
    { key: 'organPresetII.farfTab1', name: 'organPresetII.farfTab1', id: 18, bit: 368, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 18' },
    { key: 'organPresetII.farfTab2', name: 'organPresetII.farfTab2', id: 19, bit: 369, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 19' },
    { key: 'organPresetII.farfTab3', name: 'organPresetII.farfTab3', id: 20, bit: 370, width: 1, min: 0, max: 1, def: 1, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 20' },
    { key: 'organPresetII.farfTab4', name: 'organPresetII.farfTab4', id: 21, bit: 371, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 21' },
    { key: 'organPresetII.farfTab5', name: 'organPresetII.farfTab5', id: 22, bit: 372, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 22' },
    { key: 'organPresetII.farfTab6', name: 'organPresetII.farfTab6', id: 23, bit: 373, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 23' },
    { key: 'organPresetII.farfTab7', name: 'organPresetII.farfTab7', id: 24, bit: 374, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 24' },
    { key: 'organPresetII.farfTab8', name: 'organPresetII.farfTab8', id: 25, bit: 375, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 25' },
    { key: 'organPresetII.farfTab9', name: 'organPresetII.farfTab9', id: 26, bit: 376, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 26' },
    { key: 'organPresetII.b3VibratoType', name: 'organPresetII.b3VibratoType', id: 27, bit: 377, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 27', cc: 84 },
    { key: 'organPresetII.b3Flag', name: 'organPresetII.b3Flag', id: 28, bit: 380, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 28' },
    { key: 'organPresetII.voxVibrato', name: 'organPresetII.voxVibrato', id: 29, bit: 381, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 29', cc: 85 },
    { key: 'organPresetII.farfVibratoType', name: 'organPresetII.farfVibratoType', id: 30, bit: 382, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 30', cc: 84 },
    { key: 'organPresetII.farfVibrato', name: 'organPresetII.farfVibrato', id: 31, bit: 384, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 31', cc: 85 },
    { key: 'organPresetII.b3Percussion1', name: 'organPresetII.b3Percussion1', id: 32, bit: 385, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 32', cc: 88 },
    { key: 'organPresetII.b3Percussion2', name: 'organPresetII.b3Percussion2', id: 33, bit: 386, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 33', cc: 89 },
    { key: 'organPresetII.b3Percussion3', name: 'organPresetII.b3Percussion3', id: 34, bit: 387, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 34', cc: 95 },
    { key: 'organPresetII.b3Percussion4', name: 'organPresetII.b3Percussion4', id: 35, bit: 388, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 35', cc: 87 },
    { key: 'organPresetII.mode', name: 'organPresetII.mode', id: 36, bit: 389, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · organPresetII 36' },
    { key: 'piano.type', name: 'piano.type', id: 0, bit: 440, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 0', cc: 12 },
    { key: 'piano.modelGrand', name: 'piano.modelGrand', id: 1, bit: 443, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 1', cc: 44 },
    { key: 'piano.modelUpright', name: 'piano.modelUpright', id: 2, bit: 450, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 2', cc: 44 },
    { key: 'piano.modelEPiano', name: 'piano.modelEPiano', id: 3, bit: 457, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 3', cc: 44 },
    { key: 'piano.modelWurl', name: 'piano.modelWurl', id: 4, bit: 464, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 4', cc: 44 },
    { key: 'piano.modelClavHps', name: 'piano.modelClavHps', id: 5, bit: 471, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 5', cc: 44 },
    { key: 'piano.modelSample', name: 'piano.modelSample', id: 6, bit: 478, width: 7, min: 0, max: 49, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 6', cc: 44 },
    { key: 'piano.param7', name: 'piano.param7', id: 7, bit: 485, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 7', cc: 83 },
    { key: 'piano.param8', name: 'piano.param8', id: 8, bit: 486, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 8' },
    { key: 'piano.param9', name: 'piano.param9', id: 9, bit: 488, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 9', cc: 103 },
    { key: 'piano.param10', name: 'piano.param10', id: 10, bit: 489, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 10', cc: 104 },
    { key: 'piano.param11', name: 'piano.param11', id: 11, bit: 490, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 11', cc: 105 },
    { key: 'piano.param12', name: 'piano.param12', id: 12, bit: 491, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 12', cc: 106 },
    { key: 'piano.param13', name: 'piano.param13', id: 13, bit: 492, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 13' },
    { key: 'piano.param14', name: 'piano.param14', id: 14, bit: 493, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 14', cc: 33 },
    { key: 'piano.param15', name: 'piano.param15', id: 15, bit: 495, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 15', cc: 34 },
    { key: 'piano.param16', name: 'piano.param16', id: 16, bit: 497, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 16', cc: 29 },
    { key: 'piano.param17', name: 'piano.param17', id: 17, bit: 500, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 17', cc: 29 },
    { key: 'piano.param18', name: 'piano.param18', id: 18, bit: 503, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 18', cc: 98 },
    { key: 'piano.param19', name: 'piano.param19', id: 19, bit: 505, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · piano 19', cc: 99 },
    { key: 'effectsShared.param0', name: 'effectsShared.param0', id: 0, bit: 552, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 0', cc: 114 },
    { key: 'effectsShared.param1', name: 'effectsShared.param1', id: 1, bit: 559, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 1', cc: 117 },
    { key: 'effectsShared.param2', name: 'effectsShared.param2', id: 2, bit: 566, width: 7, min: 0, max: 127, def: 100, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 2', cc: 116 },
    { key: 'effectsShared.param3', name: 'effectsShared.param3', id: 3, bit: 573, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 3', cc: 113 },
    { key: 'effectsShared.param4', name: 'effectsShared.param4', id: 4, bit: 580, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 4', cc: 63 },
    { key: 'effectsShared.param5', name: 'effectsShared.param5', id: 5, bit: 587, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 5', cc: 60 },
    { key: 'effectsShared.param6', name: 'effectsShared.param6', id: 6, bit: 591, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 6', cc: 62 },
    { key: 'effectsShared.param7', name: 'effectsShared.param7', id: 7, bit: 598, width: 4, min: 0, max: 8, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 7', cc: 61 },
    { key: 'effectsShared.param8', name: 'effectsShared.param8', id: 8, bit: 602, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 8', cc: 111 },
    { key: 'effectsShared.param9', name: 'effectsShared.param9', id: 9, bit: 609, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 9', cc: 81 },
    { key: 'effectsShared.param10', name: 'effectsShared.param10', id: 10, bit: 612, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 10', cc: 102 },
    { key: 'effectsShared.param11', name: 'effectsShared.param11', id: 11, bit: 619, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 11', cc: 96 },
    { key: 'effectsShared.param12', name: 'effectsShared.param12', id: 12, bit: 622, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 12', cc: 7 },
    { key: 'effectsShared.param13', name: 'effectsShared.param13', id: 13, bit: 629, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 13', cc: 79 },
    { key: 'effectsShared.param14', name: 'effectsShared.param14', id: 14, bit: 630, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 14', cc: 82 },
    { key: 'effectsShared.param15', name: 'effectsShared.param15', id: 15, bit: 631, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 15', cc: 94 },
    { key: 'effectsShared.param16', name: 'effectsShared.param16', id: 16, bit: 632, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 16', cc: 93 },
    { key: 'effectsShared.param17', name: 'effectsShared.param17', id: 17, bit: 633, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsShared 17', cc: 92 },
    { key: 'effectsOrgan.param0', name: 'effectsOrgan.param0', id: 0, bit: 688, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsOrgan 0', cc: 115 },
    { key: 'effectsOrgan.param1', name: 'effectsOrgan.param1', id: 1, bit: 689, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsOrgan 1', cc: 69 },
    { key: 'effectsOrgan.param2', name: 'effectsOrgan.param2', id: 2, bit: 690, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsOrgan 2', cc: 80 },
    { key: 'effectsOrgan.param3', name: 'effectsOrgan.param3', id: 3, bit: 691, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsOrgan 3', cc: 86 },
    { key: 'effectsOrgan.param4', name: 'effectsOrgan.param4', id: 4, bit: 692, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsOrgan 4', cc: 97 },
    { key: 'effectsPiano.param0', name: 'effectsPiano.param0', id: 0, bit: 776, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsPiano 0', cc: 115 },
    { key: 'effectsPiano.param1', name: 'effectsPiano.param1', id: 1, bit: 777, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsPiano 1', cc: 69 },
    { key: 'effectsPiano.param2', name: 'effectsPiano.param2', id: 2, bit: 778, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsPiano 2', cc: 80 },
    { key: 'effectsPiano.param3', name: 'effectsPiano.param3', id: 3, bit: 779, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsPiano 3', cc: 86 },
    { key: 'effectsPiano.param4', name: 'effectsPiano.param4', id: 4, bit: 780, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Electro 3 HP OS 3.16 parameter containers · effectsPiano 4', cc: 97 },
  ],
  sets: {
    organPresetI: 'organPreset',
    organPresetII: 'organPreset',
    effectsOrgan: 'effectsSwitches',
    effectsPiano: 'effectsSwitches',
  },
};
