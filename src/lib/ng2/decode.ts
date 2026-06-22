/**
 * Nord Grand 2 (`.ng2p`) body decoder.
 *
 * Body offset: 0x2c (44). Body length: 185 bytes (229 − 44).
 *
 * ## Confirmed body structure (corpus RE, 2026-06-22, 20 fixtures)
 *
 * The body uses a TLV-style section layout: constant separator regions (whose
 * last byte is a section-type tag) precede every data cluster. Tag values equal
 * the payload size (0x05 = 1 byte, 0x0d = 9 bytes, 0x14 = 14 bytes,
 * 0x15 = 16 bytes). All data clusters appear as symmetric Layer A / Layer B
 * pairs at fixed body offsets.
 *
 * | Body range | Label                  | Status    |
 * |------------|------------------------|-----------|
 * | 5–8        | global header cluster  | candidate |
 * | 8 bit7     | layerB_activeFlag      | candidate |
 * | 16 bits7:5 | globalParam1 (0–7)     | candidate |
 * | 22–30      | layer A primary (9 B)  | candidate |
 * | 36–44      | layer B primary (9 B)  | candidate |
 * | 50–65      | layer A extended (16B) | candidate |
 * | 72–87      | layer B extended (16B) | candidate |
 * | 94 bits7:5 | globalParam2 (0–7)     | candidate |
 * | 100–113    | layer A effects (14 B) | candidate |
 * | 101        | Layer A piano model    | candidate |
 * | 121–134    | layer B effects (14 B) | candidate |
 * | 122        | Layer B piano model    | candidate |
 * | 142–157    | layer A final (16 B)   | candidate |
 * | 164–179    | layer B final (16 B)   | candidate |
 */

import type { Ng2LayerEffects, Ng2Program } from './types';

const BODY_OFFSET = 0x2c; // 44 — CBIN header length

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;

/**
 * Read a Layer effects cluster (ClusterD1 or ClusterD2, 14 bytes).
 * The most notable confirmed-candidate field is byte[1]: piano model index (1–18).
 */
function readLayerEffects(body: Uint8Array, clusterStart: number): Ng2LayerEffects {
  const raw = body.slice(clusterStart, clusterStart + 14);
  // byte[1] of the D cluster (body[101] for A, body[122] for B):
  // small-integer values 1–18, matching the Nord Grand 2 piano voice count.
  // Source: 20-file corpus differential analysis, 2026-06-22.
  const pianoModel = u8(body, clusterStart + 1);
  return { pianoModel, _raw: raw };
}

/** Decode a Nord Grand 2 program body (full file bytes including CBIN header). */
export function decodeNg2(bytes: Uint8Array): Ng2Program {
  const warnings: string[] = [];

  if (bytes.length < BODY_OFFSET) {
    warnings.push(`File too short: ${bytes.length} bytes (expected ≥ ${BODY_OFFSET})`);
  }

  const body = bytes.slice(BODY_OFFSET);

  // Version from CBIN header (versionRaw LE u16 at 0x14)
  const versionRaw = (bytes[0x14] ?? 0) | ((bytes[0x15] ?? 0) << 8);
  const version = (versionRaw / 100).toFixed(2);

  // ── Candidate global fields ──────────────────────────────────────────────

  // body[8] bit7: Layer B active / alternate mode flag.
  // Set in 4/20 corpus programs (Duet, Stacked, Subway, Tspoon).
  const layerBActiveFlag = (u8(body, 8) & 0x80) !== 0;

  // body[16] bits[7:5]: 3-bit global parameter (lower 5 bits always 0 in corpus).
  // Candidate: master transpose semitones or program-level category flag.
  const globalParam1 = (u8(body, 16) >>> 5) & 0x7;

  // body[94] bits[7:5]: 3-bit global parameter, same encoding as globalParam1.
  // Differs from globalParam1 in 14/20 corpus programs — tracks a separate value.
  const globalParam2 = (u8(body, 94) >>> 5) & 0x7;

  // ── Layer effects clusters (D1 / D2) ────────────────────────────────────

  // ClusterD1: body[100–113] — Layer A effects / audio parameters (14 bytes).
  // D1[1] = body[101] = Layer A piano model index (values 5,9,12,14,15,16 in corpus).
  const layerA = readLayerEffects(body, 100);

  // ClusterD2: body[121–134] — Layer B effects / audio parameters (14 bytes).
  // D2[1] = body[122] = Layer B piano model index (values 1–18 in corpus).
  const layerB = readLayerEffects(body, 121);

  return {
    parsed: true,
    version,
    layerBActiveFlag,
    globalParam1,
    globalParam2,
    layerA,
    layerB,
    // ── Named raw clusters for future RE ────────────────────────────────────
    // body[5-8]: global header cluster (ClusterA, 4 bytes)
    _globalHeaderCluster: body.slice(5, 9),
    // body[22-30]: layer A primary (ClusterB1, 9 bytes)
    _layerAPrimaryCluster: body.slice(22, 31),
    // body[36-44]: layer B primary (ClusterB2, 9 bytes)
    _layerBPrimaryCluster: body.slice(36, 45),
    // body[50-65]: layer A extended (ClusterC1, 16 bytes)
    _layerAExtendedCluster: body.slice(50, 66),
    // body[72-87]: layer B extended (ClusterC2, 16 bytes)
    _layerBExtendedCluster: body.slice(72, 88),
    // body[142-157]: layer A final (ClusterE1, 16 bytes)
    _layerAFinalCluster: body.slice(142, 158),
    // body[164-179]: layer B final (ClusterE2, 16 bytes)
    _layerBFinalCluster: body.slice(164, 180),
    _rawBody: body,
    bytes,
    warnings,
  };
}
