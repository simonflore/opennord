import type { NordSession } from './session';
import {
  CQryFileInfo, CQryFileIterate, CReqFileOpen, CReqFileClose, CReqFileRead,
  CReqFileCreate, CReqFileWrite, CReqFileDelete, CQryFileGetFocus, type2Ext, ext2Type,
} from './opcodes';
import { NordError } from './protocol';
import { readAsciiFixed } from '../clavia/ascii';
import { buildCbinHeader, readCbinHeader } from '../clavia/cbin';
import { patchNs4Checksum } from '../clavia/checksum';
import { formatSlot } from '../clavia/slot';
import { programCategoryName } from '../clavia/categories';
import { readU32BE as u32 } from './payload-io';

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
 * The {bank, slot} of the program currently selected on the device, or null if
 * the query fails / isn't supported. Lets a caller read "the program you're on"
 * instead of making the user pick a slot in the UI too.
 *
 * Uses requestRaw because GetFocus's reply-opcode convention isn't confirmed, and
 * the {status, bank, slot} payload layout below is inferred from sibling replies
 * (e.g. FileIterate 0x21). HARDWARE-VALIDATION TODO: confirm the reply opcode and
 * the bank/slot offsets against a real device. Everything is guarded so a wrong
 * guess returns null (the caller falls back to explicit slot selection).
 */
export async function getFocusedSlot(session: NordSession): Promise<{ bank: number; slot: number } | null> {
  try {
    const reply = await session.requestRaw(CQryFileGetFocus, []);
    if (reply.status !== 0 || reply.payload.length < 12) return null;
    return { bank: u32(reply.payload, 4), slot: u32(reply.payload, 8) };
  } catch {
    return null;
  }
}

/** Safety guard — the device terminates the walk with a non-0/1 iterate code; this just bounds a misbehaving device. */
const MAX_BANKS = 64;

/**
 * Enumerate the files in the session's CURRENT partition by walking the
 * FileIterate cursor across banks: code 0 → record (FileInfo); code 1 → next
 * bank; any other code → stop. The caller sets the partition via begin().
 *
 * `limit` caps how many files are read (default: all). The read-only probe
 * passes a small limit because it only needs the partition's file types
 * (fourccs), not every entry — keeping a connect-time probe fast on partitions
 * that hold hundreds of programs.
 */
export async function enumerateFiles(session: NordSession, limit = Infinity): Promise<ProgramEntry[]> {
  const out: ProgramEntry[] = [];
  let bank = 0;
  let cursor = 0xffffffff;
  while (bank < MAX_BANKS && out.length < limit) {
    const it = decodeFileIterate((await session.request(CQryFileIterate, [bank, cursor, 0])).payload);
    if (it.code === 0) {
      const info = await session.request(CQryFileInfo, [it.bank, it.slot]);
      if (info.status === 0) out.push(decodeFileInfo(info.payload, it.bank, it.slot));
      cursor = it.slot;
    } else if (it.code === 1) {
      bank = it.bank + 1;
      cursor = 0xffffffff;
    } else {
      break; // terminal code — no more banks in this partition
    }
  }
  return out;
}

/** Back-compat: the Program browser enumerates the (already-begun) Program partition. */
export function enumeratePrograms(session: NordSession): Promise<ProgramEntry[]> {
  return enumerateFiles(session);
}

/** FileRead window — programs are < 1 KB so one read suffices, but loop for safety. */
const READ_WINDOW = 4096;

/**
 * Pull a file off the device and return a complete CBIN file (44-byte header
 * reconstructed from the entry's metadata — including its `fourcc` type — + the
 * reassembled body + a fresh CRC-32). Works for any CBIN type (program, preset,
 * Live, Settings). Reads in windows until `entry.sizeBytes` bytes arrive; the
 * file data in each FileRead reply begins at payload offset 20 (after the 5-word
 * read-ack header). Read-only on the device (Open → Read… → Close).
 */
export async function pullFile(
  session: NordSession,
  entry: ProgramEntry,
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
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
      onProgress?.(offset, entry.sizeBytes);
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

/** Back-compat alias. */
export function pullProgram(session: NordSession, entry: ProgramEntry): Promise<Uint8Array> {
  return pullFile(session, entry);
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

/** FileWrite window — programs are < 1 KB so one write suffices, but loop for safety. */
const WRITE_WINDOW = 4096;

/**
 * Write a complete CBIN file (header + body) to a slot — any type (program,
 * preset, Live, Settings). Uses the validated FileCreate → FileWrite(…) →
 * FileClose sequence; FileClose is what commits the file. Body, category and
 * fourcc come from the file's own CBIN header. The handle is always closed (even
 * on a mid-write failure), preserving the original error. Destructive:
 * overwrites whatever is at {bank, slot}.
 */
export async function pushFile(
  session: NordSession,
  bank: number,
  slot: number,
  fileBytes: Uint8Array,
  name: string,
): Promise<void> {
  const body = fileBytes.subarray(44); // strip the 44-byte CBIN header — the device stores the body only
  const header = readCbinHeader(fileBytes); // for the file's category and type tag
  const nameBytes = new TextEncoder().encode(name);

  const create = await session.request(
    CReqFileCreate,
    [bank, slot, body.length, ext2Type(header.tag), 0xffffffff, header.category, nameBytes.length],
    nameBytes,
  );
  if (create.status !== 0) {
    throw new NordError(`FileCreate failed (status ${create.status}) at ${formatSlot(bank, slot)}`);
  }

  try {
    let offset = 0;
    while (offset < body.length) {
      const chunk = body.subarray(offset, Math.min(offset + WRITE_WINDOW, body.length));
      const w = await session.request(CReqFileWrite, [bank, slot, offset, chunk.length], chunk);
      if (w.status !== 0) throw new NordError(`FileWrite failed at offset ${offset} (status ${w.status})`);
      offset += chunk.length;
    }
  } catch (e) {
    await session.request(CReqFileClose, [bank, slot]).catch(() => {}); // best-effort close, keep original error
    throw e;
  }

  const close = await session.request(CReqFileClose, [bank, slot]);
  if (close.status !== 0) throw new NordError(`FileClose failed (status ${close.status}) — file not committed`);
}

/** Back-compat alias (Program slot push). */
export function pushProgram(
  session: NordSession,
  bank: number,
  slot: number,
  fileBytes: Uint8Array,
  name: string,
): Promise<void> {
  return pushFile(session, bank, slot, fileBytes, name);
}

/** Delete the program at {bank, slot}. Destructive. */
export async function deleteProgram(session: NordSession, bank: number, slot: number): Promise<void> {
  const reply = await session.request(CReqFileDelete, [bank, slot]);
  if (reply.status !== 0) throw new NordError(`FileDelete failed (status ${reply.status})`);
}
