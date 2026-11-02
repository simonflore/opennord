/**
 * Which files go to a Nord's sample and piano libraries. A Stage 4's Samp Lib takes
 * `.nsmp4` only, version 400–499 (`SPartitionSampLibV4`); NSM transcodes
 * older samples on the computer first, which OpenNord leaves to its own converter.
 * The device stores the record behind the CBIN header, sent as is.
 */
import { cbinFraming, readCbinHeader } from '../clavia/cbin';
import { PARTITION_PIANO, PARTITION_SAMP_LIB } from './opcodes';
import { pushRefusal } from './transfer';
import type { LibraryKind } from './write-guard';

export const LIBRARY_PARTITION: Readonly<Record<LibraryKind, number>> = { sample: PARTITION_SAMP_LIB, piano: PARTITION_PIANO };

/** The device's own partition names (NSM names its backup folders after them). */
export const LIBRARY_PARTITION_NAME: Readonly<Record<LibraryKind, string>> = { sample: 'Samp Lib', piano: 'Piano' };

export const NSMP4_ONLY = 'Only .nsmp4 samples can go to a Stage 4. Convert this one to .nsmp4 first, then send the result.';

const NSMP4_VERSIONS = { min: 400, max: 499 };

/**
 * Why this file can't go to that library, in a musician's words; undefined when it can.
 * Only the CBIN header is read, plus the record's size: a restore checks a backup's
 * files from their first bytes (`bytes` = the head) and their size in the archive.
 */
export function libraryFileRefusal(
  kind: LibraryKind, bytes: Uint8Array, recordBytes: number = cbinFraming(bytes).recordBytes,
): string | undefined {
  const refused = pushRefusal(bytes);
  if (refused) return refused;
  const header = readCbinHeader(bytes);
  if (kind === 'sample') {
    if (header.tag !== 'nsmp') return 'This isn’t a sample, so it wasn’t sent.';
    if (header.versionRaw < NSMP4_VERSIONS.min || header.versionRaw > NSMP4_VERSIONS.max) return NSMP4_ONLY;
  } else if (header.tag !== 'npno') {
    return 'This isn’t a piano, so it wasn’t sent.';
  }
  if (recordBytes === 0) return 'This file is empty, so it wasn’t sent.';
  return undefined;
}
