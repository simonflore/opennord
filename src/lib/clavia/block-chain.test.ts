import { describe, it, expect } from 'vitest';
import { decodeFwBody, decodeFwProgram, fieldValue, walkBlockChain, type FwLayout } from './block-chain';
import { fieldRaw, synthFwBody, synthFwFile, writeBits } from './block-chain.synth';
import { readBits } from './bitstream';
import { NG_LAYOUT } from '../ng/layout.generated';
import { NP6_LAYOUT } from '../np6/layout.generated';
import { NE7_LAYOUT } from '../ne7/layout.generated';
import { NO3_LAYOUT } from '../no3/layout.generated';

/** A tiny two-block layout for exercising the reader in isolation. */
const TINY: FwLayout<'a.x' | 'a.s' | 'b.o' | 'b.h'> = {
  model: 'Test', source: 'test', container: 'test', versionRange: [100, 101], bodyBytes: 4 + 3 + 6,
  blocks: [{ key: 'a', name: 'A', offset: 4, length: 2 }, { key: 'b', name: 'B', offset: 7, length: 5 }],
  fields: [
    { key: 'a.x', name: 'x', block: 0, bit: 0, width: 7, min: 0, max: 127, def: 64, enc: 'u', confidence: 'high', src: 't' },
    { key: 'a.s', name: 's', block: 0, bit: 7, width: 4, min: -6, max: 6, def: 0, enc: 'twos', confidence: 'high', src: 't' },
    { key: 'b.o', name: 'o', block: 1, bit: 0, width: 4, min: -6, max: 6, def: 0, enc: 'offset', confidence: 'high', src: 't' },
    { key: 'b.h', name: 'h', block: 1, bit: 4, width: 32, min: 0, max: 0, def: 0, enc: 'raw', confidence: 'high', src: 't' },
  ],
};

describe('walkBlockChain', () => {
  it('walks a version word + length-prefixed blocks to EOF', () => {
    const body = new Uint8Array([0, 0, 0, 100, 2, 0xaa, 0xbb, 1, 0xcc]);
    expect(walkBlockChain(body)).toEqual({ ok: true, formatVersion: 100, blocks: [{ offset: 4, length: 2 }, { offset: 7, length: 1 }] });
  });

  it('fails (no throw) when a block overruns EOF, the body is too short, or no block follows', () => {
    expect(walkBlockChain(new Uint8Array([0, 0, 0, 100, 5, 1])).ok).toBe(false);
    expect(walkBlockChain(new Uint8Array([0, 0, 1])).ok).toBe(false);
    expect(walkBlockChain(new Uint8Array([0, 0, 0, 100])).ok).toBe(false);
  });

  it('reads a version word with the top bit set as unsigned', () => {
    expect(walkBlockChain(new Uint8Array([0x80, 0, 0, 0, 0])).formatVersion).toBe(0x80000000);
  });
});

describe('fieldValue / fieldRaw', () => {
  it('round-trips every encoding', () => {
    const cases = [
      { f: { enc: 'u' as const, width: 7, min: 0 }, v: 99 },
      { f: { enc: 'twos' as const, width: 4, min: -6 }, v: -6 },
      { f: { enc: 'twos' as const, width: 7, min: -60 }, v: 60 },
      { f: { enc: 'offset' as const, width: 4, min: -6 }, v: -2 },
      { f: { enc: 'offset' as const, width: 2, min: 1 }, v: 2 },
      { f: { enc: 'raw' as const, width: 32, min: 0 }, v: 0xdeadbeef },
    ];
    for (const { f, v } of cases) expect(fieldValue(fieldRaw(v, f), f)).toBe(v);
  });

  it('stores two’s complement and offset differently', () => {
    expect(fieldRaw(-1, { enc: 'twos', width: 4, min: -6 })).toBe(0b1111);
    expect(fieldRaw(-1, { enc: 'offset', width: 4, min: -6 })).toBe(5);
  });
});

describe('decodeFwBody', () => {
  it('reads fields relative to their block', () => {
    const body = synthFwBody(TINY, { 'a.x': 5, 'a.s': -3, 'b.o': 4, 'b.h': 0x12345678 });
    const d = decodeFwBody(body, TINY);
    expect(d.layoutMatched).toBe(true);
    expect(d.warnings).toEqual([]);
    expect(d.values).toEqual({ 'a.x': 5, 'a.s': -3, 'b.o': 4, 'b.h': 0x12345678 });
  });

  it('returns header-only with a warning when the block count differs', () => {
    const body = new Uint8Array(TINY.bodyBytes);
    body[3] = 100;
    body[4] = TINY.bodyBytes - 5; // one block to EOF
    const d = decodeFwBody(body, TINY);
    expect(d.layoutMatched).toBe(false);
    expect(d.values).toEqual({});
    expect(d.warnings[0]).toMatch(/Expected 2 blocks/);
  });

  it('warns on an unknown format version but still reads', () => {
    const d = decodeFwBody(synthFwBody(TINY, {}, 250), TINY);
    expect(d.layoutMatched).toBe(true);
    expect(d.warnings.join(' ')).toMatch(/2\.50 is outside/);
  });

  it('reads fields in place when a block grew, and skips fields that no longer fit when it shrank', () => {
    // Block B shrunk to 1 byte: b.o (bits 0–3) still fits, b.h (bits 4–35) does not.
    const body = new Uint8Array([0, 0, 0, 100, 2, 0x80, 0x00, 1, 0x70]);
    const d = decodeFwBody(body, TINY);
    expect(d.layoutMatched).toBe(true);
    expect(d.values['b.o']).toBe(7 - 6);
    expect(d.values['b.h']).toBeUndefined();
    expect(d.warnings.join(' ')).toMatch(/Block size differs.*B/);
    expect(d.warnings.join(' ')).toMatch(/1 field\(s\) fall outside/);
  });

  it('flags values outside the firmware range', () => {
    const body = synthFwBody(TINY);
    writeBits(body, (4 + 1) * 8 + 7, 4, 0b0111); // a.s = +7 > max 6
    expect(decodeFwBody(body, TINY).warnings.join(' ')).toMatch(/outside the instrument’s range \(a\.s\)/);
  });
});

describe('decodeFwProgram — never throws on odd input', () => {
  const layouts = [NG_LAYOUT, NP6_LAYOUT, NE7_LAYOUT, NO3_LAYOUT] as FwLayout[];

  it('header-only for empty, header-only and truncated files', () => {
    for (const layout of layouts) {
      const full = synthFwFile('test', synthFwBody(layout));
      for (const bytes of [new Uint8Array(0), full.slice(0, 20), full.slice(0, 44), full.slice(0, full.length - 1)]) {
        const p = decodeFwProgram(bytes, layout);
        expect(p.layoutMatched, `${layout.model} ${bytes.length}`).toBe(false);
        expect(p.warnings.length).toBeGreaterThan(0);
        expect(p.values).toEqual({});
      }
    }
  });

  it('header-only when trailing bytes follow the chain', () => {
    for (const layout of layouts) {
      const full = synthFwFile('test', synthFwBody(layout));
      const longer = new Uint8Array(full.length + 1);
      longer.set(full);
      expect(decodeFwProgram(longer, layout).layoutMatched).toBe(false);
    }
  });

  it('survives random bytes', () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) % 256;
    for (const layout of layouts) {
      for (let n = 0; n < 50; n++) {
        const bytes = Uint8Array.from({ length: 44 + (rnd() % 64) * 6 }, rnd);
        expect(() => decodeFwProgram(bytes, layout)).not.toThrow();
      }
    }
  });
});

describe('generated layouts', () => {
  const layouts = [NG_LAYOUT, NP6_LAYOUT, NE7_LAYOUT, NO3_LAYOUT] as FwLayout[];

  it('chain the blocks back to back to the firmware body size', () => {
    const expected: Record<string, number> = { 'Nord Grand': 90, 'Nord Piano 6': 185, 'Nord Electro 7': 353, 'Nord Organ 3': 204 };
    for (const l of layouts) {
      let pos = 4;
      for (const b of l.blocks) { expect(b.offset).toBe(pos); pos += 1 + b.length; }
      expect(pos, l.model).toBe(l.bodyBytes);
      expect(l.bodyBytes).toBe(expected[l.model]);
    }
  });

  it('keep every field inside its block, without overlaps, and cite a firmware source', () => {
    for (const l of layouts) {
      const used = new Set<number>();
      for (const f of l.fields) {
        expect(f.bit + f.width, f.key).toBeLessThanOrEqual(l.blocks[f.block].length * 8);
        expect(f.src).toMatch(/OS \d\.\d\d registry FUN_c0/);
        expect(['high', 'medium']).toContain(f.confidence);
        const start = (l.blocks[f.block].offset + 1) * 8 + f.bit;
        for (let b = start; b < start + f.width; b++) { expect(used.has(b), f.key).toBe(false); used.add(b); }
      }
    }
  });

  it('a default synthetic body decodes cleanly to the firmware defaults', () => {
    for (const l of layouts) {
      const d = decodeFwBody(synthFwBody(l), l);
      expect(d.layoutMatched, l.model).toBe(true);
      expect(d.warnings, l.model).toEqual([]);
      for (const f of l.fields) expect(d.values[f.key], f.key).toBe(f.def);
    }
  });

  it('readBits agrees with writeBits at an arbitrary position', () => {
    const b = new Uint8Array(8);
    writeBits(b, 13, 32, 0xcafef00d);
    expect(readBits(b, 13, 32)).toBe(0xcafef00d);
  });
});
