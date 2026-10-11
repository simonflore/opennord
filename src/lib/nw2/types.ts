/**
 * Nord Wave 2 (`.nw2p`) program model.
 *
 * The Wave 2 OS 1.24 firmware uses the Stage 3 registry generation (registry
 *, 213 parameters; Multi format reads 3.00–3.01):
 *
 *   body 0-3      u32 format version (the fixtures carry 3.01)
 *   body 4-67     MultiCommon (length byte 0x3f + 63 bytes): slot focus/enable,
 *                 splits, transpose, master clock, per-slot level and pan
 *   body 68+244k  slot k (A-D), ten length-prefixed blocks (sub-chain
 *): Common (osc), Arp, LFO, Flt, AmpEnv, Fx, EQ,
 *                 Dly, Rvb, Vib
 *
 * Negative-min fields are two's complement in their width (registry init
 *, signed mode 0). Morphable parameters carry 5 deltas (encoding
 * kind 6) or 1 delta (kind 2) after their base value, each one bit wider; the
 * layout reads the base values only — the delta encoding of morph buffer 1 is
 * not reconciled yet, so no deltas are
 * decoded. Fields come from the generated layout (`layout.generated.ts`).
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
