// AUTO-GENERATED (lead-a1) — DO NOT EDIT MANUALLY.
//
// Provenance: Lead A1 OS 1.36 parameter descriptors; Lead A1 OS 1.36 registration, record sizes.
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). `bit` is relative to the record data (file 0x1A).
import type { LegacyLayout } from '../clavia/legacy-record';

export type NlaFieldKey =
  | 'slot.param0'
  | 'slot.param1'
  | 'slot.param2MorphDeltaSrc0'
  | 'slot.param2MorphDeltaSrc1'
  | 'slot.param2'
  | 'slot.param3'
  | 'slot.param4'
  | 'slot.param5MorphDeltaSrc0'
  | 'slot.param5MorphDeltaSrc1'
  | 'slot.param5'
  | 'slot.param6'
  | 'slot.param8MorphDeltaSrc0'
  | 'slot.param8MorphDeltaSrc1'
  | 'slot.param8'
  | 'slot.param9MorphDeltaSrc0'
  | 'slot.param9MorphDeltaSrc1'
  | 'slot.param9'
  | 'slot.param10MorphDeltaSrc0'
  | 'slot.param10MorphDeltaSrc1'
  | 'slot.param10'
  | 'slot.param11'
  | 'slot.param12'
  | 'slot.param13'
  | 'slot.param14'
  | 'slot.param15'
  | 'slot.param16MorphDeltaSrc0'
  | 'slot.param16MorphDeltaSrc1'
  | 'slot.param16'
  | 'slot.param17MorphDeltaSrc0'
  | 'slot.param17MorphDeltaSrc1'
  | 'slot.param17'
  | 'slot.param18MorphDeltaSrc0'
  | 'slot.param18MorphDeltaSrc1'
  | 'slot.param18'
  | 'slot.param21'
  | 'slot.param22MorphDeltaSrc0'
  | 'slot.param22MorphDeltaSrc1'
  | 'slot.param22'
  | 'slot.param23MorphDeltaSrc0'
  | 'slot.param23MorphDeltaSrc1'
  | 'slot.param23'
  | 'slot.param24MorphDeltaSrc0'
  | 'slot.param24MorphDeltaSrc1'
  | 'slot.param24'
  | 'slot.param25'
  | 'slot.param26'
  | 'slot.param27'
  | 'slot.param28MorphDeltaSrc0'
  | 'slot.param28MorphDeltaSrc1'
  | 'slot.param28'
  | 'slot.param29MorphDeltaSrc0'
  | 'slot.param29MorphDeltaSrc1'
  | 'slot.param29'
  | 'slot.param30MorphDeltaSrc0'
  | 'slot.param30MorphDeltaSrc1'
  | 'slot.param30'
  | 'slot.param31MorphDeltaSrc0'
  | 'slot.param31MorphDeltaSrc1'
  | 'slot.param31'
  | 'slot.param32MorphDeltaSrc0'
  | 'slot.param32MorphDeltaSrc1'
  | 'slot.param32'
  | 'slot.param33MorphDeltaSrc0'
  | 'slot.param33MorphDeltaSrc1'
  | 'slot.param33'
  | 'slot.param34'
  | 'slot.param35'
  | 'slot.param36'
  | 'slot.param37'
  | 'slot.param39MorphDeltaSrc0'
  | 'slot.param39MorphDeltaSrc1'
  | 'slot.param39'
  | 'slot.param40'
  | 'slot.param42'
  | 'slot.param43'
  | 'slot.param44'
  | 'fx.param0'
  | 'fx.param1'
  | 'fx.param3MorphDeltaSrc0'
  | 'fx.param3'
  | 'fx.param4'
  | 'fx.param6MorphDeltaSrc0'
  | 'fx.param6'
  | 'fx.param7'
  | 'fx.param9'
  | 'fx.param10'
  | 'fx.param12MorphDeltaSrc0'
  | 'fx.param12'
  | 'fx.param13'
  | 'fx.param14'
  | 'fx.param16MorphDeltaSrc0'
  | 'fx.param16';

export const NLA_LAYOUT: LegacyLayout<NlaFieldKey> = {
  model: 'Nord Lead A1',
  source: 'Lead A1 OS 1.36 parameter descriptors',
  container: 'Lead A1 OS 1.36 registration, record sizes',
  recordVersion: 7,
  dataBytes: 95,
  fields: [
    { key: 'slot.param0', name: 'param 0 (CC 17)', id: 0, bit: 0, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 0', cc: 17 },
    { key: 'slot.param1', name: 'param 1 (CC 15)', id: 1, bit: 3, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 1', cc: 15 },
    { key: 'slot.param2MorphDeltaSrc0', name: 'param 2 (CC 5) morph delta src0', id: 2, bit: 5, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 2', cc: 5, deltaOf: 'slot.param2' },
    { key: 'slot.param2MorphDeltaSrc1', name: 'param 2 (CC 5) morph delta src1', id: 2, bit: 13, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 2', cc: 5, deltaOf: 'slot.param2' },
    { key: 'slot.param2', name: 'param 2 (CC 5)', id: 2, bit: 21, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 2', cc: 5 },
    { key: 'slot.param3', name: 'param 3 (CC 56)', id: 3, bit: 28, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 3', cc: 56 },
    { key: 'slot.param4', name: 'param 4 (CC 20)', id: 4, bit: 30, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 4', cc: 20 },
    { key: 'slot.param5MorphDeltaSrc0', name: 'param 5 (CC 19) morph delta src0', id: 5, bit: 33, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 5', cc: 19, deltaOf: 'slot.param5' },
    { key: 'slot.param5MorphDeltaSrc1', name: 'param 5 (CC 19) morph delta src1', id: 5, bit: 41, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 5', cc: 19, deltaOf: 'slot.param5' },
    { key: 'slot.param5', name: 'param 5 (CC 19)', id: 5, bit: 49, width: 7, min: 0, max: 127, def: 50, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 5', cc: 19 },
    { key: 'slot.param6', name: 'param 6 (CC 2)', id: 6, bit: 56, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 6', cc: 2 },
    { key: 'slot.param8MorphDeltaSrc0', name: 'param 8 (CC 26) morph delta src0', id: 8, bit: 74, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 8', cc: 26, deltaOf: 'slot.param8' },
    { key: 'slot.param8MorphDeltaSrc1', name: 'param 8 (CC 26) morph delta src1', id: 8, bit: 82, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 8', cc: 26, deltaOf: 'slot.param8' },
    { key: 'slot.param8', name: 'param 8 (CC 26)', id: 8, bit: 90, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 8', cc: 26 },
    { key: 'slot.param9MorphDeltaSrc0', name: 'param 9 (CC 27) morph delta src0', id: 9, bit: 97, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 9', cc: 27, deltaOf: 'slot.param9' },
    { key: 'slot.param9MorphDeltaSrc1', name: 'param 9 (CC 27) morph delta src1', id: 9, bit: 105, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 9', cc: 27, deltaOf: 'slot.param9' },
    { key: 'slot.param9', name: 'param 9 (CC 27)', id: 9, bit: 113, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 9', cc: 27 },
    { key: 'slot.param10MorphDeltaSrc0', name: 'param 10 (CC 28) morph delta src0', id: 10, bit: 120, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 10', cc: 28, deltaOf: 'slot.param10' },
    { key: 'slot.param10MorphDeltaSrc1', name: 'param 10 (CC 28) morph delta src1', id: 10, bit: 128, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 10', cc: 28, deltaOf: 'slot.param10' },
    { key: 'slot.param10', name: 'param 10 (CC 28)', id: 10, bit: 136, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 10', cc: 28 },
    { key: 'slot.param11', name: 'param 11 (CC 29)', id: 11, bit: 143, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 11', cc: 29 },
    { key: 'slot.param12', name: 'param 12 (CC 38)', id: 12, bit: 144, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 12', cc: 38 },
    { key: 'slot.param13', name: 'param 13 (no CC)', id: 13, bit: 145, width: 3, min: 0, max: 6, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 13' },
    { key: 'slot.param14', name: 'param 14 (CC 33)', id: 14, bit: 148, width: 7, min: 0, max: 102, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 14', cc: 33 },
    { key: 'slot.param15', name: 'param 15 (CC 30)', id: 15, bit: 155, width: 7, min: 0, max: 127, def: 2, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 15', cc: 30 },
    { key: 'slot.param16MorphDeltaSrc0', name: 'param 16 (CC 68) morph delta src0', id: 16, bit: 162, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 16', cc: 68, deltaOf: 'slot.param16' },
    { key: 'slot.param16MorphDeltaSrc1', name: 'param 16 (CC 68) morph delta src1', id: 16, bit: 170, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 16', cc: 68, deltaOf: 'slot.param16' },
    { key: 'slot.param16', name: 'param 16 (CC 68)', id: 16, bit: 178, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 16', cc: 68 },
    { key: 'slot.param17MorphDeltaSrc0', name: 'param 17 (CC 69) morph delta src0', id: 17, bit: 185, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 17', cc: 69, deltaOf: 'slot.param17' },
    { key: 'slot.param17MorphDeltaSrc1', name: 'param 17 (CC 69) morph delta src1', id: 17, bit: 193, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 17', cc: 69, deltaOf: 'slot.param17' },
    { key: 'slot.param17', name: 'param 17 (CC 69)', id: 17, bit: 201, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 17', cc: 69 },
    { key: 'slot.param18MorphDeltaSrc0', name: 'param 18 (CC 31) morph delta src0', id: 18, bit: 208, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 18', cc: 31, deltaOf: 'slot.param18' },
    { key: 'slot.param18MorphDeltaSrc1', name: 'param 18 (CC 31) morph delta src1', id: 18, bit: 216, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 18', cc: 31, deltaOf: 'slot.param18' },
    { key: 'slot.param18', name: 'param 18 (CC 31)', id: 18, bit: 224, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 18', cc: 31 },
    { key: 'slot.param21', name: 'param 21 (CC 34)', id: 21, bit: 254, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 21', cc: 34 },
    { key: 'slot.param22MorphDeltaSrc0', name: 'param 22 (CC 73) morph delta src0', id: 22, bit: 255, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 22', cc: 73, deltaOf: 'slot.param22' },
    { key: 'slot.param22MorphDeltaSrc1', name: 'param 22 (CC 73) morph delta src1', id: 22, bit: 263, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 22', cc: 73, deltaOf: 'slot.param22' },
    { key: 'slot.param22', name: 'param 22 (CC 73)', id: 22, bit: 271, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 22', cc: 73 },
    { key: 'slot.param23MorphDeltaSrc0', name: 'param 23 (CC 36) morph delta src0', id: 23, bit: 278, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 23', cc: 36, deltaOf: 'slot.param23' },
    { key: 'slot.param23MorphDeltaSrc1', name: 'param 23 (CC 36) morph delta src1', id: 23, bit: 286, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 23', cc: 36, deltaOf: 'slot.param23' },
    { key: 'slot.param23', name: 'param 23 (CC 36)', id: 23, bit: 294, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 23', cc: 36 },
    { key: 'slot.param24MorphDeltaSrc0', name: 'param 24 (CC 72) morph delta src0', id: 24, bit: 301, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 24', cc: 72, deltaOf: 'slot.param24' },
    { key: 'slot.param24MorphDeltaSrc1', name: 'param 24 (CC 72) morph delta src1', id: 24, bit: 309, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 24', cc: 72, deltaOf: 'slot.param24' },
    { key: 'slot.param24', name: 'param 24 (CC 72)', id: 24, bit: 317, width: 7, min: 0, max: 127, def: 5, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 24', cc: 72 },
    { key: 'slot.param25', name: 'param 25 (CC 35)', id: 25, bit: 324, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 25', cc: 35 },
    { key: 'slot.param26', name: 'param 26 (CC 44)', id: 26, bit: 325, width: 3, min: 0, max: 5, def: 1, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 26', cc: 44 },
    { key: 'slot.param27', name: 'param 27 (CC 46)', id: 27, bit: 328, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 27', cc: 46 },
    { key: 'slot.param28MorphDeltaSrc0', name: 'param 28 (CC 74) morph delta src0', id: 28, bit: 330, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 28', cc: 74, deltaOf: 'slot.param28' },
    { key: 'slot.param28MorphDeltaSrc1', name: 'param 28 (CC 74) morph delta src1', id: 28, bit: 338, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 28', cc: 74, deltaOf: 'slot.param28' },
    { key: 'slot.param28', name: 'param 28 (CC 74)', id: 28, bit: 346, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 28', cc: 74 },
    { key: 'slot.param29MorphDeltaSrc0', name: 'param 29 (CC 42) morph delta src0', id: 29, bit: 353, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 29', cc: 42, deltaOf: 'slot.param29' },
    { key: 'slot.param29MorphDeltaSrc1', name: 'param 29 (CC 42) morph delta src1', id: 29, bit: 361, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 29', cc: 42, deltaOf: 'slot.param29' },
    { key: 'slot.param29', name: 'param 29 (CC 42)', id: 29, bit: 369, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 29', cc: 42 },
    { key: 'slot.param30MorphDeltaSrc0', name: 'param 30 (CC 47) morph delta src0', id: 30, bit: 376, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 30', cc: 47, deltaOf: 'slot.param30' },
    { key: 'slot.param30MorphDeltaSrc1', name: 'param 30 (CC 47) morph delta src1', id: 30, bit: 384, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 30', cc: 47, deltaOf: 'slot.param30' },
    { key: 'slot.param30', name: 'param 30 (CC 47)', id: 30, bit: 392, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 30', cc: 47 },
    { key: 'slot.param31MorphDeltaSrc0', name: 'param 31 (CC 48) morph delta src0', id: 31, bit: 399, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 31', cc: 48, deltaOf: 'slot.param31' },
    { key: 'slot.param31MorphDeltaSrc1', name: 'param 31 (CC 48) morph delta src1', id: 31, bit: 407, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 31', cc: 48, deltaOf: 'slot.param31' },
    { key: 'slot.param31', name: 'param 31 (CC 48)', id: 31, bit: 415, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 31', cc: 48 },
    { key: 'slot.param32MorphDeltaSrc0', name: 'param 32 (CC 43) morph delta src0', id: 32, bit: 422, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 32', cc: 43, deltaOf: 'slot.param32' },
    { key: 'slot.param32MorphDeltaSrc1', name: 'param 32 (CC 43) morph delta src1', id: 32, bit: 430, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 32', cc: 43, deltaOf: 'slot.param32' },
    { key: 'slot.param32', name: 'param 32 (CC 43)', id: 32, bit: 438, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 32', cc: 43 },
    { key: 'slot.param33MorphDeltaSrc0', name: 'param 33 (CC 71) morph delta src0', id: 33, bit: 445, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 33', cc: 71, deltaOf: 'slot.param33' },
    { key: 'slot.param33MorphDeltaSrc1', name: 'param 33 (CC 71) morph delta src1', id: 33, bit: 453, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 33', cc: 71, deltaOf: 'slot.param33' },
    { key: 'slot.param33', name: 'param 33 (CC 71)', id: 33, bit: 461, width: 7, min: 0, max: 127, def: 85, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 33', cc: 71 },
    { key: 'slot.param34', name: 'param 34 (CC 16)', id: 34, bit: 468, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 34', cc: 16 },
    { key: 'slot.param35', name: 'param 35 (CC 90)', id: 35, bit: 470, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 35', cc: 90 },
    { key: 'slot.param36', name: 'param 36 (CC 88)', id: 36, bit: 471, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 36', cc: 88 },
    { key: 'slot.param37', name: 'param 37 (CC 89)', id: 37, bit: 473, width: 3, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 37', cc: 89 },
    { key: 'slot.param39MorphDeltaSrc0', name: 'param 39 (CC 9) morph delta src0', id: 39, bit: 477, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 39', cc: 9, deltaOf: 'slot.param39' },
    { key: 'slot.param39MorphDeltaSrc1', name: 'param 39 (CC 9) morph delta src1', id: 39, bit: 485, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 39', cc: 9, deltaOf: 'slot.param39' },
    { key: 'slot.param39', name: 'param 39 (CC 9)', id: 39, bit: 493, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 39', cc: 9 },
    { key: 'slot.param40', name: 'param 40 (CC 86)', id: 40, bit: 500, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 40', cc: 86 },
    { key: 'slot.param42', name: 'param 42 (CC 54)', id: 42, bit: 512, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 42', cc: 54 },
    { key: 'slot.param43', name: 'param 43 (CC 118)', id: 43, bit: 513, width: 4, min: 0, max: 12, def: 2, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 43', cc: 118 },
    { key: 'slot.param44', name: 'param 44 (CC 10)', id: 44, bit: 517, width: 7, min: 0, max: 120, def: 60, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot 44', cc: 10 },
    { key: 'fx.param0', name: 'param 0 (CC 52)', id: 0, bit: 592, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 0', cc: 52 },
    { key: 'fx.param1', name: 'param 1 (CC 53)', id: 1, bit: 593, width: 3, min: 0, max: 5, def: 3, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 1', cc: 53 },
    { key: 'fx.param3MorphDeltaSrc0', name: 'param 3 (CC 55) morph delta src0', id: 3, bit: 604, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 3', cc: 55, deltaOf: 'fx.param3' },
    { key: 'fx.param3', name: 'param 3 (CC 55)', id: 3, bit: 612, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 3', cc: 55 },
    { key: 'fx.param4', name: 'param 4 (CC 99)', id: 4, bit: 619, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 4', cc: 99 },
    { key: 'fx.param6MorphDeltaSrc0', name: 'param 6 (CC 78) morph delta src0', id: 6, bit: 635, width: 15, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 6', cc: 78, deltaOf: 'fx.param6' },
    { key: 'fx.param6', name: 'param 6 (CC 78)', id: 6, bit: 650, width: 14, min: 0, max: 127, def: 50, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 6', cc: 78 },
    { key: 'fx.param7', name: 'param 7 (CC 51)', id: 7, bit: 664, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 7', cc: 51 },
    { key: 'fx.param9', name: 'param 9 (CC 79)', id: 9, bit: 676, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 9', cc: 79 },
    { key: 'fx.param10', name: 'param 10 (CC 100)', id: 10, bit: 678, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 10', cc: 100 },
    { key: 'fx.param12MorphDeltaSrc0', name: 'param 12 (CC 76) morph delta src0', id: 12, bit: 687, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 12', cc: 76, deltaOf: 'fx.param12' },
    { key: 'fx.param12', name: 'param 12 (CC 76)', id: 12, bit: 695, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 12', cc: 76 },
    { key: 'fx.param13', name: 'param 13 (CC 97)', id: 13, bit: 702, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 13', cc: 97 },
    { key: 'fx.param14', name: 'param 14 (CC 96)', id: 14, bit: 703, width: 3, min: 0, max: 4, def: 1, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 14', cc: 96 },
    { key: 'fx.param16MorphDeltaSrc0', name: 'param 16 (CC 98) morph delta src0', id: 16, bit: 714, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 16', cc: 98, deltaOf: 'fx.param16' },
    { key: 'fx.param16', name: 'param 16 (CC 98)', id: 16, bit: 722, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Slot FX 16', cc: 98 },
  ],
};

export type NlaPerfFieldKey =
  | 'perf.param0'
  | 'perf.param1'
  | 'perf.param2'
  | 'perf.param3'
  | 'perf.param4'
  | 'perf.param5'
  | 'perf.param7'
  | 'perf.param8'
  | 'perf.param9';

export const NLA_PERF_LAYOUT: LegacyLayout<NlaPerfFieldKey> = {
  model: 'Nord Lead A1',
  source: 'Lead A1 OS 1.36 parameter descriptors',
  container: 'Lead A1 OS 1.36 registration, record sizes',
  recordVersion: 7,
  dataBytes: 7,
  fields: [
    { key: 'perf.param0', name: 'param 0 (CC 119)', id: 0, bit: 0, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Performance common 0', cc: 119 },
    { key: 'perf.param1', name: 'param 1 (CC 115)', id: 1, bit: 2, width: 4, min: 0, max: 15, def: 1, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Performance common 1', cc: 115 },
    { key: 'perf.param2', name: 'param 2 (no CC)', id: 2, bit: 6, width: 9, min: 0, max: 270, def: 90, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Performance common 2' },
    { key: 'perf.param3', name: 'param 3 (no CC)', id: 3, bit: 15, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Performance common 3' },
    { key: 'perf.param4', name: 'param 4 (no CC)', id: 4, bit: 16, width: 7, min: 0, max: 127, def: 60, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Performance common 4' },
    { key: 'perf.param5', name: 'param 5 (CC 58)', id: 5, bit: 23, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Performance common 5', cc: 58 },
    { key: 'perf.param7', name: 'param 7 (no CC)', id: 7, bit: 24, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Performance common 7' },
    { key: 'perf.param8', name: 'param 8 (no CC)', id: 8, bit: 25, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Performance common 8' },
    { key: 'perf.param9', name: 'param 9 (no CC)', id: 9, bit: 28, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Lead A1 OS 1.36 parameter descriptors · Performance common 9' },
  ],
};
