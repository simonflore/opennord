/**
 * What every byte of one file is, by the file's own layout — for the decode
 * inspector. The CBIN header fields, the record or body framing (format version,
 * block lengths), each parameter the model's firmware layout places there, and
 * the bits the layout leaves unused (reserved space, padding). A byte is
 * `unmapped` only where no layout says anything about it: a model OpenNord has no
 * layout for, or a file whose body does not fit the layout.
 *
 * Synth presets (`.ns3y`, `.ns2s`) are mapped with their preset layouts
 * (synth-preset.ts), every other file with its model's program
 * layout (contribute/coverage.ts). Pure; never throws.
 */
import { readBits } from '../clavia/bitstream';
import { CBIN_BODY_OFFSET, cbinFraming, fileTypeTag, hasCbinMagic } from '../clavia/cbin';
import { fieldValue, walkBlockChain, type FwField } from '../clavia/block-chain';
import { legacyDataOffset, type LegacyField } from '../clavia/legacy-record';
import { programLayoutFor, type ProgramLayout } from './coverage';
import { synthPresetLayout } from '../synth-preset';

/** header/structure/field: known and labelled · unused: known to hold nothing · unmapped: no layout covers it. */
export type ByteRole = 'header' | 'structure' | 'field' | 'unused' | 'unmapped';

export interface ByteInfo {
  role: ByteRole;
  /** What sits in the byte: header field, framing, or parameter keys. */
  labels: string[];
}

/** One parameter as the file stores it (raw descriptor encoding applied, no version conversion). */
export interface FieldRead {
  key: string;
  value: number;
  /** First bit in the file (byte × 8 + bit, MSB first). */
  fileBit: number;
  width: number;
}

export interface FileByteMap {
  bytes: ByteInfo[];
  fields: FieldRead[];
  /** The layout the body was mapped with, e.g. "Nord Stage 2"; null when none fits. */
  layoutName: string | null;
  /** Why the body is unmapped, when it is. */
  note?: string;
}

const HEADER: readonly [number, number, string][] = [
  [0x00, 4, 'CBIN magic'], [0x04, 4, 'header format'], [0x08, 4, 'file type tag'], [0x0c, 2, 'bank'],
  [0x0e, 2, 'location in bank'], [0x10, 4, 'category'], [0x14, 4, 'version'],
];

function layoutForFile(tag: string, modelId: string | undefined): ProgramLayout | null {
  return synthPresetLayout(tag) ?? (modelId ? programLayoutFor(modelId) : null);
}

/** Map every byte of `bytes`; `modelId` is the model the file was identified as (identify-summary.ts). */
export function fileByteMap(bytes: Uint8Array, modelId: string | undefined): FileByteMap {
  const info: ByteInfo[] = Array.from(bytes, () => ({ role: 'unmapped' as ByteRole, labels: [] }));
  const set = (from: number, n: number, role: ByteRole, label: string) => {
    for (let i = from; i < from + n && i < info.length; i++) {
      // A byte shared by a parameter and unused bits is the parameter's.
      if (role === 'unused' && info[i].role !== 'unmapped') continue;
      if (info[i].role === 'unused' || info[i].role === 'unmapped') info[i] = { role, labels: [] };
      if (!info[i].labels.includes(label)) info[i].labels.push(label);
    }
  };
  /** Mark the bytes bits [fileBit, fileBit + width) touch. */
  const setBits = (fileBit: number, width: number, label: string) =>
    set(fileBit >> 3, ((fileBit + width - 1) >> 3) - (fileBit >> 3) + 1, 'field', label);
  const fields: FieldRead[] = [];
  const field = (fileBit: number, f: FwField | LegacyField) => {
    setBits(fileBit, f.width, f.key);
    fields.push({ key: f.key, value: fieldValue(readBits(bytes, fileBit, f.width), f), fileBit, width: f.width });
  };

  if (!hasCbinMagic(bytes)) return { bytes: info, fields, layoutName: null, note: 'Not a Nord file: it does not start with the CBIN header.' };
  const framing = cbinFraming(bytes);
  for (const [at, n, label] of HEADER) set(at, n, 'header', label);
  if (framing.recordOffset === CBIN_BODY_OFFSET) {
    set(0x18, 4, 'header', 'checksum (CRC-32)');
    set(0x1c, CBIN_BODY_OFFSET - 0x1c, 'unused', 'reserved (zero)');
  }
  if (framing.trailerBytes > 0) set(bytes.length - framing.trailerBytes, framing.trailerBytes, 'header', 'checksum (CRC-16)');

  const layout = layoutForFile(fileTypeTag(bytes), modelId);
  if (!layout) return { bytes: info, fields, layoutName: null, note: 'OpenNord has no parameter layout for this file type.' };
  const start = framing.recordOffset;
  const end = start + framing.recordBytes;

  if (layout.kind === 'fw') {
    const l = layout.layout;
    const walk = walkBlockChain(bytes.subarray(start, Math.max(start, end)));
    if (!walk.ok || walk.blocks.length !== l.blocks.length) {
      return { bytes: info, fields, layoutName: null, note: `The body does not follow the ${l.model} layout (${walk.reason ?? `${walk.blocks.length} blocks, expected ${l.blocks.length}`}).` };
    }
    set(start, 4, 'structure', 'format version');
    walk.blocks.forEach((blk, i) => {
      set(start + blk.offset, 1, 'structure', `block length · ${l.blocks[i].name}`);
      set(start + blk.offset + 1, blk.length, 'unused', `reserved · ${l.blocks[i].name}`);
    });
    for (const f of l.fields) {
      const blk = walk.blocks[f.block];
      if (f.bit + f.width <= blk.length * 8) field((start + blk.offset + 1) * 8 + f.bit, f);
    }
    return { bytes: info, fields, layoutName: l.model };
  }

  const l = layout.layout;
  const dataStart = legacyDataOffset(bytes, l);
  const dataBytes = l.dataBytes + (l.padBytes ?? 0);
  if (end - dataStart !== dataBytes) {
    return { bytes: info, fields, layoutName: null, note: `The record is ${end - dataStart} bytes; the ${l.model} layout makes ${dataBytes}.` };
  }
  set(start, dataStart - start, 'structure', 'record version');
  set(dataStart, dataBytes, 'unused', 'reserved');
  for (const f of l.fields) field(dataStart * 8 + f.bit, f);
  for (const m of l.morphLists ?? []) {
    setBits(dataStart * 8 + m.countBit, m.countWidth, `${m.set} morph list`);
    setBits(dataStart * 8 + m.entryBit, m.maxEntries * (m.paramBits + m.sourceBits + m.deltaBits), `${m.set} morph list`);
  }
  return { bytes: info, fields, layoutName: l.model };
}
