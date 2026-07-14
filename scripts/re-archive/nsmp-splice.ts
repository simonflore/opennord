/**
 * Splice test (research): take a real `.nsmp4`, decode each stroke's audio and
 * RE-ENCODE it with OpenNord's codec-4 encoder, then reassemble into the original
 * container (real map, real stroke headers) with sizes + CRC fixed. If the Stage 4
 * plays the result, our encoder is byte-compatible — independent of the container
 * fields we template in writeNsmp. Output: <input>_respliced.nsmp4.
 *
 * Usage: npx tsx scripts/nsmp-splice.ts research/nsmp/Strings.nsmp4
 * User's own sample only (docs/LEGAL.md) — never factory content.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { readNsmp, parseNsmpSections, type NsmpSection } from '../src/lib/ns4/nsmp';
import { decodeStroke } from '../src/lib/ns4/nsmp-codec';
import { encodeStroke } from '../src/lib/ns4/nsmp-encode';
import { patchNs4Checksum } from '../src/lib/ns4/checksum';

const inPath = process.argv[2] ?? 'research/nsmp/Strings.nsmp4';
const bytes = new Uint8Array(readFileSync(inPath));
const file = readNsmp(bytes);
const wordInterleaved = file.codec === 4;
const sections = parseNsmpSections(bytes);

/** Find a stroke's block-stream start + channel count (the prefix is its header). */
function locateStroke(section: NsmpSection): { start: number; nCh: number; channels: Int32Array[] } | null {
  const bounded = bytes.subarray(0, section.endOffset);
  const BOUND = 1 << 26;
  for (let hdr = 0x60; hdr <= 0x180; hdr += 4) {
    const start = section.payloadOffset + hdr;
    if (start >= section.endOffset) break;
    for (const nCh of [1, 2]) {
      let r;
      try { r = decodeStroke(bounded, start, nCh, { wordInterleaved }); } catch { continue; }
      const peak = r.channels[0].reduce((m, x) => Math.max(m, Math.abs(x)), 0);
      if (r.endOffset >= section.endOffset - 8 && peak < BOUND && r.channels[0].length > 100) {
        return { start, nCh, channels: r.channels };
      }
    }
  }
  return null;
}

const concat = (parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

const parts: Uint8Array[] = [bytes.subarray(0, 0x2c)]; // CBIN envelope
let resplicedStrokes = 0;
for (const s of sections) {
  const headerStart = s.payloadOffset - 12;
  const secHeader = bytes.subarray(headerStart, s.payloadOffset); // tag(4)+ver(4)+size(4)
  if (!s.tag.endsWith('stk')) {
    parts.push(secHeader, bytes.subarray(s.payloadOffset, s.endOffset)); // verbatim
    continue;
  }
  const loc = locateStroke(s);
  if (!loc) { // couldn't decode — keep original
    parts.push(secHeader, bytes.subarray(s.payloadOffset, s.endOffset));
    continue;
  }
  const strokeHdr = bytes.subarray(s.payloadOffset, loc.start); // real stroke header, kept
  const reencoded = encodeStroke(loc.channels, { wordInterleaved });
  const newPayload = concat([strokeHdr, reencoded]);
  const hdr = new Uint8Array(12);
  hdr.set(secHeader.subarray(0, 8)); // tag + version unchanged
  new DataView(hdr.buffer).setUint32(8, newPayload.length, false); // new size
  parts.push(hdr, newPayload);
  resplicedStrokes++;
  const origBlockBytes = s.endOffset - loc.start;
  console.log(`  stk: ${loc.nCh}ch ${loc.channels[0].length} smp/ch | orig block ${origBlockBytes}B -> reencoded ${reencoded.length}B`);
}

const out = patchNs4Checksum(concat(parts));
const outPath = inPath.replace(/\.nsmp4$/, '_respliced.nsmp4');
writeFileSync(outPath, out);
console.log(`respliced ${resplicedStrokes} strokes -> ${outPath} (${out.length} bytes, was ${bytes.length})`);
