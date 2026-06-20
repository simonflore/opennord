/**
 * Composition root for the Nord file family — the one place that knows every
 * model codec and routes a raw file to the right one. Consumers parse through
 * `parseClaviaFile` rather than reaching for a model's parser directly, so adding
 * a Stage 2/3 body decoder (docs/MULTI-MODEL.md, Tier 2) is a one-line change to
 * the codec list here, not a rewrite of every call site.
 *
 * This module sits *above* both `clavia/` (the shared container) and the model
 * folders (`ns4/`), so it alone may depend on concrete program types.
 */
import type { ModelCodec, ClaviaModel } from './clavia/model';
import { identifyNordFile, type NordFileInfo } from './clavia/nord-file';
import { ns4Codec } from './ns4/codec';
import { parseNs4Program } from './ns4/parse';
import type { NS4Program } from './ns4/types';

/**
 * Every model OpenNord can *fully* decode. Stage 2/3 body codecs append here as
 * they land (Tier 2). For now the Stage 4 codec is the only full decoder.
 */
const CODECS: readonly ModelCodec<NS4Program>[] = [ns4Codec];

export interface ClaviaFile {
  /** Which Nord generation this file is (from a claiming codec, else the header). */
  model: ClaviaModel;
  /** Container/header structure — always available for a recognized CBIN file. */
  info: NordFileInfo;
  /**
   * The decoded program. Fully decoded when a codec claims the file (today: Stage
   * 4); otherwise a recognized-but-unparsed `NS4Program` shell (`parsed: false`)
   * so the structure view still renders. Generalises to a per-model union once a
   * second body codec lands.
   */
  program: NS4Program;
}

const GENERATION_MODEL: Record<string, ClaviaModel> = {
  'Stage 4': 'ns4', 'Stage 3': 'ns3', 'Stage 2': 'ns2',
};

/** The codec that claims this file by tag (and version range, if it sets one). */
function resolveCodec(info: NordFileInfo): ModelCodec<NS4Program> | undefined {
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
