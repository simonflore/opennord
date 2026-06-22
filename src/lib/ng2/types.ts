/**
 * Nord Grand 2 (`.ng2p`) program model.
 *
 * Confirmed fields (corpus RE, 2026-06-22, 20 fixtures × 229 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, version @0x14 (1.02)
 *   - Compact header cluster at body[5-8]
 *   - Four symmetric A/B layer pairs at body[22/36], [50/72], [100/121], [142/164]
 *
 * The symmetric pair structure is the most distinctive feature of this format:
 * each 9-, 16-, or 14-byte cluster at offset N has a near-identical mirror
 * at offset N+14 to N+22. This strongly suggests Layer A / Layer B architecture
 * (the Grand 2 supports layering two piano sounds).
 *
 * Source: 20-file corpus statistical analysis (2026-06-22).
 */

export interface Ng2Program {
  readonly parsed: true;
  readonly version: string;
  /** body[5-8] — 4 bytes. Global / header parameters. */
  readonly _clusterA: Uint8Array;
  /** body[22-30] — 9 bytes. Layer A, sound selection / primary params. */
  readonly _clusterB1: Uint8Array;
  /** body[36-44] — 9 bytes. Layer B mirror of B1. */
  readonly _clusterB2: Uint8Array;
  /** body[50-65] — 16 bytes. Layer A, extended parameters. */
  readonly _clusterC1: Uint8Array;
  /** body[72-87] — 16 bytes. Layer B mirror of C1. */
  readonly _clusterC2: Uint8Array;
  /** body[100-113] — 14 bytes. Layer A, effects / output. */
  readonly _clusterD1: Uint8Array;
  /** body[121-134] — 14 bytes. Layer B mirror of D1. */
  readonly _clusterD2: Uint8Array;
  /** body[142-157] — 16 bytes. Layer A, final section. */
  readonly _clusterE1: Uint8Array;
  /** body[164-179] — 16 bytes. Layer B mirror of E1. */
  readonly _clusterE2: Uint8Array;
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
