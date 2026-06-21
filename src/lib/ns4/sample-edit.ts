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
import type { NsmpFile, NsmpZone, DecodedStrokeResult } from './nsmp';
import { parseNsmpSections, readNsmp, zoneRecordLayout, patchStrokeLoopBytes } from './nsmp';
import { writeNsmpMulti, type WriteZone } from './nsmp-write';
import { patchNs4Checksum } from '../clavia/checksum';

export interface EditZone {
  rootKey: number;
  keyLow: number;
  keyHigh: number;
  /** Top velocity of the layer (velMax). */
  velTop: number;
  /** Bottom velocity of the layer (velMin). */
  velLow: number;
  /** Byte offset of this zone's 16-byte record in the source file (for in-place patching). */
  recordOffset?: number;
}

export interface EditModel {
  name: string;
  zones: EditZone[];
  /** Optional loop-point edits, by `stk` payload offset (absolute pointers). */
  loops?: Array<{ stkPayloadOffset: number; loopInAbs: number; loopOutAbs: number }>;
}

/** Build the editable model from a loaded file + its zone map. */
export function editModel(file: NsmpFile, zones: NsmpZone[]): EditModel {
  return {
    name: file.name ?? 'Sample',
    zones: zones.map((z) => ({
      rootKey: z.rootKey, keyLow: z.keyLow, keyHigh: z.keyHigh,
      velTop: z.velTop, velLow: z.velLow, recordOffset: z.recordOffset,
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
 */
export function patchEditedNsmp(original: Uint8Array, model: EditModel): Uint8Array {
  const out = original.slice();
  const layout = zoneRecordLayout(readNsmp(out).codec);
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
  patchName(out, model.name);
  return patchNs4Checksum(out);
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
