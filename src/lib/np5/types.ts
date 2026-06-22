/**
 * Nord Piano 5 (`.np5p`) program model.
 *
 * Confirmed fields (corpus RE, 2026-06-22, 25 fixtures × 281 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, version @0x14 (1.01)
 *   - Six parameter clusters at body[5-7], [18-32], [58-66], [90-98], [122-135], [180-193]
 *
 * The repeating cluster structure (pairs C/D at similar sizes, pairs E/F)
 * suggests the Piano 5's multi-layer sound architecture.
 *
 * Source: 25-file corpus statistical analysis (2026-06-22).
 */

export interface Np5Program {
  readonly parsed: true;
  readonly version: string;
  /** body[5-7] — 3 bytes. Compact header field (sound selection / flags). */
  readonly _clusterA: Uint8Array;
  /** body[18-32] — 15 bytes. Primary piano parameters candidate. */
  readonly _clusterB: Uint8Array;
  /** body[58-66] — 9 bytes. */
  readonly _clusterC: Uint8Array;
  /** body[90-98] — 9 bytes. Mirror of C — second layer candidate. */
  readonly _clusterD: Uint8Array;
  /** body[122-135] — 14 bytes. Effects / EQ candidate. */
  readonly _clusterE: Uint8Array;
  /** body[180-193] — 14 bytes. Mirror of E — second layer effects candidate. */
  readonly _clusterF: Uint8Array;
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
