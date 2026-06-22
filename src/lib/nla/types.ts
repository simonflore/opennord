/**
 * Nord Lead A1 Sound (`.nlas`) program model.
 *
 * Confirmed fields (corpus RE, 2026-06-22, 51 nlas fixtures × 123 bytes):
 *   - CBIN header: slot @0x0e, category @0x10, versionRaw @0x14 (=7, all files)
 *   - Body 79 bytes; almost entirely parameter data (70/79 bytes vary)
 *   - Constant blocks: body[32]=const(1b), body[48-50]=0(3b), body[53]=const(1b),
 *     body[61]=const(1b), body[71]=const(1b), body[74-75]=0(2b)
 *
 * Source: 51-file corpus statistical analysis (2026-06-22).
 */
export interface NlaProgram {
  readonly parsed: true;
  readonly version: string;
  /** Main parameter block: body[0-31] (32 bytes). Likely name/voice identity. */
  readonly _clusterA: Uint8Array;
  /** Second block: body[33-47] (15 bytes). */
  readonly _clusterB: Uint8Array;
  /** Remaining parameters: body[51-78] (28 bytes, with sparse constant gaps). */
  readonly _clusterC: Uint8Array;
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
