import { describe, it, expect } from 'vitest';
import { decodeNspStroke, findCnsp, readLayerTable, readNspDirectory, strokeFor } from '../ns4/nsp-audio';
import { NSP_ROOT_OFFSET, readNsp } from '../ns4/nsp';
import { checkNpnoAcceptance } from '../ns4/nsp-check';
import { NPNO_PEAK } from '../ns4/nsp-write';
import { centsBetween, estimateF0, noteToHz, spectralCentroid } from './analysis';
import { buildTestPiano, TEST_PIANO_NOTE, TEST_PIANO_RATE, testPianoSpecs, testTone } from './test-piano';

const specs = testPianoSpecs();
const asFloat = (c: Int32Array) => Float32Array.from(c, (v) => v / 32768);

describe('testTone', () => {
  it('loops on whole cycles, so the seam is sample-exact', () => {
    const t = testTone({ hz: 440, seconds: 1.5, harmonics: [1, 0.4], loopSeconds: 0.5 });
    expect(t.loop).toEqual({ start: 44100, length: 22050 });
    const end = t.loop!.start + t.loop!.length;
    for (let k = 1; k <= 64; k++) expect(t.pcm[end - k]).toBe(t.pcm[t.loop!.start - k]);
    expect(Math.max(...Array.from(t.pcm, Math.abs))).toBe(NPNO_PEAK);
  });

  it('refuses a loop that cuts a cycle', () => {
    expect(() => testTone({ hz: 441, seconds: 1, harmonics: [1], loopSeconds: 0.5 })).toThrow(/whole cycles/);
  });
});

describe('test pianos', () => {
  it('are T0–T3 with distinct names', () => {
    expect(specs.map((s) => s.id)).toEqual(['T0', 'T1', 'T2', 'T3']);
    expect(new Set(specs.map((s) => buildTestPiano(s).fileName)).size).toBe(4);
  });

  for (const spec of specs) {
    describe(spec.id, () => {
      const built = buildTestPiano(spec);
      const { bytes } = built;

      it('passes every acceptance check, with a full decode', () => {
        const acc = checkNpnoAcceptance(bytes, { deep: true });
        expect(acc.checks.filter((c) => !c.ok)).toEqual([]);
        expect(acc.ok).toBe(true);
        expect(acc.nsmVersion).toBe(600);
        expect(readNsp(bytes)).toMatchObject({ recognized: true, checksumValid: true, version: '6.00' });
      });

      it('needs no seam repair and stays small', () => {
        expect(built.notes.filter((n) => /seam|loop/i.test(n))).toEqual([]);
        expect(bytes.length).toBeLessThan(1_500_000);
      });

      it('maps every zone key to a root 4 semitones below the recorded note', () => {
        const cnsp = findCnsp(bytes);
        for (const z of spec.input.zones) {
          for (let k = 0; k < 128; k++) {
            const stored = bytes[cnsp + 0x8c + k];
            if (k >= z.lowNote && k <= z.highNote) expect(stored).toBe(z.rootNote - NSP_ROOT_OFFSET);
          }
          expect(readLayerTable(bytes, cnsp)[z.rootNote - NSP_ROOT_OFFSET]).toBe(z.layers.length);
        }
        const mapped = Array.from({ length: 128 }, (_, k) => bytes[cnsp + 0x8c + k]).filter((b) => b !== 0xff).length;
        expect(mapped).toBe(spec.input.zones.reduce((a, z) => a + z.highNote - z.lowNote + 1, 0));
      });

      it('decodes back to the recorded pitch (root + 4 semitones)', () => {
        const dir = readNspDirectory(bytes)!;
        const zones = [...spec.input.zones].sort((a, b) => a.rootNote - b.rootNote);
        for (const s of dir.strokes) {
          const pcm = decodeNspStroke(bytes, dir, s);
          const f0 = estimateF0(asFloat(pcm[0]).subarray(4410, 26460), TEST_PIANO_RATE)!;
          const z = zones[s.zone];
          const storedRoot = z.rootNote - NSP_ROOT_OFFSET;
          expect(Math.abs(centsBetween(f0.hz, noteToHz(storedRoot + NSP_ROOT_OFFSET)))).toBeLessThan(0.1);
          if (s.loop) {
            // The seam the DSP needs: the 4 frames before the loop end equal those before its start.
            const end = s.loop.start + s.loop.length;
            for (let k = 1; k <= 4; k++) expect(pcm[0][end - k]).toBe(pcm[0][s.loop.start - k]);
          }
        }
      });
    });
  }

  it('T0 is unlooped; T1–T3 loop', () => {
    const loops = specs.map((s) => readNspDirectory(buildTestPiano(s).bytes)!.strokes.map((x) => !!x.loop));
    expect(loops).toEqual([[false], [true], [true, true], [true, true]]);
  });

  it('T2: the hard layer is far brighter than the soft one, and touch picks between them', () => {
    const { bytes } = buildTestPiano(specs[2]);
    const dir = readNspDirectory(bytes)!;
    const [hard, soft] = dir.strokes.map((s) => asFloat(decodeNspStroke(bytes, dir, s)[0]).subarray(4410, 26460));
    const ch = spectralCentroid(hard, TEST_PIANO_RATE)!;
    const cs = spectralCentroid(soft, TEST_PIANO_RATE)!;
    expect(cs).toBeLessThan(500);
    expect(ch / cs).toBeGreaterThan(2);
    expect(strokeFor(dir, 0, 127)?.index).toBe(0);
    expect(strokeFor(dir, 0, 20)?.index).toBe(1);
    expect(dir.strokes[1].velocityFrom).toBe(100); // 20 dB in 0.2 dB steps
  });

  it('T3: two zones, A3 = 220 Hz below A#3, A4 = 440 Hz from A#3 up', () => {
    const { bytes } = buildTestPiano(specs[3]);
    const cnsp = findCnsp(bytes);
    expect(bytes[cnsp + 0x8c + 57]).toBe(53);
    expect(bytes[cnsp + 0x8c + 58]).toBe(TEST_PIANO_NOTE - NSP_ROOT_OFFSET);
    expect(readNsp(bytes).zones).toEqual([
      { rootNote: 53, lowNote: 45, highNote: 57 },
      { rootNote: 65, lowNote: 58, highNote: 69 },
    ]);
  });
});
