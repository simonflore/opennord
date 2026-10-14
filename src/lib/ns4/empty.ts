/**
 * An empty Stage 4 program: a new `.ns4p` built from nothing but the firmware's
 * own parameter registry — every setting it lists at the firmware default, the
 * body framed the way OS 1.66's program archive writes it (format 3.13). No
 * donor program, so nothing of anyone's sound comes along.
 *
 * **Not yet loaded on a keyboard.** The registry layout (layout.generated.ts)
 * lists about 91% of the body's bits; the rest are padding — except a handful
 * that real programs do set (in the Common, Organ, Synth and Synth Sound blocks)
 * and the layout doesn't name yet. Those are zero here. Whether the instrument
 * takes zero for them is the open question; the maintainers’ notes has the
 * check. Until then the product marks a program made this way as experimental.
 */
import { buildCbinHeader, CBIN_BODY_OFFSET } from '../clavia/cbin';
import { buildFwBody } from '../clavia/block-chain';
import { patchNs4Checksum } from '../clavia/checksum';
import { NS4_LAYOUT } from './layout.generated';

/** The body format the empty program is written in: what OS 1.66 writes. */
export const EMPTY_PROGRAM_FORMAT = 313;

/** CBIN category 17, "None" — the category a program without one carries. */
const CATEGORY_NONE = 17;

export function emptyNs4Program(): Uint8Array {
  const body = buildFwBody(NS4_LAYOUT, {}, EMPTY_PROGRAM_FORMAT);
  const out = new Uint8Array(CBIN_BODY_OFFSET + body.length);
  out.set(buildCbinHeader({
    formatType: 1, tag: 'ns4p', bank: 0, location: 0, category: CATEGORY_NONE, versionRaw: EMPTY_PROGRAM_FORMAT,
  }));
  out.set(body, CBIN_BODY_OFFSET);
  return patchNs4Checksum(out);
}
