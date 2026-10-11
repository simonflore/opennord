import { describe, it, expect } from 'vitest';
import { decodeForModel, getModelProgress, summarizeProgress, NS4_PARAM_COUNT, DECODE_LABEL } from './coverage';
import { NS4_OFFSET_MAP } from '../ns4/offset-map.generated';
import { NE7_LAYOUT } from '../ne7/layout.generated';
import { NS3_LAYOUT } from '../ns3/layout.generated';

describe('decodeForModel', () => {
  it('reports Stage 4 fully decoded with its real parameter count', () => {
    const d = decodeForModel('stage-4');
    expect(d.status).toBe('full');
    // Param count = the ported ns4decode map + the corpus-hunted extra params.
    expect(d.paramCount).toBe(NS4_PARAM_COUNT);
    expect(NS4_PARAM_COUNT).toBeGreaterThanOrEqual(new Set(NS4_OFFSET_MAP.map((p) => p.id)).size);
    expect(d.pct).toBe(100);
    expect(NS4_PARAM_COUNT).toBeGreaterThan(100);
  });

  it('reports Stage 3 with the firmware layout\'s parameter count and a confirmed byte map', () => {
    const d = decodeForModel('stage-3');
    // Each registry parameter once: slot B, Organ Preset II and the morph deltas repeat parameters.
    const params = new Set(NS3_LAYOUT.fields.filter((f) => f.key.split('.').length === 2).map((f) => f.name));
    expect(d).toMatchObject({ status: 'partial', paramCount: params.size, bodyBytes: 548 });
    expect(d.paramCount).toBeGreaterThan(150);
    // Everything but the version word, the 19 length bytes and the reserved bits is a field.
    expect(d.pct).toBeGreaterThan(80);
    expect(getModelProgress('stage-3')?.regions?.some((r) => r.status === 'candidate')).toBe(false);
  });

  it('reports a model with no curated progress as none', () => {
    // A model id absent from MODEL_PROGRESS has no localized controls → none.
    expect(decodeForModel('does-not-exist')).toMatchObject({ status: 'none', controlCount: 0, pct: null });
    expect(decodeForModel('whatever')).toMatchObject({ status: 'none', controlCount: 0 });
  });

  it('reports a curated model with controls mapped as started', () => {
    const d = decodeForModel('electro-5');
    expect(d.status).toBe('started');
    expect(d.controlCount).toBeGreaterThan(0);
    expect(d.pct).toBeGreaterThan(0);
  });

  it('reports NE6 as partly decoded, with its byte map from the firmware layout', () => {
    const d = decodeForModel('electro-6');
    expect(d).toMatchObject({ status: 'partial', bodyBytes: 211 });
    expect(d.pct).toBeGreaterThan(0);
  });

  it('maps the legacy-record models over their record data (file 0x1A on)', () => {
    expect(decodeForModel('lead-4')).toMatchObject({ status: 'partial', bodyBytes: 315 });
    expect(decodeForModel('electro-4')).toMatchObject({ status: 'partial', bodyBytes: 108 });
    // Lead A1: alignment unchecked on real files, so candidate bytes only.
    expect(decodeForModel('lead-a1')).toMatchObject({ status: 'partial', bodyBytes: 95, coveredBytes: 0 });
    expect(decodeForModel('lead-a1').candidateBytes).toBeGreaterThan(0);
    const labels = getModelProgress('lead-4')!.regions!.map((r) => r.label);
    expect(labels).toEqual(expect.arrayContaining(['slot', 'slot morph list', 'fx', 'fx morph list', 'Reserved']));
  });

  it('has a label for every status', () => {
    expect(DECODE_LABEL.full && DECODE_LABEL.partial && DECODE_LABEL.started && DECODE_LABEL.none).toBeTruthy();
  });

  it('synthesizes a byte-map for Stage 2 by tracing the reader and for Stage 3 from its layout', () => {
    for (const id of ['stage-2', 'stage-3']) {
      const p = getModelProgress(id);
      expect(p, id).toBeTruthy();
      expect(p!.bodyBytes, id).toBeGreaterThan(0);
      expect(p!.regions!.length, id).toBeGreaterThan(0);
      // Some bytes are read by the reader (confirmed) — the map isn't all-constant.
      expect(p!.regions!.some((r) => r.status === 'confirmed'), id).toBe(true);
    }
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

describe('parameter counts of the firmware-layout readers', () => {
  it('count each firmware parameter once, like the Stage 4 count (Electro 7 repeats its Fx block per section)', () => {
    const fxRate = NE7_LAYOUT.fields.filter((f) => f.name === 'Edt_Effects_kFx1Rate');
    expect(fxRate.length).toBe(3); // organ, piano and synth Fx blocks
    const n = decodeForModel('electro-7').paramCount!;
    expect(n).toBe(new Set(NE7_LAYOUT.fields.filter((f) => f.key.split('.').length === 2).map((f) => f.name)).size);
    expect(n).toBeLessThan(NE7_LAYOUT.fields.length);
  });
});

describe('parameter counts of the legacy-record readers', () => {
  it('count the Electro 4 preset sets stored twice (Preset I/II) once, and leave out Lead A1 morph deltas', () => {
    expect(decodeForModel('electro-4').paramCount).toBe(90);
    expect(decodeForModel('lead-4').paramCount).toBe(86);
    expect(decodeForModel('lead-a1').paramCount).toBe(52);
  });
});

describe('fullMap', () => {
  it('is set for the firmware-layout and legacy-record readers except Wave 2, and for the Stage 4', () => {
    for (const id of ['stage-4', 'grand', 'grand-2', 'piano-4', 'piano-5', 'piano-6', 'electro-6', 'electro-7', 'organ-3', 'lead-4', 'lead-a1', 'electro-4']) {
      expect(decodeForModel(id).fullMap, id).toBe(true);
    }
    for (const id of ['wave-2', 'stage-3', 'stage-2', 'electro-5', 'wave', 'electro-3']) {
      expect(decodeForModel(id).fullMap, id).toBe(false);
    }
  });
});
