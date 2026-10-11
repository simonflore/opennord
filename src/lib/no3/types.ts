/**
 * Nord Organ 3 (`.no3p`) program model — PROVISIONAL.
 *
 * The Organ 3 OS 1.00 firmware uses the Stage 4 registry generation with
 * per-parameter calls (182 parameters, no morph kinds). Program
 * archive, version 2.00 (medium). Block tree, assuming insertion
 * order (medium): Common 129 · BassDrawbar 5 · BassSustain 4 · ModeSpecific 14
 * · Manual A (Drawbar 11, ModeAndLayer 9) · Manual B (Drawbar 11,
 * ModeAndLayer 9) — a 204-byte body (248-byte file). The order is NOT yet
 * confirmed on a real file.
 */
import type { FwProgram } from '../clavia/block-chain';
import type { No3FieldKey } from './layout.generated';

export type { No3FieldKey };

export interface No3Program extends FwProgram<No3FieldKey> {
  readonly format: 'no3p';
}
