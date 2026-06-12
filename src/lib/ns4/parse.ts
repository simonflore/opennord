import type { NS4Program, Ns4FileKind } from './types';

/**
 * Parse a Nord Stage 4 program/preset file into the OpenNord model.
 *
 * The .ns4p format is only PARTIALLY reverse-engineered (see docs/FORMAT.md).
 * This parser is deliberately incremental: it never throws on unknown data, it
 * preserves the raw bytes, and it records what it couldn't decode in `warnings`.
 * Add a field by mapping its offset/bits (cite the source in a comment), then
 * cover it with a fixture test in parse.test.ts.
 */
export function parseNs4Program(bytes: Uint8Array): NS4Program {
  const warnings: string[] = [];
  const kind = kindFromLength(bytes);

  // TODO(format): header magic + version live near the start of the file.
  // The Stage 2/3 docs put the program header at offset 0x04; verify for ns4
  // against real captures before trusting any offset. Until then we report the
  // file as recognized-but-not-decoded rather than guessing.
  const name = tryReadName(bytes, warnings);

  const parsed = name !== undefined; // becomes richer as sections are decoded
  if (!parsed) {
    warnings.push('Structured decoding not yet implemented for this file — see docs/FORMAT.md.');
  }

  return { parsed, kind, name, bytes, warnings };
}

/** Best-effort file-kind guess from extension-independent heuristics. */
function kindFromLength(bytes: Uint8Array): Ns4FileKind {
  // Placeholder: real classification will key off header bytes once decoded.
  return bytes.length > 0 ? 'program' : 'preset-unknown';
}

/**
 * Attempt to read the program name. The name region/offset is NOT yet verified
 * for ns4, so this returns undefined until a contributor pins it down (at which
 * point flip the offset in and add a fixture test). Kept as a real function so
 * the call site and tests are ready.
 */
function tryReadName(_bytes: Uint8Array, warnings: string[]): string | undefined {
  warnings.push('Program name offset not yet decoded.');
  return undefined;
}

/**
 * Read a NUL- or space-padded ASCII string of fixed length from a buffer.
 * A verified, reusable primitive for when offsets are known.
 */
export function readAsciiFixed(bytes: Uint8Array, offset: number, length: number): string {
  let end = offset;
  const limit = Math.min(offset + length, bytes.length);
  const out: number[] = [];
  for (; end < limit; end++) {
    const b = bytes[end];
    if (b === 0x00) break;
    out.push(b);
  }
  return String.fromCharCode(...out).replace(/\s+$/, '');
}
