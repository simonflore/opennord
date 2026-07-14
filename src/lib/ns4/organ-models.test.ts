import { describe, it, expect } from 'vitest';
import { organModelSpec, ORGAN_MODELS } from './organ-models';

describe('organModelSpec', () => {
  it('returns Hammond footages + colors for B3 (9 drawbars)', () => {
    const s = organModelSpec('B3');
    expect(s).not.toBeNull();
    expect(s!.footages).toHaveLength(9);
    expect(s!.colors).toHaveLength(9);
    expect(s!.footages[0]).toBe('16′');
    expect(s!.footages[2]).toBe('8′');
    expect(s!.colors[0]).toBe('brown');   // 16′
    expect(s!.colors[2]).toBe('white');   // 8′
    expect(s!.colors[4]).toBe('black');   // 2⅔′
  });

  it('is case-insensitive on the model name', () => {
    expect(organModelSpec('b3')).not.toBeNull();
  });

  it('returns null for non-B3 models (generic drawbars)', () => {
    expect(organModelSpec('VOX')).toBeNull();
    expect(organModelSpec('FARF')).toBeNull();
    expect(organModelSpec(undefined)).toBeNull();
  });

  it('exposes the canonical selector model list', () => {
    expect(ORGAN_MODELS).toEqual(['B3', 'VOX', 'FARF', 'PIPE1', 'PIPE2']);
  });
});
