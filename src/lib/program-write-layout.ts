/**
 * Every model's program writer, each with the layout its reader's values come
 * from, needing only the layouts, the models' own value readers and the shared
 * writer (clavia/layout-write.ts) — none of the display tables. program-write.ts
 * is the app's door to it; a caller that should not take the display tables
 * (program-models.ts) uses it directly. Values are keyed like the reader's
 * `values` (the generated field keys).
 */
import type { ClaviaModel } from './clavia/model';
import type { FwLayout } from './clavia/block-chain';
import type { LegacyLayout } from './clavia/legacy-record';
import { fileTypeTag } from './clavia/cbin';
import { ProgramWriteError, writeFwProgram, writeLegacyProgram, type FwWriteOptions } from './clavia/layout-write';
import { NG_LAYOUT } from './ng/layout.generated';
import { NG2_LAYOUT } from './ng2/layout.generated';
import { NP4_LAYOUT } from './np4/layout.generated';
import { NP5_LAYOUT } from './np5/layout.generated';
import { NP6_LAYOUT } from './np6/layout.generated';
import { NE6_LAYOUT } from './ne6/layout.generated';
import { NE7_LAYOUT } from './ne7/layout.generated';
import { NO3_LAYOUT } from './no3/layout.generated';
import { NW2_LAYOUT } from './nw2/layout.generated';
import { NE3HP_LAYOUT } from './ne3/layout-hp.generated';
import { NE4_LAYOUT } from './ne4/layout.generated';
import { NE5_LAYOUT } from './ne5/layout.generated';
import { NC2_LAYOUT } from './nc2/layout.generated';
import { NCP_LAYOUT } from './nc/layout.generated';
import { NW1_LAYOUT } from './nw1/layout.generated';
import { NL4_LAYOUT } from './nl4/layout.generated';
import { NLA_LAYOUT } from './nla/layout.generated';
import { NP2_LAYOUT } from './np2/layout.generated';
import { NP3_LAYOUT } from './np3/layout.generated';
import { NS1_LAYOUT } from './ns1/layout.generated';
import { NS2_LAYOUT } from './ns2/layout.generated';
import { NS3_LAYOUT } from './ns3/layout.generated';
import { ns3FieldsAbsent, readNs3Values } from './ns3/values';
import { ns3FieldsConverted } from './ns3/convert';

export { ProgramWriteError };

/** Program values by field key, as a reader returns them. */
export type ProgramValues = Readonly<Partial<Record<string, number>>>;

export type ProgramWriter = (bytes: Uint8Array, values: ProgramValues) => Uint8Array;

/** A layout writer: the layout it writes, and how. */
export interface LayoutWriter {
  readonly layout: FwLayout | LegacyLayout;
  readonly write: ProgramWriter;
}

const fw = (layout: FwLayout, opts?: FwWriteOptions<string>): LayoutWriter => ({
  layout, write: (bytes, values) => writeFwProgram(bytes, layout, values, opts),
});

/** A single-record legacy file; `tags` it refuses (a file holding several records) with `why`. */
const legacy = (layout: LegacyLayout, refuse?: { tags: readonly string[]; why: string }): LayoutWriter => ({
  layout,
  write: (bytes, values) => {
    if (refuse?.tags.includes(fileTypeTag(bytes))) throw new ProgramWriteError(refuse.why);
    return writeLegacyProgram(bytes, layout, values);
  },
});

/**
 * The Stage 3 writes 3.00–3.04 bodies as they are, but the firmware fixes up a
 * few values of a 3.00 / 3.01 body on load (ns3/convert.ts), and the reader
 * shows them fixed up. Writing such a setting back would store the converted
 * value in the old format, so it is refused — unless it is what the reader
 * shows, which is left as stored (a full read → edit one → write round-trips).
 */
const ns3: LayoutWriter = {
  layout: NS3_LAYOUT,
  write: (bytes, values) => {
    const p = readNs3Values(bytes);
    const v = p.fw.formatVersion;
    const converted = v === null ? [] : ns3FieldsConverted(v);
    const rest: Record<string, number | undefined> = { ...values };
    for (const k of converted) {
      const value = rest[k];
      if (value === undefined) continue;
      if (value !== p.values[k]) {
        throw new ProgramWriteError(
          `${k}: this Stage 3 program is in format ${((v ?? 0) / 100).toFixed(2)}, which stores this setting ` +
          'the way an older OS did; OpenNord doesn’t write it');
      }
      delete rest[k];
    }
    return writeFwProgram(bytes, NS3_LAYOUT, rest, { absentIn: ns3FieldsAbsent });
  },
};

/**
 * The models OpenNord writes. Only the native format/record version is written
 * (layout-write.ts); the Stage 3 also refuses settings an older 3.x file does not
 * store yet, or stores the old way.
 */
export const LAYOUT_WRITERS: Partial<Record<ClaviaModel, LayoutWriter>> = {
  ns3,
  // Firmware block-chain layouts (clavia/block-chain.ts).
  ng: fw(NG_LAYOUT),
  ng2: fw(NG2_LAYOUT),
  np4: fw(NP4_LAYOUT),
  np5: fw(NP5_LAYOUT),
  np6: fw(NP6_LAYOUT),
  ne6: fw(NE6_LAYOUT),
  ne7: fw(NE7_LAYOUT),
  no3: fw(NO3_LAYOUT),
  nw2: fw(NW2_LAYOUT),
  // Legacy formatType-0 records (clavia/legacy-record.ts).
  ns2: legacy(NS2_LAYOUT),
  // The reader's superset layout: it reads both the Electro 3 and the 3 HP record.
  ne3: legacy(NE3HP_LAYOUT),
  ne4: legacy(NE4_LAYOUT),
  ne5: legacy(NE5_LAYOUT),
  nc2: legacy(NC2_LAYOUT),
  nc: legacy(NCP_LAYOUT),
  nw1: legacy(NW1_LAYOUT),
  np2: legacy(NP2_LAYOUT),
  np3: legacy(NP3_LAYOUT),
  // Placed by the CBIN framing rule like its reader (not yet seen in a real file): the exact
  // 426 / 444-byte size, record version 10 and a holding checksum guard every write.
  ns1: legacy(NS1_LAYOUT),
  nl4: legacy(NL4_LAYOUT, { tags: ['nl4p'], why: 'Lead 4 performances can’t be written yet, only single programs' }),
  nla: legacy(NLA_LAYOUT, { tags: ['nlap'], why: 'Lead A1 performances can’t be written yet, only single programs' }),
};

/** Models whose programs OpenNord reads (or partly reads) but does not write, and why. */
export const NOT_WRITABLE: Partial<Record<ClaviaModel, string>> = {
  ns4: 'Stage 4 programs are edited through the Stage 4 writer',
  np1: 'where a Nord Piano program’s settings sit in its file is an unconfirmed guess, and the record has no version to check it by',
};
