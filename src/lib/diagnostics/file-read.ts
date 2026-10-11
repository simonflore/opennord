/**
 * `file.read` diagnostics — an opt-in report of how well OpenNord could read a
 * program file the player opened, so files from models we can't test locally
 * tell us whether the reader matched their layout. What a report carries is
 * listed for users in docs/LEGAL.md ("Diagnostics"); keep the two in step.
 *
 * Privacy line: program files carry no name in the binary (the maintainers’ notes "Name
 * is not in the binary"), and only framing bytes are copied — the header from the
 * version field up to (not including) the NSM-era CRC at 0x18, and the record /
 * body version word (plus the first block length on a block chain). No parameter
 * bits, no checksum, no hash. Only tags a reader claims ({@link PROGRAM_TAGS}) are
 * reported, so samples (which embed a name), pianos and presets never are.
 * Reader warnings are generic strings built from sizes, versions and layout
 * field names. One report per distinct file per session; gated on the per-device
 * opt-in (file-support-pref.ts), off by default.
 */
import type { DiagnosticEvent, Diagnostics } from '../capabilities/types';
import { identifyNordFile, type NordFileInfo } from '../clavia/nord-file';
import { LEGACY_RECORD_OFFSET, NSM_RECORD_OFFSET } from '../clavia/legacy-record';
import { PROGRAM_TAGS, parseClaviaFile } from '../formats';
import { decodeNs3 } from '../ns3/decode';
import { decodeNs2 } from '../ns2/decode';
import { BUILD, COMMIT } from '../version';
import { readFileSupportOptIn } from './file-support-pref';

/** Header window: the u16 version field at 0x14 and the two bytes after it — stops before the NSM-era CRC-32 at 0x18. */
const VERSION_WINDOW = 0x14;
const HEADER_WINDOW_BYTES = 4;
/** Body window: a legacy record's u16 version; a block chain's u32 format version + first block length. */
const LEGACY_BODY_BYTES = 2;
const BLOCK_CHAIN_BODY_BYTES = 5;
/** Warnings kept per report, and the length each is cut to. */
const MAX_WARNINGS = 10;
const MAX_WARNING_CHARS = 200;

/** What the reader made of a file, in model-agnostic terms. */
export interface ReaderVerdict {
  /** True when the reader read the body against its layout; false = header only; null = the reader doesn't say. */
  layoutMatched: boolean | null;
  headerOnly: boolean;
  /** Record version (legacy) or body format version (block chain), when the reader found one. */
  recordVersion: number | null;
  warningCount: number;
  warnings: string[];
  outOfRange: number;
}

export interface FileReadDetail {
  tag: string;
  modelId: string | null;
  size: number;
  cbinFormatType: number;
  versionField0x14: number;
  framing: {
    /** Hex of bytes 0x14–0x17. */
    at0x14: string;
    /** Where the reader expects the record/body: 0x18 (legacy) or 0x2C (NSM-era). */
    bodyOffset: number;
    /** Hex of the version word at `bodyOffset` (2 bytes on a legacy record, 5 with the first block length on a block chain). */
    atBody: string;
  };
  reader: ReaderVerdict;
  app: { build: number | null; commit: string | null };
}

const hex = (bytes: Uint8Array, at: number, n: number): string =>
  Array.from(bytes.subarray(at, Math.min(bytes.length, at + n)), (b) => b.toString(16).padStart(2, '0')).join('');

const u16le = (bytes: Uint8Array, at: number): number => (bytes[at] ?? 0) | ((bytes[at + 1] ?? 0) << 8);

/** Read a property off a decoded program without trusting its shape. */
type Loose = Record<string, unknown>;

/** Turn any reader's result into the shared verdict. Pure. */
export function verdictOf(program: Loose): ReaderVerdict {
  const warnings = Array.isArray(program.warnings)
    ? program.warnings.filter((w): w is string => typeof w === 'string')
    : [];
  const values = program.values;
  const layoutMatched: boolean | null =
    typeof program.layoutMatched === 'boolean' ? program.layoutMatched          // block chain + legacy-program readers
    : typeof program.complete === 'boolean' ? program.complete                   // Wave, C2D
    : 'record' in program ? program.record != null                               // Stage Classic / EX
    : 'kind' in program ? program.parsed === true                                // Stage 4 (parsed = structured decode)
    : values && typeof values === 'object' ? Object.keys(values).length > 0      // other legacy-record readers
    : program.program != null || program.slots != null ? true                    // Lead 4
    : null;
  const recordVersion =
    typeof program.recordVersion === 'number' ? program.recordVersion
    : typeof program.formatVersion === 'number' ? program.formatVersion
    : null;
  const outOfRange = Array.isArray(program.outOfRange) ? program.outOfRange.length : 0;
  return {
    layoutMatched,
    headerOnly: layoutMatched === false,
    recordVersion,
    warningCount: warnings.length,
    warnings: warnings.slice(0, MAX_WARNINGS).map((w) => (w.length > MAX_WARNING_CHARS ? `${w.slice(0, MAX_WARNING_CHARS - 1)}…` : w)),
    outOfRange,
  };
}

/** Run the reader OpenNord uses for this file (the views' own entry points). Never throws. */
function readerVerdict(bytes: Uint8Array, info: NordFileInfo): ReaderVerdict {
  try {
    // Stage 3 / Stage 2 programs render through their own decoders, not a codec.
    if (info.tag === 'ns3f') return verdictOf(decodeNs3(bytes) as unknown as Loose);
    if (info.tag === 'ns2p') return verdictOf(decodeNs2(bytes) as unknown as Loose);
    return verdictOf(parseClaviaFile(bytes).program as unknown as Loose);
  } catch (e) {
    // Only the error's class name: a message is ours, but keep the payload minimal.
    const name = e instanceof Error ? e.name : 'Error';
    return { layoutMatched: false, headerOnly: true, recordVersion: null, warningCount: 1, warnings: [`reader threw ${name}`], outOfRange: 0 };
  }
}

/**
 * The `file.read` event for a program file, or null when the bytes aren't a
 * program file a reader claims. Pure apart from the build constants.
 */
export function buildFileReadEvent(bytes: Uint8Array): DiagnosticEvent | null {
  const info = identifyNordFile(bytes);
  if (!info.recognized || !PROGRAM_TAGS.has(info.tag)) return null;

  const bodyOffset = info.formatType === 0 ? LEGACY_RECORD_OFFSET : NSM_RECORD_OFFSET;
  // A legacy record (every formatType-0 file, and the Stage 2 behind an NSM-era header) opens with a u16 version.
  const legacyRecord = info.formatType === 0 || info.tag === 'ns2p';
  const reader = readerVerdict(bytes, info);
  const status = reader.layoutMatched === null ? 'read (no layout check)' : reader.headerOnly ? 'header-only' : 'read';
  const detail: FileReadDetail = {
    tag: info.tag,
    modelId: info.modelId ?? null,
    size: bytes.length,
    cbinFormatType: info.formatType,
    versionField0x14: u16le(bytes, VERSION_WINDOW),
    framing: {
      at0x14: hex(bytes, VERSION_WINDOW, HEADER_WINDOW_BYTES),
      bodyOffset,
      atBody: hex(bytes, bodyOffset, legacyRecord ? LEGACY_BODY_BYTES : BLOCK_CHAIN_BODY_BYTES),
    },
    reader,
    app: { build: BUILD, commit: COMMIT },
  };
  return {
    kind: 'file.read',
    ok: reader.layoutMatched !== false,
    message: `${info.tag} ${bytes.length} B: ${status}`,
    detail: detail as unknown as Record<string, unknown>,
  };
}

/** FNV-1a over the bytes, plus the length — a session dedupe key, never sent. */
function fileKey(bytes: Uint8Array): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return `${(h >>> 0).toString(36)}:${bytes.length}`;
}

/** Files already reported this session (page load). */
const reported = new Set<string>();

/** Test hook: forget what this session reported. */
export function resetFileReadSession(): void {
  reported.clear();
}

/**
 * Report a program file the player opened — only when they opted in, and once per
 * distinct file per session. Never throws; returns whether an event was recorded.
 */
export function reportFileRead(
  diagnostics: Diagnostics, bytes: Uint8Array | undefined,
  enabled: () => boolean = readFileSupportOptIn,
): boolean {
  try {
    if (!bytes || bytes.length === 0 || !enabled()) return false;
    const key = fileKey(bytes);
    if (reported.has(key)) return false;
    const event = buildFileReadEvent(bytes);
    if (!event) return false;
    reported.add(key);
    diagnostics.record(event);
    return true;
  } catch {
    return false; // diagnostics must never break opening a file
  }
}
