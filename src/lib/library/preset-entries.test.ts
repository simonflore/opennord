import { describe, it, expect } from 'vitest';
import { presetEntriesFromScanned, presetEntriesFromDevice, filterPresets, sortPresets, presentKinds, type PresetEntry } from './preset-entries';
import type { ProgramEntry } from '../device/transfer';

const dev = (over: Partial<ProgramEntry>): ProgramEntry => ({
  bank: 0, slot: 0, name: 'X', categoryId: 0, version: 100, sizeBytes: 100, fourcc: 'ns4y', ...over,
});

describe('preset-entries', () => {
  it('maps device groups into entries carrying kind + partition + slot', () => {
    const out = presetEntriesFromDevice([
      { kind: 'synth-preset', partition: 9, entries: [dev({ bank: 0, slot: 0, name: 'Pad' })] },
    ]);
    expect(out[0]).toMatchObject({ source: 'nord', kind: 'synth-preset', partition: 9, name: 'Pad' });
    expect(out[0].slot).toBe('A:11');           // formatSlot(0,0)
    expect(out[0].id).toBe('nord-preset:9:A:11');
    expect(out[0].device?.name).toBe('Pad');
  });

  it('maps scanned presets into local entries with bytes + size', () => {
    const out = presetEntriesFromScanned([
      { id: 'folder:a.ns4o', name: 'My Organ', path: 'a.ns4o', tag: 'ns4o', kind: 'organ-preset', bytes: new Uint8Array(50) },
    ]);
    expect(out[0]).toMatchObject({ source: 'local', kind: 'organ-preset', name: 'My Organ', size: 50 });
    expect(out[0].bytes).toBeInstanceOf(Uint8Array);
  });

  it('filters by source, kind, and name query', () => {
    const es: PresetEntry[] = [
      { id: '1', name: 'Organ A', source: 'local', kind: 'organ-preset' },
      { id: '2', name: 'Synth B', source: 'nord', kind: 'synth-preset' },
    ];
    expect(filterPresets(es, 'all', 'synth-preset', '').map((e) => e.id)).toEqual(['2']);
    expect(filterPresets(es, 'local', 'all', '').map((e) => e.id)).toEqual(['1']);
    expect(filterPresets(es, 'all', 'all', 'organ').map((e) => e.id)).toEqual(['1']);
  });

  it('presentKinds lists distinct kinds in canonical order', () => {
    const es: PresetEntry[] = [
      { id: '1', name: 'a', source: 'nord', kind: 'synth-preset' },
      { id: '2', name: 'b', source: 'nord', kind: 'organ-preset' },
      { id: '3', name: 'c', source: 'nord', kind: 'synth-preset' },
    ];
    expect(presentKinds(es)).toEqual(['organ-preset', 'synth-preset']); // no piano present
  });

  it('sorts by name, favorites first', () => {
    const es: PresetEntry[] = [
      { id: '1', name: 'B', source: 'nord', kind: 'synth-preset' },
      { id: '2', name: 'A', source: 'nord', kind: 'synth-preset' },
    ];
    expect(sortPresets(es, 'name', new Set()).map((e) => e.name)).toEqual(['A', 'B']);
    expect(sortPresets(es, 'name', new Set(['1'])).map((e) => e.name)).toEqual(['B', 'A']); // fav floats up
  });
});
