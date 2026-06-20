import { describe, it, expect } from 'vitest';
import { MODELS, ALL_MODELS, modelById } from './partitions';

describe('partition registry', () => {
  it('has unique model ids and resolves them', () => {
    const ids = ALL_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(modelById('stage-4')?.name).toBe('Nord Stage 4');
    expect(modelById('stage-3')?.programTag).toBe('ns3f'); // ns3f, not ns3p
    expect(modelById('nope' as never)).toBeUndefined();
  });

  it('every model has at most one program partition and unique fourccs', () => {
    for (const m of ALL_MODELS) {
      const programs = m.partitions.filter((p) => p.kind === 'program');
      expect(programs.length, m.id).toBeLessThanOrEqual(1);
      const fourccs = m.partitions.map((p) => p.fourcc).filter(Boolean);
      expect(new Set(fourccs).size, m.id).toBe(fourccs.length);
    }
  });

  it('Stage 4 carries hardware-validated partition indices', () => {
    const prog = modelById('stage-4')!.partitions.find((p) => p.kind === 'program')!;
    expect(prog.index).toBe(6); // PROTOCOL-RE.md
    expect(prog.fourcc).toBe('ns4p');
  });

  it('exposes MODELS keyed by id', () => {
    expect(MODELS['stage-2'].generation).toBe('OG');
  });
});
