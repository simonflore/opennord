import { describe, it, expect } from 'vitest';
import { ContributionSession } from './session';
import { buildBundle, bundleToJson, bundleFilename } from './export';
import type { Capture } from './types';
import { identifyNordFile } from '../clavia/nord-file';
import { buildCbinHeader } from '../clavia/cbin';

function cap(body: number[]): Capture {
  const file = buildCbinHeader({ formatType: 1, tag: 'ns4p', bank: 0, location: 0, category: 0, versionRaw: 400 });
  return { model: identifyNordFile(file), body: new Uint8Array(body) };
}

describe('buildBundle', () => {
  it('serializes baseline + entries with model identity', () => {
    const s = new ContributionSession();
    s.setBaseline(cap([1, 2, 3, 4]));
    s.addEntry(cap([1, 9, 3, 4]), 'Filter cutoff', 'min -> max', 'syn.flt.cutoff');
    const b = buildBundle(s, { pid: '0x002e', toolVersion: '0.1.0', capturedAt: '2026-06-20T00:00:00Z' });

    expect(b.schema).toBe('opennord.contribution/1');
    expect(b.model.fileTag).toBe('ns4p');
    expect(b.model.pid).toBe('0x002e');
    expect(b.baseline.bodyLen).toBe(4);
    expect(b.entries).toHaveLength(1);
    expect(b.entries[0].vocabId).toBe('syn.flt.cutoff');
    expect(() => JSON.parse(bundleToJson(b))).not.toThrow();
    expect(bundleFilename(b)).toBe('opennord-contribution-ns4p-2026-06-20.json');
  });

  it('throws when there is no baseline', () => {
    expect(() => buildBundle(new ContributionSession(), { pid: '', toolVersion: '0', capturedAt: '2026-06-20T00:00:00Z' })).toThrow();
  });
});
