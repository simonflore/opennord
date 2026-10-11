// AUTO-GENERATED (wave) — DO NOT EDIT MANUALLY.
//
// Provenance: Wave OS 2.14 parameter containers; Wave OS 2.14 record write / read, versions 6-8.
// Knowledge only —
// parameter names, bit positions, ranges and defaults; no firmware bytes or
// tables (docs/LEGAL.md). `bit` is relative to the record data (file 0x19).
import type { LegacyLayout } from '../clavia/legacy-record';

export type Nw1FieldKey =
  | 'global.param0'
  | 'global.param1'
  | 'global.param2'
  | 'global.param3'
  | 'global.param4'
  | 'global.param5'
  | 'global.param6'
  | 'global.param7'
  | 'slotA.param0'
  | 'slotA.param1'
  | 'slotA.param2'
  | 'slotA.param3'
  | 'slotA.param4'
  | 'slotA.param5'
  | 'slotA.param6'
  | 'slotA.param7MorphDeltaSrc0'
  | 'slotA.param7MorphDeltaSrc5'
  | 'slotA.param7MorphDeltaSrc6'
  | 'slotA.param7'
  | 'slotA.param8MorphDeltaSrc0'
  | 'slotA.param8MorphDeltaSrc5'
  | 'slotA.param8MorphDeltaSrc6'
  | 'slotA.param8'
  | 'slotA.param9'
  | 'slotA.param10'
  | 'slotA.param11'
  | 'slotA.param12MorphDeltaSrc0'
  | 'slotA.param12MorphDeltaSrc5'
  | 'slotA.param12MorphDeltaSrc6'
  | 'slotA.param12'
  | 'slotA.param13MorphDeltaSrc0'
  | 'slotA.param13MorphDeltaSrc5'
  | 'slotA.param13MorphDeltaSrc6'
  | 'slotA.param13'
  | 'slotA.param14MorphDeltaSrc0'
  | 'slotA.param14MorphDeltaSrc5'
  | 'slotA.param14MorphDeltaSrc6'
  | 'slotA.param14'
  | 'slotA.param15MorphDeltaSrc0'
  | 'slotA.param15MorphDeltaSrc5'
  | 'slotA.param15MorphDeltaSrc6'
  | 'slotA.param15'
  | 'slotA.param16MorphDeltaSrc0'
  | 'slotA.param16MorphDeltaSrc5'
  | 'slotA.param16MorphDeltaSrc6'
  | 'slotA.param16'
  | 'slotA.param17'
  | 'slotA.param18'
  | 'slotA.param19'
  | 'slotA.param20'
  | 'slotA.param21'
  | 'slotA.param22'
  | 'slotA.param23MorphDeltaSrc0'
  | 'slotA.param23MorphDeltaSrc5'
  | 'slotA.param23MorphDeltaSrc6'
  | 'slotA.param23'
  | 'slotA.param24'
  | 'slotA.param25'
  | 'slotA.param26'
  | 'slotA.param27'
  | 'slotA.param28'
  | 'slotA.param29MorphDeltaSrc0'
  | 'slotA.param29MorphDeltaSrc5'
  | 'slotA.param29MorphDeltaSrc6'
  | 'slotA.param29'
  | 'slotA.param30MorphDeltaSrc0'
  | 'slotA.param30MorphDeltaSrc5'
  | 'slotA.param30MorphDeltaSrc6'
  | 'slotA.param30'
  | 'slotA.param31MorphDeltaSrc0'
  | 'slotA.param31MorphDeltaSrc5'
  | 'slotA.param31MorphDeltaSrc6'
  | 'slotA.param31'
  | 'slotA.param32MorphDeltaSrc0'
  | 'slotA.param32MorphDeltaSrc5'
  | 'slotA.param32MorphDeltaSrc6'
  | 'slotA.param32'
  | 'slotA.param33'
  | 'slotA.param34'
  | 'slotA.param35MorphDeltaSrc0'
  | 'slotA.param35MorphDeltaSrc5'
  | 'slotA.param35MorphDeltaSrc6'
  | 'slotA.param35'
  | 'slotA.param36MorphDeltaSrc0'
  | 'slotA.param36MorphDeltaSrc5'
  | 'slotA.param36MorphDeltaSrc6'
  | 'slotA.param36'
  | 'slotA.param37MorphDeltaSrc0'
  | 'slotA.param37MorphDeltaSrc5'
  | 'slotA.param37MorphDeltaSrc6'
  | 'slotA.param37'
  | 'slotA.param38MorphDeltaSrc0'
  | 'slotA.param38MorphDeltaSrc5'
  | 'slotA.param38MorphDeltaSrc6'
  | 'slotA.param38'
  | 'slotA.param39MorphDeltaSrc0'
  | 'slotA.param39MorphDeltaSrc5'
  | 'slotA.param39MorphDeltaSrc6'
  | 'slotA.param39'
  | 'slotA.param40MorphDeltaSrc0'
  | 'slotA.param40MorphDeltaSrc5'
  | 'slotA.param40MorphDeltaSrc6'
  | 'slotA.param40'
  | 'slotA.param41MorphDeltaSrc0'
  | 'slotA.param41MorphDeltaSrc5'
  | 'slotA.param41MorphDeltaSrc6'
  | 'slotA.param41'
  | 'slotA.param42MorphDeltaSrc0'
  | 'slotA.param42MorphDeltaSrc5'
  | 'slotA.param42MorphDeltaSrc6'
  | 'slotA.param42'
  | 'slotA.param43MorphDeltaSrc0'
  | 'slotA.param43MorphDeltaSrc5'
  | 'slotA.param43MorphDeltaSrc6'
  | 'slotA.param43'
  | 'slotA.param44MorphDeltaSrc0'
  | 'slotA.param44MorphDeltaSrc5'
  | 'slotA.param44MorphDeltaSrc6'
  | 'slotA.param44'
  | 'slotA.param45'
  | 'slotA.param46'
  | 'slotA.param47'
  | 'slotA.param48'
  | 'slotA.param49MorphDeltaSrc0'
  | 'slotA.param49MorphDeltaSrc5'
  | 'slotA.param49MorphDeltaSrc6'
  | 'slotA.param49'
  | 'slotA.param50MorphDeltaSrc0'
  | 'slotA.param50MorphDeltaSrc5'
  | 'slotA.param50MorphDeltaSrc6'
  | 'slotA.param50'
  | 'slotA.param51MorphDeltaSrc0'
  | 'slotA.param51MorphDeltaSrc5'
  | 'slotA.param51MorphDeltaSrc6'
  | 'slotA.param51'
  | 'slotA.param52MorphDeltaSrc0'
  | 'slotA.param52MorphDeltaSrc5'
  | 'slotA.param52MorphDeltaSrc6'
  | 'slotA.param52'
  | 'slotA.param53'
  | 'slotA.param54'
  | 'slotA.param55'
  | 'slotB.param0'
  | 'slotB.param1'
  | 'slotB.param2'
  | 'slotB.param3'
  | 'slotB.param4'
  | 'slotB.param5'
  | 'slotB.param6'
  | 'slotB.param7MorphDeltaSrc0'
  | 'slotB.param7MorphDeltaSrc5'
  | 'slotB.param7MorphDeltaSrc6'
  | 'slotB.param7'
  | 'slotB.param8MorphDeltaSrc0'
  | 'slotB.param8MorphDeltaSrc5'
  | 'slotB.param8MorphDeltaSrc6'
  | 'slotB.param8'
  | 'slotB.param9'
  | 'slotB.param10'
  | 'slotB.param11'
  | 'slotB.param12MorphDeltaSrc0'
  | 'slotB.param12MorphDeltaSrc5'
  | 'slotB.param12MorphDeltaSrc6'
  | 'slotB.param12'
  | 'slotB.param13MorphDeltaSrc0'
  | 'slotB.param13MorphDeltaSrc5'
  | 'slotB.param13MorphDeltaSrc6'
  | 'slotB.param13'
  | 'slotB.param14MorphDeltaSrc0'
  | 'slotB.param14MorphDeltaSrc5'
  | 'slotB.param14MorphDeltaSrc6'
  | 'slotB.param14'
  | 'slotB.param15MorphDeltaSrc0'
  | 'slotB.param15MorphDeltaSrc5'
  | 'slotB.param15MorphDeltaSrc6'
  | 'slotB.param15'
  | 'slotB.param16MorphDeltaSrc0'
  | 'slotB.param16MorphDeltaSrc5'
  | 'slotB.param16MorphDeltaSrc6'
  | 'slotB.param16'
  | 'slotB.param17'
  | 'slotB.param18'
  | 'slotB.param19'
  | 'slotB.param20'
  | 'slotB.param21'
  | 'slotB.param22'
  | 'slotB.param23MorphDeltaSrc0'
  | 'slotB.param23MorphDeltaSrc5'
  | 'slotB.param23MorphDeltaSrc6'
  | 'slotB.param23'
  | 'slotB.param24'
  | 'slotB.param25'
  | 'slotB.param26'
  | 'slotB.param27'
  | 'slotB.param28'
  | 'slotB.param29MorphDeltaSrc0'
  | 'slotB.param29MorphDeltaSrc5'
  | 'slotB.param29MorphDeltaSrc6'
  | 'slotB.param29'
  | 'slotB.param30MorphDeltaSrc0'
  | 'slotB.param30MorphDeltaSrc5'
  | 'slotB.param30MorphDeltaSrc6'
  | 'slotB.param30'
  | 'slotB.param31MorphDeltaSrc0'
  | 'slotB.param31MorphDeltaSrc5'
  | 'slotB.param31MorphDeltaSrc6'
  | 'slotB.param31'
  | 'slotB.param32MorphDeltaSrc0'
  | 'slotB.param32MorphDeltaSrc5'
  | 'slotB.param32MorphDeltaSrc6'
  | 'slotB.param32'
  | 'slotB.param33'
  | 'slotB.param34'
  | 'slotB.param35MorphDeltaSrc0'
  | 'slotB.param35MorphDeltaSrc5'
  | 'slotB.param35MorphDeltaSrc6'
  | 'slotB.param35'
  | 'slotB.param36MorphDeltaSrc0'
  | 'slotB.param36MorphDeltaSrc5'
  | 'slotB.param36MorphDeltaSrc6'
  | 'slotB.param36'
  | 'slotB.param37MorphDeltaSrc0'
  | 'slotB.param37MorphDeltaSrc5'
  | 'slotB.param37MorphDeltaSrc6'
  | 'slotB.param37'
  | 'slotB.param38MorphDeltaSrc0'
  | 'slotB.param38MorphDeltaSrc5'
  | 'slotB.param38MorphDeltaSrc6'
  | 'slotB.param38'
  | 'slotB.param39MorphDeltaSrc0'
  | 'slotB.param39MorphDeltaSrc5'
  | 'slotB.param39MorphDeltaSrc6'
  | 'slotB.param39'
  | 'slotB.param40MorphDeltaSrc0'
  | 'slotB.param40MorphDeltaSrc5'
  | 'slotB.param40MorphDeltaSrc6'
  | 'slotB.param40'
  | 'slotB.param41MorphDeltaSrc0'
  | 'slotB.param41MorphDeltaSrc5'
  | 'slotB.param41MorphDeltaSrc6'
  | 'slotB.param41'
  | 'slotB.param42MorphDeltaSrc0'
  | 'slotB.param42MorphDeltaSrc5'
  | 'slotB.param42MorphDeltaSrc6'
  | 'slotB.param42'
  | 'slotB.param43MorphDeltaSrc0'
  | 'slotB.param43MorphDeltaSrc5'
  | 'slotB.param43MorphDeltaSrc6'
  | 'slotB.param43'
  | 'slotB.param44MorphDeltaSrc0'
  | 'slotB.param44MorphDeltaSrc5'
  | 'slotB.param44MorphDeltaSrc6'
  | 'slotB.param44'
  | 'slotB.param45'
  | 'slotB.param46'
  | 'slotB.param47'
  | 'slotB.param48'
  | 'slotB.param49MorphDeltaSrc0'
  | 'slotB.param49MorphDeltaSrc5'
  | 'slotB.param49MorphDeltaSrc6'
  | 'slotB.param49'
  | 'slotB.param50MorphDeltaSrc0'
  | 'slotB.param50MorphDeltaSrc5'
  | 'slotB.param50MorphDeltaSrc6'
  | 'slotB.param50'
  | 'slotB.param51MorphDeltaSrc0'
  | 'slotB.param51MorphDeltaSrc5'
  | 'slotB.param51MorphDeltaSrc6'
  | 'slotB.param51'
  | 'slotB.param52MorphDeltaSrc0'
  | 'slotB.param52MorphDeltaSrc5'
  | 'slotB.param52MorphDeltaSrc6'
  | 'slotB.param52'
  | 'slotB.param53'
  | 'slotB.param54'
  | 'slotB.param55'
  | 'common.param0'
  | 'common.param1'
  | 'common.param2'
  | 'common.param3'
  | 'common.param4'
  | 'common.param5MorphDeltaSrc0'
  | 'common.param5MorphDeltaSrc5'
  | 'common.param5MorphDeltaSrc6'
  | 'common.param5'
  | 'common.param6'
  | 'common.param7'
  | 'common.param8'
  | 'common.param9';

export const NW1_LAYOUT: LegacyLayout<Nw1FieldKey> = {
  model: 'Nord Wave',
  source: 'Wave OS 2.14 parameter containers',
  container: 'Wave OS 2.14 record write / read, versions 6-8',
  recordVersion: 8,
  versionBytes: 1,
  dataBytes: 321,
  padBytes: 2,
  fields: [
    { key: 'global.param0', name: 'global.param0', id: 0, bit: 0, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · global 0', cc: 119 },
    { key: 'global.param1', name: 'global.param1', id: 1, bit: 1, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · global 1', cc: 115 },
    { key: 'global.param2', name: 'global.param2', id: 2, bit: 2, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · global 2', cc: 112 },
    { key: 'global.param3', name: 'global.param3', id: 3, bit: 3, width: 12, min: 0, max: 4095, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · global 3' },
    { key: 'global.param4', name: 'global.param4', id: 4, bit: 15, width: 12, min: 0, max: 4095, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · global 4' },
    { key: 'global.param5', name: 'global.param5', id: 5, bit: 27, width: 12, min: 0, max: 4095, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · global 5' },
    { key: 'global.param6', name: 'global.param6', id: 6, bit: 39, width: 12, min: 0, max: 4095, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · global 6' },
    { key: 'global.param7', name: 'global.param7', id: 7, bit: 51, width: 7, min: 0, max: 100, def: 40, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · global 7' },
    { key: 'slotA.param0', name: 'Octave Shift', id: 0, bit: 156, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 0', cc: 17 },
    { key: 'slotA.param1', name: 'Mono Mode', id: 1, bit: 159, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 1', cc: 15 },
    { key: 'slotA.param2', name: 'Glide', id: 2, bit: 161, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 2', cc: 5 },
    { key: 'slotA.param3', name: 'Vibrato Mode', id: 3, bit: 168, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 3', cc: 56 },
    { key: 'slotA.param4', name: 'LFO 1 Waveform', id: 4, bit: 171, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 4', cc: 20 },
    { key: 'slotA.param5', name: 'LFO 1 Dest', id: 5, bit: 174, width: 4, min: 0, max: 13, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 5', cc: 21 },
    { key: 'slotA.param6', name: 'LFO 1 Polyphonic', id: 6, bit: 178, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 6', cc: 83 },
    { key: 'slotA.param7MorphDeltaSrc0', name: 'LFO 1 Rate morph delta src0', id: 7, bit: 179, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 7 · morph src0', deltaOf: 'slotA.param7' },
    { key: 'slotA.param7MorphDeltaSrc5', name: 'LFO 1 Rate morph delta src5', id: 7, bit: 187, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 7 · morph src5', deltaOf: 'slotA.param7' },
    { key: 'slotA.param7MorphDeltaSrc6', name: 'LFO 1 Rate morph delta src6', id: 7, bit: 195, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 7 · morph src6', deltaOf: 'slotA.param7' },
    { key: 'slotA.param7', name: 'LFO 1 Rate', id: 7, bit: 203, width: 7, min: 0, max: 127, def: 46, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 7', cc: 19 },
    { key: 'slotA.param8MorphDeltaSrc0', name: 'LFO 1 Amount morph delta src0', id: 8, bit: 210, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 8 · morph src0', deltaOf: 'slotA.param8' },
    { key: 'slotA.param8MorphDeltaSrc5', name: 'LFO 1 Amount morph delta src5', id: 8, bit: 218, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 8 · morph src5', deltaOf: 'slotA.param8' },
    { key: 'slotA.param8MorphDeltaSrc6', name: 'LFO 1 Amount morph delta src6', id: 8, bit: 226, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 8 · morph src6', deltaOf: 'slotA.param8' },
    { key: 'slotA.param8', name: 'LFO 1 Amount', id: 8, bit: 234, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 8', cc: 22 },
    { key: 'slotA.param9', name: 'LFO 2 Waveform', id: 9, bit: 241, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 9', cc: 85 },
    { key: 'slotA.param10', name: 'LFO 2 Dest', id: 10, bit: 244, width: 4, min: 0, max: 13, def: 1, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 10', cc: 24 },
    { key: 'slotA.param11', name: 'LFO 2 Single Mode', id: 11, bit: 248, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 11', cc: 87 },
    { key: 'slotA.param12MorphDeltaSrc0', name: 'LFO 2 Rate morph delta src0', id: 12, bit: 249, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 12 · morph src0', deltaOf: 'slotA.param12' },
    { key: 'slotA.param12MorphDeltaSrc5', name: 'LFO 2 Rate morph delta src5', id: 12, bit: 257, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 12 · morph src5', deltaOf: 'slotA.param12' },
    { key: 'slotA.param12MorphDeltaSrc6', name: 'LFO 2 Rate morph delta src6', id: 12, bit: 265, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 12 · morph src6', deltaOf: 'slotA.param12' },
    { key: 'slotA.param12', name: 'LFO 2 Rate', id: 12, bit: 273, width: 7, min: 0, max: 127, def: 46, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 12', cc: 23 },
    { key: 'slotA.param13MorphDeltaSrc0', name: 'LFO 2 Amount morph delta src0', id: 13, bit: 280, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 13 · morph src0', deltaOf: 'slotA.param13' },
    { key: 'slotA.param13MorphDeltaSrc5', name: 'LFO 2 Amount morph delta src5', id: 13, bit: 288, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 13 · morph src5', deltaOf: 'slotA.param13' },
    { key: 'slotA.param13MorphDeltaSrc6', name: 'LFO 2 Amount morph delta src6', id: 13, bit: 296, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 13 · morph src6', deltaOf: 'slotA.param13' },
    { key: 'slotA.param13', name: 'LFO 2 Amount', id: 13, bit: 304, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 13', cc: 25 },
    { key: 'slotA.param14MorphDeltaSrc0', name: 'Mod Envelope Attack morph delta src0', id: 14, bit: 311, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 14 · morph src0', deltaOf: 'slotA.param14' },
    { key: 'slotA.param14MorphDeltaSrc5', name: 'Mod Envelope Attack morph delta src5', id: 14, bit: 319, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 14 · morph src5', deltaOf: 'slotA.param14' },
    { key: 'slotA.param14MorphDeltaSrc6', name: 'Mod Envelope Attack morph delta src6', id: 14, bit: 327, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 14 · morph src6', deltaOf: 'slotA.param14' },
    { key: 'slotA.param14', name: 'Mod Envelope Attack', id: 14, bit: 335, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 14', cc: 26 },
    { key: 'slotA.param15MorphDeltaSrc0', name: 'Mod Envelope Decay morph delta src0', id: 15, bit: 342, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 15 · morph src0', deltaOf: 'slotA.param15' },
    { key: 'slotA.param15MorphDeltaSrc5', name: 'Mod Envelope Decay morph delta src5', id: 15, bit: 350, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 15 · morph src5', deltaOf: 'slotA.param15' },
    { key: 'slotA.param15MorphDeltaSrc6', name: 'Mod Envelope Decay morph delta src6', id: 15, bit: 358, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 15 · morph src6', deltaOf: 'slotA.param15' },
    { key: 'slotA.param15', name: 'Mod Envelope Decay', id: 15, bit: 366, width: 7, min: 0, max: 127, def: 69, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 15', cc: 27 },
    { key: 'slotA.param16MorphDeltaSrc0', name: 'Mod Envelope Amount morph delta src0', id: 16, bit: 373, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 16 · morph src0', deltaOf: 'slotA.param16' },
    { key: 'slotA.param16MorphDeltaSrc5', name: 'Mod Envelope Amount morph delta src5', id: 16, bit: 381, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 16 · morph src5', deltaOf: 'slotA.param16' },
    { key: 'slotA.param16MorphDeltaSrc6', name: 'Mod Envelope Amount morph delta src6', id: 16, bit: 389, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 16 · morph src6', deltaOf: 'slotA.param16' },
    { key: 'slotA.param16', name: 'Mod Envelope Amount', id: 16, bit: 397, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 16', cc: 29 },
    { key: 'slotA.param17', name: 'Mod Envelope Dest', id: 17, bit: 404, width: 4, min: 0, max: 13, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 17', cc: 28 },
    { key: 'slotA.param18', name: 'Mod Envelope Mode', id: 18, bit: 408, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 18', cc: 109 },
    { key: 'slotA.param19', name: 'Osc 1 Waveform', id: 19, bit: 409, width: 3, min: 0, max: 5, def: 5, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 19', cc: 30 },
    { key: 'slotA.param20', name: 'Osc 1 FM', id: 20, bit: 412, width: 7, min: 0, max: 36, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 20', cc: 47 },
    { key: 'slotA.param21', name: 'Osc 1 Etc', id: 21, bit: 419, width: 7, min: 0, max: 31, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 21', cc: 48 },
    { key: 'slotA.param22', name: 'Osc 1 Table', id: 22, bit: 426, width: 7, min: 0, max: 98, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 22', cc: 49 },
    { key: 'slotA.param23MorphDeltaSrc0', name: 'Osc 1 Shape morph delta src0', id: 23, bit: 433, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 23 · morph src0', deltaOf: 'slotA.param23' },
    { key: 'slotA.param23MorphDeltaSrc5', name: 'Osc 1 Shape morph delta src5', id: 23, bit: 441, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 23 · morph src5', deltaOf: 'slotA.param23' },
    { key: 'slotA.param23MorphDeltaSrc6', name: 'Osc 1 Shape morph delta src6', id: 23, bit: 449, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 23 · morph src6', deltaOf: 'slotA.param23' },
    { key: 'slotA.param23', name: 'Osc 1 Shape', id: 23, bit: 457, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 23', cc: 79 },
    { key: 'slotA.param24', name: 'Osc 2 Waveform', id: 24, bit: 464, width: 7, min: 0, max: 5, def: 5, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 24', cc: 31 },
    { key: 'slotA.param25', name: 'Osc 2 FM', id: 25, bit: 471, width: 7, min: 0, max: 36, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 25', cc: 93 },
    { key: 'slotA.param26', name: 'Osc 2 Etc', id: 26, bit: 478, width: 7, min: 0, max: 98, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 26', cc: 118 },
    { key: 'slotA.param27', name: 'Osc 2 Smp', id: 27, bit: 485, width: 7, min: 0, max: 98, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 27', cc: 50 },
    { key: 'slotA.param28', name: 'Osc 2 Skip Attack', id: 28, bit: 492, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 28', cc: 51 },
    { key: 'slotA.param29MorphDeltaSrc0', name: 'Osc 2 Smp Decay morph delta src0', id: 29, bit: 493, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 29 · morph src0', deltaOf: 'slotA.param29' },
    { key: 'slotA.param29MorphDeltaSrc5', name: 'Osc 2 Smp Decay morph delta src5', id: 29, bit: 501, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 29 · morph src5', deltaOf: 'slotA.param29' },
    { key: 'slotA.param29MorphDeltaSrc6', name: 'Osc 2 Smp Decay morph delta src6', id: 29, bit: 509, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 29 · morph src6', deltaOf: 'slotA.param29' },
    { key: 'slotA.param29', name: 'Osc 2 Smp Decay', id: 29, bit: 517, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 29', cc: 52 },
    { key: 'slotA.param30MorphDeltaSrc0', name: 'Osc 2 Semi Tones morph delta src0', id: 30, bit: 524, width: 8, min: -48, max: 48, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 30 · morph src0', deltaOf: 'slotA.param30' },
    { key: 'slotA.param30MorphDeltaSrc5', name: 'Osc 2 Semi Tones morph delta src5', id: 30, bit: 532, width: 8, min: -48, max: 48, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 30 · morph src5', deltaOf: 'slotA.param30' },
    { key: 'slotA.param30MorphDeltaSrc6', name: 'Osc 2 Semi Tones morph delta src6', id: 30, bit: 540, width: 8, min: -48, max: 48, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 30 · morph src6', deltaOf: 'slotA.param30' },
    { key: 'slotA.param30', name: 'Osc 2 Semi Tones', id: 30, bit: 548, width: 7, min: 0, max: 48, def: 24, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 30', cc: 78 },
    { key: 'slotA.param31MorphDeltaSrc0', name: 'Osc 2 Fine Tune morph delta src0', id: 31, bit: 555, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 31 · morph src0', deltaOf: 'slotA.param31' },
    { key: 'slotA.param31MorphDeltaSrc5', name: 'Osc 2 Fine Tune morph delta src5', id: 31, bit: 563, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 31 · morph src5', deltaOf: 'slotA.param31' },
    { key: 'slotA.param31MorphDeltaSrc6', name: 'Osc 2 Fine Tune morph delta src6', id: 31, bit: 571, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 31 · morph src6', deltaOf: 'slotA.param31' },
    { key: 'slotA.param31', name: 'Osc 2 Fine Tune', id: 31, bit: 579, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 31', cc: 33 },
    { key: 'slotA.param32MorphDeltaSrc0', name: 'Osc 2 Shape morph delta src0', id: 32, bit: 586, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 32 · morph src0', deltaOf: 'slotA.param32' },
    { key: 'slotA.param32MorphDeltaSrc5', name: 'Osc 2 Shape morph delta src5', id: 32, bit: 594, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 32 · morph src5', deltaOf: 'slotA.param32' },
    { key: 'slotA.param32MorphDeltaSrc6', name: 'Osc 2 Shape morph delta src6', id: 32, bit: 602, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 32 · morph src6', deltaOf: 'slotA.param32' },
    { key: 'slotA.param32', name: 'Osc 2 Shape', id: 32, bit: 610, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 32', cc: 102 },
    { key: 'slotA.param33', name: 'Osc 1 Sync Mode', id: 33, bit: 617, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 33', cc: 35 },
    { key: 'slotA.param34', name: 'Osc Mod Type', id: 34, bit: 618, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 34', cc: 105 },
    { key: 'slotA.param35MorphDeltaSrc0', name: 'Osc Mod Amount morph delta src0', id: 35, bit: 620, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 35 · morph src0', deltaOf: 'slotA.param35' },
    { key: 'slotA.param35MorphDeltaSrc5', name: 'Osc Mod Amount morph delta src5', id: 35, bit: 628, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 35 · morph src5', deltaOf: 'slotA.param35' },
    { key: 'slotA.param35MorphDeltaSrc6', name: 'Osc Mod Amount morph delta src6', id: 35, bit: 636, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 35 · morph src6', deltaOf: 'slotA.param35' },
    { key: 'slotA.param35', name: 'Osc Mod Amount', id: 35, bit: 644, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 35', cc: 70 },
    { key: 'slotA.param36MorphDeltaSrc0', name: 'Osc Mix morph delta src0', id: 36, bit: 651, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 36 · morph src0', deltaOf: 'slotA.param36' },
    { key: 'slotA.param36MorphDeltaSrc5', name: 'Osc Mix morph delta src5', id: 36, bit: 659, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 36 · morph src5', deltaOf: 'slotA.param36' },
    { key: 'slotA.param36MorphDeltaSrc6', name: 'Osc Mix morph delta src6', id: 36, bit: 667, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 36 · morph src6', deltaOf: 'slotA.param36' },
    { key: 'slotA.param36', name: 'Osc Mix', id: 36, bit: 675, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 36', cc: 8 },
    { key: 'slotA.param37MorphDeltaSrc0', name: 'Amp Env Attack morph delta src0', id: 37, bit: 682, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 37 · morph src0', deltaOf: 'slotA.param37' },
    { key: 'slotA.param37MorphDeltaSrc5', name: 'Amp Env Attack morph delta src5', id: 37, bit: 690, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 37 · morph src5', deltaOf: 'slotA.param37' },
    { key: 'slotA.param37MorphDeltaSrc6', name: 'Amp Env Attack morph delta src6', id: 37, bit: 698, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 37 · morph src6', deltaOf: 'slotA.param37' },
    { key: 'slotA.param37', name: 'Amp Env Attack', id: 37, bit: 706, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 37', cc: 73 },
    { key: 'slotA.param38MorphDeltaSrc0', name: 'Amp Env Decay morph delta src0', id: 38, bit: 713, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 38 · morph src0', deltaOf: 'slotA.param38' },
    { key: 'slotA.param38MorphDeltaSrc5', name: 'Amp Env Decay morph delta src5', id: 38, bit: 721, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 38 · morph src5', deltaOf: 'slotA.param38' },
    { key: 'slotA.param38MorphDeltaSrc6', name: 'Amp Env Decay morph delta src6', id: 38, bit: 729, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 38 · morph src6', deltaOf: 'slotA.param38' },
    { key: 'slotA.param38', name: 'Amp Env Decay', id: 38, bit: 737, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 38', cc: 36 },
    { key: 'slotA.param39MorphDeltaSrc0', name: 'Amp Env Sustain morph delta src0', id: 39, bit: 744, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 39 · morph src0', deltaOf: 'slotA.param39' },
    { key: 'slotA.param39MorphDeltaSrc5', name: 'Amp Env Sustain morph delta src5', id: 39, bit: 752, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 39 · morph src5', deltaOf: 'slotA.param39' },
    { key: 'slotA.param39MorphDeltaSrc6', name: 'Amp Env Sustain morph delta src6', id: 39, bit: 760, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 39 · morph src6', deltaOf: 'slotA.param39' },
    { key: 'slotA.param39', name: 'Amp Env Sustain', id: 39, bit: 768, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 39', cc: 37 },
    { key: 'slotA.param40MorphDeltaSrc0', name: 'Amp Env Release morph delta src0', id: 40, bit: 775, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 40 · morph src0', deltaOf: 'slotA.param40' },
    { key: 'slotA.param40MorphDeltaSrc5', name: 'Amp Env Release morph delta src5', id: 40, bit: 783, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 40 · morph src5', deltaOf: 'slotA.param40' },
    { key: 'slotA.param40MorphDeltaSrc6', name: 'Amp Env Release morph delta src6', id: 40, bit: 791, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 40 · morph src6', deltaOf: 'slotA.param40' },
    { key: 'slotA.param40', name: 'Amp Env Release', id: 40, bit: 799, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 40', cc: 72 },
    { key: 'slotA.param41MorphDeltaSrc0', name: 'Filter Env Attack morph delta src0', id: 41, bit: 806, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 41 · morph src0', deltaOf: 'slotA.param41' },
    { key: 'slotA.param41MorphDeltaSrc5', name: 'Filter Env Attack morph delta src5', id: 41, bit: 814, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 41 · morph src5', deltaOf: 'slotA.param41' },
    { key: 'slotA.param41MorphDeltaSrc6', name: 'Filter Env Attack morph delta src6', id: 41, bit: 822, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 41 · morph src6', deltaOf: 'slotA.param41' },
    { key: 'slotA.param41', name: 'Filter Env Attack', id: 41, bit: 830, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 41', cc: 38 },
    { key: 'slotA.param42MorphDeltaSrc0', name: 'Filter Env Decay morph delta src0', id: 42, bit: 837, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 42 · morph src0', deltaOf: 'slotA.param42' },
    { key: 'slotA.param42MorphDeltaSrc5', name: 'Filter Env Decay morph delta src5', id: 42, bit: 845, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 42 · morph src5', deltaOf: 'slotA.param42' },
    { key: 'slotA.param42MorphDeltaSrc6', name: 'Filter Env Decay morph delta src6', id: 42, bit: 853, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 42 · morph src6', deltaOf: 'slotA.param42' },
    { key: 'slotA.param42', name: 'Filter Env Decay', id: 42, bit: 861, width: 7, min: 0, max: 127, def: 32, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 42', cc: 39 },
    { key: 'slotA.param43MorphDeltaSrc0', name: 'Filter Env Sustain morph delta src0', id: 43, bit: 868, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 43 · morph src0', deltaOf: 'slotA.param43' },
    { key: 'slotA.param43MorphDeltaSrc5', name: 'Filter Env Sustain morph delta src5', id: 43, bit: 876, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 43 · morph src5', deltaOf: 'slotA.param43' },
    { key: 'slotA.param43MorphDeltaSrc6', name: 'Filter Env Sustain morph delta src6', id: 43, bit: 884, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 43 · morph src6', deltaOf: 'slotA.param43' },
    { key: 'slotA.param43', name: 'Filter Env Sustain', id: 43, bit: 892, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 43', cc: 40 },
    { key: 'slotA.param44MorphDeltaSrc0', name: 'Filter Env Release morph delta src0', id: 44, bit: 899, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 44 · morph src0', deltaOf: 'slotA.param44' },
    { key: 'slotA.param44MorphDeltaSrc5', name: 'Filter Env Release morph delta src5', id: 44, bit: 907, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 44 · morph src5', deltaOf: 'slotA.param44' },
    { key: 'slotA.param44MorphDeltaSrc6', name: 'Filter Env Release morph delta src6', id: 44, bit: 915, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 44 · morph src6', deltaOf: 'slotA.param44' },
    { key: 'slotA.param44', name: 'Filter Env Release', id: 44, bit: 923, width: 7, min: 0, max: 127, def: 16, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 44', cc: 41 },
    { key: 'slotA.param45', name: 'Filter Type', id: 45, bit: 930, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 45', cc: 44 },
    { key: 'slotA.param46', name: 'Filter Kb Track', id: 46, bit: 933, width: 2, min: 0, max: 3, def: 3, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 46', cc: 46 },
    { key: 'slotA.param47', name: 'Filter Slope', id: 47, bit: 935, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 47', cc: 58 },
    { key: 'slotA.param48', name: 'Filter Velocity', id: 48, bit: 936, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 48', cc: 45 },
    { key: 'slotA.param49MorphDeltaSrc0', name: 'Filter Freq morph delta src0', id: 49, bit: 937, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 49 · morph src0', deltaOf: 'slotA.param49' },
    { key: 'slotA.param49MorphDeltaSrc5', name: 'Filter Freq morph delta src5', id: 49, bit: 945, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 49 · morph src5', deltaOf: 'slotA.param49' },
    { key: 'slotA.param49MorphDeltaSrc6', name: 'Filter Freq morph delta src6', id: 49, bit: 953, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 49 · morph src6', deltaOf: 'slotA.param49' },
    { key: 'slotA.param49', name: 'Filter Freq', id: 49, bit: 961, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 49', cc: 74 },
    { key: 'slotA.param50MorphDeltaSrc0', name: 'Filter Resonance morph delta src0', id: 50, bit: 968, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 50 · morph src0', deltaOf: 'slotA.param50' },
    { key: 'slotA.param50MorphDeltaSrc5', name: 'Filter Resonance morph delta src5', id: 50, bit: 976, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 50 · morph src5', deltaOf: 'slotA.param50' },
    { key: 'slotA.param50MorphDeltaSrc6', name: 'Filter Resonance morph delta src6', id: 50, bit: 984, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 50 · morph src6', deltaOf: 'slotA.param50' },
    { key: 'slotA.param50', name: 'Filter Resonance', id: 50, bit: 992, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 50', cc: 42 },
    { key: 'slotA.param51MorphDeltaSrc0', name: 'Filter Env Amount morph delta src0', id: 51, bit: 999, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 51 · morph src0', deltaOf: 'slotA.param51' },
    { key: 'slotA.param51MorphDeltaSrc5', name: 'Filter Env Amount morph delta src5', id: 51, bit: 1007, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 51 · morph src5', deltaOf: 'slotA.param51' },
    { key: 'slotA.param51MorphDeltaSrc6', name: 'Filter Env Amount morph delta src6', id: 51, bit: 1015, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 51 · morph src6', deltaOf: 'slotA.param51' },
    { key: 'slotA.param51', name: 'Filter Env Amount', id: 51, bit: 1023, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 51', cc: 43 },
    { key: 'slotA.param52MorphDeltaSrc0', name: 'Output Level morph delta src0', id: 52, bit: 1030, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 52 · morph src0', deltaOf: 'slotA.param52' },
    { key: 'slotA.param52MorphDeltaSrc5', name: 'Output Level morph delta src5', id: 52, bit: 1038, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 52 · morph src5', deltaOf: 'slotA.param52' },
    { key: 'slotA.param52MorphDeltaSrc6', name: 'Output Level morph delta src6', id: 52, bit: 1046, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 52 · morph src6', deltaOf: 'slotA.param52' },
    { key: 'slotA.param52', name: 'Output Level', id: 52, bit: 1054, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 52', cc: 71 },
    { key: 'slotA.param53', name: 'Treble', id: 53, bit: 1061, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 53', cc: 113 },
    { key: 'slotA.param54', name: 'Bass', id: 54, bit: 1068, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 54', cc: 114 },
    { key: 'slotA.param55', name: 'Chorus Mode', id: 55, bit: 1075, width: 4, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotA 55', cc: 53 },
    { key: 'slotB.param0', name: 'Octave Shift', id: 0, bit: 1276, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 0', cc: 17 },
    { key: 'slotB.param1', name: 'Mono Mode', id: 1, bit: 1279, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 1', cc: 15 },
    { key: 'slotB.param2', name: 'Glide', id: 2, bit: 1281, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 2', cc: 5 },
    { key: 'slotB.param3', name: 'Vibrato Mode', id: 3, bit: 1288, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 3', cc: 56 },
    { key: 'slotB.param4', name: 'LFO 1 Waveform', id: 4, bit: 1291, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 4', cc: 20 },
    { key: 'slotB.param5', name: 'LFO 1 Dest', id: 5, bit: 1294, width: 4, min: 0, max: 13, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 5', cc: 21 },
    { key: 'slotB.param6', name: 'LFO 1 Polyphonic', id: 6, bit: 1298, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 6', cc: 83 },
    { key: 'slotB.param7MorphDeltaSrc0', name: 'LFO 1 Rate morph delta src0', id: 7, bit: 1299, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 7 · morph src0', deltaOf: 'slotB.param7' },
    { key: 'slotB.param7MorphDeltaSrc5', name: 'LFO 1 Rate morph delta src5', id: 7, bit: 1307, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 7 · morph src5', deltaOf: 'slotB.param7' },
    { key: 'slotB.param7MorphDeltaSrc6', name: 'LFO 1 Rate morph delta src6', id: 7, bit: 1315, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 7 · morph src6', deltaOf: 'slotB.param7' },
    { key: 'slotB.param7', name: 'LFO 1 Rate', id: 7, bit: 1323, width: 7, min: 0, max: 127, def: 46, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 7', cc: 19 },
    { key: 'slotB.param8MorphDeltaSrc0', name: 'LFO 1 Amount morph delta src0', id: 8, bit: 1330, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 8 · morph src0', deltaOf: 'slotB.param8' },
    { key: 'slotB.param8MorphDeltaSrc5', name: 'LFO 1 Amount morph delta src5', id: 8, bit: 1338, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 8 · morph src5', deltaOf: 'slotB.param8' },
    { key: 'slotB.param8MorphDeltaSrc6', name: 'LFO 1 Amount morph delta src6', id: 8, bit: 1346, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 8 · morph src6', deltaOf: 'slotB.param8' },
    { key: 'slotB.param8', name: 'LFO 1 Amount', id: 8, bit: 1354, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 8', cc: 22 },
    { key: 'slotB.param9', name: 'LFO 2 Waveform', id: 9, bit: 1361, width: 3, min: 0, max: 4, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 9', cc: 85 },
    { key: 'slotB.param10', name: 'LFO 2 Dest', id: 10, bit: 1364, width: 4, min: 0, max: 13, def: 1, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 10', cc: 24 },
    { key: 'slotB.param11', name: 'LFO 2 Single Mode', id: 11, bit: 1368, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 11', cc: 87 },
    { key: 'slotB.param12MorphDeltaSrc0', name: 'LFO 2 Rate morph delta src0', id: 12, bit: 1369, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 12 · morph src0', deltaOf: 'slotB.param12' },
    { key: 'slotB.param12MorphDeltaSrc5', name: 'LFO 2 Rate morph delta src5', id: 12, bit: 1377, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 12 · morph src5', deltaOf: 'slotB.param12' },
    { key: 'slotB.param12MorphDeltaSrc6', name: 'LFO 2 Rate morph delta src6', id: 12, bit: 1385, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 12 · morph src6', deltaOf: 'slotB.param12' },
    { key: 'slotB.param12', name: 'LFO 2 Rate', id: 12, bit: 1393, width: 7, min: 0, max: 127, def: 46, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 12', cc: 23 },
    { key: 'slotB.param13MorphDeltaSrc0', name: 'LFO 2 Amount morph delta src0', id: 13, bit: 1400, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 13 · morph src0', deltaOf: 'slotB.param13' },
    { key: 'slotB.param13MorphDeltaSrc5', name: 'LFO 2 Amount morph delta src5', id: 13, bit: 1408, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 13 · morph src5', deltaOf: 'slotB.param13' },
    { key: 'slotB.param13MorphDeltaSrc6', name: 'LFO 2 Amount morph delta src6', id: 13, bit: 1416, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 13 · morph src6', deltaOf: 'slotB.param13' },
    { key: 'slotB.param13', name: 'LFO 2 Amount', id: 13, bit: 1424, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 13', cc: 25 },
    { key: 'slotB.param14MorphDeltaSrc0', name: 'Mod Envelope Attack morph delta src0', id: 14, bit: 1431, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 14 · morph src0', deltaOf: 'slotB.param14' },
    { key: 'slotB.param14MorphDeltaSrc5', name: 'Mod Envelope Attack morph delta src5', id: 14, bit: 1439, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 14 · morph src5', deltaOf: 'slotB.param14' },
    { key: 'slotB.param14MorphDeltaSrc6', name: 'Mod Envelope Attack morph delta src6', id: 14, bit: 1447, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 14 · morph src6', deltaOf: 'slotB.param14' },
    { key: 'slotB.param14', name: 'Mod Envelope Attack', id: 14, bit: 1455, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 14', cc: 26 },
    { key: 'slotB.param15MorphDeltaSrc0', name: 'Mod Envelope Decay morph delta src0', id: 15, bit: 1462, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 15 · morph src0', deltaOf: 'slotB.param15' },
    { key: 'slotB.param15MorphDeltaSrc5', name: 'Mod Envelope Decay morph delta src5', id: 15, bit: 1470, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 15 · morph src5', deltaOf: 'slotB.param15' },
    { key: 'slotB.param15MorphDeltaSrc6', name: 'Mod Envelope Decay morph delta src6', id: 15, bit: 1478, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 15 · morph src6', deltaOf: 'slotB.param15' },
    { key: 'slotB.param15', name: 'Mod Envelope Decay', id: 15, bit: 1486, width: 7, min: 0, max: 127, def: 69, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 15', cc: 27 },
    { key: 'slotB.param16MorphDeltaSrc0', name: 'Mod Envelope Amount morph delta src0', id: 16, bit: 1493, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 16 · morph src0', deltaOf: 'slotB.param16' },
    { key: 'slotB.param16MorphDeltaSrc5', name: 'Mod Envelope Amount morph delta src5', id: 16, bit: 1501, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 16 · morph src5', deltaOf: 'slotB.param16' },
    { key: 'slotB.param16MorphDeltaSrc6', name: 'Mod Envelope Amount morph delta src6', id: 16, bit: 1509, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 16 · morph src6', deltaOf: 'slotB.param16' },
    { key: 'slotB.param16', name: 'Mod Envelope Amount', id: 16, bit: 1517, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 16', cc: 29 },
    { key: 'slotB.param17', name: 'Mod Envelope Dest', id: 17, bit: 1524, width: 4, min: 0, max: 13, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 17', cc: 28 },
    { key: 'slotB.param18', name: 'Mod Envelope Mode', id: 18, bit: 1528, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 18', cc: 109 },
    { key: 'slotB.param19', name: 'Osc 1 Waveform', id: 19, bit: 1529, width: 3, min: 0, max: 5, def: 5, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 19', cc: 30 },
    { key: 'slotB.param20', name: 'Osc 1 FM', id: 20, bit: 1532, width: 7, min: 0, max: 36, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 20', cc: 47 },
    { key: 'slotB.param21', name: 'Osc 1 Etc', id: 21, bit: 1539, width: 7, min: 0, max: 31, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 21', cc: 48 },
    { key: 'slotB.param22', name: 'Osc 1 Table', id: 22, bit: 1546, width: 7, min: 0, max: 98, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 22', cc: 49 },
    { key: 'slotB.param23MorphDeltaSrc0', name: 'Osc 1 Shape morph delta src0', id: 23, bit: 1553, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 23 · morph src0', deltaOf: 'slotB.param23' },
    { key: 'slotB.param23MorphDeltaSrc5', name: 'Osc 1 Shape morph delta src5', id: 23, bit: 1561, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 23 · morph src5', deltaOf: 'slotB.param23' },
    { key: 'slotB.param23MorphDeltaSrc6', name: 'Osc 1 Shape morph delta src6', id: 23, bit: 1569, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 23 · morph src6', deltaOf: 'slotB.param23' },
    { key: 'slotB.param23', name: 'Osc 1 Shape', id: 23, bit: 1577, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 23', cc: 79 },
    { key: 'slotB.param24', name: 'Osc 2 Waveform', id: 24, bit: 1584, width: 7, min: 0, max: 5, def: 5, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 24', cc: 31 },
    { key: 'slotB.param25', name: 'Osc 2 FM', id: 25, bit: 1591, width: 7, min: 0, max: 36, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 25', cc: 93 },
    { key: 'slotB.param26', name: 'Osc 2 Etc', id: 26, bit: 1598, width: 7, min: 0, max: 98, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 26', cc: 118 },
    { key: 'slotB.param27', name: 'Osc 2 Smp', id: 27, bit: 1605, width: 7, min: 0, max: 98, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 27', cc: 50 },
    { key: 'slotB.param28', name: 'Osc 2 Skip Attack', id: 28, bit: 1612, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 28', cc: 51 },
    { key: 'slotB.param29MorphDeltaSrc0', name: 'Osc 2 Smp Decay morph delta src0', id: 29, bit: 1613, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 29 · morph src0', deltaOf: 'slotB.param29' },
    { key: 'slotB.param29MorphDeltaSrc5', name: 'Osc 2 Smp Decay morph delta src5', id: 29, bit: 1621, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 29 · morph src5', deltaOf: 'slotB.param29' },
    { key: 'slotB.param29MorphDeltaSrc6', name: 'Osc 2 Smp Decay morph delta src6', id: 29, bit: 1629, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 29 · morph src6', deltaOf: 'slotB.param29' },
    { key: 'slotB.param29', name: 'Osc 2 Smp Decay', id: 29, bit: 1637, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 29', cc: 52 },
    { key: 'slotB.param30MorphDeltaSrc0', name: 'Osc 2 Semi Tones morph delta src0', id: 30, bit: 1644, width: 8, min: -48, max: 48, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 30 · morph src0', deltaOf: 'slotB.param30' },
    { key: 'slotB.param30MorphDeltaSrc5', name: 'Osc 2 Semi Tones morph delta src5', id: 30, bit: 1652, width: 8, min: -48, max: 48, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 30 · morph src5', deltaOf: 'slotB.param30' },
    { key: 'slotB.param30MorphDeltaSrc6', name: 'Osc 2 Semi Tones morph delta src6', id: 30, bit: 1660, width: 8, min: -48, max: 48, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 30 · morph src6', deltaOf: 'slotB.param30' },
    { key: 'slotB.param30', name: 'Osc 2 Semi Tones', id: 30, bit: 1668, width: 7, min: 0, max: 48, def: 24, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 30', cc: 78 },
    { key: 'slotB.param31MorphDeltaSrc0', name: 'Osc 2 Fine Tune morph delta src0', id: 31, bit: 1675, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 31 · morph src0', deltaOf: 'slotB.param31' },
    { key: 'slotB.param31MorphDeltaSrc5', name: 'Osc 2 Fine Tune morph delta src5', id: 31, bit: 1683, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 31 · morph src5', deltaOf: 'slotB.param31' },
    { key: 'slotB.param31MorphDeltaSrc6', name: 'Osc 2 Fine Tune morph delta src6', id: 31, bit: 1691, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 31 · morph src6', deltaOf: 'slotB.param31' },
    { key: 'slotB.param31', name: 'Osc 2 Fine Tune', id: 31, bit: 1699, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 31', cc: 33 },
    { key: 'slotB.param32MorphDeltaSrc0', name: 'Osc 2 Shape morph delta src0', id: 32, bit: 1706, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 32 · morph src0', deltaOf: 'slotB.param32' },
    { key: 'slotB.param32MorphDeltaSrc5', name: 'Osc 2 Shape morph delta src5', id: 32, bit: 1714, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 32 · morph src5', deltaOf: 'slotB.param32' },
    { key: 'slotB.param32MorphDeltaSrc6', name: 'Osc 2 Shape morph delta src6', id: 32, bit: 1722, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 32 · morph src6', deltaOf: 'slotB.param32' },
    { key: 'slotB.param32', name: 'Osc 2 Shape', id: 32, bit: 1730, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 32', cc: 102 },
    { key: 'slotB.param33', name: 'Osc 1 Sync Mode', id: 33, bit: 1737, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 33', cc: 35 },
    { key: 'slotB.param34', name: 'Osc Mod Type', id: 34, bit: 1738, width: 2, min: 0, max: 2, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 34', cc: 105 },
    { key: 'slotB.param35MorphDeltaSrc0', name: 'Osc Mod Amount morph delta src0', id: 35, bit: 1740, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 35 · morph src0', deltaOf: 'slotB.param35' },
    { key: 'slotB.param35MorphDeltaSrc5', name: 'Osc Mod Amount morph delta src5', id: 35, bit: 1748, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 35 · morph src5', deltaOf: 'slotB.param35' },
    { key: 'slotB.param35MorphDeltaSrc6', name: 'Osc Mod Amount morph delta src6', id: 35, bit: 1756, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 35 · morph src6', deltaOf: 'slotB.param35' },
    { key: 'slotB.param35', name: 'Osc Mod Amount', id: 35, bit: 1764, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 35', cc: 70 },
    { key: 'slotB.param36MorphDeltaSrc0', name: 'Osc Mix morph delta src0', id: 36, bit: 1771, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 36 · morph src0', deltaOf: 'slotB.param36' },
    { key: 'slotB.param36MorphDeltaSrc5', name: 'Osc Mix morph delta src5', id: 36, bit: 1779, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 36 · morph src5', deltaOf: 'slotB.param36' },
    { key: 'slotB.param36MorphDeltaSrc6', name: 'Osc Mix morph delta src6', id: 36, bit: 1787, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 36 · morph src6', deltaOf: 'slotB.param36' },
    { key: 'slotB.param36', name: 'Osc Mix', id: 36, bit: 1795, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 36', cc: 8 },
    { key: 'slotB.param37MorphDeltaSrc0', name: 'Amp Env Attack morph delta src0', id: 37, bit: 1802, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 37 · morph src0', deltaOf: 'slotB.param37' },
    { key: 'slotB.param37MorphDeltaSrc5', name: 'Amp Env Attack morph delta src5', id: 37, bit: 1810, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 37 · morph src5', deltaOf: 'slotB.param37' },
    { key: 'slotB.param37MorphDeltaSrc6', name: 'Amp Env Attack morph delta src6', id: 37, bit: 1818, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 37 · morph src6', deltaOf: 'slotB.param37' },
    { key: 'slotB.param37', name: 'Amp Env Attack', id: 37, bit: 1826, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 37', cc: 73 },
    { key: 'slotB.param38MorphDeltaSrc0', name: 'Amp Env Decay morph delta src0', id: 38, bit: 1833, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 38 · morph src0', deltaOf: 'slotB.param38' },
    { key: 'slotB.param38MorphDeltaSrc5', name: 'Amp Env Decay morph delta src5', id: 38, bit: 1841, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 38 · morph src5', deltaOf: 'slotB.param38' },
    { key: 'slotB.param38MorphDeltaSrc6', name: 'Amp Env Decay morph delta src6', id: 38, bit: 1849, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 38 · morph src6', deltaOf: 'slotB.param38' },
    { key: 'slotB.param38', name: 'Amp Env Decay', id: 38, bit: 1857, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 38', cc: 36 },
    { key: 'slotB.param39MorphDeltaSrc0', name: 'Amp Env Sustain morph delta src0', id: 39, bit: 1864, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 39 · morph src0', deltaOf: 'slotB.param39' },
    { key: 'slotB.param39MorphDeltaSrc5', name: 'Amp Env Sustain morph delta src5', id: 39, bit: 1872, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 39 · morph src5', deltaOf: 'slotB.param39' },
    { key: 'slotB.param39MorphDeltaSrc6', name: 'Amp Env Sustain morph delta src6', id: 39, bit: 1880, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 39 · morph src6', deltaOf: 'slotB.param39' },
    { key: 'slotB.param39', name: 'Amp Env Sustain', id: 39, bit: 1888, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 39', cc: 37 },
    { key: 'slotB.param40MorphDeltaSrc0', name: 'Amp Env Release morph delta src0', id: 40, bit: 1895, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 40 · morph src0', deltaOf: 'slotB.param40' },
    { key: 'slotB.param40MorphDeltaSrc5', name: 'Amp Env Release morph delta src5', id: 40, bit: 1903, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 40 · morph src5', deltaOf: 'slotB.param40' },
    { key: 'slotB.param40MorphDeltaSrc6', name: 'Amp Env Release morph delta src6', id: 40, bit: 1911, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 40 · morph src6', deltaOf: 'slotB.param40' },
    { key: 'slotB.param40', name: 'Amp Env Release', id: 40, bit: 1919, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 40', cc: 72 },
    { key: 'slotB.param41MorphDeltaSrc0', name: 'Filter Env Attack morph delta src0', id: 41, bit: 1926, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 41 · morph src0', deltaOf: 'slotB.param41' },
    { key: 'slotB.param41MorphDeltaSrc5', name: 'Filter Env Attack morph delta src5', id: 41, bit: 1934, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 41 · morph src5', deltaOf: 'slotB.param41' },
    { key: 'slotB.param41MorphDeltaSrc6', name: 'Filter Env Attack morph delta src6', id: 41, bit: 1942, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 41 · morph src6', deltaOf: 'slotB.param41' },
    { key: 'slotB.param41', name: 'Filter Env Attack', id: 41, bit: 1950, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 41', cc: 38 },
    { key: 'slotB.param42MorphDeltaSrc0', name: 'Filter Env Decay morph delta src0', id: 42, bit: 1957, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 42 · morph src0', deltaOf: 'slotB.param42' },
    { key: 'slotB.param42MorphDeltaSrc5', name: 'Filter Env Decay morph delta src5', id: 42, bit: 1965, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 42 · morph src5', deltaOf: 'slotB.param42' },
    { key: 'slotB.param42MorphDeltaSrc6', name: 'Filter Env Decay morph delta src6', id: 42, bit: 1973, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 42 · morph src6', deltaOf: 'slotB.param42' },
    { key: 'slotB.param42', name: 'Filter Env Decay', id: 42, bit: 1981, width: 7, min: 0, max: 127, def: 32, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 42', cc: 39 },
    { key: 'slotB.param43MorphDeltaSrc0', name: 'Filter Env Sustain morph delta src0', id: 43, bit: 1988, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 43 · morph src0', deltaOf: 'slotB.param43' },
    { key: 'slotB.param43MorphDeltaSrc5', name: 'Filter Env Sustain morph delta src5', id: 43, bit: 1996, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 43 · morph src5', deltaOf: 'slotB.param43' },
    { key: 'slotB.param43MorphDeltaSrc6', name: 'Filter Env Sustain morph delta src6', id: 43, bit: 2004, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 43 · morph src6', deltaOf: 'slotB.param43' },
    { key: 'slotB.param43', name: 'Filter Env Sustain', id: 43, bit: 2012, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 43', cc: 40 },
    { key: 'slotB.param44MorphDeltaSrc0', name: 'Filter Env Release morph delta src0', id: 44, bit: 2019, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 44 · morph src0', deltaOf: 'slotB.param44' },
    { key: 'slotB.param44MorphDeltaSrc5', name: 'Filter Env Release morph delta src5', id: 44, bit: 2027, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 44 · morph src5', deltaOf: 'slotB.param44' },
    { key: 'slotB.param44MorphDeltaSrc6', name: 'Filter Env Release morph delta src6', id: 44, bit: 2035, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 44 · morph src6', deltaOf: 'slotB.param44' },
    { key: 'slotB.param44', name: 'Filter Env Release', id: 44, bit: 2043, width: 7, min: 0, max: 127, def: 16, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 44', cc: 41 },
    { key: 'slotB.param45', name: 'Filter Type', id: 45, bit: 2050, width: 3, min: 0, max: 5, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 45', cc: 44 },
    { key: 'slotB.param46', name: 'Filter Kb Track', id: 46, bit: 2053, width: 2, min: 0, max: 3, def: 3, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 46', cc: 46 },
    { key: 'slotB.param47', name: 'Filter Slope', id: 47, bit: 2055, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 47', cc: 58 },
    { key: 'slotB.param48', name: 'Filter Velocity', id: 48, bit: 2056, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 48', cc: 45 },
    { key: 'slotB.param49MorphDeltaSrc0', name: 'Filter Freq morph delta src0', id: 49, bit: 2057, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 49 · morph src0', deltaOf: 'slotB.param49' },
    { key: 'slotB.param49MorphDeltaSrc5', name: 'Filter Freq morph delta src5', id: 49, bit: 2065, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 49 · morph src5', deltaOf: 'slotB.param49' },
    { key: 'slotB.param49MorphDeltaSrc6', name: 'Filter Freq morph delta src6', id: 49, bit: 2073, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 49 · morph src6', deltaOf: 'slotB.param49' },
    { key: 'slotB.param49', name: 'Filter Freq', id: 49, bit: 2081, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 49', cc: 74 },
    { key: 'slotB.param50MorphDeltaSrc0', name: 'Filter Resonance morph delta src0', id: 50, bit: 2088, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 50 · morph src0', deltaOf: 'slotB.param50' },
    { key: 'slotB.param50MorphDeltaSrc5', name: 'Filter Resonance morph delta src5', id: 50, bit: 2096, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 50 · morph src5', deltaOf: 'slotB.param50' },
    { key: 'slotB.param50MorphDeltaSrc6', name: 'Filter Resonance morph delta src6', id: 50, bit: 2104, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 50 · morph src6', deltaOf: 'slotB.param50' },
    { key: 'slotB.param50', name: 'Filter Resonance', id: 50, bit: 2112, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 50', cc: 42 },
    { key: 'slotB.param51MorphDeltaSrc0', name: 'Filter Env Amount morph delta src0', id: 51, bit: 2119, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 51 · morph src0', deltaOf: 'slotB.param51' },
    { key: 'slotB.param51MorphDeltaSrc5', name: 'Filter Env Amount morph delta src5', id: 51, bit: 2127, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 51 · morph src5', deltaOf: 'slotB.param51' },
    { key: 'slotB.param51MorphDeltaSrc6', name: 'Filter Env Amount morph delta src6', id: 51, bit: 2135, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 51 · morph src6', deltaOf: 'slotB.param51' },
    { key: 'slotB.param51', name: 'Filter Env Amount', id: 51, bit: 2143, width: 7, min: 0, max: 127, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 51', cc: 43 },
    { key: 'slotB.param52MorphDeltaSrc0', name: 'Output Level morph delta src0', id: 52, bit: 2150, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 52 · morph src0', deltaOf: 'slotB.param52' },
    { key: 'slotB.param52MorphDeltaSrc5', name: 'Output Level morph delta src5', id: 52, bit: 2158, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 52 · morph src5', deltaOf: 'slotB.param52' },
    { key: 'slotB.param52MorphDeltaSrc6', name: 'Output Level morph delta src6', id: 52, bit: 2166, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 52 · morph src6', deltaOf: 'slotB.param52' },
    { key: 'slotB.param52', name: 'Output Level', id: 52, bit: 2174, width: 7, min: 0, max: 127, def: 127, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 52', cc: 71 },
    { key: 'slotB.param53', name: 'Treble', id: 53, bit: 2181, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 53', cc: 113 },
    { key: 'slotB.param54', name: 'Bass', id: 54, bit: 2188, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 54', cc: 114 },
    { key: 'slotB.param55', name: 'Chorus Mode', id: 55, bit: 2195, width: 4, min: 0, max: 3, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · slotB 55', cc: 53 },
    { key: 'common.param0', name: 'Tube Amp State', id: 0, bit: 2396, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · common 0', cc: 92 },
    { key: 'common.param1', name: 'Tube Amp Drive', id: 1, bit: 2397, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · common 1', cc: 89 },
    { key: 'common.param2', name: 'Delay Tempo', id: 2, bit: 2404, width: 16, min: 0, max: 65535, def: 32768, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · common 2', cc: 77 },
    { key: 'common.param3', name: 'Delay Feedback', id: 3, bit: 2420, width: 2, min: 0, max: 3, def: 1, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · common 3', cc: 116 },
    { key: 'common.param4', name: 'Delay Mode', id: 4, bit: 2422, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · common 4', cc: 117 },
    { key: 'common.param5MorphDeltaSrc0', name: 'Delay Amount morph delta src0', id: 5, bit: 2423, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · common 5 · morph src0', deltaOf: 'common.param5' },
    { key: 'common.param5MorphDeltaSrc5', name: 'Delay Amount morph delta src5', id: 5, bit: 2431, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · common 5 · morph src5', deltaOf: 'common.param5' },
    { key: 'common.param5MorphDeltaSrc6', name: 'Delay Amount morph delta src6', id: 5, bit: 2439, width: 8, min: -127, max: 127, def: 0, enc: 'twos', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · common 5 · morph src6', deltaOf: 'common.param5' },
    { key: 'common.param5', name: 'Delay Amount', id: 5, bit: 2447, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · common 5', cc: 76 },
    { key: 'common.param6', name: 'Delay State', id: 6, bit: 2454, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · common 6', cc: 80 },
    { key: 'common.param7', name: 'Reverb Model', id: 7, bit: 2455, width: 3, min: 0, max: 4, def: 2, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · common 7', cc: 96 },
    { key: 'common.param8', name: 'Reverb Dry/Wet', id: 8, bit: 2458, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · common 8', cc: 95 },
    { key: 'common.param9', name: 'Reverb State', id: 9, bit: 2465, width: 1, min: 0, max: 1, def: 0, enc: 'u', confidence: 'medium', src: 'Wave OS 2.14 parameter containers · common 9', cc: 97 },
  ],
  sets: {
    slotA: 'slot',
    slotB: 'slot',
  },
};
