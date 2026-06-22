/**
 * Nord Electro 4 (`.ne4p`) program model.
 *
 * Confirmed fields (corpus RE, 2026-06-22, 16 fixtures × 136 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, versionRaw @0x14 (=103 → 1.03, all files)
 *   - Body 92 bytes; very sparse — 33/92 bytes vary; long zero-padding runs between params
 *   - Varying blocks: body[0], [16-21], [37-45], [51-63], [68], [79], [90-91]
 *   - Drawbar candidates: body[51-63] (13 bytes = 26 nibbles — upper+lower drawbars)
 *
 * Source: 16-file corpus statistical analysis (2026-06-22).
 */
export interface Ne4Program {
  readonly parsed: true;
  readonly version: string;
  /** Category/type byte: body[0] */
  readonly _byte0: number;
  /** Organ section params: body[16-21] (6 bytes) */
  readonly _clusterA: Uint8Array;
  /** Second param block: body[37-45] (9 bytes) */
  readonly _clusterB: Uint8Array;
  /** Third param block: body[51-63] (13 bytes). Organ section or sample routing. */
  readonly _clusterC: Uint8Array;
  /** Sparse tail params: body[68], body[79], body[90-91] */
  readonly _tail: Uint8Array;
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
