/**
 * Nord Wave (`.nwp`) program model.
 *
 * Confirmed fields (corpus RE, 2026-06-22, 1018 fixtures × 350 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, versionRaw @0x14 (6/7/8)
 *   - Body 306 bytes, four varying parameter clusters separated by zero-padding.
 *   - Zero-padding blocks: body[76]=const, body[116-139]=0 (24 b), body[256-279]=0 (24 b), body[290-302]=0 (13 b)
 *
 * Source: 1018-file corpus statistical analysis (2026-06-22).
 */
export interface Nw1Program {
  readonly parsed: true;
  readonly version: string;
  /** First parameter cluster: body[0-75] (76 bytes). Oscillator/voice params. */
  readonly _clusterA: Uint8Array;
  /** Second parameter cluster: body[77-115] (39 bytes). */
  readonly _clusterB: Uint8Array;
  /** Third parameter cluster: body[140-255] (116 bytes). Largest block. */
  readonly _clusterC: Uint8Array;
  /** Tail clusters: body[280-305] (26 bytes, includes small internal gaps). */
  readonly _clusterTail: Uint8Array;
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
