import type { NordSession } from './session';
import { CQryFileInfo, CQryFileIterate, CReqFileOpen, CReqFileClose, CReqFileRead, type2Ext } from './opcodes';
import { NordError } from './protocol';
import { readAsciiFixed } from '../ns4/parse';
import { buildCbinHeader } from '../ns4/bits';
import { patchNs4Checksum } from '../ns4/checksum';
import { formatSlot } from '../ns4/slot';
import { programCategoryName } from '../ns4/categories';

/** A program file on the device, from FileInfo. */
export interface ProgramEntry {
  bank: number;
  slot: number;
  name: string;
  categoryId: number;
  /** Version ×100, e.g. 313 = v3.13. */
  version: number;
  /** Body size in bytes (no CBIN header). */
  sizeBytes: number;
  /** 4-char file type, e.g. "ns4p". */
  fourcc: string;
}

function u32(payload: Uint8Array, byteOffset: number): number {
  return new DataView(payload.buffer, payload.byteOffset + byteOffset, 4).getUint32(0);
}

/** Decode a FileIterate reply payload (0x21): code, bank, slot. */
export function decodeFileIterate(payload: Uint8Array): { code: number; bank: number; slot: number } {
  return { code: u32(payload, 0), bank: u32(payload, 4), slot: u32(payload, 8) };
}

/** Decode a FileInfo reply payload (0x1F) at the validated byte offsets. */
export function decodeFileInfo(payload: Uint8Array, bank: number, slot: number): ProgramEntry {
  const nameLen = u32(payload, 32);
  return {
    bank,
    slot,
    name: readAsciiFixed(payload, 36, nameLen),
    categoryId: u32(payload, 28),
    version: u32(payload, 20),
    sizeBytes: u32(payload, 12),
    fourcc: type2Ext(u32(payload, 16)),
  };
}

/**
 * Enumerate every program by walking the FileIterate cursor across banks 0–7,
 * naming each hit via FileInfo. The session must already be on the Program
 * partition (begin(PARTITION_PROGRAM)). Read-only.
 */
export async function enumeratePrograms(session: NordSession): Promise<ProgramEntry[]> {
  const out: ProgramEntry[] = [];
  let bank = 0;
  let cursor = 0xffffffff; // sentinel: start iterating from the top of the bank
  while (bank < 8) {
    const it = decodeFileIterate((await session.request(CQryFileIterate, [bank, cursor, 0])).payload);
    if (it.code === 0) {
      // code 0 always reports a file within the requested bank (it.bank === bank).
      const info = await session.request(CQryFileInfo, [it.bank, it.slot]);
      if (info.status === 0) out.push(decodeFileInfo(info.payload, it.bank, it.slot));
      cursor = it.slot;
    } else if (it.code === 1) {
      bank = it.bank + 1;
      cursor = 0xffffffff;
    } else {
      break;
    }
  }
  return out;
}

/** FileRead window — programs are < 1 KB so one read suffices, but loop for safety. */
const READ_WINDOW = 4096;

/**
 * Pull a program off the device and return a complete .ns4p (44-byte CBIN header
 * reconstructed from the entry's metadata + the reassembled body + a fresh
 * CRC-32). Reads in windows until `entry.sizeBytes` bytes arrive; the file data
 * in each FileRead reply begins at payload offset 20 (after the 5-word read-ack
 * header). Read-only on the device (Open → Read… → Close).
 */
export async function pullProgram(session: NordSession, entry: ProgramEntry): Promise<Uint8Array> {
  const open = await session.request(CReqFileOpen, [entry.bank, entry.slot]);
  if (open.status !== 0) throw new NordError(`FileOpen failed (status ${open.status}) for ${entry.name}`);

  const body = new Uint8Array(entry.sizeBytes);
  try {
    let offset = 0;
    while (offset < entry.sizeBytes) {
      const want = Math.min(READ_WINDOW, entry.sizeBytes - offset);
      const reply = await session.request(CReqFileRead, [entry.bank, entry.slot, offset, want]);
      const data = reply.payload.subarray(20); // skip the 5-word read-ack header
      if (data.length === 0) throw new NordError(`FileRead returned no data at offset ${offset}`);
      const taken = Math.min(data.length, entry.sizeBytes - offset);
      body.set(data.subarray(0, taken), offset);
      offset += taken;
    }
  } finally {
    // Always release the handle, even if a read failed mid-transfer.
    await session.request(CReqFileClose, [entry.bank, entry.slot]);
  }

  const header = buildCbinHeader({
    formatType: 1,
    tag: entry.fourcc,
    bank: entry.bank,
    location: entry.slot,
    category: entry.categoryId,
    versionRaw: entry.version,
  });
  const file = new Uint8Array(header.length + body.length);
  file.set(header, 0);
  file.set(body, header.length);
  return patchNs4Checksum(file);
}

export interface ProgramRowView {
  name: string;
  /** Nord X:YY slot. */
  slot: string;
  category: string;
  /** e.g. "v3.13". */
  version: string;
}

/** Display row for a ProgramEntry — reuses the shared slot + category formatting. */
export function programEntryView(e: ProgramEntry): ProgramRowView {
  return {
    name: e.name || `(slot ${formatSlot(e.bank, e.slot)})`,
    slot: formatSlot(e.bank, e.slot),
    category: programCategoryName(e.categoryId) ?? `#${e.categoryId}`,
    version: `v${(e.version / 100).toFixed(2)}`,
  };
}
