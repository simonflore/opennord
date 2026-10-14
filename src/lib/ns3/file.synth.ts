/**
 * Synthetic Stage 3 files for tests and dev tooling (editing a real `.ns3f`
 * goes through program-write.ts). A body is framed the way the firmware writes
 * it — u32 format version, then the 19 length-prefixed blocks of `NS3_LAYOUT` —
 * so the block-chain reader accepts it. Pure.
 */
import { CBIN_BODY_OFFSET, buildCbinHeader } from '../clavia/cbin';
import { synthFwBody, synthFwFile, writeBits } from '../clavia/block-chain.synth';
import { NS3_LAYOUT, type Ns3FieldKey } from './layout.generated';

/** File size of an NSM-era `.ns3f`: the 44-byte header plus the 548-byte body. */
export const NS3_FILE_BYTES = CBIN_BODY_OFFSET + NS3_LAYOUT.bodyBytes;

/**
 * Write the Stage 3 framing (format version + every block length) into `bytes`
 * at `bodyOffset`, leaving the field bits alone. `bytes` must end where the body
 * ends. Returns `bytes`.
 */
export function frameNs3Body(bytes: Uint8Array, bodyOffset = CBIN_BODY_OFFSET, formatVersion = 304): Uint8Array {
  if (bytes.length !== bodyOffset + NS3_LAYOUT.bodyBytes) {
    throw new Error(`a Stage 3 file with its body at ${bodyOffset} is ${bodyOffset + NS3_LAYOUT.bodyBytes} bytes, got ${bytes.length}`);
  }
  const body = bytes.subarray(bodyOffset);
  writeBits(body, 0, 32, formatVersion);
  for (const blk of NS3_LAYOUT.blocks) body[blk.offset] = blk.length;
  return bytes;
}

/** An NSM-era `.ns3f` (formatType 1) whose fields are all zero bits — for poking absolute offsets. */
export function ns3ZeroFile(formatVersion = 304): Uint8Array {
  const out = new Uint8Array(NS3_FILE_BYTES);
  out.set(buildCbinHeader({ formatType: 1, tag: 'ns3f', bank: 0, location: 0, category: 0, versionRaw: formatVersion }));
  return frameNs3Body(out, CBIN_BODY_OFFSET, formatVersion);
}

/** An NSM-era `.ns3f` with every field at its firmware default, overridden by `values`. */
export function ns3SynthFile(values: Partial<Record<Ns3FieldKey, number>> = {}, formatVersion = 304): Uint8Array {
  return synthFwFile('ns3f', synthFwBody(NS3_LAYOUT, values, formatVersion), formatVersion);
}

/**
 * A `.ns3y` synth preset the way the Nord saves one: the header, the u32 format
 * version, then `program`'s Synth (A) block as it stands (ns3/preset.ts).
 */
export function ns3SynthPresetFile(program: Uint8Array = ns3SynthFile(), formatVersion = 300): Uint8Array {
  const blk = NS3_LAYOUT.blocks.find((b) => b.key === 'synthA')!;
  const from = CBIN_BODY_OFFSET + blk.offset;
  const out = new Uint8Array(CBIN_BODY_OFFSET + 4 + 1 + blk.length);
  out.set(buildCbinHeader({ formatType: 1, tag: 'ns3y', bank: 0, location: 0, category: 0, versionRaw: formatVersion }));
  writeBits(out, CBIN_BODY_OFFSET * 8, 32, formatVersion);
  out.set(program.subarray(from, from + 1 + blk.length), CBIN_BODY_OFFSET + 4);
  return out;
}
