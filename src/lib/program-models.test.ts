import { describe, it, expect } from 'vitest';
import type { FwLayout } from './clavia/block-chain';
import type { LegacyLayout } from './clavia/legacy-record';
import { sealFileChecksum } from './clavia/checksum';
import { synthFwBody, synthFwFile, synthLegacyLayoutFile } from './clavia/block-chain.synth';
import { CODECS } from './formats';
import { PROGRAM_WRITERS } from './program-write';
import { PROGRAM_MODELS, programModel, programModelByTag } from './program-models';
import { NL4_LAYOUT } from './nl4/layout.generated';
import { decodeNs2 } from './ns2/decode';
import { decodeNs3 } from './ns3/decode';

const isFw = (l: FwLayout | LegacyLayout): l is FwLayout => 'blocks' in l;

/** A program of every setting at its default, behind an NSM-era header. */
function synth(tag: string, layout: FwLayout | LegacyLayout): Uint8Array {
  if (!isFw(layout)) return sealFileChecksum(synthLegacyLayoutFile(tag, layout, {}, { nsmHeader: true }));
  const version = layout.versionRange?.[1] ?? 100;
  return sealFileChecksum(synthFwFile(tag, synthFwBody(layout, {}, version), version));
}

describe('PROGRAM_MODELS', () => {
  it('lists every model core reads but the Stage 4 (its own codec), the Stage 2 and 3 included', () => {
    // The Stage 2 and 3 are read outside CODECS (formats.ts decodes them directly).
    const read = [...CODECS.map((c) => c.model).filter((m) => m !== 'ns4'), 'ns2', 'ns3'];
    expect(PROGRAM_MODELS.map((m) => m.model).sort()).toEqual([...new Set(read)].sort());
  });

  it('reads the Stage 2 and 3 to the same values as their full readers, without a summary', () => {
    for (const [model, decode] of [['ns2', decodeNs2], ['ns3', decodeNs3]] as const) {
      const m = programModel(model)!;
      const file = synth(m.tags[0], m.layout);
      expect(m.read(file).values).toEqual(decode(file).values);
      expect(m.present).toBeUndefined();
    }
  });

  it('claims the same file tags as the app\'s codecs, so a file the app reads is one the tools read', () => {
    const tags = (model: string) => CODECS.find((c) => c.model === model)?.tags ?? { ns2: ['ns2p'], ns3: ['ns3f'] }[model];
    for (const m of PROGRAM_MODELS) expect([...m.tags].sort(), m.model).toEqual([...tags(m.model)!].sort());
  });

  it('reads a Lead 4 performance\'s slot A, and says so', () => {
    const nl4 = programModel('nl4')!;
    const perf = sealFileChecksum(synthLegacyLayoutFile('nl4p', NL4_LAYOUT, {}, { version: 9 }));
    const r = nl4.read(perf);
    expect(Object.keys(r.values).length).toBeGreaterThan(0);
    expect(r.warnings.join(' ')).toMatch(/slot A/);
    expect(() => nl4.writer!.write(perf, {})).toThrow(/performances/);
  });

  it('writes exactly what program-write.ts writes', () => {
    const written = Object.keys(PROGRAM_WRITERS).sort();
    expect(PROGRAM_MODELS.filter((m) => m.writer).map((m) => m.model).sort()).toEqual(written);
    expect(programModel('np1')?.notWritable).toMatch(/Nord Piano/);
  });

  for (const m of PROGRAM_MODELS) {
    it(`${m.layout.model}: reads its own layout's keys, summarises, and writes back what it reads`, () => {
      const tag = m.tags[0];
      expect(programModelByTag(tag)).toBe(m);
      const file = synth(tag, m.layout);
      const { values } = m.read(file);
      const keys = new Set(m.layout.fields.map((f) => f.key));
      expect(Object.keys(values).length).toBeGreaterThan(0);
      expect(Object.keys(values).every((k) => keys.has(k))).toBe(true);
      if (m.present) expect(m.present(file).sections.length + m.present(file).header.length).toBeGreaterThan(0);
      if (m.writer) expect(m.writer.write(file, values)).toEqual(file);
    });
  }
});
