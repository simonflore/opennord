/**
 * Nord Sample (`.nsmp`) container **writer** — assembles a single-stroke codec-3
 * sample from PCM, so OpenNord can create a `.nsmp` file from a user's own audio.
 *
 * Structure mirrors what `readNsmp` parses (`docs/NSMP-CODEC.md`): the shared
 * `CBIN` envelope + a flat section sequence `NSMP → hdr → cat → map → stk → sty
 * → meta`, each `[tag:u32 BE][version:u32 BE][size:u32 BE][payload]`. The `stk`
 * section carries a stroke header + the {@link encodeStroke} block stream.
 *
 * Validated by **round-trip through our own reader** (`nsmp-write.test.ts`):
 * `decodeNsmp(writeNsmp(pcm))` returns the input PCM. Acceptance *on a real
 * keyboard* additionally needs the exact stroke-header fields (loop points, norm
 * gain, sample length — still being decoded) and the per-zone `map` content;
 * those are templated here and flagged as the remaining work + a hardware test.
 *
 * ⚠️ SCOPE (docs/LEGAL.md): the user's own audio only — local sample creation,
 * never factory content.
 */

import { encodeStroke, type EncodeOptions } from './nsmp-encode';
import { patchNs4Checksum } from './checksum';

const CBIN_HEADER_SIZE = 0x2c;
const STROKE_HEADER_SIZE = 0xb0; // observed; the block stream begins after it

/** Build one `[tag][version][size][payload]` section (tag NUL-left-padded to 4). */
function section(tag: string, version: number, payload: Uint8Array): Uint8Array {
  const head = new Uint8Array(12 + payload.length);
  const dv = new DataView(head.buffer);
  const t = tag.padStart(4, '\0');
  for (let i = 0; i < 4; i++) head[i] = t.charCodeAt(i);
  dv.setUint32(4, version, false);
  dv.setUint32(8, payload.length, false);
  head.set(payload, 12);
  return head;
}

function asciiPad(s: string, len: number, at = 0): Uint8Array {
  const b = new Uint8Array(len);
  for (let i = 0; i < s.length && at + i < len; i++) b[at + i] = s.charCodeAt(i) & 0x7f;
  return b;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

export interface WriteNsmpOptions extends EncodeOptions {
  /** Sample name (stored in the `hdr` section; ASCII, truncated to fit). */
  name: string;
  /** Per-channel integer PCM (mono or stereo). */
  channels: ArrayLike<number>[];
}

/**
 * Assemble a single-stroke codec-3 `.nsmp` from PCM. Returns the complete file
 * bytes (CRC-32 patched). Round-trips through `readNsmp`/`decodeNsmp`.
 */
export function writeNsmp(opts: WriteNsmpOptions): Uint8Array {
  const { name, channels } = opts;

  // --- CBIN envelope (0x00–0x2B) — samples: unslotted (bank/loc = 0xFFFFFFFF) ---
  const header = new Uint8Array(CBIN_HEADER_SIZE);
  const hv = new DataView(header.buffer);
  header.set([0x43, 0x42, 0x49, 0x4e], 0x00); // "CBIN"
  header[0x04] = 1; // format type
  header.set([0x6e, 0x73, 0x6d, 0x70], 0x08); // "nsmp"
  hv.setUint32(0x0c, 0xffffffff, false); // bank/loc — not slotted
  header[0x12] = 0x0f; // category byte (templated from real samples)
  hv.setUint16(0x14, 300, true); // version 3.00 (codec 3) — u16 LE
  // 0x18 CRC-32 patched at the end.

  // --- sections (templated from a real .nsmp3; see docs/NSMP-CODEC.md) ---
  const nsmp = section('NSMP', 30, Uint8Array.from([0x00, 0x02, 0x00, 0x0c]));

  const hdrPayload = new Uint8Array(112);
  new DataView(hdrPayload.buffer).setUint16(4, 0x062c, false); // templated marker
  hdrPayload.set(asciiPad(name, 112 - 10, 0).subarray(0, 112 - 10), 10); // name at +10
  const hdr = section('\0hdr', 10, hdrPayload);

  const cat = section('\0cat', 7, Uint8Array.from([0x0f, 0, 0, 0, 0, 0, 0, 0]));

  // Minimal `map` (per-zone level/detune). The exact per-zone layout is still
  // being decoded; our reader ignores it, but a real keyboard needs it filled.
  const map = section('\0map', 14, new Uint8Array(16));

  // Stroke: a templated header then the encoded block stream.
  const block = encodeStroke(channels, { blockSize: opts.blockSize });
  const stroke = concat([new Uint8Array(STROKE_HEADER_SIZE), block]);
  const stk = section('\0stk', 11, stroke);

  const sty = section('\0sty', 7, Uint8Array.from(
    [0x00, 0x00, 0x7f, 0x1e, 0x2b, 0, 0, 0, 0, 0, 0, 0x01, 0x4a, 0, 0x01, 0, 0x4a, 0, 0, 0x40, 0, 0, 0, 0],
  ));
  const meta = section('meta', 1, Uint8Array.from([0x00, 0x02, 0x00, 0x0e, 0xb2, 0x28, 0, 0, 0, 0, 0, 0]));

  const file = concat([header, nsmp, hdr, cat, map, stk, sty, meta]);
  return patchNs4Checksum(file); // CRC-32 over bytes[0x2C:] → 0x18
}
