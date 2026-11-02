/**
 * Reply frames and sample builders for the device tests, built with the real encoder
 * so every decode also checks framing and CRC. Test-only: nothing in the app imports
 * this module. Defaults describe a Stage 4 (FileTransfer version 10, 13 flag bytes
 * per partition).
 */
import { encodeMessage, decodeReply } from './protocol';
import {
  CQryBankList, CQryFileInfo, CQryFileIterate, CQryPartList, CQryPartState, CReqBegin, ext2Type,
} from './opcodes';
import { MockTransport, TransportTimeoutError } from './transport';
import { NordSession } from './session';
import { writeNsmp } from '../ns4/nsmp-write';
import { buildCbinHeader } from '../clavia/cbin';
import { patchNs4Checksum } from '../clavia/checksum';

export const be32 = (v: number): number[] => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];

/** The reply to `op` with status 0, then `words`. */
export function ack(op: number, ...words: number[]): Uint8Array {
  return encodeMessage(op | 1, [0, ...words]);
}

/** The reply to `op` with status `code`, then `words`. */
export function status(op: number, code: number, ...words: number[]): Uint8Array {
  return encodeMessage(op | 1, [code, ...words]);
}

/** A FileIterate reply: code 0 = a file at bank/slot, 1 = bank done, 2 = no more banks. */
export function iter(code: number, bank: number, slot: number): Uint8Array {
  return encodeMessage(CQryFileIterate | 1, [code, bank, slot]);
}

/** A FileInfo reply for a file of `size` record bytes. */
export function info(name: string, size: number, opts: { fourcc?: string; version?: number; category?: number } = {}): Uint8Array {
  const nb = new TextEncoder().encode(name);
  const { fourcc = 'nsmp', version = 400, category = 0x000f0000 } = opts;
  return encodeMessage(CQryFileInfo | 1, [0, 0, 0, size, ext2Type(fourcc), version, 0, category, nb.length], nb);
}

/** A PartState reply: file count, then free, used and dirty erase blocks. */
export function partState(fileCount: number, free: number, used: number, dirty: number): Uint8Array {
  return encodeMessage(CQryPartState | 1, [0, fileCount, free, used, dirty, 8]);
}

/** A BankList reply: each bank's name and slot count. */
export function bankList(partition: number, banks: [string, number][]): Uint8Array {
  const bytes: number[] = [banks.length];
  for (const [name, slots] of banks) {
    const nb = [...new TextEncoder().encode(name)];
    bytes.push(...be32(nb.length), ...nb, ...be32(slots));
  }
  return encodeMessage(CQryBankList | 1, [0, partition], new Uint8Array(bytes));
}

/** Partition names in protocol-index order, as NSM's backup folders name 1, 5 and 6. */
export const STAGE4_PARTITION_NAMES = [
  'Piano (Native)', 'Piano', 'Pedal (Native)', 'Piano Pedal', 'Samp Lib (Native)', 'Samp Lib',
  'Program', 'Organ Preset', 'Piano Preset', 'Synth Preset', 'Live', 'Settings',
];

/** 13 flag bytes with the erase flag (index 10, version >= 5) set. */
export const FLAGS_ERASE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0];
/** 13 zero flag bytes: no erase (version >= 5), matched by name. */
export const FLAGS_NO_ERASE = new Array<number>(13).fill(0);

export interface PartitionOverride { words?: [number, number, number, number]; flags?: number[]; name?: string }

/**
 * A PartList reply for a Stage 4: 12 partitions, each 64 KiB blocks rounded up
 * (w1 = 65535), 512-byte write alignment, erase supported, unless overridden.
 */
export function partList(over: Partial<Record<number, PartitionOverride>> = {}): Uint8Array {
  const bytes: number[] = [STAGE4_PARTITION_NAMES.length];
  STAGE4_PARTITION_NAMES.forEach((defaultName, i) => {
    const nb = [...new TextEncoder().encode(over[i]?.name ?? defaultName)];
    const words = over[i]?.words ?? [65536, 65535, 512, 0];
    const flags = over[i]?.flags ?? FLAGS_ERASE;
    bytes.push(...be32(nb.length), ...nb, ...words.flatMap(be32), ...flags);
  });
  return encodeMessage(CQryPartList | 1, [0], new Uint8Array(bytes));
}

/** A session with `partition` open and `writable` confirmed; the Begin is consumed and cleared from `t.sent`. */
export async function openSession(
  replies: Uint8Array[], { partition = 5, writable = [partition] }: { partition?: number; writable?: number[] } = {},
): Promise<{ t: MockTransport; s: NordSession }> {
  const t = new MockTransport([ack(CReqBegin), ...replies]);
  const s = new NordSession(t);
  s.allowWrites(writable);
  await s.begin(partition);
  t.sent.length = 0;
  return { t, s };
}

/** In a {@link ScriptedTransport} script: this read times out. */
export const TIMEOUT = 'timeout' as const;

/** Replies, or a read that times out (as a real transport does: the read is cancelled, later frames stay queued). */
export class ScriptedTransport extends MockTransport {
  readonly bounds: (number | undefined)[] = [];
  private script: (Uint8Array | typeof TIMEOUT)[];
  constructor(script: (Uint8Array | typeof TIMEOUT)[]) {
    super([]);
    this.script = script;
  }
  override async bulkIn(_maxLength: number, timeoutMs?: number): Promise<Uint8Array> {
    this.bounds.push(timeoutMs);
    const next = this.script.shift();
    if (next === undefined) throw new Error('ScriptedTransport: no more replies');
    if (next === TIMEOUT) throw new TransportTimeoutError(timeoutMs ?? 0);
    return next;
  }
}

/** The opcode of every frame sent so far. */
export function sentIds(t: MockTransport): number[] {
  return t.sent.map((f) => decodeReply(f).msgId);
}

// ---- Sample and file builders (shared by the send, backup and restore tests) ----

/** A short synthetic sample: a sine tone written as a complete `.nsmp` (codec 4 = `.nsmp4`). */
export function testSample(opts: { name?: string; codec?: 3 | 4; length?: number } = {}): Uint8Array {
  const { name = 'Pad', codec = 4, length = 2000 } = opts;
  const tone = Array.from({ length }, (_, i) => Math.round(6000 * Math.sin(i / 8)));
  return writeNsmp({ name, channels: [tone], codec });
}

/** A full CBIN file as the Nord stores it: header addressed to `bank`/`slot`, then `record`, checksum patched. */
export function cbinFile(
  record: Uint8Array,
  { tag = 'nsmp', bank = 0, slot = 0, category = 0x000f0000, versionRaw = 400 }: { tag?: string; bank?: number; slot?: number; category?: number; versionRaw?: number } = {},
): Uint8Array {
  const header = buildCbinHeader({ formatType: 1, tag, bank, location: slot, category, versionRaw });
  return patchNs4Checksum(new Uint8Array([...header, ...record]));
}

/** `bytes` followed by zeros up to the next multiple of `multiple`. */
export function padTo(bytes: Uint8Array, multiple: number): Uint8Array {
  const out = new Uint8Array(Math.ceil(bytes.length / multiple) * multiple);
  out.set(bytes);
  return out;
}
