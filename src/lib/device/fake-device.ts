import type { ProgramEntry } from './transfer';
import type { DeviceIO } from './device-io';
import { addrKey, type Addr } from './reorg';

type Call = 'pull' | 'push' | 'delete' | 'info';
const k = (partition: number, a: Addr) => `${partition}:${addrKey(a)}`;

interface Cell { file: Uint8Array; entry: ProgramEntry }

/** In-memory DeviceIO for hardware-free executor tests. */
export class FakeDevice implements DeviceIO {
  private cells = new Map<string, Cell>();
  private failures = new Set<string>();
  private truncate = false;
  private corrupt = false;

  constructor(seed: Array<{ partition: number; file: Uint8Array; entry: ProgramEntry }>) {
    for (const s of seed) this.cells.set(k(s.partition, s.entry), { file: s.file, entry: s.entry });
  }

  /** Schedule a one-shot failure for the next matching call. */
  failNext(call: Call, partition: number, addr: Addr): void {
    this.failures.add(`${call}:${k(partition, addr)}`);
  }
  /** Make the next push store a wrong-sized body, to exercise verify-mismatch. */
  truncateNextPush(): void { this.truncate = true; }
  /** Make the next push flip one body byte (same size) — a device-side write
   *  corruption that a size-only verify would miss. */
  corruptNextPush(): void { this.corrupt = true; }
  /** key → stored body size, for asserting "final == initial". */
  snapshot(): Map<string, number> {
    return new Map([...this.cells].map(([key, c]) => [key, c.file.length - 44]));
  }

  private trip(call: Call, partition: number, addr: Addr): void {
    const id = `${call}:${k(partition, addr)}`;
    if (this.failures.has(id)) { this.failures.delete(id); throw new Error(`fake ${call} failure at ${id}`); }
  }

  async pull(partition: number, entry: ProgramEntry): Promise<Uint8Array> {
    this.trip('pull', partition, entry);
    const cell = this.cells.get(k(partition, entry));
    if (!cell) throw new Error(`fake pull: empty ${k(partition, entry)}`);
    return cell.file;
  }

  async push(partition: number, addr: Addr, file: Uint8Array, name: string): Promise<void> {
    this.trip('push', partition, addr);
    let stored = this.truncate ? file.subarray(0, file.length - 1) : file;
    this.truncate = false;
    if (this.corrupt) {
      stored = stored.slice();
      stored[44] ^= 0xff; // flip one body byte, size unchanged
      this.corrupt = false;
    }
    const entry: ProgramEntry = {
      bank: addr.bank, slot: addr.slot, name,
      categoryId: 0, version: 313, sizeBytes: stored.length - 44, fourcc: 'ns4p',
    };
    this.cells.set(k(partition, addr), { file: stored, entry });
  }

  async delete(partition: number, addr: Addr): Promise<void> {
    this.trip('delete', partition, addr);
    if (!this.cells.has(k(partition, addr))) throw new Error(`fake delete: empty ${k(partition, addr)}`);
    this.cells.delete(k(partition, addr));
  }

  async info(partition: number, addr: Addr): Promise<ProgramEntry | null> {
    this.trip('info', partition, addr);
    return this.cells.get(k(partition, addr))?.entry ?? null;
  }
}
