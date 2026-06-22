/**
 * Nord Lead 4 program model.
 *
 * Two file variants share this type, discriminated by `fileType`:
 *
 * `nl4s` (Sound, 343 bytes) — single voice / sound slot:
 *   - Cluster A: body[0-24] (25 bytes)
 *   - Cluster B: body[30-102] (73 bytes)
 *   - Cluster C: body[238-264] (27 bytes)
 *
 * `nl4p` (Program, 1295 bytes) — multi-slot structure (~315-byte repeating period):
 *   - 4 slot groups at body[0], [304], [619], [934]
 *   - Each group has a main varying block + large zero padding (~160-170 bytes)
 *
 * Source: corpus RE 2026-06-22 (101 nl4s + 26 nl4p fixtures).
 */
export interface Nl4Program {
  readonly parsed: true;
  readonly fileType: 'nl4s' | 'nl4p';
  readonly version: string;
  /** nl4s: first param block body[0-24] */
  readonly _clusterA?: Uint8Array;
  /** nl4s: main param block body[30-102] */
  readonly _clusterB?: Uint8Array;
  /** nl4s: tail param block body[238-264] */
  readonly _clusterC?: Uint8Array;
  /** nl4p: slot 0 params body[0-76] */
  readonly _slot0?: Uint8Array;
  /** nl4p: slot 1 params body[245-398] */
  readonly _slot1?: Uint8Array;
  /** nl4p: slot 2 params body[560-705] */
  readonly _slot2?: Uint8Array;
  /** nl4p: slot 3 params body[875-1014] */
  readonly _slot3?: Uint8Array;
  readonly _rawBody: Uint8Array;
  readonly warnings: readonly string[];
  bytes: Uint8Array;
  name?: string;
}
