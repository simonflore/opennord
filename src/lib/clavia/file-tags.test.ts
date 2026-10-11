import { describe, it, expect } from 'vitest';
import { FILE_TAGS, fileTagInfo, fileTagLabel, type NordFileKind } from './file-tags';
import { ALL_MODELS, modelByTag, type PartitionKind } from './partitions';

/** The file kind a partition of each kind holds (the Leads swap program and synth-preset, see below). */
const FILE_KIND_OF: Partial<Record<PartitionKind, readonly NordFileKind[]>> = {
  program: ['program', 'performance'],
  'synth-preset': ['synth-preset', 'program'],
  live: ['live'],
  settings: ['settings'],
  setlist: ['setlist', 'song'],
  'organ-preset': ['organ-preset'],
  'piano-preset': ['piano-preset'],
  swave: ['synth-waves'],
  ramfs: ['ram-data'],
};

describe('file-tag table', () => {
  it('lists each tag once', () => {
    const tags = FILE_TAGS.map((t) => t.tag);
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('knows every partition tag the registry lists, for that model, with a matching kind', () => {
    for (const m of ALL_MODELS) {
      for (const p of m.partitions) {
        if (!p.fourcc) continue;
        const t = fileTagInfo(p.fourcc);
        expect(t, `${m.id} ${p.fourcc}`).toBeDefined();
        expect(t!.models, `${m.id} ${p.fourcc}`).toContain(m.id);
        expect(FILE_KIND_OF[p.kind], `${m.id} ${p.fourcc} ${p.kind}`).toContain(t!.kind);
      }
    }
  });

  it('names every program tag as a program (a performance on the Leads), anchored like modelByTag', () => {
    for (const m of ALL_MODELS) {
      if (!m.programTag) continue;
      const t = fileTagInfo(m.programTag)!;
      expect(['program', 'performance'], m.id).toContain(t.kind);
      expect(t.models, m.id).toContain(m.id);
      expect(t.models[0], m.id).toBe(modelByTag(m.programTag)!.id);
    }
  });

  it('points every Live tag at a program tag of the same models', () => {
    const lives = FILE_TAGS.filter((t) => t.kind === 'live');
    expect(lives.map((t) => t.tag)).toEqual(expect.arrayContaining(['ns2l', 'ns3l', 'ns4l', 'neli', 'npli', 'ncli', 'nc2l', 'np2l']));
    for (const t of lives) {
      const program = fileTagInfo(t.program)!;
      expect(program.kind, t.tag).toBe('program');
      expect(program.models, t.tag).toEqual(t.models);
    }
  });

  it('names NSM\'s kinds: Electro 7 ne7s is a Song, ne7r a synth preset; the Leads\' nl4s / nlas are programs', () => {
    expect(fileTagInfo('ne7s')).toMatchObject({ kind: 'song', models: ['electro-7'] });
    expect(fileTagInfo('ne7r')).toMatchObject({ kind: 'synth-preset' });
    expect(fileTagInfo('nl4s')).toMatchObject({ kind: 'program' });
    expect(fileTagInfo('nl4p')).toMatchObject({ kind: 'performance' });
    expect(fileTagInfo('nlas')).toMatchObject({ kind: 'program', models: ['lead-a1'] });
    expect(fileTagInfo('ns3f')).toMatchObject({ kind: 'program' });
    expect(fileTagInfo('ne5t')).toMatchObject({ kind: 'setlist' });
    expect(fileTagInfo('ns4g')).toMatchObject({ kind: 'unknown', models: ['stage-4'] }); // NSM names no kind
  });

  it('marks bundles and backups as ZIP files, with musician-facing labels', () => {
    expect(fileTagInfo('ns2synthpb')).toMatchObject({ kind: 'bundle', container: 'zip' });
    expect(fileTagLabel(fileTagInfo('ns2synthpb'))).toBe('Synth bundle');
    expect(fileTagLabel(fileTagInfo('ne4pb'))).toBe('Program bundle');
    expect(fileTagInfo('ns2exb')).toMatchObject({ kind: 'backup', container: 'zip', models: ['stage-2-ex'] });
    expect(fileTagInfo('.NE4DB')).toMatchObject({ kind: 'backup', models: ['electro-4'] }); // case and dot ignored
    for (const t of FILE_TAGS) expect(t.container, t.tag).toBe(t.kind === 'bundle' || t.kind === 'backup' ? 'zip' : 'cbin');
    expect(fileTagLabel(undefined)).toBe('Nord file');
  });
});
