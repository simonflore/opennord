import { describe, it, expect } from 'vitest';
import { presetEntriesFromScanned, presetEntriesFromDevice, filterPresets, sortPresets, presentKinds, presentGenerations, cloudPresetEntries, type PresetEntry } from './preset-entries';
import type { ProgramEntry } from '../device/transfer';

const dev = (over: Partial<ProgramEntry>): ProgramEntry => ({
  bank: 0, slot: 0, name: 'X', categoryId: 0, version: 100, sizeBytes: 100, fourcc: 'ns4y', ...over,
});

describe('preset-entries', () => {
  it('keeps presets in slots 0 and 64 under their own ids', () => {
    const out = presetEntriesFromDevice([
      { kind: 'synth-preset', partition: 9, entries: [dev({ slot: 0, name: 'A' }), dev({ slot: 64, name: 'B' })] },
    ]);
    expect(out.map((e) => e.id)).toEqual(['nord-preset:9:A:11', 'nord-preset:9:A:91']);
  });

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

  it('carries the file type and Stage model, so Stage 2/3/4 presets read and filter apart', () => {
    const scanned = presetEntriesFromScanned([
      { id: 'folder:a.ns2s', name: 'Two', path: 'a.ns2s', tag: 'ns2s', kind: 'synth-preset', bytes: new Uint8Array(10) },
      { id: 'folder:b.ns3y', name: 'Three', path: 'b.ns3y', tag: 'ns3y', kind: 'synth-preset', bytes: new Uint8Array(10) },
    ]);
    const device = presetEntriesFromDevice([{ kind: 'organ-preset', partition: 7, entries: [dev({ name: 'Four' })] }]);
    const all = [...device, ...scanned];
    expect(all.map((e) => [e.typeLabel, e.generation])).toEqual([
      ['.ns4o', 'Stage 4'], ['.ns2s', 'Stage 2'], ['.ns3y', 'Stage 3'],
    ]);
    expect(presentGenerations(all)).toEqual(['Stage 2', 'Stage 3', 'Stage 4']);
    expect(filterPresets(all, 'all', 'all', '', 'Stage 3').map((e) => e.name)).toEqual(['Three']);
  });

  it('tags a bundle-sourced preset (id contains !) as source=backup', () => {
    const out = presetEntriesFromScanned([
      { id: 'folder:Backup.ns4b!Organ Preset/Bank 1/X.ns4o', name: 'X', path: 'Backup.ns4b → Organ Preset/Bank 1/X.ns4o', tag: 'ns4o', kind: 'organ-preset', bytes: new Uint8Array(10) },
    ]);
    expect(out[0].source).toBe('backup');
  });

  it('tags a loose preset (no ! in id) as source=local', () => {
    const out = presetEntriesFromScanned([
      { id: 'folder:a.ns4o', name: 'My Organ', path: 'a.ns4o', tag: 'ns4o', kind: 'organ-preset', bytes: new Uint8Array(10) },
    ]);
    expect(out[0].source).toBe('local');
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

describe('cloud presets', () => {
  it('lists a cloud preset by its file type’s kind, without bytes until fetched', () => {
    const items = [
      { fingerprint: 'y1', kind: 'preset' as const, filename: 'Fat Lead.ns4y' },
      { fingerprint: 'y2', kind: 'preset' as const, filename: 'Gospel.ns4o' },
      { fingerprint: 'y3', kind: 'preset' as const, filename: 'Mystery.xyz' },      // not a preset type: left out
      { fingerprint: 'p1', kind: 'program' as const, filename: 'Pad.ns4p' },
    ];
    expect(cloudPresetEntries(items, new Map())).toEqual([
      { id: 'cloud:y1', name: 'Fat Lead', source: 'cloud', fingerprint: 'y1', kind: 'synth-preset', typeLabel: '.ns4y', generation: 'Stage 4' },
      { id: 'cloud:y2', name: 'Gospel', source: 'cloud', fingerprint: 'y2', kind: 'organ-preset', typeLabel: '.ns4o', generation: 'Stage 4' },
    ]);
    const bytes = new Uint8Array([1]);
    expect(cloudPresetEntries(items, new Map([['y1', bytes]]))[0]).toMatchObject({ bytes, size: 1 });
  });
  it('filters presets by "found on"', () => {
    const row = { id: 'folder:a', name: 'A', source: 'local' as const, kind: 'synth-preset' as const, sources: ['local' as const, 'cloud' as const] };
    expect(filterPresets([row], 'cloud', 'all', '')).toHaveLength(1);
    expect(filterPresets([row], 'nord', 'all', '')).toHaveLength(0);
  });
  it('floats a row to the top when any of its members, or its fingerprint, is a favourite', () => {
    const a = { id: 'folder:a', name: 'A', source: 'local' as const, kind: 'synth-preset' as const };
    const row = { id: 'folder:b', name: 'B', source: 'local' as const, kind: 'synth-preset' as const, fingerprint: 'y1', members: [{ id: 'folder:b', source: 'local' as const, name: 'B' }, { id: 'cloud:y1', source: 'cloud' as const, name: 'B' }] };
    expect(sortPresets([a, row], 'default', new Set(['cloud:y1'])).map((e) => e.id)).toEqual(['folder:b', 'folder:a']);
  });
});
