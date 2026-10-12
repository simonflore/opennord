import { describe, it, expect } from 'vitest';
import { MODEL_PROGRESS } from './coverage-data';
import { decodeForModel, getModelProgress, summarizeProgress, NS4_PARAM_COUNT, DECODE_LABEL } from './coverage';
import { NS4_OFFSET_MAP } from '../ns4/offset-map.generated';
import { NE7_LAYOUT } from '../ne7/layout.generated';
import { NS2_LAYOUT } from '../ns2/layout.generated';
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
    // A synthetic curated entry: every model with a curated map so far has since got a reader.
    MODEL_PROGRESS['test-model'] = { bodyBytes: 10, controls: [{ label: 'Level', ranges: [{ start: 2, end: 3 }] }] };
    try {
      const d = decodeForModel('test-model');
      expect(d.status).toBe('started');
      expect(d.controlCount).toBe(1);
      expect(d.pct).toBe(20);
    } finally {
      delete MODEL_PROGRESS['test-model'];
    }
  });

  it('reports NE6 as partly decoded, with its byte map from the firmware layout', () => {
    const d = decodeForModel('electro-6');
    expect(d).toMatchObject({ status: 'partial', bodyBytes: 211 });
    expect(d.pct).toBeGreaterThan(0);
  });

  it('maps the legacy-record models over their record data (file 0x1A on)', () => {
    expect(decodeForModel('lead-4')).toMatchObject({ status: 'partial', bodyBytes: 315 });
    expect(decodeForModel('electro-4')).toMatchObject({ status: 'partial', bodyBytes: 108 });
    // Lead A1: confirmed on real files, so its bytes count as covered.
    expect(decodeForModel('lead-a1')).toMatchObject({ status: 'partial', bodyBytes: 95, candidateBytes: 0 });
    expect(decodeForModel('lead-a1').coveredBytes).toBeGreaterThan(0);
    const labels = getModelProgress('lead-4')!.regions!.map((r) => r.label);
    expect(labels).toEqual(expect.arrayContaining(['slot', 'slot morph list', 'fx', 'fx morph list', 'Reserved']));
  });

  it('has a label for every status', () => {
    expect(DECODE_LABEL.full && DECODE_LABEL.partial && DECODE_LABEL.started && DECODE_LABEL.none).toBeTruthy();
  });

  it('maps the Stage 2 / 2 EX record from the firmware layout, counting slot B, Preset II and morph deltas once', () => {
    const d = decodeForModel('stage-2');
    expect(decodeForModel('stage-2-ex')).toEqual(d);
    // Global containers' parameters + one slot's (Preset I/II share descriptor ids).
    const base = NS2_LAYOUT.fields.filter((f) => !f.deltaOf);
    const once = new Set(base
      .filter((f) => !f.key.startsWith('slotB_') && !/PresetII\./.test(f.key))
      .map((f) => f.key));
    expect(d).toMatchObject({ status: 'partial', paramCount: once.size, bodyBytes: 519 });
    expect(d.paramCount).toBeGreaterThan(150);
    expect(d.paramCount).toBeLessThan(base.length);
    // Everything but the reserved descriptors is a field.
    expect(d.pct).toBeGreaterThan(85);
    const labels = getModelProgress('stage-2')!.regions!.map((r) => r.label);
    expect(labels).toEqual(expect.arrayContaining(['globalFx', 'slotA_synth', 'slotB_effects', 'Reserved']));
    expect(getModelProgress('stage-2')!.regions!.some((r) => r.status === 'candidate')).toBe(false);
  });

  it('synthesizes a byte-map for Stage 2 and Stage 3 from their firmware layouts (no fixtures needed)', () => {
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

  it('count the Electro 3 presets and per-instrument effect switches once; the HP adds five', () => {
    // common 1 · organ common 6 · preset 37 · piano 18 · shared effects 15 · switches 5
    expect(decodeForModel('electro-3').paramCount).toBe(82);
    expect(decodeForModel('electro-3-hp').paramCount).toBe(87);
    expect(decodeForModel('electro-3')).toMatchObject({ bodyBytes: 108, coveredBytes: 0 });
  });

  it('count each C2D parameter once across presets, manuals and repeated containers', () => {
    expect(decodeForModel('c2d').paramCount).toBe(91);
    expect(decodeForModel('c2d')).toMatchObject({ status: 'partial', bodyBytes: 345, coveredBytes: 0 });
  });

  it('count each Wave parameter once across both slots, without the morph deltas', () => {
    // global 8 · slot 56 · common 10
    expect(decodeForModel('wave').paramCount).toBe(74);
    expect(decodeForModel('wave')).toMatchObject({ status: 'partial', bodyBytes: 323, candidateBytes: 0 });
  });
});

describe('parameter counts of the later ColdFire readers', () => {
  it('count each stored parameter once (Electro 5 presets, C2 manuals and presets, Stage panels A/B), without the Stage morph deltas', () => {
    const counts = Object.fromEntries(['electro-5', 'piano-3', 'piano-2', 'piano-1', 'stage-classic', 'c2']
      .map((id) => [id, decodeForModel(id).paramCount]));
    expect(counts).toEqual({ 'electro-5': 129, 'piano-3': 76, 'piano-2': 52, 'piano-1': 29, 'stage-classic': 199, c2: 86 });
    expect(decodeForModel('stage-ex').paramCount).toBe(counts['stage-classic']);
  });

});

describe('fullMap', () => {
  it('is set for the firmware-layout and legacy-record readers, and for the Stage 4', () => {
    for (const id of ['stage-4', 'stage-3', 'grand', 'grand-2', 'piano-4', 'piano-5', 'piano-6', 'electro-6', 'electro-7', 'organ-3', 'wave-2', 'lead-4', 'lead-a1', 'electro-4',
      'stage-2', 'stage-2-ex', 'electro-3', 'electro-3-hp', 'c2d', 'wave', 'electro-5', 'piano-3', 'piano-2', 'piano-1', 'c2',
      'stage-classic', 'stage-ex']) {
      expect(decodeForModel(id).fullMap, id).toBe(true);
    }
  });
});
