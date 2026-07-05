import type { NordSession } from './session';
import { enumerateFiles } from './transfer';

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

/** Scan this many partition indices (Stage 4 uses 0..11; extra headroom is harmless). */
const SCAN = 14;
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
      const files = await session.withSession(index, () => enumerateFiles(session, PROBE_FILES_PER_PARTITION));
      const fourccs = [...new Set(files.map((f) => f.fourcc))].sort();
      partitions.push({ index, fileCount: files.length, fourccs });
    } catch {
      // begin failed → this model doesn't have a partition at this index; skip.
    }
  }
  return { deviceName: opts.deviceName, productId: opts.productId, partitions, capturedAt: opts.now().toISOString() };
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
