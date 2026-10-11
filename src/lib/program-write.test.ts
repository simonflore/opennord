import { describe, it, expect } from 'vitest';
import type { ClaviaModel } from './clavia/model';
import type { FwLayout } from './clavia/block-chain';
import type { LegacyLayout } from './clavia/legacy-record';
import { sealFileChecksum, verifyFileChecksum } from './clavia/checksum';
import { synthFwBody, synthFwFile, synthLegacyLayoutFile } from './clavia/block-chain.synth';
import { NOT_WRITABLE, PROGRAM_WRITERS, ProgramWriteError, writeProgram } from './program-write';
import { decodeNs3 } from './ns3/decode';
import { decodeNs2 } from './ns2/decode';
import { decodeNg } from './ng/decode';
import { decodeNg2 } from './ng2/decode';
import { decodeNp4 } from './np4/decode';
import { decodeNp5 } from './np5/decode';
import { decodeNp6 } from './np6/decode';
import { decodeNe6 } from './ne6/decode';
import { decodeNe7 } from './ne7/decode';
import { decodeNo3 } from './no3/decode';
import { decodeNw2 } from './nw2/decode';
import { decodeNe3 } from './ne3/decode';
import { decodeNe4 } from './ne4/decode';
import { decodeNe5 } from './ne5/decode';
import { decodeNc2 } from './nc2/decode';
import { decodeNc } from './nc/decode';
import { decodeNw1 } from './nw1/decode';
import { decodeNl4 } from './nl4/decode';
import { decodeNla } from './nla/decode';
import { decodeNp2 } from './np2/decode';
import { decodeNp3 } from './np3/decode';
import { NS3_LAYOUT } from './ns3/layout.generated';
import { NS2_LAYOUT } from './ns2/layout.generated';
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

type Values = Partial<Record<string, number>>;
interface Case { tag: string; layout: FwLayout | LegacyLayout; read: (bytes: Uint8Array) => Values }

/** Each writable model: a tag its reader claims, its layout, and the values its own reader returns. */
const CASES: Partial<Record<ClaviaModel, Case>> = {
  ns3: { tag: 'ns3f', layout: NS3_LAYOUT, read: (b) => decodeNs3(b).values },
  ng: { tag: 'ngp', layout: NG_LAYOUT, read: (b) => decodeNg(b).values },
  ng2: { tag: 'ng2p', layout: NG2_LAYOUT, read: (b) => decodeNg2(b).values },
  np4: { tag: 'np4p', layout: NP4_LAYOUT, read: (b) => decodeNp4(b).values },
  np5: { tag: 'np5p', layout: NP5_LAYOUT, read: (b) => decodeNp5(b).values },
  np6: { tag: 'np6p', layout: NP6_LAYOUT, read: (b) => decodeNp6(b).values },
  ne6: { tag: 'ne6p', layout: NE6_LAYOUT, read: (b) => decodeNe6(b).values },
  ne7: { tag: 'ne7p', layout: NE7_LAYOUT, read: (b) => decodeNe7(b).values },
  no3: { tag: 'no3p', layout: NO3_LAYOUT, read: (b) => decodeNo3(b).values },
  nw2: { tag: 'nw2p', layout: NW2_LAYOUT, read: (b) => decodeNw2(b).values },
  ns2: { tag: 'ns2p', layout: NS2_LAYOUT, read: (b) => decodeNs2(b).values },
  ne3: { tag: 'nepg', layout: NE3HP_LAYOUT, read: (b) => decodeNe3(b).values },
  ne4: { tag: 'ne4p', layout: NE4_LAYOUT, read: (b) => decodeNe4(b).values },
  ne5: { tag: 'ne5p', layout: NE5_LAYOUT, read: (b) => decodeNe5(b).values },
  nc2: { tag: 'nc2p', layout: NC2_LAYOUT, read: (b) => decodeNc2(b).values },
  nc: { tag: 'ncpg', layout: NCP_LAYOUT, read: (b) => decodeNc(b).values },
  nw1: { tag: 'nwp', layout: NW1_LAYOUT, read: (b) => decodeNw1(b).values },
  nl4: { tag: 'nl4s', layout: NL4_LAYOUT, read: (b) => { const p = decodeNl4(b); return p.program?.values ?? {}; } },
  nla: { tag: 'nlas', layout: NLA_LAYOUT, read: (b) => decodeNla(b).values },
  np2: { tag: 'np2p', layout: NP2_LAYOUT, read: (b) => decodeNp2(b).values },
  np3: { tag: 'np3p', layout: NP3_LAYOUT, read: (b) => decodeNp3(b).values },
};

const isFw = (l: FwLayout | LegacyLayout): l is FwLayout => 'blocks' in l;

/** A default program for `c`, behind an NSM-era or a legacy header. */
function synth(c: Case, nsmHeader: boolean): Uint8Array {
  if (!isFw(c.layout)) return sealFileChecksum(synthLegacyLayoutFile(c.tag, c.layout, {}, { nsmHeader }));
  const version = c.layout.versionRange?.[1] ?? 100;
  return sealFileChecksum(synthFwFile(c.tag, synthFwBody(c.layout, {}, version), version, { legacyHeader: !nsmHeader }));
}

/** Every third field (copies excluded), set away from its default. */
function edits(layout: FwLayout | LegacyLayout): Record<string, number> {
  const out: Record<string, number> = {};
  layout.fields.forEach((f, i) => {
    if (i % 3 !== 0 || ('copyOf' in f && f.copyOf)) return;
    out[f.key] = f.enc === 'raw' ? 0x12345678 % 2 ** f.width : f.def === f.max ? f.min : f.max;
  });
  return out;
}

describe('writeProgram', () => {
  it('covers every model OpenNord reads with a layout, except the ones it says it can’t write', () => {
    expect(Object.keys(PROGRAM_WRITERS).sort()).toEqual(Object.keys(CASES).sort());
    expect(Object.keys(NOT_WRITABLE).sort()).toEqual(['np1', 'ns1', 'ns4']);
  });

  for (const [model, c] of Object.entries(CASES) as [ClaviaModel, Case][]) {
    for (const nsmHeader of [true, false]) {
      it(`${c.layout.model} (${nsmHeader ? 'NSM-era' : 'legacy'} header): its own reader reads back what was written`, () => {
        const file = synth(c, nsmHeader);
        const before = c.read(file);
        expect(Object.keys(before).length).toBeGreaterThan(0);
        expect(writeProgram(model, file, {})).toEqual(file);
        expect(writeProgram(model, file, before)).toEqual(file);
        const e = edits(c.layout);
        const out = writeProgram(model, file, e);
        const after = c.read(out);
        const expected = { ...before, ...e };
        // A second stored copy reads back its first copy's value.
        for (const f of c.layout.fields) if ('copyOf' in f && f.copyOf && f.copyOf in e) expected[f.key] = e[f.copyOf];
        expect(after).toEqual(expected);
        expect(verifyFileChecksum(out)).toBe(true);
      });
    }
  }

  it('refuses the models it can’t write, and Lead performances', () => {
    expect(() => writeProgram('ns1', new Uint8Array(0), {})).toThrow(/Stage Classic/);
    expect(() => writeProgram('np1', new Uint8Array(0), {})).toThrow(ProgramWriteError);
    expect(() => writeProgram('unknown', new Uint8Array(0), {})).toThrow(/not supported/);
    const nl4p = sealFileChecksum(synthLegacyLayoutFile('nl4p', NL4_LAYOUT, {}, { version: 9 }));
    expect(() => writeProgram('nl4', nl4p, {})).toThrow(/Lead 4 performances/);
  });

  it('Stage 3: refuses a setting an older 3.x file does not store, accepts its default, and refuses 2.0x', () => {
    const v302 = sealFileChecksum(synthFwFile('ns3f', synthFwBody(NS3_LAYOUT, { 'common.pitchStickRange': 0 }, 302), 302));
    const def = NS3_LAYOUT.fields.find((f) => f.key === 'common.pitchStickRange')!.def;
    expect(decodeNs3(v302).values['common.pitchStickRange']).toBe(def);
    expect(writeProgram('ns3', v302, decodeNs3(v302).values)).toEqual(v302);
    expect(() => writeProgram('ns3', v302, { 'common.pitchStickRange': def + 1 })).toThrow(/does not store this setting yet/);
    const v203 = sealFileChecksum(synthFwFile('ns3f', synthFwBody(NS3_LAYOUT, {}, 203), 203));
    expect(() => writeProgram('ns3', v203, {})).toThrow(/OpenNord writes only formats 3\.00–3\.04/);
  });

  it('refuses record versions the firmware converts on load', () => {
    expect(() => writeProgram('ne3', synthLegacyLayoutFile('nepg', NE3HP_LAYOUT, {}, { version: 100 }), {})).toThrow(/version 100/);
    expect(() => writeProgram('ns2', synthLegacyLayoutFile('ns2p', NS2_LAYOUT, {}, { version: 6 }), {})).toThrow(/version 6/);
    expect(() => writeProgram('ne5', synthLegacyLayoutFile('ne5p', NE5_LAYOUT, {}, { version: 3 }), {})).toThrow(/version 3/);
  });
});
