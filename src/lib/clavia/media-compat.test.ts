import { describe, it, expect } from 'vitest';
import {
  acceptsSample, CNSP_VERSION, MEDIA_COMPAT, mediaCompat, pianoWriteVersion, sampleTarget, type MediaModelId,
} from './media-compat';
import { MODELS } from './partitions';

const { v4, v5, v6 } = CNSP_VERSION;
const pianoVersions = (m: MediaModelId) => {
  const p = mediaCompat(m).pianos;
  return typeof p === 'object' ? p.versions : p;
};
const sampleGens = (m: MediaModelId) => {
  const s = mediaCompat(m).samples;
  return typeof s === 'object' ? s.generations : s;
};

describe('MEDIA_COMPAT', () => {
  it('has a row for every registry model, plus the Electro 7', () => {
    for (const id of Object.keys(MODELS)) expect(MEDIA_COMPAT[id as MediaModelId], id).toBeDefined();
    expect(MEDIA_COMPAT['electro-7']).toBeDefined();
  });

  it('cites an OS and a firmware source on every established row', () => {
    for (const [id, row] of Object.entries(MEDIA_COMPAT)) {
      for (const part of [row.pianos, row.samples]) {
        if (typeof part === 'object') {
          expect(part.os, id).toMatch(/^\d+\.\d\d$/);
          expect(part.source.length, id).toBeGreaterThan(0);
        } else {
          expect(row.note, `${id} needs a note for its ${part}`).toBeTruthy();
        }
      }
    }
  });

  it('records the piano versions each firmware gate loads', () => {
    for (const m of ['stage-2', 'stage-3', 'stage-4', 'electro-5', 'electro-6', 'electro-7', 'piano-3', 'piano-4', 'piano-5', 'piano-6', 'grand', 'grand-2'] as const) {
      expect(pianoVersions(m), m).toEqual([v5, v6]);
    }
    for (const m of ['electro-3-hp', 'electro-4', 'piano-1', 'piano-2'] as const) expect(pianoVersions(m), m).toEqual([v5]);
    expect(pianoVersions('electro-3')).toEqual([v4, v5]);
    for (const m of ['wave', 'wave-2', 'organ-3', 'lead-4', 'lead-a1', 'c2d'] as const) expect(pianoVersions(m), m).toBe('none');
  });

  it('records the voice table: 0x4000 on the ColdFire gen-5 loaders, 0x6000 on the ARM ones', () => {
    const table = (m: MediaModelId) => { const p = mediaCompat(m).pianos; return typeof p === 'object' ? p.voiceTable : p; };
    for (const m of ['stage-2', 'electro-5', 'piano-3'] as const) expect(table(m), m).toBe(0x4000);
    for (const m of ['stage-3', 'stage-4', 'piano-4', 'piano-5', 'piano-6', 'grand', 'grand-2'] as const) expect(table(m), m).toBe(0x6000);
    // Not read on these.
    for (const m of ['electro-3', 'electro-3-hp', 'electro-4', 'piano-1', 'piano-2', 'electro-6', 'electro-7'] as const) expect(table(m), m).toBeUndefined();
  });

  it('records the sample generations each model loads', () => {
    for (const m of ['stage-2', 'electro-3', 'electro-3-hp', 'electro-4', 'electro-5', 'piano-2', 'piano-3', 'wave'] as const) {
      expect(sampleGens(m), m).toEqual([1, 2]);
    }
    for (const m of ['stage-3', 'piano-4', 'grand', 'electro-6'] as const) expect(sampleGens(m), m).toEqual([3]);
    for (const m of ['stage-4', 'piano-5', 'piano-6', 'grand-2'] as const) expect(sampleGens(m), m).toEqual([3, 4]);
    for (const m of ['wave-2', 'electro-7'] as const) expect(sampleGens(m), m).toBe('unknown');
    for (const m of ['piano-1', 'c2d', 'organ-3', 'lead-4', 'lead-a1'] as const) expect(sampleGens(m), m).toBe('none');
  });
});

describe('pianoWriteVersion / sampleTarget / acceptsSample', () => {
  it('picks the newest piano version a model loads', () => {
    expect(pianoWriteVersion('stage-4')).toBe(v6);
    expect(pianoWriteVersion('piano-2')).toBe(v5);
    expect(pianoWriteVersion('electro-3')).toBe(v5);
    expect(pianoWriteVersion('wave')).toBeUndefined();
    expect(pianoWriteVersion('stage-classic')).toBeUndefined();
  });

  it('picks the newest sample generation a model loads, as a convertNsmp target', () => {
    expect(sampleTarget('stage-4')).toBe(4);
    expect(sampleTarget('grand-2')).toBe(4);
    expect(sampleTarget('stage-3')).toBe(3);
    expect(sampleTarget('piano-4')).toBe(3);
    expect(sampleTarget('electro-5')).toBe(2);
    expect(sampleTarget('stage-2')).toBe(2);
    expect(sampleTarget('piano-1')).toBeUndefined();
    expect(sampleTarget('wave-2')).toBeUndefined();
  });

  it('answers per generation, and says when it is not established', () => {
    expect(acceptsSample('electro-5', 3)).toBe(false);
    expect(acceptsSample('electro-5', 2)).toBe(true);
    expect(acceptsSample('grand', 4)).toBe(false);
    expect(acceptsSample('piano-5', 4)).toBe(true);
    expect(acceptsSample('organ-3', 3)).toBe(false);
    expect(acceptsSample('wave-2', 3)).toBeUndefined();
  });
});
