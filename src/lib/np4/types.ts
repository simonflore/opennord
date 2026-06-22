/**
 * Nord Piano 4 (`.np4p`) program model.
 *
 * Confirmed fields (corpus RE, 2026-06-22, 6 fixtures × 134 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, version @0x14 (1.00)
 *   - Three parameter clusters at body[17-25], [35-47], [59-72]
 *
 * All body fields outside the clusters are constant across the corpus and
 * left as implicit zeroed regions. Clusters are exposed as raw bytes for
 * future differential RE.
 *
 * Source: 6-file corpus statistical analysis (2026-06-22).
 */

export interface Np4Program {
  readonly parsed: true;
  /** Program version string, e.g. "1.00". */
  readonly version: string;
  /** body[17-25] — 9 bytes, up to 4 unique values. Piano engine / sound selection candidate. */
  readonly _clusterA: Uint8Array;
  /** body[35-47] — 13 bytes, richest variation. Piano parameters (touch, release, etc.) candidate. */
  readonly _clusterB: Uint8Array;
  /** body[59-72] — 14 bytes. Effects / output section candidate. */
  readonly _clusterC: Uint8Array;
  /** Full raw body for RE tooling. */
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
