/**
 * Nord Electro 6 (`.ne6p`) program model.
 *
 * The Electro 6 OS 2.66 firmware uses the Stage 3 registry generation
 * (registry FUN_c0054b5c, 148 parameters; Multi format FUN_c0057f8c reads
 * 2.00–2.04): a u32 version, then 14 length-prefixed blocks — MultiComm, Piano,
 * Synth, Effects, Organ, OrganMultiA/B, OrgMan Comm, and for each organ manual
 * A/B a PresetComm + Preset I + Preset II — a 211-byte body. Negative-min fields
 * are two's complement in their width (registry init FUN_c009aad8, signed mode
 * 0). No morphable parameters. 1.xx files load through a legacy "Multi v1"
 * path with another layout (FUN_c005ed58) and show the header only.
 *
 * Fields come from the generated layout (`layout.generated.ts`), each citing its
 * firmware parameter id.
 *
 * The earlier corpus-only reader (2026-06-22) is reconciled as follows: its
 * "upper/lower" drawbars at body 143/158 are organ manual A Preset I / Preset II
 * (manual B's presets sit at 182/197); its `_trailing` nibble after drawbar 9 is
 * VibratoEnable / B3PercEnable / B3PercHarmonic / B3PercSpeed and the 0x80 at
 * 148 is B3PercLevel; its `sectionEnable` bits (body 5–6) are MultiComm split
 * fields — the section enables are Piano 20 b7, Synth 38 b7 and Organ 94 b7; its
 * "sample" cluster (38–50) is the Synth block (9-bit sample position at 40 b7,
 * 32-bit sample name hash from 41 b6); the piano name hash is 32 bits at 23 b5;
 * and the organ "lead-in" at 124–125 is OrgMan Level (7 bits), Model and
 * VibratoType.
 */
import type { FwProgram } from '../clavia/block-chain';
import type { Ne6FieldKey } from './layout.generated';

export type { Ne6FieldKey };

export interface Ne6Program extends FwProgram<Ne6FieldKey> {
  readonly format: 'ne6p';
}
