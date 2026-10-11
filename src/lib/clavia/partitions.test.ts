import { describe, it, expect } from 'vitest';
import {
  MODELS, ALL_MODELS, modelById, modelByTag, modelByProductId, identifyModelByProductId, programPartitionIndex,
  hasDeviceTransfer, type NordModelId,
} from './partitions';

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

  it('resolves a model from its USB product id (hardware-confirmed PIDs only)', () => {
    expect(modelByProductId(0x002e)?.id).toBe('stage-4'); // in code (negotiate.ts)
    expect(modelByProductId(0x0026)?.id).toBe('stage-3'); // Fred's probe, issues #38-40
    expect(modelByProductId(0x0021)?.id).toBe('stage-2'); // issue #31
    expect(modelByProductId(0x9999)).toBeUndefined();
  });

  it('reports the program partition index only when hardware-confirmed', () => {
    expect(programPartitionIndex(modelById('stage-4')!)).toBe(6);
    expect(programPartitionIndex(modelById('stage-2')!)).toBe(6);
    // Stage 3 layout is NOT hardware-confirmed yet — no index, so resolution must
    // fall back rather than assume the Stage-4 value. Unblocked by the probe's Types column.
    expect(programPartitionIndex(modelById('stage-3')!)).toBeUndefined();
  });

  // Hardware-validated via a live CQryPartList probe on a Nord Stage 2 (fw 3.00),
  // contributed in issue #31 (independent interop notes, not from any Nord source).
  // count = 10; Program partition index = 6 (same as NS4). Full map:
  //   0 Piano(Native) 1 Piano 2 Piano Pedal 3 Pedal(Native) 4 Samp Lib(Native)
  //   5 Samp Lib 6 Program 7 Synth 8 Live 9 Settings.
  // NS2 swaps indices 2/3 (user Piano Pedal ↔ native Pedal) relative to the NS4.
  it('Stage 2 carries the hardware-validated 10-partition map (issue #31)', () => {
    const m = modelById('stage-2')!;
    expect(m.partitions.map((p) => p.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(m.partitions.map((p) => p.kind)).toEqual([
      'piano-native', 'piano', 'pedal', 'pedal-native', 'samplib-native', 'samplib',
      'program', 'synth-preset', 'live', 'settings',
    ]);
    const prog = m.partitions.find((p) => p.kind === 'program')!;
    expect(prog.index).toBe(6);
    expect(prog.fourcc).toBe('ns2p');
    // index 3 is the native (factory) pedal; index 2 the user one — swapped vs NS4
    expect(m.partitions[2]).toMatchObject({ kind: 'pedal', native: false });
    expect(m.partitions[3]).toMatchObject({ kind: 'pedal-native', native: true });
  });

  // Stage 2 OS 3.00 firmware partition registration (FUN_3007046c): Synth = ns2s,
  // Settings = ns2y. The layout still varies by OS, so connect keeps probing.
  it('Stage 2 / 2 EX: Synth is ns2s and Settings is ns2y (firmware registration)', () => {
    for (const id of ['stage-2', 'stage-2-ex'] as const) {
      const m = modelById(id)!;
      expect(m.partitions.find((p) => p.kind === 'synth-preset'), id).toMatchObject({ fourcc: 'ns2s', index: 7 });
      expect(m.partitions.find((p) => p.kind === 'settings'), id).toMatchObject({ fourcc: 'ns2y', index: 9 });
      expect(m.layoutVariesByOs, id).toBe(true);
    }
  });

  // Stage 3 OS 2.64 firmware partition registration (FUN_c001ace0) — the order the
  // device reports in CQryPartList. NSM's CStage3 constructor adds Song before
  // Synth and an "E2P FFS" the device never reports; the firmware order wins.
  it('Stage 3 follows the firmware registration order: 12 partitions, static indices only', () => {
    const m = modelById('stage-3')!;
    expect(m.partitions.map((p) => [p.staticIndex, p.kind, p.fourcc ?? null])).toEqual([
      [0, 'piano-native', null],
      [1, 'piano', null],
      [2, 'pedal-native', null],
      [3, 'pedal', null],
      [4, 'samplib-native', null],
      [5, 'samplib', null],
      [6, 'swave', null],
      [7, 'program', 'ns3f'],
      [8, 'synth-preset', 'ns3y'],
      [9, 'setlist', 'ns3s'],
      [10, 'live', 'ns3l'],
      [11, 'settings', 'ns3t'],
    ]);
    // Static, not hardware-confirmed: nothing carries a protocol `index`.
    expect(m.partitions.every((p) => p.index === undefined)).toBe(true);
    // Factory partitions and SWave are read-only.
    expect(m.partitions.filter((p) => p.native).map((p) => p.staticIndex)).toEqual([0, 2, 4, 6]);
  });

  // Lead 4 OS 1.32 firmware registration (FUN_c000bf58): 0 Program [nl4s],
  // 1 Performance [nl4p], 2 Settings [nl4t]. NSM's CLead4Base constructor
  // adds Performance first; the firmware order wins. The Performance tag stays
  // the registry's programTag, so it carries the `program` kind.
  it('Lead 4 / Lead A1 follow the firmware order: Program (sound), Performance, Settings', () => {
    const cases = [
      ['lead-4', 'nl4s', 'nl4p', 'nl4t'],
      ['lead-a1', 'nlas', 'nlap', 'nlat'],
    ] as const;
    for (const [id, sound, perf, settings] of cases) {
      const m = modelById(id)!;
      expect(m.programTag, id).toBe(perf);
      expect(m.partitions.map((p) => [p.staticIndex, p.kind, p.label, p.fourcc]), id).toEqual([
        [0, 'synth-preset', 'Programs', sound],
        [1, 'program', 'Performances', perf],
        [2, 'settings', 'Settings', settings],
      ]);
      expect(m.fileTransferVersion, id).toBe(8);
    }
  });

  // Wave 2 OS 1.24 firmware registration (in FUN_c0161afc): 5 partitions, no
  // "E2P FFS" and no "Transient" (NSM's CWave2::CWave2 @0x100033a7c adds both).
  it('wave-2 follows the firmware order: no E2P FFS', () => {
    const m = modelById('wave-2')!;
    expect(m.programTag).toBe('nw2p');
    expect(m.partitions.map((p) => [p.staticIndex, p.kind, p.fourcc ?? null])).toEqual([
      [0, 'samplib-native', null],
      [1, 'samplib', null],
      [2, 'program', 'nw2p'],
      [3, 'live', 'nw2l'],
      [4, 'settings', 'nw2s'],
    ]);
    expect(m.partitions.find((p) => p.kind === 'synth-preset')).toBeUndefined();
  });

  it('Electro 6 follows the firmware order: Program at 4, ne6t is Settings, no pedals or set list', () => {
    const m = modelById('electro-6')!;
    expect(m.partitions.map((p) => [p.staticIndex, p.kind, p.fourcc ?? null])).toEqual([
      [0, 'piano-native', null],
      [1, 'piano', null],
      [2, 'samplib-native', null],
      [3, 'samplib', null],
      [4, 'program', 'ne6p'],
      [5, 'live', 'ne6l'],
      [6, 'settings', 'ne6t'],
    ]);
  });

  // Electro 7 OS 1.30 firmware registration (FUN_c0011420): 10 partitions;
  // `ne7s` is the synth-preset archive tag, not a partition.
  it('adds the Electro 7 with its 10 firmware partitions', () => {
    const m = modelById('electro-7')!;
    expect(m).toMatchObject({
      name: 'Nord Electro 7', programTag: 'ne7p', staticProductId: 0x3b, fileTransferVersion: 10,
      os: { min: 100, recommended: 100 },
    });
    expect(m.productId).toBeUndefined(); // NSM-recovered, not hardware-confirmed
    expect(m.partitions.map((p) => [p.staticIndex, p.kind, p.fourcc ?? null])).toEqual([
      [0, 'piano-native', null],
      [1, 'piano', null],
      [2, 'pedal-native', null],
      [3, 'pedal', null],
      [4, 'samplib-native', null],
      [5, 'samplib', null],
      [6, 'program', 'ne7p'],
      [7, 'live', 'ne7l'],
      [8, 'settings', 'ne7t'],
      [9, 'synth-preset', 'ne7r'],
    ]);
    expect(m.partitions.some((p) => p.fourcc === 'ne7s')).toBe(false);
    expect(modelByTag('ne7p')?.id).toBe('electro-7');
    expect(identifyModelByProductId(0x3b)?.id).toBe('electro-7');
    expect(modelByProductId(0x3b)).toBeUndefined();
  });

  it('Organ 3 registers only Program, Live, Settings (Program at 0)', () => {
    expect(modelById('organ-3')!.partitions.map((p) => [p.staticIndex, p.kind, p.fourcc])).toEqual([
      [0, 'program', 'no3p'],
      [1, 'live', 'no3l'],
      [2, 'settings', 'no3t'],
    ]);
  });

  // Piano 4 / 5 / 6, Grand, Grand 2: one 9-partition list on all five; the
  // `…t` file is Settings (np6t / ng2t were wrongly a Set List).
  it('the ARM pianos register the same 9 partitions, with Settings at 8', () => {
    const cases = [
      ['piano-4', 'np4p', 'np4l', 'np4t'],
      ['grand', 'ngp', 'ngl', 'ngs'],
      ['piano-5', 'np5p', 'np5l', 'np5t'],
      ['piano-6', 'np6p', 'np6l', 'np6t'],
      ['grand-2', 'ng2p', 'ng2l', 'ng2t'],
    ] as const;
    for (const [id, program, live, settings] of cases) {
      const m = modelById(id)!;
      expect(m.partitions.map((p) => [p.staticIndex, p.kind, p.fourcc ?? null]), id).toEqual([
        [0, 'piano-native', null],
        [1, 'piano', null],
        [2, 'pedal-native', null],
        [3, 'pedal', null],
        [4, 'samplib-native', null],
        [5, 'samplib', null],
        [6, 'program', program],
        [7, 'live', live],
        [8, 'settings', settings],
      ]);
      expect(m.fileTransferVersion, id).toBe(10);
    }
  });

  // ColdFire models (docs/FIRMWARE-LINE.md §3).
  it('the ColdFire models follow their firmware registration order', () => {
    const order = (id: NordModelId) => modelById(id)!.partitions.map((p) => [p.staticIndex, p.kind]);
    const e3 = [[0, 'piano-native'], [1, 'samplib-native'], [2, 'piano'], [3, 'samplib'],
      [4, 'program'], [5, 'live'], [6, 'settings'], [7, 'organ-preset']];
    expect(order('electro-3')).toEqual(e3);
    expect(order('electro-3-hp')).toEqual(e3);
    expect(order('electro-4')).toEqual(e3.slice(0, 7));
    expect(order('electro-5')).toEqual([[0, 'piano-native'], [1, 'piano'], [2, 'samplib-native'],
      [3, 'samplib'], [4, 'program'], [5, 'setlist'], [6, 'live'], [7, 'settings']]);
    expect(order('piano-1')).toEqual([[0, 'piano-native'], [1, 'pedal-native'], [2, 'piano'],
      [3, 'program'], [4, 'live'], [5, 'settings']]);
    const p23 = [[0, 'piano-native'], [1, 'piano'], [2, 'pedal'], [3, 'pedal-native'],
      [4, 'samplib-native'], [5, 'samplib'], [6, 'program'], [7, 'live'], [8, 'settings']];
    expect(order('piano-2')).toEqual(p23);
    expect(order('piano-3')).toEqual(p23);
    expect(order('c2d')).toEqual([[0, 'pipe-native'], [1, 'pipe'], [2, 'program'], [3, 'settings']]);
    expect(order('wave')).toEqual([[0, 'samplib'], [1, 'program'], [2, 'swave'], [3, 'ramfs'], [4, 'settings']]);
  });

  it('records each model\'s FileTransfer version from its firmware', () => {
    const versions: Partial<Record<NordModelId, number>> = {
      'stage-4': 10, 'stage-3': 10, 'stage-2': 8, 'stage-2-ex': 8,
      'electro-3': 4, 'electro-3-hp': 4, 'piano-1': 4, 'c2d': 4, 'wave': 4,
      'piano-2': 6, 'electro-4': 7, 'electro-5': 10, 'piano-3': 10,
      'electro-6': 10, 'electro-7': 10, 'organ-3': 10, 'wave-2': 10,
      'lead-4': 8, 'lead-a1': 8,
    };
    for (const [id, v] of Object.entries(versions)) {
      expect(modelById(id as NordModelId)!.fileTransferVersion, id).toBe(v);
    }
    // No OS image read, or no transfer at all: left unset.
    for (const id of ['stage-classic', 'stage-ex', 'c2', 'c1'] as const) {
      expect(modelById(id)!.fileTransferVersion, id).toBeUndefined();
    }
  });

  it('marks the C1 as having no USB file transfer', () => {
    const c1 = modelById('c1')!;
    expect(c1).toMatchObject({ name: 'Nord C1', deviceTransfer: false, programTag: null, partitions: [] });
    expect(hasDeviceTransfer(c1)).toBe(false);
    expect(ALL_MODELS.filter((m) => !hasDeviceTransfer(m)).map((m) => m.id)).toEqual(['c1']);
  });

  it('sample codecs follow what each firmware loads', () => {
    const codec = (id: NordModelId) => modelById(id)!.sampleCodec;
    // ColdFire: `.nsmp` NWS v8/v11 only — Electro 5 and Piano 3 refuse `.nsmp3`.
    for (const id of ['electro-3', 'electro-3-hp', 'electro-4', 'electro-5', 'piano-2', 'piano-3', 'wave'] as const) {
      expect(codec(id), id).toBe('og');
    }
    expect(codec('piano-1')).toBeNull(); // no sample library at all
    expect(codec('piano-4')).toBe('codec3'); // `.nsmp3` only
    expect(codec('grand')).toBe('codec3');
    // `.nsmp3` and `.nsmp4` accepted; the newest is recorded.
    for (const id of ['piano-5', 'piano-6', 'grand-2'] as const) expect(codec(id), id).toBe('codec4');
  });

  it('never marks a factory, ROM, SWave or RAMFS partition as user-writable', () => {
    const readOnly = new Set(['piano-native', 'pedal-native', 'samplib-native', 'swave', 'ramfs', 'pipe-native', 'pipe', 'ffs']);
    for (const m of ALL_MODELS) {
      for (const p of m.partitions) {
        if (readOnly.has(p.kind)) expect(p.native, `${m.id} ${p.kind}`).toBe(true);
      }
    }
  });

  it('only Stage 4 and Stage 2 carry hardware-confirmed indices; every firmware-read list is in order', () => {
    for (const m of ALL_MODELS) {
      const confirmed = m.partitions.filter((p) => p.index !== undefined);
      if (m.id === 'stage-4' || m.id === 'stage-2' || m.id === 'stage-2-ex') continue;
      expect(confirmed, m.id).toEqual([]);
      // A model with a FileTransfer version had its OS image read: its list is
      // the registration order, so staticIndex is the position.
      if (m.fileTransferVersion !== undefined) {
        expect(m.partitions.map((p) => p.staticIndex), m.id).toEqual(m.partitions.map((_, i) => i));
      }
    }
  });

  it('a fourcc means the same partition kind on every model (backup classification scans them all)', () => {
    const kindOf = new Map<string, string>();
    for (const m of ALL_MODELS) {
      for (const p of m.partitions) {
        if (!p.fourcc) continue;
        const seen = kindOf.get(p.fourcc);
        if (seen) expect(p.kind, `${m.id} ${p.fourcc}`).toBe(seen);
        else kindOf.set(p.fourcc, p.kind);
      }
    }
  });

  // No E2P FFS partition anywhere: the registry has no such kind (no firmware registers one).
  it('no firmware-read model registers a Set List except the Electro 5', () => {
    for (const m of ALL_MODELS) {
      if (m.fileTransferVersion === undefined) continue;
      const setlists = m.partitions.filter((p) => p.kind === 'setlist').map((p) => p.fourcc);
      if (m.id === 'electro-5') expect(setlists).toEqual(['ne5t']);
      else if (m.id === 'stage-3') expect(setlists).toEqual(['ns3s']); // Songs
      else expect(setlists, m.id).toEqual([]);
    }
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

  // NSM 9.22 `CProduct::New` @0x100043e20 switches on the PID (== Zevs::EInstrumentId).
  it('identifies models from NSM-recovered product ids without widening the HW-confirmed lookup', () => {
    expect(identifyModelByProductId(0x0029)?.id).toBe('electro-6');
    expect(identifyModelByProductId(0x0024)?.id).toBe('lead-4');
    expect(identifyModelByProductId(0x0003)?.id).toBe('stage-classic');
    expect(identifyModelByProductId(0x0021)?.id).toBe('stage-2'); // shared with Stage 2 EX → anchor
    expect(identifyModelByProductId(0x002e)?.id).toBe('stage-4'); // HW-confirmed wins
    expect(identifyModelByProductId(0x9999)).toBeUndefined();
    expect(identifyModelByProductId(undefined)).toBeUndefined();
    // Transfer behaviour must keep using only hardware-confirmed PIDs.
    expect(modelByProductId(0x0029)).toBeUndefined();
  });

  it('static product ids agree with confirmed ones and are unique apart from shared classes', () => {
    for (const m of ALL_MODELS) {
      if (m.productId !== undefined && m.staticProductId !== undefined) {
        expect(m.staticProductId, m.id).toBe(m.productId);
      }
    }
    const pids = ALL_MODELS.map((m) => m.productId ?? m.staticProductId).filter((p) => p !== undefined);
    const shared = pids.filter((p, i) => pids.indexOf(p) !== i);
    expect(shared).toEqual([0x0021]); // Stage 2 / Stage 2 EX — one CStage2 class
  });

  it('carries NSM OS-version gates in version×100 with min ≤ recommended', () => {
    expect(modelById('stage-4')!.os).toEqual({ min: 90, recommended: 100 });
    // Stage 2 recommended 3.00 — matches the fw 3.00 unit that validated issue #31.
    expect(modelById('stage-2')!.os?.recommended).toBe(300);
    for (const m of ALL_MODELS) {
      if (m.os) expect(m.os.min, m.id).toBeLessThanOrEqual(m.os.recommended);
    }
  });
});
