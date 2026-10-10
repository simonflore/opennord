import { probeDevice, inferProgramPartition } from './probe';
import type { NordSession } from './session';
import {
  identifyModelByProductId,
  modelByProductId,
  programPartitionIndex,
  type ModelInfo,
} from '../clavia/partitions';
import { resolveModelProgramPartition } from './program-partition';
import type { Diagnostics } from '../capabilities/types';

/** Outcome of the connect-time Program partition check. */
export interface ProgramPartitionCheckResult {
  /** The partition to address for programs (probed when found, else the guess). */
  partition: number;
  /** True only when the probe found the model's program files at `partition`. */
  confirmed: boolean;
}

/**
 * Confirm (and, when needed, correct) a device's Program partition index at
 * connect time using the read-only probe.
 *
 * The registry carries a hardware-validated, OS-independent index only for the
 * Stage 4. Every other model starts from a guess — the Stage 3 / Electro /
 * Piano static (NSM-recovered) index, Stage 2's hardware index (which shifts on
 * older OS versions), or the Stage-4 default. This runs the read-only partition
 * probe, finds which partition actually holds the model's program files (by
 * fourcc), and:
 *   1. returns that index, marked confirmed, so THIS session transfers to the
 *      right partition even when the guess was wrong (static indices come from
 *      NSM's constructor Add() order, which doesn't always match the device);
 *      when the tag isn't found the guess comes back unconfirmed, and the
 *      caller must keep the connection read-only;
 *   2. records a diagnostic with the full partition→fourcc map + whether the
 *      probe agreed with the guess — so real user connects fill in the map we
 *      can't get without hardware, and we bake confirmed indices into the
 *      registry over time.
 *
 * Read-only and best-effort: any failure falls back to the (unconfirmed)
 * `guessed` index and never breaks the connect.
 */
export async function confirmProgramPartition(
  session: NordSession,
  model: ModelInfo | undefined,
  guessed: number,
  diagnostics: Diagnostics,
  now: () => Date = () => new Date(),
): Promise<ProgramPartitionCheckResult> {
  const tag = model?.programTag ?? undefined;
  // No program fourcc to look for (unknown model): nothing can confirm the guess.
  if (!tag) return { partition: guessed, confirmed: false };
  try {
    const report = await probeDevice(session, {
      deviceName: model?.name ?? 'Nord',
      productId: model?.productId ?? 0,
      now,
    });
    const probed = inferProgramPartition(report, tag);
    const adopted = probed ?? guessed;
    diagnostics.record({
      kind: 'device.partition-probe',
      ok: probed !== undefined,
      message: `${model?.id ?? 'device'} program partition: probed=${probed ?? 'not-found'} guessed=${guessed} adopted=${adopted}`,
      detail: {
        model: model?.id,
        programTag: tag,
        probed,
        guessed,
        adopted,
        agrees: probed === guessed,
        partitions: report.partitions.map((p) => ({ index: p.index, files: p.fileCount, fourccs: p.fourccs })),
      },
    });
    return { partition: adopted, confirmed: probed !== undefined };
  } catch (e) {
    diagnostics.record({
      kind: 'device.partition-probe',
      ok: false,
      message: `partition probe failed for ${model?.id ?? 'device'}`,
      detail: { model: model?.id, error: e instanceof Error ? e.message : String(e) },
    });
    return { partition: guessed, confirmed: false };
  }
}

/** Which model a connected device is, and how sure we are. */
export interface DeviceIdentity {
  model: ModelInfo | undefined;
  /** True only when the USB product id is hardware-confirmed for `model`
   *  (registry `productId`), not just recovered from NSM (`staticProductId`). */
  confirmed: boolean;
}

/** Identify a device by USB product id: hardware-confirmed first, else NSM-recovered. */
export function identifyDevice(productId: number | undefined): DeviceIdentity {
  const confirmed = modelByProductId(productId);
  if (confirmed) return { model: confirmed, confirmed: true };
  return { model: identifyModelByProductId(productId), confirmed: false };
}

/**
 * True when the device's partition layout can be trusted without probing: a
 * hardware-confirmed model whose hardware-confirmed Program index doesn't move
 * between OS versions (today: Stage 4). Stage 2 is excluded — NSM adds its user
 * Pedal partition only on newer OS, so Program shifts down by one on older OS.
 */
export function hasTrustedLayout(identity: DeviceIdentity): boolean {
  const { model } = identity;
  return identity.confirmed && !!model && !model.layoutVariesByOs && programPartitionIndex(model) !== undefined;
}

/** Where a connected device's programs live, and which partitions may be written. */
export interface DeviceAccess {
  programPartition: number;
  /** Partitions writes may target. Empty = a read-only connection. */
  writable: number[];
}

/**
 * Decide the Program partition and the writable partitions for a connection.
 *
 * Safety rule: a partition is writable only when its index is confirmed —
 * either hardware-confirmed for a device with a trusted layout (every user
 * partition of a Stage 4), or found by the read-only probe to hold the model's
 * program files (just that Program partition). Anything else connects
 * read-only: browsing, listening and backing up still use the best guess.
 */
export async function resolveDeviceAccess(
  session: NordSession,
  identity: DeviceIdentity,
  diagnostics: Diagnostics,
  now?: () => Date,
): Promise<DeviceAccess> {
  const { model } = identity;
  const guessed = resolveModelProgramPartition(model);
  if (hasTrustedLayout(identity)) {
    const writable = model!.partitions.flatMap((p) => (!p.native && p.index !== undefined ? [p.index] : []));
    return { programPartition: guessed, writable };
  }
  const check = await confirmProgramPartition(session, model, guessed, diagnostics, now);
  return { programPartition: check.partition, writable: check.confirmed ? [check.partition] : [] };
}
