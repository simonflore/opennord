/**
 * Nord Electro 7 (`.ne7p`) program model — PROVISIONAL.
 *
 * The Electro 7 OS 1.30 firmware uses the Stage 4 registry generation: a
 * table-driven registry (inlined in) of 251 parameters in 11
 * buffers. A new format, not an Electro 6 delta: each section has its own Fx
 * block, the program embeds a full synth preset, and there are 3 drawbar sets
 * and 2 organ layers.
 *
 * Block order (medium): from the program-archive tree (static
 * initialiser) — Common; Organ folder (Organ, Fx, OrganLayer ×2,
 * OrganDrawbars ×3); Piano folder (Piano, Fx); Synth folder (Synth,
 * SynthPreset, Fx). Each buffer's computed size matches the bit total the
 * firmware declares. A knob with encoding kind 3 (levels, effect rates and
 * amounts, filter frequency, FM amount) is followed by two 1-bit morph slots,
 * read as `<field>.pedalAssign` and `<field>.wheelAssign` (slot order high,
 * which slot is pedal and which is wheel medium). Negative values are two's
 * complement in the field width (the registry builder sets the signed mode;
 * value − min would put 75 factory values out of range). Predicted body 353
 * bytes (397-byte file). The order is NOT yet confirmed on a real file, and partial saves may
 * omit folders — such a file fails the block-count check and
 * shows the header only.
 */
import type { FwProgram } from '../clavia/block-chain';
import type { Ne7FieldKey } from './layout.generated';

export type { Ne7FieldKey };

export interface Ne7Program extends FwProgram<Ne7FieldKey> {
  readonly format: 'ne7p';
}
