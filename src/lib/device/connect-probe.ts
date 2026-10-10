import { probePartition, queryPartitionCount, SCAN, type ProbePartition } from './probe';
import { TransportTimeoutError } from './transport';
import type { NordSession } from './session';
import {
  identifyModelByProductId,
  modelByProductId,
  programPartitionIndex,
  type ModelInfo,
  type PartitionKind,
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
 * How long one probe reply may take. A Nord answers these queries in
 * milliseconds; a question it doesn't understand (an index past its last
 * partition, a frame it ignores) may never be answered, and without a bound
 * that would hang the connect.
 */
export const PROBE_REPLY_TIMEOUT_MS = 3000;

/** Where the program tag turned up, and what was looked at on the way. */
interface ProgramPartitionSearch {
  probed: number | undefined;
  partitions: ProbePartition[];
  /** The device's own partition count, when the wider scan asked for it. */
  partitionCount?: number;
}

/**
 * Look for `tag` cheaply: the expected index first, then one lower (Stage 2's
 * older OS lacks a partition before Program, so everything after sits one
 * lower). Only on a miss, scan every index the device reports having (its
 * partition-list count), or {@link SCAN} when it doesn't say.
 */
async function findProgramPartition(session: NordSession, tag: string, guessed: number): Promise<ProgramPartitionSearch> {
  const partitions: ProbePartition[] = [];
  const tried = new Set<number>();
  const holdsTag = async (index: number): Promise<boolean> => {
    if (index < 0 || tried.has(index)) return false;
    tried.add(index);
    const partition = await probePartition(session, index);
    if (partition) partitions.push(partition);
    return !!partition?.fourccs.includes(tag);
  };
  for (const index of [guessed, guessed - 1]) {
    if (await holdsTag(index)) return { probed: index, partitions };
  }
  const partitionCount = await queryPartitionCount(session);
  for (let index = 0; index < (partitionCount ?? SCAN); index++) {
    if (await holdsTag(index)) return { probed: index, partitions, partitionCount };
  }
  return { probed: undefined, partitions, partitionCount };
}

/**
 * Confirm (and, when needed, correct) a device's Program partition index at
 * connect time using the read-only probe.
 *
 * The registry carries a hardware-validated, OS-independent index only for the
 * Stage 4. Every other model starts from a guess — the Stage 3 / Electro /
 * Piano static (NSM-recovered) index, Stage 2's hardware index (which shifts on
 * older OS versions), or the Stage-4 default. This looks for the partition that
 * actually holds the model's program files (by fourcc) — the guess first, then
 * one lower, then the rest of the device's partitions — and:
 *   1. returns that index, marked confirmed, so THIS session transfers to the
 *      right partition even when the guess was wrong (static indices come from
 *      NSM's constructor Add() order, which doesn't always match the device);
 *      when the tag isn't found the guess comes back unconfirmed, and the
 *      caller must keep the connection read-only;
 *   2. records a diagnostic with the partition→fourcc map it saw + whether the
 *      probe agreed with the guess — so real user connects fill in the map we
 *      can't get without hardware, and we bake confirmed indices into the
 *      registry over time.
 *
 * Read-only and best-effort: every reply is bounded by `replyTimeoutMs`, and
 * any failure (a timeout included) falls back to the (unconfirmed) `guessed`
 * index and never breaks or hangs the connect.
 */
export async function confirmProgramPartition(
  session: NordSession,
  model: ModelInfo | undefined,
  guessed: number,
  diagnostics: Diagnostics,
  now: () => Date = () => new Date(),
  replyTimeoutMs = PROBE_REPLY_TIMEOUT_MS,
): Promise<ProgramPartitionCheckResult> {
  const tag = model?.programTag ?? undefined;
  // No program fourcc to look for (unknown model): nothing can confirm the guess.
  if (!tag) return { partition: guessed, confirmed: false };
  try {
    const { probed, partitions, partitionCount } =
      await session.withReplyTimeout(replyTimeoutMs, () => findProgramPartition(session, tag, guessed));
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
        partitionCount,
        partitions: partitions.map((p) => ({ index: p.index, files: p.fileCount, fourccs: p.fourccs })),
        capturedAt: now().toISOString(),
      },
    });
    return { partition: adopted, confirmed: probed !== undefined };
  } catch (e) {
    diagnostics.record({
      kind: 'device.partition-probe',
      ok: false,
      message: `partition probe failed for ${model?.id ?? 'device'}`,
      detail: {
        model: model?.id,
        error: e instanceof Error ? e.message : String(e),
        timedOut: e instanceof TransportTimeoutError,
      },
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

/** Sample and piano libraries: where "remove unused samples / pianos" deletes. */
const LIBRARY_KINDS: ReadonlySet<PartitionKind> = new Set(['piano', 'samplib']);

/**
 * Decide the Program partition and the writable partitions for a connection.
 *
 * Safety rule: a partition is writable only when its index is confirmed —
 * either hardware-confirmed for a device with a trusted layout (every user
 * partition of a Stage 4), or found by the read-only probe to hold the model's
 * program files (that Program partition). When the probe finds Program exactly
 * at a hardware-confirmed model's hardware index (a Stage 2 on a current OS),
 * the device has the registry's layout, so that model's user sample and piano
 * libraries are writable too. Its preset, Live and Settings partitions never
 * are this way: a restore addresses those by Stage 4 indices, which on another
 * model are different partitions. Anything else connects read-only: browsing,
 * listening and backing up still use the best guess.
 */
export async function resolveDeviceAccess(
  session: NordSession,
  identity: DeviceIdentity,
  diagnostics: Diagnostics,
  now?: () => Date,
  replyTimeoutMs?: number,
): Promise<DeviceAccess> {
  const { model } = identity;
  const guessed = resolveModelProgramPartition(model);
  if (hasTrustedLayout(identity)) {
    const writable = model!.partitions.flatMap((p) => (!p.native && p.index !== undefined ? [p.index] : []));
    return { programPartition: guessed, writable };
  }
  const check = await confirmProgramPartition(session, model, guessed, diagnostics, now, replyTimeoutMs);
  if (!check.confirmed) return { programPartition: check.partition, writable: [] };
  const matchesRegistry = identity.confirmed && check.partition === programPartitionIndex(model);
  const libraries = matchesRegistry
    ? model!.partitions.flatMap((p) => (LIBRARY_KINDS.has(p.kind) && !p.native && p.index !== undefined ? [p.index] : []))
    : [];
  return { programPartition: check.partition, writable: [...libraries, check.partition] };
}
