import { describe, it, expect } from 'vitest';
import { MODELS, ALL_MODELS, modelById, modelByTag } from './partitions';

describe('partition registry', () => {
  it('resolves a model from its program tag (anchor for shared tags)', () => {
    expect(modelByTag('ne6p')?.id).toBe('electro-6');
    expect(modelByTag('ns2p')?.id).toBe('stage-2'); // anchor; Stage EX shares the tag
    expect(modelByTag('zzzz')).toBeUndefined();
    expect(modelByTag(undefined)).toBeUndefined();
  });

  it('has unique model ids and resolves them', () => {
    const ids = ALL_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(modelById('stage-4')?.name).toBe('Nord Stage 4');
    expect(modelById('stage-3')?.programTag).toBe('ns3f'); // ns3f, not ns3p
    expect(modelById('nope' as never)).toBeUndefined();
  });

  it('every model has at most one program partition and unique fourccs', () => {
    for (const m of ALL_MODELS) {
      const programs = m.partitions.filter((p) => p.kind === 'program');
      expect(programs.length, m.id).toBeLessThanOrEqual(1);
      const fourccs = m.partitions.map((p) => p.fourcc).filter(Boolean);
      expect(new Set(fourccs).size, m.id).toBe(fourccs.length);
    }
  });

  it('Stage 4 carries hardware-validated partition indices', () => {
    const prog = modelById('stage-4')!.partitions.find((p) => p.kind === 'program')!;
    expect(prog.index).toBe(6); // PROTOCOL-RE.md
    expect(prog.fourcc).toBe('ns4p');
  });

  it('exposes MODELS keyed by id', () => {
    expect(MODELS['stage-2'].generation).toBe('OG');
  });

  // CLead4Base::CLead4Base @0x00000001000dd364 — constructor adds partitions in this order:
  //   SPartitionUserE2P  "Performance" (CFileSpec from nl4p CFileType) → program
  //   SPartitionProgram  (CFileSpec from nl4s CFileType)               → synth-preset
  //   SPartitionSettings "Settings"   (CFileSpec from nl4t CFileType)  → settings
  // NO piano, NO samples, NO live partition. baseline('nl4p', false) was wrong:
  // baseline adds live (not traced) and misses synth-preset ('nl4s') + settings fourcc 'nl4t'.
  it('lead-4 partition spec matches NSM constructor (CLead4Base::CLead4Base @0x00000001000dd364)', () => {
    const m = modelById('lead-4')!;
    expect(m.programTag).toBe('nl4p');
    const kinds = m.partitions.map((p) => p.kind);
    expect(kinds).toEqual(['program', 'synth-preset', 'settings']);
    // Program partition carries nl4p fourcc
    const prog = m.partitions.find((p) => p.kind === 'program');
    expect(prog?.fourcc).toBe('nl4p');
    // Synth-preset partition carries nl4s fourcc
    const preset = m.partitions.find((p) => p.kind === 'synth-preset');
    expect(preset?.fourcc).toBe('nl4s');
    // Settings partition carries nl4t fourcc
    const settings = m.partitions.find((p) => p.kind === 'settings');
    expect(settings?.fourcc).toBe('nl4t');
  });

  // CElectro5::CElectro5 @0x0000000100194838 — constructor adds partitions in this order:
  //   Piano (Native) [SPartitionNative], Piano (user) [SPartitionPianoV5/V6],
  //   Samp Lib (Native) [SPartitionNative], Samp Lib (user) [SPartitionSampLibV2],
  //   Programs [SPartitionProgram, tag="ne5p"],
  //   Set List [SPartitionUserE2P, tag="ne5t"],
  //   Live [SPartitionLive, tag="ne5l"],
  //   Settings [SPartitionSettings, tag="ne5s"].
  // The generic baseline('ne5p', true) was missing piano partitions, user samp lib,
  // and set-list — this spec replaces it with the oracle-traced layout.
  it('electro-5 partition spec matches NSM constructor (CElectro5::CElectro5 @0x0000000100194838)', () => {
    const m = modelById('electro-5')!;
    expect(m.programTag).toBe('ne5p');
    const kinds = m.partitions.map((p) => p.kind);
    expect(kinds).toEqual([
      'piano-native',
      'piano',
      'samplib-native',
      'samplib',
      'program',
      'setlist',
      'live',
      'settings',
    ]);
    // Program partition must carry the correct fourcc
    const prog = m.partitions.find((p) => p.kind === 'program');
    expect(prog?.fourcc).toBe('ne5p');
    // Set-list partition carries ne5t tag
    const setlist = m.partitions.find((p) => p.kind === 'setlist');
    expect(setlist?.fourcc).toBe('ne5t');
    // Live partition carries ne5l tag
    const live = m.partitions.find((p) => p.kind === 'live');
    expect(live?.fourcc).toBe('ne5l');
  });
});
