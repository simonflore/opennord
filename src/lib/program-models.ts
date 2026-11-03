/**
 * Every model whose programs can be read, summarised and written from its
 * generated layout, with no UI and no third-party tables: the reader, the shared
 * summary (clavia/decoded.ts), the layout its fields come from, and the layout
 * writer (program-write-layout.ts) when OpenNord writes the model.
 *
 * The Stage 4 has its own codec (ns4/) and is not listed. The Stage 2 and Stage 3
 * are read here through their value readers (ns2/values.ts, ns3/values.ts) and
 * have no summary: their summaries come from decode.ts, whose display tables
 * include ones from a GPLv3 project (ATTRIBUTION.md), and this list is for callers
 * that use only OpenNord's own code. The app reads them through formats.ts and
 * presenters.ts as before.
 */
import type { ClaviaModel } from './clavia/model';
import type { DecodedProgram } from './clavia/decoded';
import type { FwLayout } from './clavia/block-chain';
import type { LegacyLayout } from './clavia/legacy-record';
import { LAYOUT_WRITERS, NOT_WRITABLE, type LayoutWriter } from './program-write-layout';
import { PIANO_NAMES } from './ns4/names.generated';
import { readNs2Values } from './ns2/values';
import { NS2_LAYOUT } from './ns2/layout.generated';
import { readNs3Values } from './ns3/values';
import { NS3_LAYOUT } from './ns3/layout.generated';
import { decodeNs1 } from './ns1/decode';
import { ns1Decoded } from './ns1/present';
import { NS1_LAYOUT } from './ns1/layout.generated';
import { decodeNe3 } from './ne3/decode';
import { ne3Decoded } from './ne3/present';
import { NE3HP_LAYOUT } from './ne3/layout-hp.generated';
import { decodeNe4 } from './ne4/decode';
import { NE4_LAYOUT } from './ne4/layout.generated';
import { decodeNe5 } from './ne5/decode';
import { ne5Decoded } from './ne5/present';
import { NE5_LAYOUT } from './ne5/layout.generated';
import { decodeNe6 } from './ne6/decode';
import { ne6Decoded } from './ne6/present';
import { NE6_LAYOUT } from './ne6/layout.generated';
import { decodeNe7 } from './ne7/decode';
import { ne7Decoded } from './ne7/present';
import { NE7_LAYOUT } from './ne7/layout.generated';
import { decodeNg } from './ng/decode';
import { ngDecoded } from './ng/present';
import { NG_LAYOUT } from './ng/layout.generated';
import { decodeNg2 } from './ng2/decode';
import { ng2Decoded } from './ng2/present';
import { NG2_LAYOUT } from './ng2/layout.generated';
import { decodeNp1 } from './np1/decode';
import { np1Decoded } from './np1/present';
import { NP1_LAYOUT } from './np1/layout.generated';
import { decodeNp2 } from './np2/decode';
import { np2Decoded } from './np2/present';
import { NP2_LAYOUT } from './np2/layout.generated';
import { decodeNp3 } from './np3/decode';
import { np3Decoded } from './np3/present';
import { NP3_LAYOUT } from './np3/layout.generated';
import { decodeNp4 } from './np4/decode';
import { np4Decoded } from './np4/present';
import { NP4_LAYOUT } from './np4/layout.generated';
import { decodeNp5 } from './np5/decode';
import { np5Decoded } from './np5/present';
import { NP5_LAYOUT } from './np5/layout.generated';
import { decodeNp6 } from './np6/decode';
import { np6Decoded } from './np6/present';
import { NP6_LAYOUT } from './np6/layout.generated';
import { decodeNc } from './nc/decode';
import { ncDecoded } from './nc/present';
import { NCP_LAYOUT } from './nc/layout.generated';
import { decodeNc2 } from './nc2/decode';
import { nc2Decoded } from './nc2/present';
import { NC2_LAYOUT } from './nc2/layout.generated';
import { decodeNo3 } from './no3/decode';
import { no3Decoded } from './no3/present';
import { NO3_LAYOUT } from './no3/layout.generated';
import { decodeNw1 } from './nw1/decode';
import { nw1Decoded } from './nw1/present';
import { NW1_LAYOUT } from './nw1/layout.generated';
import { decodeNw2 } from './nw2/decode';
import { nw2Decoded } from './nw2/present';
import { NW2_LAYOUT } from './nw2/layout.generated';
import { decodeNl4 } from './nl4/decode';
import { NL4_LAYOUT } from './nl4/layout.generated';
import { decodeNla } from './nla/decode';
import { nlaDecoded } from './nla/present';
import { NLA_LAYOUT } from './nla/layout.generated';

/** What every reader here returns, as far as a model-agnostic caller needs it. */
export interface ProgramRead {
  /** Field values by generated key; empty when the body could not be read. */
  readonly values: Readonly<Partial<Record<string, number>>>;
  readonly warnings: readonly string[];
}

export interface ProgramModel {
  readonly model: ClaviaModel;
  /** The program file tags the reader takes (a performance or Live tag where the model has one). */
  readonly tags: readonly string[];
  /** The layout the reader's values and the writer's keys come from. */
  readonly layout: FwLayout | LegacyLayout;
  readonly read: (bytes: Uint8Array) => ProgramRead;
  /** The shared summary in words, when the model has one. */
  readonly present?: (bytes: Uint8Array) => DecodedProgram;
  /** Absent when OpenNord doesn't write the model; {@link notWritable} says why. */
  readonly writer?: LayoutWriter;
  readonly notWritable?: string;
}

const pianoName = (hash: number): string | undefined => PIANO_NAMES[hash];

type Values = Partial<Record<string, number>>;
/**
 * Most readers return `values` at the top. The Lead 4 keeps a single program's under
 * `program`, and a performance's four under `slots`: its slot A is read, as the
 * Lead A1's reader does for its performances.
 */
type AnyRead = { values?: Values; program?: { values: Values }; slots?: readonly { values: Values }[]; warnings: readonly string[] };
const adapt = (decode: (bytes: Uint8Array) => AnyRead) => (bytes: Uint8Array): ProgramRead => {
  const p = decode(bytes);
  if (p.values ?? p.program) return { values: p.values ?? p.program!.values, warnings: p.warnings };
  if (p.slots?.[0]) return { values: p.slots[0].values, warnings: [...p.warnings, 'A performance: its slot A is shown.'] };
  return { values: {}, warnings: p.warnings };
};

const entry = (
  model: ClaviaModel, tags: readonly string[], layout: FwLayout | LegacyLayout,
  decode: (bytes: Uint8Array) => AnyRead, present?: (bytes: Uint8Array) => DecodedProgram,
): ProgramModel => ({
  model, tags, layout, read: adapt(decode),
  ...(present ? { present } : {}),
  ...(LAYOUT_WRITERS[model] ? { writer: LAYOUT_WRITERS[model] } : { notWritable: NOT_WRITABLE[model] ?? 'its model is not supported' }),
});

export const PROGRAM_MODELS: readonly ProgramModel[] = [
  entry('ns2', ['ns2p'], NS2_LAYOUT, readNs2Values),
  entry('ns3', ['ns3f'], NS3_LAYOUT, readNs3Values),
  entry('ns1', ['nspg'], NS1_LAYOUT, decodeNs1, ns1Decoded),
  entry('ne3', ['nepg'], NE3HP_LAYOUT, decodeNe3, ne3Decoded),
  entry('ne4', ['ne4p'], NE4_LAYOUT, decodeNe4),
  entry('ne5', ['ne5p'], NE5_LAYOUT, decodeNe5, ne5Decoded),
  entry('ne6', ['ne6p'], NE6_LAYOUT, decodeNe6, ne6Decoded),
  entry('ne7', ['ne7p'], NE7_LAYOUT, decodeNe7, (b) => ne7Decoded(b, pianoName)),
  entry('ng', ['ngp'], NG_LAYOUT, decodeNg, (b) => ngDecoded(b, pianoName)),
  entry('ng2', ['ng2p'], NG2_LAYOUT, decodeNg2, (b) => ng2Decoded(b, pianoName)),
  entry('np1', ['nppg'], NP1_LAYOUT, decodeNp1, np1Decoded),
  entry('np2', ['np2p'], NP2_LAYOUT, decodeNp2, np2Decoded),
  entry('np3', ['np3p'], NP3_LAYOUT, decodeNp3, np3Decoded),
  entry('np4', ['np4p'], NP4_LAYOUT, decodeNp4, (b) => np4Decoded(b, pianoName)),
  entry('np5', ['np5p'], NP5_LAYOUT, decodeNp5, (b) => np5Decoded(b, pianoName)),
  entry('np6', ['np6p'], NP6_LAYOUT, decodeNp6, (b) => np6Decoded(b, pianoName)),
  entry('nc', ['ncpg'], NCP_LAYOUT, decodeNc, ncDecoded),
  entry('nc2', ['nc2p'], NC2_LAYOUT, decodeNc2, nc2Decoded),
  entry('no3', ['no3p'], NO3_LAYOUT, decodeNo3, no3Decoded),
  entry('nw1', ['nwp'], NW1_LAYOUT, decodeNw1, nw1Decoded),
  entry('nw2', ['nw2p'], NW2_LAYOUT, decodeNw2, nw2Decoded),
  entry('nl4', ['nl4s', 'nl4p'], NL4_LAYOUT, decodeNl4),
  entry('nla', ['nlas', 'nlap'], NLA_LAYOUT, decodeNla, nlaDecoded),
];

/** The entry for a model, or for a program file tag. */
export const programModel = (model: ClaviaModel): ProgramModel | undefined => PROGRAM_MODELS.find((m) => m.model === model);
export const programModelByTag = (tag: string): ProgramModel | undefined => PROGRAM_MODELS.find((m) => m.tags.includes(tag));
