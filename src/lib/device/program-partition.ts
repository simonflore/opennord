import { modelByProductId, programPartitionIndex } from '../clavia/partitions';
import { PARTITION_PROGRAM } from './opcodes';

/**
 * The protocol partition index to use for a connected device's user Programs.
 *
 * Every program transfer (push / delete / organize / enumerate) addresses a
 * partition, and until now they all assumed the Stage-4 index (`PARTITION_PROGRAM`
 * = 6). That is wrong for models whose partition layout differs (a non-Stage-4
 * device silently reads/writes the wrong partition — see the Stage 3 report).
 *
 * This resolves the index from the model registry by USB product id. When the
 * model's layout is hardware-confirmed the registry carries the real index; when
 * it isn't (index left unset) we fall back to `PARTITION_PROGRAM` — behaviour-
 * preserving until the probe's per-partition Types column identifies the model's
 * Program partition and it's recorded in `partitions.ts`.
 */
export function resolveProgramPartition(productId: number | undefined): number {
  return programPartitionIndex(modelByProductId(productId)) ?? PARTITION_PROGRAM;
}
