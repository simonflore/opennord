/**
 * Nord Wave 2 (`.nw2p`) program model.
 *
 * The Wave 2 OS 1.24 firmware uses the Stage 3 registry generation (registry
 * FUN_c01106b8, 213 parameters; Multi format FUN_c010bfe4 reads 3.00–3.01):
 *
 *   body 0-3      u32 format version (the fixtures carry 3.01)
 *   body 4-67     MultiCommon (length byte 0x3f + 63 bytes): slot focus/enable,
 *                 splits, transpose, master clock, per-slot level and pan
 *   body 68+244k  slot k (A-D), ten length-prefixed blocks (sub-chain
 *                 FUN_c010bde0): Common (osc), Arp, LFO, Flt, AmpEnv, Fx, EQ,
 *                 Dly, Rvb, Vib
 *
 * Negative-min fields are two's complement in their width (registry init
 * FUN_c00a6e64, signed mode 0). Morphs (FUN_c00a5ed0): a parameter of kind 6
 * stores its base value and then five morph buffers, kind 2 the base and
 * buffer 1, kind 1 the base only; each buffer is one bit wider than the base.
 * The layout reads them as `<field>.morph<Source>`:
 *
 *   buffer 1  Impulse      absolute target, unsigned: 0 = no Impulse morph, else
 *                          target = stored + min − 1; while the Impulse button is
 *                          held it replaces the base value
 *   buffer 2  Wheel        continuous delta, stored as delta + (max − min),
 *   buffer 3  Pedal        within ±(max − min); the effective value is
 *   buffer 4  After Touch  base + ((Σ delta·position) + 64) >> 7, clamped to the
 *   buffer 5  Velocity     parameter's range (positions 0–127)
 *
 * The buffer order is high confidence, the source names medium-high (the
 * firmware's morph-source label table). Fields come from the generated layout
 * (`layout.generated.ts`).
 *
 * The earlier corpus-only reader (26 fixtures, 2026-06-22 / 2026-07-04) is
 * reconciled as follows: its 0xfe/0xff "source flag" at body 77+244k is the top
 * bit of OscBank (bank 4 = Samples) and its 10-bit "sample index" the low bits
 * of the 16-bit OscWave — both in slot k, so the bundle meta.xml cross-check
 * still holds. Its slots sat at 244k (not 68 + 244k), its "drawbars" at
 * 143+244k were GatePtnDur, a 32-bit gate-pattern word (the Wave 2 has no
 * drawbars), its slot "on/volume" head byte was the version word / block
 * framing, and its 68-byte "global tail" is the end of slot D. Slot enable,
 * level and pan live in MultiCommon.
 */
import type { FwProgram } from '../clavia/block-chain';
import type { Nw2FieldKey } from './layout.generated';

export type { Nw2FieldKey };

export interface Nw2Program extends FwProgram<Nw2FieldKey> {
  readonly format: 'nw2p';
}

/** A morph source, in morph-buffer order (buffers 1–5). */
export type Nw2MorphSource = 'Impulse' | 'Wheel' | 'Pedal' | 'After Touch' | 'Velocity';

/** The four voice slots. */
export type Nw2Slot = 'A' | 'B' | 'C' | 'D';

/** A slot's sound source (SingleX/Common). */
export interface Nw2SlotSource {
  /** Edt_Syn_kOscBank (0–4); 4 = Samples (Nord Sample Library). Labels for 0–3 unresolved. */
  readonly bank: number;
  readonly kind: 'oscillator' | 'sample';
  /**
   * Edt_Syn_kOscWave (16 bits, 0–4095): for a sample slot, the sample-list
   * position (bundle-verified: the same sample gives the same value across programs).
   */
  readonly wave: number;
}
