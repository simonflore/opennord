import type { NS4Program, Ns4FileKind } from './types';
import { hasCbinMagic, fileTypeTag } from './bits';

/**
 * Parse a Nord Stage 4 program/preset file into the OpenNord model.
 *
 * Structured section decoding (piano/organ/synth into NS4Program) is still being
 * built from the ported offset map (see maps.ts, docs/FORMAT.md). For now this
 * recognizes the file via its CBIN/ns4p magic and classifies it; the full
 * decoder grows field by field, each verifiable in the Decode Inspector.
 */
export function parseNs4Program(bytes: Uint8Array): NS4Program {
  const warnings: string[] = [];
  const recognized = hasCbinMagic(bytes);
  const tag = recognized ? fileTypeTag(bytes) : '';

  let kind: Ns4FileKind = 'preset-unknown';
  if (tag === 'ns4p') kind = 'program';
  else if (tag.startsWith('ns4')) kind = 'preset-unknown';

  if (!recognized) warnings.push('No CBIN magic — not a recognized Nord file.');
  warnings.push('Structured section decode not yet wired from the offset map — use the Decode Inspector.');

  return { parsed: recognized, kind, bytes, warnings };
}
