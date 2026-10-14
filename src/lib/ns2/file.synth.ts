/**
 * Synthetic Stage 2 files for tests: a program with every field at its default
 * (overridden by `values`), and a `.ns2s` synth preset cut from one. Pure.
 */
import { buildCbinHeader, CBIN_BODY_OFFSET } from '../clavia/cbin';
import { synthLegacyLayoutFile, writeBits } from '../clavia/block-chain.synth';
import { NS2_LAYOUT, type Ns2FieldKey } from './layout.generated';

/** An NSM-era `.ns2p` (565 bytes) with every field at its default, overridden by `values`. */
export function ns2SynthFile(values: Partial<Record<Ns2FieldKey, number>> = {}): Uint8Array {
  return synthLegacyLayoutFile('ns2p', NS2_LAYOUT, values, { nsmHeader: true });
}

/** Data byte where slot A's synth container starts (record bit 1416). */
export const NS2_SYNTH_CONTAINER_BYTE = 1416 / 8;

/**
 * A `.ns2s` synth preset the way the Nord saves one (78 bytes): the NSM-era header,
 * the u16 record version, then slot A's 32-byte synth container of `program` (an NSM-era `.ns2p`).
 */
export function ns2SynthPresetFile(program: Uint8Array = ns2SynthFile(), version = 6): Uint8Array {
  const from = CBIN_BODY_OFFSET + 2 + NS2_SYNTH_CONTAINER_BYTE;
  const out = new Uint8Array(CBIN_BODY_OFFSET + 2 + 32);
  out.set(buildCbinHeader({ formatType: 1, tag: 'ns2s', bank: 0, location: 0, category: 0, versionRaw: version }));
  writeBits(out, CBIN_BODY_OFFSET * 8, 16, version);
  out.set(program.subarray(from, from + 32), CBIN_BODY_OFFSET + 2);
  return out;
}
