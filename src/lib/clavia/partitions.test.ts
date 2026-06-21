import { describe, it, expect } from 'vitest';
import { MODELS, ALL_MODELS, modelById, modelByTag } from './partitions';

describe('partition registry', () => {
  it('resolves a model from its program tag (anchor for shared tags)', () => {
    expect(modelByTag('ne6p')?.id).toBe('electro-6');
    expect(modelByTag('ns2p')?.id).toBe('stage-2'); // anchor; Stage 2 EX also shares ns2p
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

  // CWave2::CWave2 @0x100033a7c — constructor Add() order (NSM-traced):
  //   SPartitionNative "Samp Lib (Native)"      → samplib-native (factory)
  //   SPartitionSampLibV3                       → samplib (user)
  //   (conditional SPartitionROMFlash "Transient" — OG-mode only, skipped on NW1-v3 hardware)
  //   SPartitionUserE2P "Program" (tag "nw2p")  → program
  //   SPartitionLive    (tag "nw2l")            → live
  //   SPartitionSettings "Settings" (tag "nw2s")→ settings  ← NOT synth-preset
  //   SPartitionNative "E2P FFS"                → ffs (native housekeeping)
  // Backup ext: "nw2b" (ctor: wxString::wxString(...,"nw2b")).
  // The prior baseline had synth-preset('nw2s') — wrong: nw2s is the settings tag,
  // and the synth-preset kind doesn't appear in the constructor at all.
  it('wave-2 partition spec matches NSM constructor (CWave2::CWave2 @0x100033a7c)', () => {
    const m = modelById('wave-2')!;
    expect(m.programTag).toBe('nw2p');
    const kinds = m.partitions.map((p) => p.kind);
    // Core order: samplib-native, samplib, program, live, settings, ffs
    expect(kinds).toEqual(['samplib-native', 'samplib', 'program', 'live', 'settings', 'ffs']);
    // Program partition carries nw2p fourcc
    const prog = m.partitions.find((p) => p.kind === 'program');
    expect(prog?.fourcc).toBe('nw2p');
    // Live partition carries nw2l fourcc
    const live = m.partitions.find((p) => p.kind === 'live');
    expect(live?.fourcc).toBe('nw2l');
    // Settings partition carries nw2s fourcc (NOT synth-preset)
    const settings = m.partitions.find((p) => p.kind === 'settings');
    expect(settings?.fourcc).toBe('nw2s');
    // No synth-preset partition
    expect(m.partitions.find((p) => p.kind === 'synth-preset')).toBeUndefined();
    // ffs is native (factory)
    const ffs = m.partitions.find((p) => p.kind === 'ffs');
    expect(ffs?.native).toBe(true);
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
    // Settings partition carries ne5s tag (SPartitionSettings "ne5s")
    const settings = m.partitions.find((p) => p.kind === 'settings');
    expect(settings?.fourcc).toBe('ne5s');
  });

  // Product-line order: Stage, Stage EX, Stage 2, Stage 2 EX, Stage 3, Stage 4.
  // Two distinct "EX" models: first-gen Nord Stage EX (nspg, sibling of Stage
  // Classic) and Nord Stage 2 EX (ns2p, extended-memory sibling of Stage 2).
  it('separates first-gen Stage EX (nspg) from Stage 2 EX (ns2p)', () => {
    // First-gen Stage EX: own tag, no user sample engine (like Stage Classic).
    const ex = modelById('stage-ex')!;
    expect(ex.name).toBe('Nord Stage EX');
    expect(ex.programTag).toBe('nspg');
    expect(ex.sampleCodec).toBeNull();
    expect(modelByTag('nspg')?.id).toBe('stage-ex');

    // Stage 2 EX: shares ns2p with Stage 2, same partition structure; stage-2 stays anchor.
    const ex2 = modelById('stage-2-ex')!;
    expect(ex2.name).toBe('Nord Stage 2 EX');
    expect(ex2.programTag).toBe('ns2p');
    expect(ex2.sampleCodec).toBe('og');
    expect(modelByTag('ns2p')?.id).toBe('stage-2'); // anchor unchanged
    expect(ex2.partitions.map((p) => p.kind))
      .toEqual(MODELS['stage-2'].partitions.map((p) => p.kind));
  });
});
