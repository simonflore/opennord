/**
 * Stage Classic / EX reader tests: synthetic records built from the firmware
 * layout (OS 5.08 descriptors), placed in a `.nspg` file by the shared CBIN
 * framing rule — 0x18 behind a legacy header, 0x2C behind an NSM-era one. No
 * real file has been read, so these pin the framing, not a file's contents.
 */
import { describe, it, expect } from 'vitest';
import { decodeNs1, decodeNs1Record, NS1_RECORD_BYTES } from './decode';
import { ns1Decoded } from './present';
import { NS1_LAYOUT, type Ns1FieldKey } from './layout.generated';
import { synthLegacyLayoutFile, writeBits, writeLegacyRecord } from '../clavia/block-chain.synth';
import { parseClaviaFile } from '../formats';
import { decodedProgramFor } from '../presenters';
import { identifyNordFile } from '../clavia/nord-file';
import { decodeForModel, getModelProgress } from '../contribute/coverage';

type Values = Partial<Record<Ns1FieldKey, number>>;

/** One whole 400-byte record: the u8 version, then the data. */
function record(values: Values = {}, version = 10): Uint8Array {
  const rec = new Uint8Array(NS1_RECORD_BYTES);
  writeBits(rec, 0, 8, version);
  writeLegacyRecord(rec, NS1_LAYOUT, values, 1);
  return rec;
}

function nspg(values: Values = {}, opts: { version?: number; nsmHeader?: boolean } = {}): Uint8Array {
  return synthLegacyLayoutFile('nspg', NS1_LAYOUT, values, opts);
}

describe('Stage Classic / EX firmware layout', () => {
  it('is a 400-byte record: u8 version, then 399 bytes of common, panel A, panel B; 101 morphable parameters with 3 deltas each', () => {
    expect(NS1_LAYOUT).toMatchObject({ versionBytes: 1, dataBytes: 399, recordVersion: 10 });
    expect(NS1_RECORD_BYTES).toBe(400);
    const deltas = NS1_LAYOUT.fields.filter((f) => f.deltaOf);
    expect(deltas).toHaveLength(303);
    expect(new Set(deltas.map((f) => f.deltaOf)).size).toBe(101);
    expect(Math.min(...NS1_LAYOUT.fields.map((f) => f.bit))).toBe(0); // the data, after the version
    expect(Math.max(...NS1_LAYOUT.fields.map((f) => f.bit + f.width))).toBe(399 * 8);
    expect(NS1_LAYOUT.fields.find((f) => f.key === 'panelA.organPreset')!.bit).toBe(168);
  });

  it('stores each morph delta one bit wider than its parameter, two\'s complement, right before it', () => {
    const byKey = new Map(NS1_LAYOUT.fields.map((f) => [f.key, f]));
    for (const d of NS1_LAYOUT.fields.filter((f) => f.deltaOf)) {
      const base = byKey.get(d.deltaOf!)!;
      expect(d.width, d.key).toBe(base.width + 1);
      expect(d.enc, d.key).toBe('twos');
      expect(d.bit, d.key).toBeLessThan(base.bit);
    }
    const speed = NS1_LAYOUT.fields.filter((f) => f.deltaOf === 'common.leslieSpeed').map((f) => f.bit);
    expect(speed).toEqual([95, 103, 111]);
    expect(byKey.get('common.leslieSpeed')!.bit).toBe(119);
  });

  it('panels A and B are the same 166 descriptors', () => {
    const a = NS1_LAYOUT.fields.filter((f) => f.key.startsWith('panelA.'));
    const b = NS1_LAYOUT.fields.filter((f) => f.key.startsWith('panelB.'));
    expect(b.map((f) => f.key.slice(7))).toEqual(a.map((f) => f.key.slice(7)));
    expect(new Set(b.map((f) => f.bit)).size).toBe(b.length);
  });
});

describe('decodeNs1Record (synthetic)', () => {
  it('reads values and signed morph deltas', () => {
    const r = decodeNs1Record(record({
      'common.leslieSpeed': 100, 'common.leslieSpeed.morph1': -27, 'common.leslieSpeed.morph3': 27,
      'panelA.vTypeSub': 6, 'panelA.vTypeSub.morph2': -8, 'panelB.b3Fund': 3,
    }));
    expect(r.warnings).toEqual([]);
    expect(r.recordVersion).toBe(10);
    expect(r.values['common.leslieSpeed']).toBe(100);
    expect(r.morphDeltas['common.leslieSpeed']).toEqual([-27, 0, 27]);
    expect(r.morphDeltas['panelA.vTypeSub']).toEqual([0, -8, 0]);
    expect(r.values['panelB.b3Fund']).toBe(3);
  });

  it('warns on an older record version (converted by the instrument)', () => {
    expect(decodeNs1Record(record({}, 7)).warnings.join(' ')).toMatch(/version 7.*converts/);
  });
});

describe('decodeNs1 — the CBIN framing rule', () => {
  const values: Values = { 'common.leslieSpeed': 90, 'common.leslieSpeed.morph2': -5, 'panelB.synthLevel': 64 };

  it('reads the record at 0x18 behind a legacy header: a 426-byte file', () => {
    const file = nspg(values);
    expect(file).toHaveLength(426);
    const p = decodeNs1(file);
    expect(p).toMatchObject({ layoutMatched: true, recordVersion: 10, warnings: [] });
    expect(p.values['common.leslieSpeed']).toBe(90);
    expect(p.record!.morphDeltas['common.leslieSpeed']).toEqual([0, -5, 0]);
    expect(p.values['panelB.synthLevel']).toBe(64);
  });

  it('reads the record at 0x2C behind an NSM-era header: a 444-byte file', () => {
    const file = nspg(values, { nsmHeader: true });
    expect(file).toHaveLength(444);
    const p = decodeNs1(file);
    expect(p).toMatchObject({ layoutMatched: true, recordVersion: 10, warnings: [] });
    expect(p.values).toEqual(decodeNs1(nspg(values)).values);
  });

  it('still reads a file longer than the record, with a size note', () => {
    const long = new Uint8Array(446);
    long.set(nspg(values, { nsmHeader: true }));
    const p = decodeNs1(long);
    expect(p.layoutMatched).toBe(true);
    expect(p.values['common.leslieSpeed']).toBe(90);
    expect(p.warnings.join(' ')).toMatch(/446 bytes/);
  });

  it('opens a file too short for the record header-only', () => {
    const p = decodeNs1(nspg(values).slice(0, 300));
    expect(p).toMatchObject({ layoutMatched: false, record: null, values: {} });
    expect(p.warnings.join(' ')).toMatch(/too short/);
  });

  it('reads a converted older version with a warning, and refuses an unknown one', () => {
    const old = decodeNs1(nspg({}, { version: 7 }));
    expect(old.layoutMatched).toBe(true);
    expect(old.warnings.join(' ')).toMatch(/version 7.*converts it to version 10/);
    expect(decodeNs1(nspg({}, { version: 11 })).layoutMatched).toBe(false);
  });
});

describe('ns1Decoded and routing', () => {
  it('presents both panels', () => {
    const file = nspg({
      'common.organModel': 0, 'panelA.organPreset': 1, 'panelA.b3Sub46': 8, 'panelA.b3Fund48': 6,
      'panelA.b3PercussionMode58': 1, 'panelA.organLevel': 100,
    });
    const d = ns1Decoded(file);
    const organA = d.sections.find((s) => s.id === 'OA')!;
    expect(organA.engines[0].parts).toEqual(['B3', 'Preset 2', 'level 100']);
    expect(organA.drawbars!.map((b) => b.level).slice(0, 3)).toEqual([8, 6, 6]); // Sub3 keeps its default 6
    expect(organA.drawbars![0].footage).toBe('16′');
    expect(organA.chips).toContain('Percussion');
    expect(d.sections.map((s) => s.id)).toEqual(['OA', 'PA', 'SA', 'XA', 'OB', 'PB', 'SB', 'XB']);
    expect(d.note).toMatch(/not yet checked on a real file/);
    const farf = ns1Decoded(nspg({ 'common.organModel': 2 })).sections[0];
    expect(farf.engines[1]).toEqual({ label: 'Tabs', parts: expect.arrayContaining(['Bass 16′', '2⅔′']) });
  });

  it('shows the header only when the settings cannot be read', () => {
    const d = ns1Decoded(nspg().slice(0, 100));
    expect(d.sections).toEqual([]);
    expect(d.note).toMatch(/couldn't be read/);
  });

  it('routes nspg to the ns1 codec and presenter (Stage Classic, the tag\'s anchor model)', () => {
    const file = nspg();
    expect(identifyNordFile(file).modelId).toBe('stage-classic');
    const f = parseClaviaFile(file);
    expect(f.model).toBe('ns1');
    expect(f.program.parsed).toBe(true);
    expect(f.program.warnings).toEqual([]);
    expect(decodedProgramFor(file)?.title).toBe('Nord Stage Classic / EX · Program');
  });

  it('maps both models over the 399 data bytes as candidate, a full map', () => {
    for (const id of ['stage-classic', 'stage-ex']) {
      const d = decodeForModel(id);
      expect(d).toMatchObject({ status: 'partial', bodyBytes: 399, coveredBytes: 0, fullMap: true });
      expect(d.candidateBytes).toBeGreaterThan(300);
      expect(new Set(getModelProgress(id)!.regions!.map((r) => r.status)).has('confirmed')).toBe(false);
    }
  });
});
