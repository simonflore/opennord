/**
 * Nord Electro 5 (`.ne5p`) program model.
 *
 * Confirmed fields (corpus RE, 2026-06-22, 13 fixtures × 147 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, versionRaw @0x14 (=4 → 0.04, all files)
 *   - Body 103 bytes; 62/103 bytes vary, many nibble-range blocks
 *   - Dense nibble-packed drawbar region around body[35-77]:
 *     many individual and grouped nibble bytes → upper/lower/pedal drawbars
 *   - Constant: body[1-5]=0, body[14-16]=0, body[52-54]=0, body[62-70]=0, body[75-76]=8 (=0x08)
 *
 * Source: 13-file corpus statistical analysis (2026-06-22).
 */
export interface Ne5Program {
  readonly parsed: true;
  readonly version: string;
  /** Type/mode byte: body[0] */
  readonly _byte0: number;
  /** Voice/category params: body[6-13] (8 bytes) */
  readonly _clusterA: Uint8Array;
  /** Pre-drawbar params: body[17-33] (17 bytes, sparse) */
  readonly _clusterB: Uint8Array;
  /**
   * Drawbar nibble region: body[35-81] (47 bytes).
   * Contains nibble-packed drawbar values (confirmed by all-nibble-range detection).
   * Exact upper/lower/pedal mapping TBD via differential RE.
   */
  readonly _drawbars: Uint8Array;
  /** Post-drawbar params: body[83-102] (20 bytes) */
  readonly _clusterC: Uint8Array;
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
