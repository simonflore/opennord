import type { NordSession } from './session';
import { enumerateFiles } from './transfer';

export interface ProbePartition { index: number; fileCount: number; }

export interface ProbeReport {
  deviceName: string;
  productId: number;
  partitions: ProbePartition[];
  capturedAt: string; // ISO
}

/** Scan this many partition indices (Stage 4 uses 0..11; extra headroom is harmless). */
const SCAN = 14;

export interface ProbeOptions { deviceName: string; productId: number; now: () => Date; }

/**
 * READ-ONLY device probe: for each candidate partition, open a session and count
 * its files via enumerateFiles (FileIterate/FileInfo). Absent partitions (begin
 * fails) are skipped. Emits only begin/iterate/info/end — never a write opcode.
 * Safe to run against any Clavia device; surfaces the partition map for RE.
 */
export async function probeDevice(session: NordSession, opts: ProbeOptions): Promise<ProbeReport> {
  const partitions: ProbePartition[] = [];
  for (let index = 0; index < SCAN; index++) {
    try {
      const files = await session.withSession(index, () => enumerateFiles(session));
      partitions.push({ index, fileCount: files.length });
    } catch {
      // begin failed → this model doesn't have a partition at this index; skip.
    }
  }
  return { deviceName: opts.deviceName, productId: opts.productId, partitions, capturedAt: opts.now().toISOString() };
}
