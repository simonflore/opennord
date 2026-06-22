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

/** Every decoded program type OpenNord supports. Discriminate on `model` or `parsed`. */
export type NordProgram = NS4Program | Ne6Program | Np4Program | Np5Program | Ng2Program | Nw2Program;

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
];

export interface ClaviaFile {
  /** Which Nord model this file is (from a claiming codec, else the header). */
  model: ClaviaModel;
  /** Container/header structure — always available for a recognized CBIN file. */
  info: NordFileInfo;
  /** The decoded program. Narrow on `model` or `program.parsed` before accessing model-specific fields. */
  program: NordProgram;
}

const GENERATION_MODEL: Record<string, ClaviaModel> = {
  'Stage 4': 'ns4', 'Stage 3': 'ns3', 'Stage 2': 'ns2',
};

/** The codec that claims this file by tag (and version range, if it sets one). */
function resolveCodec(info: NordFileInfo): ModelCodec<NordProgram> | undefined {
  const raw = info.version !== undefined ? Math.round(parseFloat(info.version) * 100) : undefined;
  return CODECS.find((c) =>
    c.tags.includes(info.tag) &&
    (!c.versionRange || (raw !== undefined && raw >= c.versionRange[0] && raw <= c.versionRange[1])));
}

/**
 * Identify and decode any Nord CBIN file. Reads the shared header once, routes to
 * the model codec that claims it, and falls back to the recognized-but-unparsed
 * shell for files no codec decodes yet (Stage 2/3) — preserving today's behavior
 * exactly while giving every caller a single, model-aware entry point.
 */
export function parseClaviaFile(bytes: Uint8Array): ClaviaFile {
  const info = identifyNordFile(bytes);
  const codec = resolveCodec(info);
  const program = codec ? codec.decode(bytes) : parseNs4Program(bytes);
  const model = codec?.model ?? GENERATION_MODEL[info.generation] ?? 'unknown';
  return { model, info, program };
}
