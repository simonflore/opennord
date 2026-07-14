/**
 * Discovery aid: which bytes of a `.nsmp` body the decoder currently explains,
 * and the unclaimed gaps — candidate homes for the richer `.nsmpproj` fields
 * (EQ, imaging, fades, envelope, velocity-min) we have not yet located in the
 * binary. Mirrors the ns4 coverage workflow (src/lib/ns4/coverage.ts). Pure.
 */
import { parseNsmpSections, readNsmp, readNsmpZones, zoneRecordLayout } from './nsmp';

export interface ByteRange { start: number; end: number }

/** Every byte range the decoder currently accounts for, sorted & merged. */
export function nsmpClaimedRegions(bytes: Uint8Array): ByteRange[] {
  const out: ByteRange[] = [];
  const sections = parseNsmpSections(bytes);
  for (const s of sections) {
    out.push({ start: s.payloadOffset - 12, end: s.payloadOffset }); // 12B section header
  }
  const map = sections.find((s) => s.tag.endsWith('map'));
  if (map) {
    out.push({ start: map.payloadOffset, end: map.payloadOffset + 6 }); // global level/detune
    const codec = readNsmp(bytes).codec ?? 0;
    const rowLen = codec >= 4 ? 10 : 6;
    const afterNotes = map.payloadOffset + 6 + 128 * rowLen;
    out.push({ start: map.payloadOffset + 6, end: afterNotes }); // per-note block
    // The block before the zone records: codec-4 = 31B SampleUnison + 1B count;
    // codec-3 = just the 1B count. (readSampleUnison / readNsmpZones.)
    out.push({ start: afterNotes, end: afterNotes + (codec >= 4 ? 32 : 1) });
    const layout = zoneRecordLayout(codec);
    void layout; // (offsets within each 16B record are claimed by the record range)
    for (const z of readNsmpZones(bytes)) {
      if (z.recordOffset > 0) out.push({ start: z.recordOffset, end: z.recordOffset + 16 });
    }
  }
  // `stk` headers: the 4 loop pointers + the partly-known prefix (0x00..0x30).
  for (const s of sections.filter((x) => x.tag.endsWith('stk'))) {
    out.push({ start: s.payloadOffset, end: s.payloadOffset + 0x31 });
  }
  return mergeSorted(out);
}

/** Unclaimed ranges ≥4 bytes that fall inside a section (not the audio tail). */
export function nsmpGapRanges(bytes: Uint8Array): ByteRange[] {
  const claimed = nsmpClaimedRegions(bytes);
  const sections = parseNsmpSections(bytes);
  const gaps: ByteRange[] = [];
  for (const s of sections) {
    let cursor = s.payloadOffset;
    for (const c of claimed) {
      if (c.end <= s.payloadOffset || c.start >= s.endOffset) continue;
      if (c.start > cursor) gaps.push({ start: cursor, end: Math.min(c.start, s.endOffset) });
      cursor = Math.max(cursor, c.end);
    }
    if (cursor < s.endOffset) gaps.push({ start: cursor, end: s.endOffset });
  }
  return gaps.filter((g) => g.end - g.start >= 4);
}

function mergeSorted(ranges: ByteRange[]): ByteRange[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: ByteRange[] = [];
  for (const r of sorted) {
    const last = merged.at(-1);
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else merged.push({ ...r });
  }
  return merged;
}
