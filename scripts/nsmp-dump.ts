/**
 * Research aid: dump a Nord Sample (.nsmp*) file's CBIN header + a hexdump of the
 * chunk-directory region, so the format can be read by eye during RE.
 *
 * Usage:
 *   npx tsx scripts/nsmp-dump.ts research/nsmp/Strings.nsmp4 [hexLimit]
 *
 * Local research only — operates on the user's own sample files (docs/LEGAL.md);
 * never reads/prints the bulk audio payload meaningfully (just framing bytes).
 */
import { readFileSync } from 'node:fs';

function ascii(b: Uint8Array, i: number, n: number): string {
  return Array.from(b.slice(i, i + n))
    .map((c) => (c >= 0x20 && c < 0x7f ? String.fromCharCode(c) : '.'))
    .join('');
}

function u16le(b: Uint8Array, i: number): number {
  return b[i] | (b[i + 1] << 8);
}

function u32le(b: Uint8Array, i: number): number {
  return (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
}

function dumpHeader(path: string, b: Uint8Array): void {
  console.log('file        ', path, `(${b.length} bytes)`);
  console.log('magic       ', ascii(b, 0x00, 4));
  console.log('fmtType     ', b[0x04]);
  console.log('typeTag     ', ascii(b, 0x08, 4));
  console.log('versionRaw  ', u16le(b, 0x14));
  console.log('crc32@0x18  ', u32le(b, 0x18));
}

function hexdump(b: Uint8Array, from: number, limit: number): void {
  console.log(`--- hexdump from 0x${from.toString(16)} ---`);
  for (let off = from; off < Math.min(from + limit, b.length); off += 16) {
    const row = Array.from(b.slice(off, off + 16));
    const hex = row.map((c) => c.toString(16).padStart(2, '0')).join(' ');
    console.log(off.toString(16).padStart(6, '0'), hex.padEnd(48), ascii(b, off, 16));
  }
}

const path = process.argv[2];
if (!path) {
  console.error('usage: tsx scripts/nsmp-dump.ts <file.nsmp*> [hexLimit]');
  process.exit(1);
}
const limit = Number(process.argv[3] ?? 512);
const bytes = new Uint8Array(readFileSync(path));
dumpHeader(path, bytes);
hexdump(bytes, 0x2c, limit);
