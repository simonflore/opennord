import { describe, it, expect } from 'vitest';
import { decodeForModel, summarizeProgress, NS4_PARAM_COUNT, DECODE_LABEL } from './coverage';
import { NS4_OFFSET_MAP } from '../ns4/offset-map.generated';

describe('decodeForModel', () => {
  it('reports Stage 4 fully decoded with its real parameter count', () => {
    const d = decodeForModel('stage-4');
    expect(d.status).toBe('full');
    expect(d.paramCount).toBe(new Set(NS4_OFFSET_MAP.map((p) => p.id)).size);
    expect(d.pct).toBe(100);
    expect(NS4_PARAM_COUNT).toBeGreaterThan(100);
  });

  it('reports Stage 3 as partial', () => {
    expect(decodeForModel('stage-3')).toMatchObject({ status: 'partial', paramCount: null });
  });

  it('reports a model with no curated progress as none', () => {
    // A model id absent from MODEL_PROGRESS has no localized controls → none.
    expect(decodeForModel('does-not-exist')).toMatchObject({ status: 'none', controlCount: 0, pct: null });
    expect(decodeForModel('whatever')).toMatchObject({ status: 'none', controlCount: 0 });
  });

  it('reports NE6 as started with controls mapped', () => {
    const d = decodeForModel('electro-6');
    expect(d.status).toBe('started');
    expect(d.controlCount).toBeGreaterThan(0);
    expect(d.pct).toBeGreaterThan(0);
  });

  it('has a label for every status', () => {
    expect(DECODE_LABEL.full && DECODE_LABEL.partial && DECODE_LABEL.started && DECODE_LABEL.none).toBeTruthy();
  });
});

describe('summarizeProgress', () => {
  it('falls back to control-union bytes when there are no regions', () => {
    const s = summarizeProgress({
      bodyBytes: 100,
      controls: [
        { label: 'a', ranges: [{ start: 0, end: 1 }] },        // bytes 0,1
        { label: 'b', ranges: [{ start: 1, end: 3 }] },        // bytes 1,2,3 (1 overlaps)
      ],
    });
    expect(s).toEqual({ coveredBytes: 4, candidateBytes: 0, controlCount: 2, pct: 4 }); // {0,1,2,3} = 4 bytes of 100
  });

  it('leaves percent null when the body size is unknown', () => {
    expect(summarizeProgress({ bodyBytes: null, controls: [{ label: 'a', ranges: [{ start: 0, end: 0 }] }] }))
      .toEqual({ coveredBytes: 1, candidateBytes: 0, controlCount: 1, pct: null });
  });

  it('counts only confirmed region bytes toward pct; candidate bytes reported separately', () => {
    const s = summarizeProgress({
      bodyBytes: 100,
      controls: [{ label: 'whole body (candidate)', ranges: [{ start: 0, end: 99 }] }],
      regions: [
        { start: 0,  end: 9,  label: 'decoded field',     status: 'confirmed' }, // 10 bytes
        { start: 10, end: 49, label: 'section identified', status: 'candidate' }, // 40 bytes
        { start: 50, end: 99, label: '',                   status: 'constant'  },
      ],
    });
    // Headline = confirmed only (10/100 = 10%), NOT inflated by the candidate control.
    expect(s).toEqual({ coveredBytes: 10, candidateBytes: 40, controlCount: 1, pct: 10 });
  });
});
