/**
 * The model-codec seam. OpenNord reads a whole family of Nord files that share
 * the CBIN container (clavia/cbin.ts) but differ in their parameter *body*. A
 * `ModelCodec` pairs the tags/version that identify a model with the decoder for
 * its body. The shared layer defines only this interface — it never imports a
 * concrete codec, so the dependency direction stays model → clavia. The codecs
 * are assembled in the composition root (`src/lib/formats.ts`).
 *
 * Today only the Stage 4 codec exists (ns4/codec.ts). Stage 2/3 body decoders
 * (docs/MULTI-MODEL.md, Tier 2) plug in here without touching the container.
 */

/** Which Nord generation a file belongs to. */
export type ClaviaModel = 'ns4' | 'ns3' | 'ns2' | 'unknown';

/**
 * A decoder for one model's program body. `tags` are the CBIN file-type tags it
 * claims (e.g. `ns4p`/`ns4l`); the optional `versionRange` (inclusive, on the
 * raw ×100 CBIN version) gates by firmware era the way NSM's `CFileSpec`
 * partition list does (docs/NSP-FORMAT.md).
 */
export interface ModelCodec<P> {
  readonly model: ClaviaModel;
  readonly tags: readonly string[];
  readonly versionRange?: readonly [number, number];
  decode(bytes: Uint8Array): P;
}
