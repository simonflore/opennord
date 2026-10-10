import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { decodeNspStroke, findCnsp, readNspDirectory, strokeFor } from './nsp-audio';
import { makeNpno, tone, type SynthStroke } from './nsp-synth.testing';
import { readNsp } from './nsp';

describe('readNspDirectory + decodeNspStroke', () => {
  it('round-trips a v5-layout mono piano (CNSP at 0x18) bit-exactly', () => {
    const strokes: SynthStroke[] = [
      { pcm: [tone(30000, 0.01, 6000, 1)], velocityFrom: 0, before: [[0, 12, 30, 41]], loop: { start: 20000, length: 3508 } },
      { pcm: [tone(12000, 0.02, 7000, 2)], velocityFrom: 40, before: [[-5, -9, -2, 3]] },
      { pcm: [tone(9000, 0.03, 5000, 3)], velocityFrom: 0, before: [[0, 0, 0, 0]] },
    ];
    const bytes = makeNpno(strokes, 1, 0x18);
    const dir = readNspDirectory(bytes)!;
    expect(dir).toBeDefined();
    expect(dir.channels).toBe(1);
    expect(dir.blockWords).toBe(511);
    expect(dir.strokes.map((s) => [s.zone, s.velocityFrom])).toEqual([[0, 0], [0, 40], [1, 0]]);
    expect(dir.strokes[0].loop).toEqual({ start: 20000, length: 3508 });
    expect(dir.strokes[1].loop).toBeUndefined();
    expect(dir.strokes[0].history).toEqual([[41, 30, 12, 0]]); // newest first
    strokes.forEach((s, i) => {
      const [pcm] = decodeNspStroke(bytes, dir, dir.strokes[i]);
      expect(Array.from(pcm.subarray(0, s.pcm[0].length))).toEqual(s.pcm[0]);
      expect(pcm.subarray(s.pcm[0].length).every((v) => v === 0)).toBe(true); // block padding
    });
  });

  it('round-trips a v6-layout stereo piano (CNSP at 0x2C) bit-exactly', () => {
    const strokes: SynthStroke[] = [0, 30, 60].map((velocityFrom, i) => ({
      pcm: [tone(20000, 0.012, 3000 + 1500 * i, 10 + i), tone(20000, 0.012, 2500 + 1500 * i, 20 + i)],
      velocityFrom,
      before: [[0, 98, 298, 543], [0, 173, 217, 50]],
    }));
    const bytes = makeNpno(strokes, 2, 0x2c);
    const dir = readNspDirectory(bytes)!;
    expect(dir.channels).toBe(2);
    expect(dir.blockWords).toBe(1022);
    expect(dir.strokes.every((s) => s.zone === 0)).toBe(true);
    strokes.forEach((s, i) => {
      const pcm = decodeNspStroke(bytes, dir, dir.strokes[i]);
      for (let c = 0; c < 2; c++) expect(Array.from(pcm[c].subarray(0, 20000))).toEqual(s.pcm[c]);
    });
  });

  it('reads name + key map relative to the CNSP tag in both layouts', () => {
    for (const cnsp of [0x18, 0x2c]) {
      const bytes = makeNpno([{ pcm: [tone(5000, 0.02, 4000, 5)], velocityFrom: 0, before: [[0, 0, 0, 0]] }], 1, cnsp);
      expect(findCnsp(bytes)).toBe(cnsp);
      const f = readNsp(bytes);
      expect(f.name).toBe('Synth Piano');
      expect(f.zones).toEqual([
        { rootNote: 48, lowNote: 0, highNote: 59 },
        { rootNote: 72, lowNote: 60, highNote: 127 },
      ]);
    }
  });

  it('picks the velocity layer a key zone plays', () => {
    const mk = (velocityFrom: number) => ({ pcm: [tone(3000, 0.02, 3000, velocityFrom + 1)], velocityFrom, before: [[0, 0, 0, 0]] });
    const dir = readNspDirectory(makeNpno([mk(0), mk(40), mk(90), mk(0)], 1, 0x2c))!;
    expect(strokeFor(dir, 0, 1)?.index).toBe(0);
    expect(strokeFor(dir, 0, 39)?.index).toBe(0);
    expect(strokeFor(dir, 0, 40)?.index).toBe(1);
    expect(strokeFor(dir, 0, 127)?.index).toBe(2);
    expect(strokeFor(dir, 1, 127)?.index).toBe(3);
    expect(strokeFor(dir, 2, 64)).toBeUndefined();
  });

  it('rejects a corrupt block header instead of returning noise', () => {
    const bytes = makeNpno([{ pcm: [tone(5000, 0.02, 4000, 7)], velocityFrom: 0, before: [[0, 0, 0, 0]] }], 1, 0x2c);
    const dir = readNspDirectory(bytes)!;
    bytes[dir.strokes[0].offset + 1] = 0xe0; // width 0, order 7
    expect(() => decodeNspStroke(bytes, dir, dir.strokes[0])).toThrow(/bad block header/);
  });

  it('returns undefined for a file without a CNSP directory', () => {
    expect(readNspDirectory(new Uint8Array(0x100))).toBeUndefined();
  });
});

// Real factory pianos: point NPNO_DIR at a folder of .npno files kept outside the repo
// (Clavia's audio — never commit it). Skipped when unset, so CI never sees them.
const npnoDir = process.env.NPNO_DIR;
const realFiles = npnoDir && existsSync(npnoDir) ? readdirSync(npnoDir).filter((f) => f.endsWith('.npno')) : [];
describe.skipIf(realFiles.length === 0)('decodeNspStroke — real pianos in $NPNO_DIR', () => {
  for (const name of realFiles) {
    it(`decodes every stroke of ${name} to its directory length, bounded`, () => {
      const bytes = new Uint8Array(readFileSync(join(npnoDir!, name)));
      const dir = readNspDirectory(bytes)!;
      expect(dir).toBeDefined();
      expect(dir.strokes.at(-1)!.zone + 1).toBe(readNsp(bytes).sampleCount);
      for (const s of dir.strokes) {
        const pcm = decodeNspStroke(bytes, dir, s);
        let peak = 0;
        for (const ch of pcm) for (const v of ch) peak = Math.max(peak, Math.abs(v));
        expect(peak).toBeLessThan(32768);
      }
    }, 120_000);
  }
});
