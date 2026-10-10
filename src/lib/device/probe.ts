import type { NordSession } from './session';
import { enumerateFiles } from './transfer';
import { CQryPartList } from './opcodes';
import { TransportTimeoutError } from './transport';

export interface ProbePartition {
  index: number;
  /** Files sampled from this partition (bounded — not the partition total). */
  fileCount: number;
  /** Distinct file types (fourccs) found in the partition, sorted. Identifies which
   *  raw partition holds Programs (e.g. `ns3f`), Synth presets (`ns3y`), etc. — the
   *  datum needed to map a non-Stage-4 model's partition layout. */
  fourccs: string[];
}

export interface ProbeReport {
  deviceName: string;
  productId: number;
  partitions: ProbePartition[];
  capturedAt: string; // ISO
}

/** Scan this many partition indices when the device's own count is unknown
 *  (Stage 4 uses 0..11; extra headroom is harmless on a device that answers). */
export const SCAN = 14;
/** Most partitions a real partition-list reply is believed to carry; more is noise. */
const MAX_PARTITIONS = 32;
/** Files read per partition — enough to learn its fourccs without walking hundreds of entries. */
const PROBE_FILES_PER_PARTITION = 8;

export interface ProbeOptions { deviceName: string; productId: number; now: () => Date; }

/**
 * READ-ONLY device probe: for each candidate partition, open a session and read
 * up to a few files via enumerateFiles (FileIterate/FileInfo) to learn its file
 * types (fourccs). Absent partitions (begin fails) are skipped. Emits only
 * begin/iterate/info/end — never a write opcode. Safe to run against any Clavia
 * device; surfaces the partition map for RE. `fileCount` is the SAMPLED count
 * (bounded), not the partition total — the probe only needs the fourccs.
 */
export async function probeDevice(session: NordSession, opts: ProbeOptions): Promise<ProbeReport> {
  const partitions: ProbePartition[] = [];
  for (let index = 0; index < SCAN; index++) {
    try {
      const partition = await probePartition(session, index);
      if (partition) partitions.push(partition);
    } catch {
      // the device stopped answering — report what was learned so far
      break;
    }
  }
  return { deviceName: opts.deviceName, productId: opts.productId, partitions, capturedAt: opts.now().toISOString() };
}

/**
 * READ-ONLY: sample one partition's file types. Undefined when the device has no
 * partition at `index` (begin refused, or any other per-partition failure).
 * A {@link TransportTimeoutError} is rethrown: a device that stopped answering
 * won't answer the next partition either, so the caller should stop asking.
 */
export async function probePartition(session: NordSession, index: number): Promise<ProbePartition | undefined> {
  try {
    const files = await session.withSession(index, () => enumerateFiles(session, PROBE_FILES_PER_PARTITION));
    return { index, fileCount: files.length, fourccs: [...new Set(files.map((f) => f.fourcc))].sort() };
  } catch (e) {
    if (e instanceof TransportTimeoutError) throw e;
    return undefined;
  }
}

/**
 * READ-ONLY: how many partitions the device reports (`CQryPartList`), or
 * undefined when the reply doesn't read as a plausible count. The reply carries
 * `u8 count` then one record per partition; whether a
 * `u32 status` precedes it isn't pinned, so both are read: a leading zero word
 * is the status (a count of 0 would mean no partitions), otherwise byte 0 is the
 * count. Rethrows {@link TransportTimeoutError} like {@link probePartition}.
 */
export async function queryPartitionCount(session: NordSession): Promise<number | undefined> {
  let payload: Uint8Array;
  try {
    payload = (await session.exclusive(() => session.request(CQryPartList, []))).payload;
  } catch (e) {
    if (e instanceof TransportTimeoutError) throw e;
    return undefined;
  }
  const statusFirst = payload.length >= 5 && payload[0] === 0 && payload[1] === 0 && payload[2] === 0 && payload[3] === 0;
  const count = statusFirst ? payload[4] : payload[0];
  return count >= 1 && count <= MAX_PARTITIONS ? count : undefined;
}

/**
 * The protocol index of the Program partition according to a real device probe:
 * the partition whose fourccs include the model's program tag (e.g. "ne5p").
 * This is the hardware-truth path — it needs no pre-known product id, and it is
 * what promotes a registry `staticIndex` to a hardware-confirmed `index`.
 * Returns undefined when no probed partition carries the tag.
 */
export function inferProgramPartition(report: ProbeReport, programTag: string): number | undefined {
  return report.partitions.find((p) => p.fourccs.includes(programTag))?.index;
}

/** Result of cross-checking a device probe against a statically-recovered index. */
export interface ProgramPartitionCheck {
  /** What the probe found (undefined if the program tag wasn't seen). */
  probed: number | undefined;
  /** The registry's expected (static or hardware) index. */
  expected: number;
  /** True only when the probe saw the tag at exactly the expected index. */
  agrees: boolean;
}

/**
 * Cross-check a device probe against the registry's expected program partition
 * index. Agreement promotes a `staticIndex` to hardware-confirmed; disagreement
 * flags the static recovery for correction before it's trusted for transfers.
 */
export function crossCheckProgramPartition(
  report: ProbeReport,
  programTag: string,
  expected: number,
): ProgramPartitionCheck {
  const probed = inferProgramPartition(report, programTag);
  return { probed, expected, agrees: probed === expected };
}
