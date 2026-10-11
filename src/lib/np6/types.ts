/**
 * Nord Piano 6 (`.np6p`) program model.
 *
 * The Piano 6 OS 1.20 firmware registry (FUN_c0112544, builders c010990c /
 * c0109a38 / c0112410) shows the `.np6p` body is the Grand 2 layout — same 11
 * blocks and sizes (MultiCom 10 · PnoCom 5 · PnoA/B 13 · PnoFxA/B 21 · SynCom 5
 * · SynA/B 20 · SynFxA/B 21; 185-byte body) — with three differences:
 *  1. MultiCom gains `Com_kFxEnable` at bit 53, shifting the next 9 bits by 1;
 *  2. PnoCom and SynCom gain `EffectsSectionMode` (1 bit);
 *  3. the Syn block has separate AmpEnvDecay and Release (7 + 7) instead of
 *     DcyRls, and no SmpTimbre.
 * It is NOT close to the Piano 5 (different container, global FX block).
 *
 * Negative-min fields are two's complement — inferred from the shared code and
 * the Grand 2 corpus (medium). Not yet checked against a real `.np6p` file.
 */
import type { FwProgram } from '../clavia/block-chain';
import type { Np6FieldKey } from './layout.generated';

export type { Np6FieldKey };

export interface Np6Program extends FwProgram<Np6FieldKey> {
  readonly format: 'np6p';
}
