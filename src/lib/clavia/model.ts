/**
 * The model-codec seam. OpenNord reads a whole family of Nord files that share
 * the CBIN container (clavia/cbin.ts) but differ in their parameter *body*. A
 * `ModelCodec` pairs the tags/version that identify a model with the decoder for
 * its body. The shared layer defines only this interface — it never imports a
 * concrete codec, so the dependency direction stays model → clavia. The codecs
 * are assembled in the composition root (`src/lib/formats.ts`).
 *
 * Today only the Stage 4 codec exists (ns4/codec.ts). Stage 2/3 body decoders
 * (the maintainers’ notes, Tier 2) plug in here without touching the container.
 */

/**
 * Which Nord model a file belongs to.
 * Stage:   ns2 / ns3 / ns4
 * Electro: ne3 (Electro 3 / 3 HP) / ne4 / ne5 / ne6 / ne7
 * Piano:   np4 / np5 / np6 / ng (Grand) / ng2
 * Organ:   no3 / nc2 (C2D)
 * Wave:    nw1 / nw2
 * Lead:    nl4 / nla
 * New models added as corpus RE produces skeleton decoders.
 */
export type ClaviaModel =
  | 'ns4' | 'ns3' | 'ns2'
  | 'ne3' | 'ne4' | 'ne5' | 'ne6' | 'ne7'
  | 'np4' | 'np5' | 'np6' | 'ng' | 'ng2'
  | 'no3' | 'nc2'
  | 'nw1' | 'nw2'
  | 'nl4' | 'nla'
  | 'unknown';

/**
 * A decoder for one model's program body. `tags` are the CBIN file-type tags it
 * claims (e.g. `ns4p`/`ns4l`); the optional `versionRange` (inclusive, on the
 * raw ×100 CBIN version) gates by firmware era the way NSM's `CFileSpec`
 * partition list does.
 */
export interface ModelCodec<P> {
  readonly model: ClaviaModel;
  readonly tags: readonly string[];
  readonly versionRange?: readonly [number, number];
  decode(bytes: Uint8Array): P;
}
