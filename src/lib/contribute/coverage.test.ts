import { describe, it, expect } from 'vitest';
import { decodeForModel, NS4_PARAM_COUNT, DECODE_LABEL } from './coverage';
import { NS4_OFFSET_MAP } from '../ns4/offset-map.generated';

describe('decodeForModel', () => {
  it('reports Stage 4 fully decoded with its real parameter count', () => {
    const d = decodeForModel('stage-4');
    expect(d.status).toBe('full');
    expect(d.paramCount).toBe(new Set(NS4_OFFSET_MAP.map((p) => p.id)).size);
    expect(NS4_PARAM_COUNT).toBeGreaterThan(100);
  });

  it('reports Stage 3 as partial', () => {
    expect(decodeForModel('stage-3')).toEqual({ status: 'partial', paramCount: null });
  });

  it('reports an undecoded model as none', () => {
    expect(decodeForModel('electro-6')).toEqual({ status: 'none', paramCount: null });
    expect(decodeForModel('whatever')).toEqual({ status: 'none', paramCount: null });
  });

  it('has a label for every status', () => {
    expect(DECODE_LABEL.full && DECODE_LABEL.partial && DECODE_LABEL.none).toBeTruthy();
  });
});
