import { describe, it, expect } from 'vitest';
import { decodeFwProgram, fieldValue, fwBodyRange, type FwField, type FwLayout } from './block-chain';
import { readLegacyFile, legacyDataOffset, type LegacyField, type LegacyLayout } from './legacy-record';
import { readBits, writeBits } from './bitstream';
import { sealFileChecksum, verifyFileChecksum, verifyNs4Checksum } from './checksum';
import { verifyTrailerChecksum } from './crc16';
import { synthFwBody, synthFwFile, synthLegacyLayoutFile } from './block-chain.synth';
import { ProgramWriteError, encodeField, writeFwProgram, writeLegacyProgram } from './layout-write';
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
  return sealFileChecksum(synthFwFile('test', body, 304, { legacyHeader }));
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
  const p = decodeFwProgram(bytes, layout);
  expect(p.layoutMatched).toBe(true);
  return p.values;
};

/** The checksum bytes a reseal rewrites: the CRC-16 trailer of a legacy file, the CRC-32 at 0x18 of an NSM-era one. */
const checksumBytes = (bytes: Uint8Array) =>
  bytes[0x04] === 0 ? [bytes.length - 2, bytes.length - 1] : [0x18, 0x19, 0x1a, 0x1b];

/**
 * The bytes of `after` that differ from `before` outside the `[bit, width]` spans
 * and the checksum — a byte-level diff rather than a re-read, so checking every
 * single-field write stays linear in the file size.
 */
function strayBytes(before: Uint8Array, after: Uint8Array, spans: readonly (readonly [number, number])[]): number[] {
  const skip = new Set(checksumBytes(before));
  const out: number[] = [];
  for (let i = 0; i < before.length; i++) {
    let d = before[i] ^ after[i];
    if (d === 0 || skip.has(i)) continue;
    for (const [bit, width] of spans) {
      for (let b = Math.max(bit, i * 8); b < Math.min(bit + width, i * 8 + 8); b++) d &= ~(0x80 >> (b & 7));
    }
    if (d !== 0) out.push(i);
  }
  return out;
}

/** Fail on two fields sharing a bit: then a write of one would move the other. */
function expectDisjoint(spans: readonly (readonly [string, number, number])[]): void {
  const owner = new Map<number, string>();
  for (const [key, bit, width] of spans) {
    for (let b = bit; b < bit + width; b++) {
      expect(owner.get(b), `${key} shares bit ${b}`).toBeUndefined();
      owner.set(b, key);
    }
  }
}

/** The values a write test sets a field to: its range ends and default (an identifier: 0 and all ones). */
function testValues(f: Pick<FwField, 'enc' | 'width' | 'min' | 'max' | 'def'>): number[] {
  return f.enc === 'raw' ? [0, 2 ** f.width - 1, 0x5a5a5a5a % 2 ** f.width] : [f.min, f.max, f.def];
}

describe('writeFwProgram — every firmware layout', () => {
  for (const layout of FW) {
    for (const legacyHeader of [false, true]) {
      const label = `${layout.model} (${legacyHeader ? 'legacy' : 'NSM-era'} header)`;
      const fieldBit = (file: Uint8Array, f: FwField) => (fwBodyRange(file).start + layout.blocks[f.block].offset + 1) * 8 + f.bit;

      it(`${label}: a write without values is byte-identical, also when reserved bits are set`, () => {
        for (const file of [noisyFwFile(layout, legacyHeader), noisyFwFile(layout, legacyHeader, 3)]) {
          expect(writeFwProgram(file, layout, {})).toEqual(file);
          expect(writeFwProgram(file, layout, fwValues(file, layout))).toEqual(file);
        }
      });

      it(`${label}: every field reads back at its min, max and default; a write moves only its own bits; the checksum holds`, () => {
        const file = noisyFwFile(layout, legacyHeader);
        expectDisjoint(layout.fields.map((f) => [f.key, fieldBit(file, f), f.width] as const));
        for (let pick = 0; pick < 3; pick++) {
          const values = Object.fromEntries(layout.fields.map((f) => [f.key, testValues(f)[pick]]));
          const out = writeFwProgram(file, layout, values);
          expect(fwValues(out, layout)).toEqual(values);
          expect(legacyHeader ? verifyTrailerChecksum(out) : verifyNs4Checksum(out)).toBe(true);
        }
        // One assertion for every single-field write (an expect per write dominates the run time).
        const wrong: string[] = [];
        for (const f of layout.fields) {
          for (const v of testValues(f)) {
            const out = writeFwProgram(file, layout, { [f.key]: v });
            const stray = strayBytes(file, out, [[fieldBit(file, f), f.width]]);
            const got = fieldValue(readBits(out, fieldBit(file, f), f.width), f);
            if (got !== v || stray.length > 0 || !verifyFileChecksum(out)) wrong.push(`${f.key} = ${v}: read ${got}, stray bytes ${stray}`);
          }
        }
        expect(wrong).toEqual([]);
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

      it(`${label}: every field reads back at its min, max and default; a write moves only its own bits; the checksum holds`, () => {
        const file = noisyLegacyFile(layout, nsmHeader);
        const base = legacyDataOffset(file, layout) * 8;
        expectDisjoint(layout.fields.map((f) => [f.key, base + f.bit, f.width] as const));
        // A second stored copy is written through its first copy, and then reads back that value.
        const own = layout.fields.filter((f) => !f.copyOf);
        const copies = (key: string) => layout.fields.filter((c) => c.copyOf === key);
        for (let pick = 0; pick < 3; pick++) {
          const values = Object.fromEntries(own.map((f) => [f.key, testValues(f)[pick]]));
          const out = writeLegacyProgram(file, layout, values);
          const expected = { ...values };
          for (const f of layout.fields) if (f.copyOf) expected[f.key] = values[f.copyOf];
          expect(read(out)).toEqual(expected);
          expect(nsmHeader ? verifyNs4Checksum(out) : verifyTrailerChecksum(out)).toBe(true);
        }
        const wrong: string[] = [];
        for (const f of own) {
          const spans = [f, ...copies(f.key)].map((c) => [base + c.bit, c.width] as const);
          // The firmware takes the last stored copy (a value it already holds leaves the others as they are).
          const [bit, width] = spans[spans.length - 1];
          for (const v of testValues(f)) {
            const out = writeLegacyProgram(file, layout, { [f.key]: v });
            const stray = strayBytes(file, out, spans);
            const got = fieldValue(readBits(out, bit, width), f);
            if (got !== v || stray.length > 0 || !verifyFileChecksum(out)) wrong.push(`${f.key} = ${v}: read ${got}, stray bytes ${stray}`);
          }
        }
        expect(wrong).toEqual([]);
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

  it('refuses a file whose checksum does not hold, under either header', () => {
    const stale = file.slice();
    stale[0x18] ^= 1;
    expect(() => writeFwProgram(stale, NG_LAYOUT, {})).toThrow(/checksum doesn’t match/);
    const legacy = sealFileChecksum(synthFwFile('ng', synthFwBody(NG_LAYOUT), 100, { legacyHeader: true }));
    legacy[legacy.length - 1] ^= 1;
    expect(() => writeFwProgram(legacy, NG_LAYOUT, {})).toThrow(/checksum doesn’t match/);
    const record = synthLegacyLayoutFile('ne4p', NE4_LAYOUT);
    record[record.length - 1] ^= 1;
    expect(() => writeLegacyProgram(record, NE4_LAYOUT, {})).toThrow(/checksum doesn’t match/);
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
    // The reserved bits hold something other than the default the instrument loads.
    const stored = level.def === 0 ? 1 : 0;
    const v100 = sealFileChecksum(synthFwFile('ng', synthFwBody(NG_LAYOUT, { [level.key]: stored }, 100)));
    expect(() => writeFwProgram(v100, NG_LAYOUT, { [level.key]: level.max }, opts)).toThrow(/format 1\.00 does not store this setting yet/);
    expect(writeFwProgram(v100, NG_LAYOUT, { [level.key]: level.def }, opts)).toEqual(v100);
    expect(() => writeFwProgram(v100, NG_LAYOUT, { [level.key]: stored }, opts)).toThrow(/does not store this setting yet/);
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
    expect(() => writeLegacyProgram(long, NE3HP_LAYOUT, {})).toThrow(/137 bytes; the program record makes 136/);
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
});
