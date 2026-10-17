import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nordEntriesFromDevice, filterEntries, entriesFromScannedPrograms, entryFromImport, sortEntries, presentCategories, cloudProgramEntries } from './entries';
import type { LibraryEntry } from './types';
import type { ScannedProgram } from '../folder/scan';
import type { EngineSummary } from '../clavia/engines';
import type { NS4Program } from '../ns4/types';
import { zonedProgram } from '../../test-utils/ns4';

const ns4Bytes = new Uint8Array(
  readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/regressionTest.ns4p', import.meta.url))),
);
const synthSummary: EngineSummary = { axis: 'engine', engines: [{ kind: 'synth', layers: ['A'] }] };

// formatSlot(0, 13): bank 0 → 'A', loc=13 → Math.floor(13/8)+1=2, (13%8)+1=6 → 'A:26'
// (Task spec assumed 0-indexed slot displayed 1-indexed as 'A:14', but the real
//  formatSlot uses a 6-bit page×8 encoding: digit1=(loc/8)+1, digit2=(loc%8)+1)

const sample: LibraryEntry[] = [
  { id: 'nord:A:14', name: 'Wurli Dream', source: 'nord', slot: 'A:14', category: 'EPiano' },
  { id: 'local:1', name: 'Sunday Organ', source: 'local', category: 'Organ' },
  { id: 'nord:B:03', name: 'Deep Stab', source: 'nord', slot: 'B:03', category: 'Pad' },
];

describe('nordEntriesFromDevice', () => {
  it('maps device program entries to nord library entries with a slot label', () => {
    const out = nordEntriesFromDevice([{ bank: 0, slot: 13, name: 'Wurli Dream', categoryId: 0, version: 313, sizeBytes: 0, fourcc: 'ns4p' }]);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('nord');
    expect(out[0].name).toBe('Wurli Dream');
    expect(out[0].slot).toBe('A:26');   // formatSlot(0,13) → 'A:26' (page 2, position 6)
    expect(out[0].id).toBe('nord:A:26');
    expect(out[0].typeLabel).toBe('.ns4p'); // the file type, so a same-name hint compares like with like
  });
  it('resolves the Nord category name from the enumerated categoryId', () => {
    const out = nordEntriesFromDevice([{ bank: 0, slot: 0, name: 'Lyle Lead', categoryId: 6, version: 313, sizeBytes: 0, fourcc: 'ns4p' }]);
    expect(out[0].category).toBe('Lead'); // id 6 = Lead
  });
  it('keeps every program of a 100-slot Stage 2 bank under its own id', () => {
    const device = (slot: number, name: string) => ({ bank: 0, slot, name, categoryId: 0, version: 6, sizeBytes: 0, fourcc: 'ns2p' });
    const out = nordEntriesFromDevice([device(0, 'LadiesNight Bass'), device(64, 'The opening')]);
    expect(out.map((e) => e.id)).toEqual(['nord:A:11', 'nord:A:91']);
  });
});

describe('filterEntries', () => {
  it('returns all entries for the "all" source and empty query', () => {
    expect(filterEntries(sample, 'all', '')).toHaveLength(3);
  });
  it('filters by source', () => {
    expect(filterEntries(sample, 'nord', '')).toHaveLength(2);
    expect(filterEntries(sample, 'local', '')).toHaveLength(1);
  });
  it('filters by case-insensitive name substring', () => {
    const out = filterEntries(sample, 'all', 'deep');
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Deep Stab');
  });
  it('filters by the category facet', () => {
    const out = filterEntries(sample, 'all', '', 'all', 'Pad');
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Deep Stab');
  });
  it('search matches on category even when the name does not', () => {
    // No entry name contains "pad"; only "Deep Stab" (category "Pad") should match.
    const out = filterEntries(sample, 'all', 'pad');
    expect(out.map((e) => e.name)).toEqual(['Deep Stab']);
  });
});

describe('presentCategories', () => {
  it('returns categories present in the entries, in Nord canonical order', () => {
    // canonical order: Organ (7), Pad (8), EPiano (23)
    expect(presentCategories(sample)).toEqual(['Organ', 'Pad', 'EPiano']);
  });
  it('ignores entries with no category', () => {
    expect(presentCategories([{ id: 'x', name: 'n', source: 'local' }])).toEqual([]);
  });
});

describe('entryFromImport — engines', () => {
  it('carries the structured engine summary from the parsed file', () => {
    const e = entryFromImport({ id: 'local:1', name: 'regressionTest.ns4p', bytes: ns4Bytes });
    expect(e.engines?.axis).toBe('engine');
  });
});

describe('filterEntries — engine search', () => {
  it('matches an entry by an engine name in its summary', () => {
    const e = entryFromImport({ id: 'local:1', name: 'regressionTest.ns4p', bytes: ns4Bytes });
    expect(filterEntries([e], 'all', 'organ')).toHaveLength(1);
    expect(filterEntries([e], 'all', 'zzznope')).toHaveLength(0);
  });
});

describe('entriesFromScannedPrograms', () => {
  it('maps scanned programs to local Library entries, preserving id', () => {
    const fakeProgram = { parsed: false, bytes: new Uint8Array() } as unknown as NS4Program;
    const scanned: ScannedProgram[] = [
      { id: 'folder:Lead.ns4p', name: 'Lead', path: 'Lead.ns4p', program: fakeProgram, bytes: new Uint8Array([1]), engines: synthSummary },
    ];
    const entries = entriesFromScannedPrograms(scanned);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ id: 'folder:Lead.ns4p', name: 'Lead', source: 'local', engines: synthSummary });
    expect(entries[0].program).toBe(fakeProgram);
  });

  it('tags a bundle-sourced program as source=backup (id contains !)', () => {
    const fakeProgram = { parsed: false, bytes: new Uint8Array() } as unknown as NS4Program;
    const scanned: ScannedProgram[] = [
      { id: 'folder:Backup.ns4b!Program/Bank A/Lead.ns4p', name: 'Lead', path: 'Backup.ns4b → Program/Bank A/Lead.ns4p', program: fakeProgram, bytes: new Uint8Array([1]) },
    ];
    const entries = entriesFromScannedPrograms(scanned);
    expect(entries).toHaveLength(1);
    expect(entries[0].source).toBe('backup');
  });

  it('tags a loose program (no ! in id) as source=local', () => {
    const fakeProgram = { parsed: false, bytes: new Uint8Array() } as unknown as NS4Program;
    const scanned: ScannedProgram[] = [
      { id: 'folder:Lead.ns4p', name: 'Lead', path: 'Lead.ns4p', program: fakeProgram, bytes: new Uint8Array([1]) },
    ];
    const entries = entriesFromScannedPrograms(scanned);
    expect(entries[0].source).toBe('local');
  });
});

describe('sortEntries', () => {
  const none = new Set<string>();
  const names = (es: LibraryEntry[]) => es.map((e) => e.name);

  it('default keeps input order', () => {
    expect(names(sortEntries(sample, 'default', none))).toEqual(['Wurli Dream', 'Sunday Organ', 'Deep Stab']);
  });

  it('name sorts alphabetically', () => {
    expect(names(sortEntries(sample, 'name', none))).toEqual(['Deep Stab', 'Sunday Organ', 'Wurli Dream']);
  });

  it('source groups by source then name (local before nord)', () => {
    expect(names(sortEntries(sample, 'source', none))).toEqual(['Sunday Organ', 'Deep Stab', 'Wurli Dream']);
  });

  it('favorites float to the top within the active sort', () => {
    const fav = new Set(['nord:B:03']); // Deep Stab
    expect(names(sortEntries(sample, 'name', fav))).toEqual(['Deep Stab', 'Sunday Organ', 'Wurli Dream']);
    // even under default order, the favorite leads
    expect(names(sortEntries(sample, 'default', fav))).toEqual(['Deep Stab', 'Wurli Dream', 'Sunday Organ']);
  });

  it('does not mutate the input array', () => {
    const copy = [...sample];
    sortEntries(sample, 'name', none);
    expect(sample).toEqual(copy);
  });
});

describe('filterEntries — LED filter keys', () => {
  const ns4 = (zones: Record<'piano' | 'organ', string>, split = true) =>
    zonedProgram([{ kind: 'piano', kbZones: zones.piano }, { kind: 'organ', kbZones: zones.organ }], split);
  const pianoOrgan: EngineSummary = { axis: 'engine', engines: [{ kind: 'piano', layers: ['A'] }, { kind: 'organ', layers: ['B'] }] };
  const synthOnly: EngineSummary = { axis: 'container', term: 'Panel', groups: [{ id: 'A', engines: ['synth'] }] };
  const entries: LibraryEntry[] = [
    { id: 'split', name: 'Split', source: 'local', engines: pianoOrgan, program: ns4({ piano: '0011', organ: '1100' }) },
    { id: 'layered', name: 'Layered', source: 'local', engines: pianoOrgan, program: ns4({ piano: '1111', organ: '1111' }) },
    // Zones set but the Split switch off: the Nord plays both across the keyboard.
    { id: 'switchOff', name: 'Switch off', source: 'local', engines: pianoOrgan, program: ns4({ piano: '0011', organ: '1100' }, false) },
    { id: 'synth', name: 'Synth', source: 'local', engines: synthOnly },
    { id: 'unread', name: 'Unread', source: 'nord' },
  ];
  const ids = (engines: string[], split = false) =>
    filterEntries(entries, 'all', '', 'all', 'all', { engines: new Set(engines as never[]), split }).map((e) => e.id);

  it('keeps programs that play every lit engine, on either axis', () => {
    expect(ids(['piano'])).toEqual(['split', 'layered', 'switchOff']);
    expect(ids(['piano', 'organ'])).toEqual(['split', 'layered', 'switchOff']);
    expect(ids(['synth'])).toEqual(['synth']);
    expect(ids(['piano', 'synth'])).toEqual([]);
  });

  it('Split keeps only programs that split the keyboard', () => {
    expect(ids([], true)).toEqual(['split']);
  });

  it('with no key lit, nothing is filtered (an unread slot included)', () => {
    expect(ids([])).toEqual(['split', 'layered', 'switchOff', 'synth', 'unread']);
  });
});

describe('rows in the program list', () => {
  const stage4 = new Uint8Array(readFileSync(fileURLToPath(new URL('../ns4/__fixtures__/BreakFree_chords.ns4p', import.meta.url))));
  it('builds a cloud entry like an unread slot, and a readable one once its file is here', () => {
    const items = [{ fingerprint: 'x1', kind: 'program' as const, filename: 'Bank 1/Break Free.ns4p', slot: 'A:11' }];
    const [bare] = cloudProgramEntries(items, new Map());
    expect(bare).toEqual({ id: 'cloud:x1', name: 'Break Free', source: 'cloud', fingerprint: 'x1', slot: 'A:11', typeLabel: '.ns4p' });
    const [read] = cloudProgramEntries(items, new Map([['x1', stage4]]));
    expect(read.bytes).toBe(stage4);
    expect(read.program?.name).toBe('Break Free');
    expect(read.engines).toBeDefined();
    expect(read.generation).toBe('Stage 4');
  });
  it('keeps a cloud entry whose file does not parse, without a program', () => {
    const [bad] = cloudProgramEntries([{ fingerprint: 'x1', kind: 'program' as const, filename: 'Broken.ns4p' }], new Map([['x1', new Uint8Array(8)]]));
    expect(bad).toMatchObject({ id: 'cloud:x1', name: 'Broken' });
    expect(bad.program).toBeUndefined();
  });
  it('filters by "found on": a row on two sources passes either filter', () => {
    const row = { id: 'folder:a', name: 'Pad', source: 'local' as const, sources: ['local' as const, 'cloud' as const] };
    expect(filterEntries([row], 'cloud', '')).toHaveLength(1);
    expect(filterEntries([row], 'local', '')).toHaveLength(1);
    expect(filterEntries([row], 'nord', '')).toHaveLength(0);
  });
  it('floats a row to the top when any of its members, or its fingerprint, is a favourite', () => {
    const a = { id: 'folder:a', name: 'A', source: 'local' as const };
    const row = { id: 'folder:b', name: 'B', source: 'local' as const, fingerprint: 'x1', members: [{ id: 'folder:b', source: 'local' as const, name: 'B' }, { id: 'cloud:x1', source: 'cloud' as const, name: 'B' }] };
    expect(sortEntries([a, row], 'default', new Set(['cloud:x1'])).map((e) => e.id)).toEqual(['folder:b', 'folder:a']);
    expect(sortEntries([a, row], 'default', new Set(['x1'])).map((e) => e.id)).toEqual(['folder:b', 'folder:a']);
  });
});
