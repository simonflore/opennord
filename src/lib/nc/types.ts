/**
 * Nord C2 (`.ncpg`) program model — read through the C2 OS 2.00 firmware's own
 * parameter containers (`layout.generated.ts`).
 *
 * The firmware stores a program as `[u16 version 100][269 bytes]` (record size
 * 271; version 100 is the only one it reads — no converter): 66 containers,
 * one MSB-first bitstream, no morph sources and, unlike the C2D, no repeated
 * containers. Blocks: common (organ model), B3 (common; upper with three
 * drawbar sets and their percussion; lower with three drawbar sets), Vox and
 * Farfisa (common, upper / lower with three presets each), pipe organ
 * (common, upper / lower with six presets each, six couplers), the bass modes
 * (B3 bass, pipe bass with six presets, Trek bass) and the effects (shared,
 * then one switch set per organ).
 *
 * File alignment (medium): like the C2D the record version is the CBIN version
 * field (0x14) and the data starts at 0x1A, with the 2-byte trailer after it —
 * a predicted 26 + 269 + 2 = 297-byte file, not yet checked on a real one.
 * Block names come from descriptor shapes and control ids (medium); the
 * organ-model order 0 B3, 1 Vox, 2 Farfisa, 3 Pipe is inferred.
 */
import type { LegacyProgram } from '../clavia/legacy-program';
import type { NcpFieldKey } from './layout.generated';

export type { NcpFieldKey };

export interface NcProgram extends LegacyProgram<NcpFieldKey> {
  readonly format: 'ncpg';
  /** The 2-byte trailer as stored (its CRC coverage is unverified). */
  readonly checksum: number;
}
