/**
 * Composition root for the Nord file family — the one place that knows every
 * model codec and routes a raw file to the right one. Consumers parse through
 * `parseClaviaFile` rather than reaching for a model's parser directly, so adding
 * a new body decoder is a one-line change to the codec list here, not a rewrite
 * of every call site.
 *
 * This module sits *above* both `clavia/` (the shared container) and the model
 * folders (`ns4/`, `ne6/`, …), so it alone may depend on concrete program types.
 */
import type { ModelCodec, ClaviaModel } from './clavia/model';
import { identifyNordFile, type NordFileInfo } from './clavia/nord-file';
import { ns4Codec } from './ns4/codec';
import { parseNs4Program } from './ns4/parse';
import type { NS4Program } from './ns4/types';
import { ne6Codec } from './ne6/codec';
import type { Ne6Program } from './ne6/types';
import { np4Codec } from './np4/codec';
import type { Np4Program } from './np4/types';
import { np5Codec } from './np5/codec';
import type { Np5Program } from './np5/types';
import { ng2Codec } from './ng2/codec';
import type { Ng2Program } from './ng2/types';
import { nw2Codec } from './nw2/codec';
import type { Nw2Program } from './nw2/types';
import { nw1Codec } from './nw1/codec';
import type { Nw1Program } from './nw1/types';
import { nl4Codec } from './nl4/codec';
import type { Nl4Program } from './nl4/types';
import { nlaCodec } from './nla/codec';
import type { NlaProgram } from './nla/types';
import { ne3Codec } from './ne3/codec';
import { nc2Codec } from './nc2/codec';
import type { Nc2Program } from './nc2/types';
import type { Ne3Program } from './ne3/types';
import { ne4Codec } from './ne4/codec';
import type { Ne4Program } from './ne4/types';
import { ne5Codec } from './ne5/codec';
import type { Ne5Program } from './ne5/types';
import { ngCodec } from './ng/codec';
import type { NgProgram } from './ng/types';
import { np6Codec } from './np6/codec';
import type { Np6Program } from './np6/types';
import { ne7Codec } from './ne7/codec';
import type { Ne7Program } from './ne7/types';
import { no3Codec } from './no3/codec';
import type { No3Program } from './no3/types';
import { np3Codec } from './np3/codec';
import type { Np3Program } from './np3/types';
import { ncCodec } from './nc/codec';
import type { NcProgram } from './nc/types';
import { ns1Codec } from './ns1/codec';
import type { Ns1Program } from './ns1/types';
import { np1Codec } from './np1/codec';
import type { Np1Program } from './np1/types';
import { np2Codec } from './np2/codec';
import type { Np2Program } from './np2/types';
import type { EngineSummary } from './clavia/engines';
import { ns4Engines } from './ns4/engines';
import { ns3Engines } from './ns3/engines';
import { ns2Engines } from './ns2/engines';
import { decodeNs3 } from './ns3/decode';
import { decodeNs2 } from './ns2/decode';
import { cbinFraming } from './clavia/cbin';
import { fileTagInfo } from './clavia/file-tags';
import type { LegacyLayout } from './clavia/legacy-record';
import { NS2_LAYOUT } from './ns2/layout.generated';
import { NE3_LAYOUT } from './ne3/layout.generated';
import { NE3HP_LAYOUT } from './ne3/layout-hp.generated';
import { NE4_LAYOUT } from './ne4/layout.generated';
import { NE5_LAYOUT } from './ne5/layout.generated';
import { NP1_LAYOUT } from './np1/layout.generated';
import { NP2_LAYOUT } from './np2/layout.generated';
import { NP3_LAYOUT } from './np3/layout.generated';
import { NCP_LAYOUT } from './nc/layout.generated';
import { NC2_LAYOUT } from './nc2/layout.generated';

/** Every decoded program type OpenNord supports. Discriminate on `model` or `parsed`. */
export type NordProgram =
  | NS4Program | Ne6Program
  | Np4Program | Np5Program | Ng2Program
  | Nw1Program | Nw2Program
  | Nl4Program | NlaProgram
  | Ne3Program | Ne4Program | Ne5Program | Nc2Program
  | NgProgram | Np6Program | Ne7Program | No3Program
  | Np3Program | NcProgram | Ns1Program | Np1Program | Np2Program;

/**
 * Every model OpenNord can decode. Add new codecs here as they land —
 * formats.ts is the only file that knows all concrete program types.
 */
const CODECS: readonly ModelCodec<NordProgram>[] = [
  ns4Codec,
  ne6Codec,
  np4Codec,
  np5Codec,
  ng2Codec,
  nw2Codec,
  nw1Codec,
  nl4Codec,
  nlaCodec,
  ne3Codec,
  nc2Codec,
  ne4Codec,
  ne5Codec,
  // Firmware-layout readers (clavia/block-chain.ts): read-only.
  ngCodec,
  np6Codec,
  ne7Codec,
  no3Codec,
  // Later ColdFire legacy records (clavia/legacy-program.ts): read-only.
  np3Codec,
  np2Codec,
  np1Codec,
  ns1Codec,
  ncCodec,
];

/** Every program file-type tag OpenNord reads: the codecs' tags plus Stage 3 / Stage 2, which decode outside CODECS. */
export const PROGRAM_TAGS: ReadonlySet<string> = new Set([...CODECS.flatMap((c) => c.tags), 'ns3f', 'ns2p']);

/** True when `program` is a fully-structured NS4 program (has `kind`). */
export function isNs4Program(program: NordProgram): program is NS4Program {
  return 'kind' in program;
}

export interface ClaviaFile {
  /** Which Nord model this file is (from a claiming codec, else the header). */
  model: ClaviaModel;
  /** Container/header structure — always available for a recognized CBIN file. */
  info: NordFileInfo;
  /** The decoded program. Narrow on `model` or `program.parsed` before accessing model-specific fields. */
  program: NordProgram;
  /** Which engines are active, on this generation's own axis. Undefined when unknown. */
  engines?: EngineSummary;
}

const GENERATION_MODEL: Record<string, ClaviaModel> = {
  'Stage 4': 'ns4', 'Stage 3': 'ns3', 'Stage 2': 'ns2',
};

/** A legacy record's whole length: its version, data and padding. */
const legacyRecordBytes = (l: LegacyLayout) => (l.versionBytes ?? 2) + l.dataBytes + (l.padBytes ?? 0);

/**
 * Program records of a fixed length (the legacy-record readers), by program
 * tag. A Live file of these models reads as a program only when its record
 * (cbin.ts framing: size − 44, or size − 26 legacy) has exactly this length.
 * The block-chain readers (Stage 3/4, the ARM pianos, Electro 6/7, Organ 3,
 * Wave 2) delimit their own blocks and check them, so their Lives need no
 * length gate.
 */
const PROGRAM_RECORD_BYTES: Readonly<Record<string, readonly number[]>> = {
  ns2p: [legacyRecordBytes(NS2_LAYOUT)],
  nepg: [...new Set([legacyRecordBytes(NE3_LAYOUT), legacyRecordBytes(NE3HP_LAYOUT)])],
  ne4p: [legacyRecordBytes(NE4_LAYOUT)],
  ne5p: [legacyRecordBytes(NE5_LAYOUT)],
  nppg: [legacyRecordBytes(NP1_LAYOUT)],
  np2p: [legacyRecordBytes(NP2_LAYOUT)],
  np3p: [legacyRecordBytes(NP3_LAYOUT)],
  ncpg: [legacyRecordBytes(NCP_LAYOUT)],
  nc2p: [legacyRecordBytes(NC2_LAYOUT)],
};

/**
 * The program tag whose reader reads this file: its own tag for a program,
 * the model's program tag for a Live file whose record is a program record
 * (a Live slot stores one verbatim — clavia/file-tags.ts), else undefined
 * (Settings, Songs, Set Lists, presets, or a Live of another length: those are
 * identified, not decoded).
 */
export function programTagFor(info: NordFileInfo, bytes: Uint8Array): string | undefined {
  const t = fileTagInfo(info.tag);
  if (t?.kind === 'program' || t?.kind === 'performance') return info.tag;
  if (t?.kind !== 'live' || !t.program) return undefined;
  const fixed = PROGRAM_RECORD_BYTES[t.program];
  return !fixed || fixed.includes(cbinFraming(bytes).recordBytes) ? t.program : undefined;
}

/** The codec that claims this file by tag (and version range, if it sets one). */
function resolveCodec(info: NordFileInfo, bytes: Uint8Array): ModelCodec<NordProgram> | undefined {
  const tag = programTagFor(info, bytes);
  if (!tag) return undefined;
  const raw = info.version !== undefined ? Math.round(parseFloat(info.version) * 100) : undefined;
  return CODECS.find((c) =>
    c.tags.includes(tag) &&
    (!c.versionRange || (raw !== undefined && raw >= c.versionRange[0] && raw <= c.versionRange[1])));
}

/**
 * Which engines are active, per generation. Stage 2/3 are decoded here rather
 * than via CODECS: registering them would reroute ProgramView and regress
 * Ns3ProgramView (see docs/specs/2026-07-17-engine-display-design.md §3a).
 * `model` is already correct for them via GENERATION_MODEL. The decode is cheap —
 * real .ns3f/.ns2p files are under 1 KB.
 */
function engineSummaryFor(model: ClaviaModel, program: NordProgram, bytes: Uint8Array, programTag: string | undefined): EngineSummary | undefined {
  if (model === 'ns4') return isNs4Program(program) && program.parsed ? ns4Engines(program) : undefined;
  // Stage 2/3 Settings, Songs and Synth presets share the generation but not the program body.
  if (model === 'ns3') return programTag === 'ns3f' ? ns3Engines(decodeNs3(bytes).panels) : undefined;
  if (model === 'ns2') return programTag === 'ns2p' ? ns2Engines(decodeNs2(bytes).slots.filter((s) => s.active)) : undefined;
  return undefined;
}

/**
 * Identify and decode any Nord CBIN file. Reads the shared header once, routes to
 * the model codec that claims it, and falls back to the recognized-but-unparsed
 * shell for files no codec decodes yet (Stage 2/3) — preserving today's behavior
 * exactly while giving every caller a single, model-aware entry point.
 */
export function parseClaviaFile(bytes: Uint8Array): ClaviaFile {
  const info = identifyNordFile(bytes);
  const codec = resolveCodec(info, bytes);
  const program = codec ? codec.decode(bytes) : parseNs4Program(bytes);
  const model = codec?.model ?? GENERATION_MODEL[info.generation] ?? 'unknown';
  return { model, info, program, engines: engineSummaryFor(model, program, bytes, programTagFor(info, bytes)) };
}
