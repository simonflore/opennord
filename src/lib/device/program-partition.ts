import {
  modelByProductId,
  programPartitionIndex,
  programPartitionStaticIndex,
  type ModelInfo,
} from '../clavia/partitions';
import { PARTITION_PROGRAM } from './opcodes';

/**
 * The protocol partition index to use for a given model's user Programs.
 *
 * Every program transfer (push / delete / organize / enumerate) addresses a
 * partition, and they historically all assumed the Stage-4 index
 * (`PARTITION_PROGRAM` = 6) — wrong for models whose layout differs (a
 * non-Stage-4 device silently reads/writes the wrong partition — the Stage 3
 * report). Precedence, most-trusted first:
 *   1. `index`       — hardware-confirmed (registry).
 *   2. `staticIndex` — recovered from NSM's product constructor (Add-order
 *                      ordinal; medium-high confidence, not yet HW-validated).
 *   3. `PARTITION_PROGRAM` — the Stage-4 default, behaviour-preserving last
 *                      resort for models with no evidence yet.
 */
export function resolveModelProgramPartition(model: ModelInfo | undefined): number {
  return programPartitionIndex(model) ?? programPartitionStaticIndex(model) ?? PARTITION_PROGRAM;
}

/** Resolve the program partition index for a connected device by USB product id. */
export function resolveProgramPartition(productId: number | undefined): number {
  return resolveModelProgramPartition(modelByProductId(productId));
}
