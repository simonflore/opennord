/**
 * Sample editing model — derive an editable view from a decoded .nsmp and write
 * the edits back. Pure: no DOM, no audio.
 *
 * v1 edits: name + per-zone root key / top key (split) / top velocity (layer).
 *
 * Two write paths:
 *  - {@link patchEditedNsmp} (the editor's default): patch the edited fields back
 *    into the *original* file in place and re-checksum. Preserves every byte we
 *    don't model (per-note levels, EQ, loops, imaging, fades, and the audio) — the
 *    safe path for editing real factory multisamples. Needs `recordOffset` per zone.
 *  - {@link buildEditedNsmp}: rebuild a fresh `.nsmp` from the decoded audio (for
 *    OpenNord-authored samples). Lossy — per-note levels/detune reset to unity and
 *    loops aren't carried — and pairs zones with strokes BY POSITION, so it's only
 *    correct when zone order matches stroke order (what `writeNsmpMulti` produces).
 */
import type { NsmpFile, NsmpZone, DecodedStrokeResult, NsmpSection } from './nsmp';
import { parseNsmpSections, readNsmp, readNsmpZones, zoneRecordLayout, patchStrokeLoopBytes } from './nsmp';
import { writeNsmpMulti, type WriteZone } from './nsmp-write';
import { level2DSP, detune2DSP } from './nw1-dsp';
import { patchNs4Checksum } from '../clavia/checksum';
import { crc16Ccitt } from './nsmp-og';

export interface EditZone {
  rootKey: number;
  keyLow: number;
  keyHigh: number;
  /** Top velocity of the layer (velMax). */
  velTop: number;
  /** Bottom velocity of the layer (velMin). */
  velLow: number;
  /** The stroke this zone plays, by global id (record +11 codec-3/4 / `stk` header +3
   *  or +0 legacy) — needed to locate the right `stk` header when patching legacy files.
   *  Populated by {@link editModel} for real files; only the legacy patch path reads it. */
  globalID?: number;
  /** Byte offset of this zone's 16-byte record in the source file (for in-place patching). */
  recordOffset?: number;
}

export interface EditModel {
  name: string;
  zones: EditZone[];
  /** Optional loop-point edits, by `stk` payload offset (absolute pointers). */
  loops?: Array<{ stkPayloadOffset: number; loopInAbs: number; loopOutAbs: number }>;
  /** Global gain in dB — written to the `map` global level when set. */
  globalGainDb?: number;
  /** Global detune in cents — written to the `map` global detune when set. */
  globalDetuneCents?: number;
}

/** Build the editable model from a loaded file + its zone map. */
export function editModel(file: NsmpFile, zones: NsmpZone[]): EditModel {
  return {
    name: file.name ?? 'Sample',
    zones: zones.map((z) => ({
      rootKey: z.rootKey, keyLow: z.keyLow, keyHigh: z.keyHigh,
      velTop: z.velTop, velLow: z.velLow, globalID: z.globalID, recordOffset: z.recordOffset,
    })),
  };
}

const clampKey = (n: number): number => Math.max(0, Math.min(127, Math.round(n))) & 0x7f;

/**
 * Patch the edited zone fields + name back into the original file bytes, then
 * re-checksum. Writes `rootKey`/`keyHigh`/`keyLow`/`velLow`/`velTop` at their
 * offsets in each zone's 16-byte record (the root-aligned {@link ZONE_LAYOUT},
 * shared across codec 3 & 4); everything else — audio, per-note data, the bytes we
 * don't decode — is preserved untouched. Zones without a `recordOffset` are
 * skipped. Renaming is capped to the stored name's length.
 *
 * Legacy (`NWS`-container, `.nsmp` v9/v10) files are structurally different — a
 * 12/15-byte stroke-reference zone record, root key living in the `stk` header
 * rather than the record, and their own CRC-16 instead of the NS4 checksum at
 * 0x18..0x1b (which in an `NWS` container is the **magic**, not a checksum slot) —
 * so they're delegated to {@link patchLegacyNsmp} rather than run through the
 * codec-3/4 path below.
 */
export function patchEditedNsmp(original: Uint8Array, model: EditModel): Uint8Array {
  const file = readNsmp(original);
  if (file.legacy) return patchLegacyNsmp(original, model);
  const out = original.slice();
  const layout = zoneRecordLayout(file.codec);
  for (const z of model.zones) {
    if (z.recordOffset == null) continue;
    const e = z.recordOffset;
    out[e + layout.velTop] = clampKey(z.velTop);
    out[e + layout.velLow] = clampKey(z.velLow);
    out[e + layout.rootKey] = clampKey(z.rootKey);
    out[e + layout.keyLow] = clampKey(z.keyLow);
    out[e + layout.keyHigh] = clampKey(z.keyHigh);
  }
  for (const lp of model.loops ?? []) {
    patchStrokeLoopBytes(out, lp.stkPayloadOffset, lp.loopInAbs, lp.loopOutAbs);
  }
  patchGlobalGainDetune(out, model.globalGainDb, model.globalDetuneCents);
  patchName(out, model.name);
  return patchNs4Checksum(out);
}

const rU32 = (b: Uint8Array, o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

/**
 * Patch root + split into a legacy (`NWS`) `.nsmp` in place, then re-CRC the OG way
 * and verify by read-back. Editable surface for this generation (docs/NSMP-CODEC.md):
 *  - `keyHigh` (split): map record (v9 `+6` u32 / v10 `+7` u8) **and** the `stk` header
 *    `+0x33` mirror — real files carry both copies in agreement, so a one-sided write
 *    desyncs them.
 *  - `rootKey`: `stk` header `+0x05`, located by the stroke's global id.
 *  - `keyLow`/`velTop`/`velLow`/`name`: no slot — not offered by the UI, ignored here.
 * Gated on the `map` version (9 or 10); anything else throws. Never changes length;
 * never calls `patchNs4Checksum` (0x18..0x1b is the `NWS` magic).
 */
export function patchLegacyNsmp(original: Uint8Array, model: EditModel): Uint8Array {
  const sections = parseNsmpSections(original);
  const map = sections.find((s) => s.tag.endsWith('map'));
  if (!map || (map.version !== 9 && map.version !== 10)) {
    throw new Error('This legacy .nsmp uses a sample-map version OpenNord can’t edit yet.');
  }
  const out = original.slice();

  // stk sections indexed by the reader's own key: v9's `NsmpZone.globalID` is the full
  // u24 gid and legacyStrokeRootByGlobalId (nsmp.ts) keys stk headers by the full u32 BE
  // at +0, so index v9 stk sections the same way — a low-byte-only key (as codec 3/4 use)
  // collides whenever two strokes share a low gid byte (e.g. 673 = 0x2A1 and 417 = 0x1A1),
  // landing the write on the wrong physical `stk`. v10's `NsmpZone.globalID` is the u8 low
  // byte and strokeRootByGlobalId keys by `bytes[payloadOffset + 3]`, so keep that keying
  // there — it already matches the reader.
  const stkByGid = new Map<number, NsmpSection>();
  for (const s of sections) {
    if (!s.tag.endsWith('stk')) continue;
    stkByGid.set(map.version === 9 ? rU32(original, s.payloadOffset) : original[s.payloadOffset + 3], s);
  }

  for (const z of model.zones) {
    if (z.recordOffset == null) continue;
    const keyHigh = clampKey(z.keyHigh);
    // map keyHigh — width by version. recordOffset points at the record start (Task 1).
    if (map.version === 9) { out[z.recordOffset + 6] = 0; out[z.recordOffset + 7] = 0; out[z.recordOffset + 8] = (keyHigh >>> 8) & 0xff; out[z.recordOffset + 9] = keyHigh & 0xff; }
    else out[z.recordOffset + 7] = keyHigh; // v10: single byte, exactly where parseCodec2ZoneRecords reads it
    // stk header: root @+0x05, keyHigh mirror @+0x33.
    const stk = z.globalID == null ? undefined : stkByGid.get(z.globalID);
    if (stk) { out[stk.payloadOffset + 0x05] = clampKey(z.rootKey); out[stk.payloadOffset + 0x33] = keyHigh; }
  }

  // OG re-CRC: CRC-16/CCITT over everything before the trailing 2-byte checksum, LE.
  const n = out.length - 2;
  const crc = crc16Ccitt(out.subarray(0, n));
  out[n] = crc & 0xff; out[n + 1] = (crc >>> 8) & 0xff;

  verifyLegacyPatch(original, out, model, map.version);
  return out;
}

/**
 * Read the patched bytes back with the corpus-validated reader and confirm the edits
 * took — the guard that makes an unvalidated v10 write safe (a wrong assumption becomes
 * an error, never a corrupt download). Would have caught both original bugs: the
 * ZONE_LAYOUT misapplication (zones read back wrong) and the CRC-over-magic
 * (`recognized` false).
 */
function verifyLegacyPatch(original: Uint8Array, out: Uint8Array, model: EditModel, mapVersion: number): void {
  const f = readNsmp(out);
  if (!f.recognized || !f.legacy) throw new Error('Legacy patch left the file unrecognizable — refusing to save.');
  const before = parseNsmpSections(original), after = parseNsmpSections(out);
  if (after.length !== before.length || after.some((s, i) => s.tag !== before[i].tag || s.size !== before[i].size)) {
    throw new Error('Legacy patch disturbed the section tree — refusing to save.');
  }
  const stored = out[out.length - 2] | (out[out.length - 1] << 8);
  if (stored !== crc16Ccitt(out.subarray(0, out.length - 2))) throw new Error('Legacy patch checksum failed to verify.');
  const back = new Map(readNsmpZones(out).map((z) => [z.globalID, z]));
  for (const z of model.zones) {
    if (z.recordOffset == null || z.globalID == null) continue;
    const got = back.get(z.globalID);
    const want = { root: clampKey(z.rootKey), high: clampKey(z.keyHigh) };
    if (!got || got.rootKey !== want.root || got.keyHigh !== want.high) {
      throw new Error('Legacy patch did not round-trip — refusing to save a file that may be corrupt.');
    }
    // stk +0x33 mirror must match the map keyHigh (the reader takes keyHigh from the map).
    // Same version-appropriate key as the write side: v9 full u32 @+0, v10 u8 low byte @+3.
    const stk = after.find((s) => s.tag.endsWith('stk')
      && (mapVersion === 9 ? rU32(out, s.payloadOffset) === z.globalID! : out[s.payloadOffset + 3] === z.globalID!));
    if (stk && out[stk.payloadOffset + 0x33] !== want.high) throw new Error('Legacy patch left the split mirror out of sync — refusing to save.');
  }
}

/** Big-endian u24 write at `o`. */
function writeU24(out: Uint8Array, o: number, v: number): void {
  out[o] = (v >>> 16) & 0xff; out[o + 1] = (v >>> 8) & 0xff; out[o + 2] = v & 0xff;
}

/**
 * Patch the `map` section's global level (dB → `Level2DSP`) and/or detune
 * (cents → `Detune2DSP`, written s24) in place. Each is written only when given,
 * so a model that edits just one leaves the other untouched.
 */
function patchGlobalGainDetune(out: Uint8Array, gainDb?: number, detuneCents?: number): void {
  if (gainDb == null && detuneCents == null) return;
  const map = parseNsmpSections(out).find((s) => s.tag.endsWith('map'));
  if (!map) return;
  const p = map.payloadOffset;
  if (gainDb != null) writeU24(out, p, level2DSP(gainDb) & 0xffffff);
  if (detuneCents != null) writeU24(out, p + 3, detune2DSP(detuneCents) & 0xffffff); // s24 (two's complement)
}

/**
 * Overwrite the stored name in the `hdr` section in place. Targets the first
 * printable run of length ≥2 — the same run {@link readName} reads back — and
 * may extend over the run's trailing NUL padding (bounded by the `hdr` section),
 * so a longer name fits the name field. Names longer than the field are truncated;
 * the file size never changes.
 */
function patchName(out: Uint8Array, name: string): void {
  const hdr = parseNsmpSections(out).find((s) => s.tag.endsWith('hdr'));
  if (!hdr) return;
  const limit = Math.min(hdr.endOffset, out.length);
  let start = -1;
  let len = 0;
  for (let i = hdr.payloadOffset; i < limit; i++) {
    const c = out[i];
    if (c >= 0x20 && c < 0x7f) { if (start < 0) start = i; len++; }
    else if (len >= 2) break;
    else { start = -1; len = 0; }
  }
  if (start < 0 || len < 2) return;
  // The name field = the printable run + its trailing NUL padding (available space).
  let span = len;
  while (start + span < limit && out[start + span] === 0) span++;
  const ascii = name.trim();
  for (let i = 0; i < span; i++) out[start + i] = i < ascii.length ? (ascii.charCodeAt(i) & 0x7f) : 0;
}

/**
 * Rebuild a fresh `.nsmp` from the edited model + the original decoded audio. Zone
 * `i` uses decoded stroke `i` (positional — see the module note). Throws if a zone
 * has no matching stroke. Prefer {@link patchEditedNsmp} for editing loaded files.
 */
export function buildEditedNsmp(model: EditModel, decoded: DecodedStrokeResult[], codec: 3 | 4): Uint8Array {
  const zones: WriteZone[] = model.zones.map((z, i) => {
    const stroke = decoded[i];
    if (!stroke) throw new Error(`no decoded audio for zone ${i}`);
    return { channels: stroke.channels, keyHigh: z.keyHigh, keyLow: z.keyLow, rootKey: z.rootKey, velTop: z.velTop, velLow: z.velLow };
  });
  return writeNsmpMulti({ name: model.name, zones, codec });
}
