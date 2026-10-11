import { describe, it, expect } from 'vitest';
import { decodeFwProgram, fieldValue, type FwField, type FwLayout } from './block-chain';
import { readLegacyFile, legacyDataOffset, type LegacyField, type LegacyLayout } from './legacy-record';
import { readBits, writeBits } from './bitstream';
import { buildCbinHeader } from './cbin';
import { sealFileChecksum, verifyFileChecksum, verifyNs4Checksum } from './checksum';
import { sealTrailerChecksum, verifyTrailerChecksum } from './crc16';
import { synthFwBody, synthFwFile, synthLegacyLayoutFile } from './block-chain.synth';
import { ProgramWriteError, encodeField, fwBodyRange, writeFwProgram, writeLegacyProgram } from './layout-write';
import { NS3_LAYOUT } from '../ns3/layout.generated';
import { NG_LAYOUT } from '../ng/layout.generated';
import { NG2_LAYOUT } from '../ng2/layout.generated';
import { NP4_LAYOUT } from '../np4/layout.generated';
import { NP5_LAYOUT } from '../np5/layout.generated';
import { NP6_LAYOUT } from '../np6/layout.generated';
import { NE6_LAYOUT } from '../ne6/layout.generated';
import { NE7_LAYOUT } from '../ne7/layout.generated';
import { NO3_LAYOUT } from '../no3/layout.generated';
import { NW2_LAYOUT } from '../nw2/layout.generated';
import { NS2_LAYOUT } from '../ns2/layout.generated';
import { NE3_LAYOUT } from '../ne3/layout.generated';
import { NE3HP_LAYOUT } from '../ne3/layout-hp.generated';
import { NE4_LAYOUT } from '../ne4/layout.generated';
import { NE5_LAYOUT } from '../ne5/layout.generated';
import { NC2_LAYOUT } from '../nc2/layout.generated';
import { NCP_LAYOUT } from '../nc/layout.generated';
import { NW1_LAYOUT } from '../nw1/layout.generated';
import { NL4_LAYOUT, NL4_PERF_LAYOUT } from '../nl4/layout.generated';
import { NLA_LAYOUT, NLA_PERF_LAYOUT } from '../nla/layout.generated';
import { NP1_LAYOUT } from '../np1/layout.generated';
import { NP2_LAYOUT } from '../np2/layout.generated';
import { NP3_LAYOUT } from '../np3/layout.generated';
import { NS1_LAYOUT } from '../ns1/layout.generated';

/** Every firmware block-chain layout (contribute/coverage.ts FW_LAYOUTS). */
const FW: readonly FwLayout[] = [
  NS3_LAYOUT, NG_LAYOUT, NG2_LAYOUT, NP4_LAYOUT, NP5_LAYOUT, NP6_LAYOUT, NE6_LAYOUT, NE7_LAYOUT, NO3_LAYOUT, NW2_LAYOUT,
];
/** Every legacy record layout (contribute/coverage.ts LEGACY_LAYOUTS, plus the Lead performance-common records). */
const LEGACY: readonly LegacyLayout[] = [
  NS2_LAYOUT, NE3_LAYOUT, NE3HP_LAYOUT, NE4_LAYOUT, NE5_LAYOUT, NC2_LAYOUT, NCP_LAYOUT, NW1_LAYOUT,
  NL4_LAYOUT, NL4_PERF_LAYOUT, NLA_LAYOUT, NLA_PERF_LAYOUT, NP1_LAYOUT, NP2_LAYOUT, NP3_LAYOUT, NS1_LAYOUT,
];

/** A deterministic byte stream (xorshift), for filling reserved and unmapped bits with noise. */
function noise(seed: number): () => number {
  let x = seed || 1;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return x & 0xff;
  };
}

/**
 * A firmware-layout file whose every payload bit (reserved bits included) is
 * noise, so the test sees any bit the writer disturbs.
 */
function noisyFwFile(layout: FwLayout, legacyHeader: boolean, seed = 7): Uint8Array {
  const body = synthFwBody(layout, {}, layout.versionRange?.[1] ?? 100);
  const next = noise(seed);
  for (const b of layout.blocks) for (let i = 1; i <= b.length; i++) body[b.offset + i] = next();
  if (!legacyHeader) return sealFileChecksum(synthFwFile('test', body));
  const header = buildCbinHeader({ formatType: 0, tag: 'test', bank: 3, location: 5, category: 2, versionRaw: 304 });
  const out = new Uint8Array(0x18 + body.length + 2);
  out.set(header.subarray(0, 0x18));
  out.set(body, 0x18);
  return sealTrailerChecksum(out);
}

/** A legacy-record file whose every data and padding bit is noise. */
function noisyLegacyFile(layout: LegacyLayout, nsmHeader: boolean, seed = 11): Uint8Array {
  const file = synthLegacyLayoutFile('test', layout, {}, { nsmHeader });
  const next = noise(seed);
  const start = legacyDataOffset(file, layout);
  for (let i = 0; i < layout.dataBytes + (layout.padBytes ?? 0); i++) file[start + i] = next();
  return sealFileChecksum(file);
}

const fwValues = (bytes: Uint8Array, layout: FwLayout) => {
  const { start, end } = fwBodyRange(bytes);
  const p = decodeFwProgram(bytes, layout, start, end);
  expect(p.layoutMatched).toBe(true);
  return p.values;
};

/** The keys whose value differs between two reads (a plain loop: deep-comparing ~800-key objects per write is slow). */
function changed(before: Partial<Record<string, number>>, after: Partial<Record<string, number>>): Record<string, number | undefined> {
  const out: Record<string, number | undefined> = {};
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) if (before[k] !== after[k]) out[k] = after[k];
  return out;
}

/** The values a write test sets a field to: its range ends and default (an identifier: 0 and all ones). */
function testValues(f: Pick<FwField, 'enc' | 'width' | 'min' | 'max' | 'def'>): number[] {
  return f.enc === 'raw' ? [0, 2 ** f.width - 1, 0x5a5a5a5a % 2 ** f.width] : [f.min, f.max, f.def];
}

describe('writeFwProgram — every firmware layout', () => {
  for (const layout of FW) {
    for (const legacyHeader of [false, true]) {
      const label = `${layout.model} (${legacyHeader ? 'legacy' : 'NSM-era'} header)`;

      it(`${label}: a write without values is byte-identical, also when reserved bits are set`, () => {
        for (const file of [noisyFwFile(layout, legacyHeader), noisyFwFile(layout, legacyHeader, 3)]) {
          expect(writeFwProgram(file, layout, {})).toEqual(file);
          expect(writeFwProgram(file, layout, fwValues(file, layout))).toEqual(file);
        }
      });

      it(`${label}: each field reads back at its min, max and default, nothing else moves, the checksum holds`, () => {
        const file = noisyFwFile(layout, legacyHeader);
        const before = fwValues(file, layout);
        for (const f of layout.fields) {
          for (const v of testValues(f)) {
            const out = writeFwProgram(file, layout, { [f.key]: v });
            expect(changed(before, fwValues(out, layout)), `${f.key} = ${v}`).toEqual(before[f.key] === v ? {} : { [f.key]: v });
            expect(verifyFileChecksum(out)).toBe(true);
            expect(legacyHeader ? verifyTrailerChecksum(out) : verifyNs4Checksum(out)).toBe(true);
          }
        }
        // Only the field bits and the checksum may differ.
        const all = writeFwProgram(file, layout, Object.fromEntries(layout.fields.map((f) => [f.key, testValues(f)[1]])));
        const { start } = fwBodyRange(file);
        const touched = new Set<number>(legacyHeader ? [all.length - 2, all.length - 1] : [0x18, 0x19, 0x1a, 0x1b]);
        for (const f of layout.fields) {
          const at = (start + layout.blocks[f.block].offset + 1) * 8 + f.bit;
          for (let b = at; b < at + f.width; b++) touched.add(b >> 3);
        }
        const moved = [...file.keys()].filter((i) => !touched.has(i) && all[i] !== file[i]);
        expect(moved, 'bytes outside the fields and the checksum').toEqual([]);
      });
    }
  }
});

describe('writeLegacyProgram — every legacy record layout', () => {
  for (const layout of LEGACY) {
    for (const nsmHeader of [false, true]) {
      const label = `${layout.model} (${nsmHeader ? 'NSM-era' : 'legacy'} header, ${layout.dataBytes} bytes)`;
      const read = (bytes: Uint8Array) => {
        const r = readLegacyFile(bytes, layout);
        expect(r.complete).toBe(true);
        return r.values;
      };

      it(`${label}: a write without values is byte-identical, also when reserved and padding bits are set`, () => {
        for (const file of [noisyLegacyFile(layout, nsmHeader), sealFileChecksum(synthLegacyLayoutFile('test', layout, {}, { nsmHeader }))]) {
          expect(writeLegacyProgram(file, layout, {})).toEqual(file);
          expect(writeLegacyProgram(file, layout, read(file))).toEqual(file);
        }
      });

      it(`${label}: each field reads back at its min, max and default, nothing else moves, the checksum holds`, () => {
        const file = noisyLegacyFile(layout, nsmHeader);
        const before = read(file);
        for (const f of layout.fields) {
          // A second stored copy is written through its first copy (both then read back the value).
          const key = f.copyOf ?? f.key;
          const copies = layout.fields.filter((c) => c.copyOf === key).map((c) => c.key);
          for (const v of testValues(f)) {
            const out = writeLegacyProgram(file, layout, { [key]: v });
            const expected = { [key]: v, ...Object.fromEntries(copies.map((c) => [c, v])) };
            // A key already at `v` doesn't show as changed.
            for (const k of Object.keys(expected)) if (before[k] === v) delete expected[k];
            expect(changed(before, read(out)), `${key} = ${v}`).toEqual(expected);
            expect(verifyFileChecksum(out)).toBe(true);
            expect(nsmHeader ? verifyNs4Checksum(out) : verifyTrailerChecksum(out)).toBe(true);
          }
        }
        // Only the field bits and the checksum may differ (padding, version and header stay).
        const all = writeLegacyProgram(file, layout,
          Object.fromEntries(layout.fields.filter((f) => !f.copyOf).map((f) => [f.key, testValues(f)[1]])));
        const base = legacyDataOffset(file, layout) * 8;
        const touched = new Set<number>(nsmHeader ? [0x18, 0x19, 0x1a, 0x1b] : [all.length - 2, all.length - 1]);
        for (const f of layout.fields) for (let b = base + f.bit; b < base + f.bit + f.width; b++) touched.add(b >> 3);
        const moved = [...file.keys()].filter((i) => !touched.has(i) && all[i] !== file[i]);
        expect(moved, 'bytes outside the fields and the checksum').toEqual([]);
      });
    }
  }
});

describe('encodeField', () => {
  const u: Pick<FwField, 'key' | 'width' | 'min' | 'max' | 'enc'> = { key: 'u', width: 7, min: 0, max: 100, enc: 'u' };
  it('is the inverse of fieldValue for every encoding', () => {
    const cases: Pick<FwField, 'key' | 'width' | 'min' | 'max' | 'enc'>[] = [
      u,
      { key: 'o', width: 4, min: -6, max: 6, enc: 'offset' },
      { key: 't', width: 4, min: -6, max: 6, enc: 'twos' },
      { key: 'r', width: 32, min: 0, max: 0, enc: 'raw' },
    ];
    for (const f of cases) {
      for (const v of f.enc === 'raw' ? [0, 0xdeadbeef, 0xffffffff] : [f.min, -1, 0, 1, f.max].filter((x) => x >= f.min)) {
        expect(fieldValue(encodeField(f, v), f), `${f.key} ${v}`).toBe(v);
      }
    }
  });

  it('refuses values outside the range, outside the width, or not whole', () => {
    expect(() => encodeField(u, 101)).toThrow(ProgramWriteError);
    expect(() => encodeField(u, -1)).toThrow(/outside its range 0–100/);
    expect(() => encodeField(u, 1.5)).toThrow(/not a whole number/);
    expect(() => encodeField({ ...u, max: 200 }, 200)).toThrow(/does not fit its 7-bit field/);
    expect(() => encodeField({ key: 'r', width: 32, min: 0, max: 0, enc: 'raw' }, 2 ** 32)).toThrow(/32-bit identifier/);
    expect(() => encodeField({ key: 'r', width: 32, min: 0, max: 0, enc: 'raw' }, -1)).toThrow(ProgramWriteError);
  });
});

describe('writeFwProgram — refusals', () => {
  const file = sealFileChecksum(synthFwFile('ng', synthFwBody(NG_LAYOUT)));
  const level = NG_LAYOUT.fields.find((f) => f.enc === 'u' && f.max > 1)!;

  it('does not change its input', () => {
    const copy = file.slice();
    writeFwProgram(file, NG_LAYOUT, { [level.key]: level.max });
    expect(file).toEqual(copy);
  });

  it('refuses an unknown key and an out-of-range value', () => {
    expect(() => writeFwProgram(file, NG_LAYOUT, { nope: 1 } as never)).toThrow(/nope: not a Nord Grand program field/);
    expect(() => writeFwProgram(file, NG_LAYOUT, { [level.key]: level.max + 1 })).toThrow(ProgramWriteError);
  });

  it('accepts a stored value outside the range when it is written back unchanged', () => {
    const odd = file.slice();
    const at = (0x2c + NG_LAYOUT.blocks[level.block].offset + 1) * 8 + level.bit;
    writeBits(odd, at, level.width, 2 ** level.width - 1); // above max
    sealFileChecksum(odd);
    expect(writeFwProgram(odd, NG_LAYOUT, { [level.key]: 2 ** level.width - 1 })).toEqual(odd);
  });

  it('refuses a format version outside the layout range (one the firmware converts)', () => {
    const old = sealFileChecksum(synthFwFile('ns3f', synthFwBody(NS3_LAYOUT, {}, 203)));
    expect(() => writeFwProgram(old, NS3_LAYOUT, {})).toThrow(/format 2\.03: OpenNord writes only formats 3\.00–3\.04/);
  });

  it('refuses a body whose blocks differ from the layout, a truncated file and a non-Nord file', () => {
    // Same total size, but the first block one byte shorter and the last one byte longer.
    const lengths = NG_LAYOUT.blocks.map((b) => b.length);
    lengths[0] -= 1;
    lengths[lengths.length - 1] += 1;
    const body = new Uint8Array(NG_LAYOUT.bodyBytes);
    body[3] = 100;
    let at = 4;
    for (const n of lengths) { body[at] = n; at += 1 + n; }
    expect(() => writeFwProgram(sealFileChecksum(synthFwFile('ng', body)), NG_LAYOUT, {})).toThrow(/laid out differently/);
    expect(() => writeFwProgram(file.slice(0, file.length - 1), NG_LAYOUT, {})).toThrow(/Not a Nord Grand program body/);
    expect(() => writeFwProgram(new Uint8Array(100), NG_LAYOUT, {})).toThrow(/Not a Nord program file/);
  });

  it('refuses a field the file’s version does not store yet, but accepts its default', () => {
    const opts = { absentIn: (v: number) => (v < 101 ? [level.key] : []) };
    const v100 = sealFileChecksum(synthFwFile('ng', synthFwBody(NG_LAYOUT, { [level.key]: 0 }, 100)));
    expect(() => writeFwProgram(v100, NG_LAYOUT, { [level.key]: level.max }, opts)).toThrow(/format 1\.00 does not store this setting yet/);
    expect(writeFwProgram(v100, NG_LAYOUT, { [level.key]: level.def }, opts)).toEqual(v100);
    expect(writeFwProgram(v100, NG_LAYOUT, { [level.key]: 0 }, opts)).toEqual(v100);
    const v101 = sealFileChecksum(synthFwFile('ng', synthFwBody(NG_LAYOUT, {}, 101)));
    expect(writeFwProgram(v101, NG_LAYOUT, { [level.key]: level.max }, opts)).not.toEqual(v101);
  });
});

describe('writeLegacyProgram — refusals and copies', () => {
  it('refuses a converted record version and an odd-sized file', () => {
    const v100 = synthLegacyLayoutFile('nepg', NE3HP_LAYOUT, {}, { version: 100 });
    expect(() => writeLegacyProgram(v100, NE3HP_LAYOUT, {})).toThrow(/version 100: OpenNord writes only version 101/);
    const v7 = synthLegacyLayoutFile('nwp', NW1_LAYOUT, {}, { version: 7 });
    expect(() => writeLegacyProgram(v7, NW1_LAYOUT, {})).toThrow(/version 7/);
    const long = sealFileChecksum(new Uint8Array([...synthLegacyLayoutFile('nepg', NE3HP_LAYOUT).slice(0, -2), 0, 0, 0]));
    expect(() => writeLegacyProgram(long, NE3HP_LAYOUT, {})).toThrow(/137 bytes; the firmware record makes 136/);
  });

  it('writes a record version-less layout whatever the version field holds', () => {
    const file = synthLegacyLayoutFile('ne4p', NE4_LAYOUT, {}, { version: 1234 });
    const out = writeLegacyProgram(file, NE4_LAYOUT, { 'b3PresetI.0': 8 });
    expect(readLegacyFile(out, NE4_LAYOUT).values['b3PresetI.0']).toBe(8);
  });

  it('writes a second stored copy only through its first copy', () => {
    const copy = NC2_LAYOUT.fields.find((f) => f.copyOf)! as LegacyField<string>;
    const first = copy.copyOf!;
    const file = synthLegacyLayoutFile('nc2p', NC2_LAYOUT);
    const firstField = NC2_LAYOUT.fields.find((f) => f.key === first)!;
    const v = firstField.def === firstField.min ? firstField.max : firstField.min; // away from the default
    const out = writeLegacyProgram(file, NC2_LAYOUT, { [first]: v });
    const base = legacyDataOffset(out, NC2_LAYOUT) * 8;
    expect(readBits(out, base + firstField.bit, firstField.width)).toBe(v);
    expect(readBits(out, base + copy.bit, copy.width)).toBe(v);
    // Passing the copy alongside (as a full read hands it back) is fine when it agrees …
    expect(writeLegacyProgram(file, NC2_LAYOUT, { [first]: v, [copy.key]: v })).toEqual(out);
    // … but it can't be set on its own.
    expect(() => writeLegacyProgram(file, NC2_LAYOUT, { [copy.key]: v })).toThrow(/second stored copy of/);
  });

  it('writes one record of a file holding several (a Lead 4 performance slot)', () => {
    const perf = NL4_PERF_LAYOUT.dataBytes;
    const data = new Uint8Array(perf + 4 * NL4_LAYOUT.dataBytes);
    const header = buildCbinHeader({ formatType: 0, tag: 'nl4p', bank: 0, location: 0, category: 0, versionRaw: 9 });
    const file = new Uint8Array(0x18 + 2 + data.length + 2);
    file.set(header.subarray(0, 0x18));
    file[0x19] = 9;
    file.set(data, 0x1a);
    sealTrailerChecksum(file);
    const f = NL4_LAYOUT.fields.find((x) => x.max > 1)!;
    const slot = 2;
    const out = writeLegacyProgram(file, NL4_LAYOUT, { [f.key]: f.max },
      { versions: [9], byteOffset: perf + slot * NL4_LAYOUT.dataBytes, fileBytes: file.length });
    expect(readBits(out, (0x1a + perf + slot * NL4_LAYOUT.dataBytes) * 8 + f.bit, f.width)).toBe(f.max);
    expect(verifyTrailerChecksum(out)).toBe(true);
    expect(() => writeLegacyProgram(file, NL4_LAYOUT, {})).toThrow(/1295 bytes; the firmware record makes 343/);
  });
});
