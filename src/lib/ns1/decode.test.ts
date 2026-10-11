/**
 * Stage Classic / EX reader tests: synthetic 400-byte records built from the
 * firmware layout (OS 5.08 descriptors). Files open header-only — the record's
 * start in a `.nspg` file is not confirmed — so record reads pass a start explicitly.
 */
import { describe, it, expect } from 'vitest';
import { decodeNs1, decodeNs1Record, NS1_RECORD_START } from './decode';
import { ns1Decoded } from './present';
import { NS1_LAYOUT, type Ns1FieldKey } from './layout.generated';
import { synthLegacyFile, writeBits, writeLegacyRecord } from '../clavia/block-chain.synth';
import { parseClaviaFile } from '../formats';
import { decodedProgramFor } from '../presenters';
import { identifyNordFile } from '../clavia/nord-file';
import { decodeForModel, getModelProgress } from '../contribute/coverage';

function record(values: Partial<Record<Ns1FieldKey, number>> = {}, version = 10): Uint8Array {
  const data = new Uint8Array(NS1_LAYOUT.dataBytes);
  writeBits(data, 0, 8, version);
  writeLegacyRecord(data, NS1_LAYOUT, values);
  return data;
}

/** A `.nspg`-tagged file with the record placed at 0x18 — a test placement, not a claim about real files. */
function nspg(values: Partial<Record<Ns1FieldKey, number>> = {}): Uint8Array {
  const rec = record(values);
  const file = synthLegacyFile('nspg', 10, new Uint8Array(rec.length - 2));
  const out = new Uint8Array(0x18 + rec.length + 2);
  out.set(file.subarray(0, 0x18));
  out.set(rec, 0x18);
  return out;
}

describe('Stage Classic / EX firmware layout', () => {
  it('is a 400-byte record: u8 version, common, panel A, panel B; 101 morphable parameters with 3 deltas each', () => {
    expect(NS1_LAYOUT).toMatchObject({ dataBytes: 400, recordVersion: 10 });
    const deltas = NS1_LAYOUT.fields.filter((f) => f.deltaOf);
    expect(deltas).toHaveLength(303);
    expect(new Set(deltas.map((f) => f.deltaOf)).size).toBe(101);
    expect(Math.min(...NS1_LAYOUT.fields.map((f) => f.bit))).toBe(8); // bit 0–7 is the version
    expect(NS1_LAYOUT.fields.find((f) => f.key === 'panelA.organPreset')!.bit).toBe(176);
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
    expect(speed).toEqual([103, 111, 119]);
    expect(byKey.get('common.leslieSpeed')!.bit).toBe(127);
  });

  it('panels A and B are the same 166 descriptors', () => {
    const a = NS1_LAYOUT.fields.filter((f) => f.key.startsWith('panelA.'));
    const b = NS1_LAYOUT.fields.filter((f) => f.key.startsWith('panelB.'));
    expect(b.map((f) => f.key.slice(7))).toEqual(a.map((f) => f.key.slice(7)));
    expect(new Set(b.map((f) => f.bit - a[0].bit + 0)).size).toBe(b.length);
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

describe('decodeNs1 / ns1Decoded', () => {
  it('opens a file header-only with a warning: the record start is not confirmed', () => {
    expect(NS1_RECORD_START).toBeNull();
    const p = decodeNs1(nspg());
    expect(p).toMatchObject({ layoutMatched: false, record: null, values: {}, recordVersion: null });
    expect(p.warnings.join(' ')).toMatch(/not confirmed/);
    const d = ns1Decoded(nspg());
    expect(d.sections).toEqual([]);
    expect(d.note).toMatch(/position in the file still has to be confirmed/);
  });

  it('reads the record at an explicit start and presents both panels', () => {
    const file = nspg({
      'common.organModel': 0, 'panelA.organPreset': 1, 'panelA.b3Sub46': 8, 'panelA.b3Fund48': 6,
      'panelA.b3PercussionMode58': 1, 'panelA.organLevel': 100,
    });
    const p = decodeNs1(file, 0x18);
    expect(p.layoutMatched).toBe(true);
    expect(p.record!.recordVersion).toBe(10);
    const d = ns1Decoded(file, 0x18);
    const organA = d.sections.find((s) => s.id === 'OA')!;
    expect(organA.engines[0].parts).toEqual(['B3', 'Preset 2', 'level 100']);
    expect(organA.drawbars!.map((b) => b.level).slice(0, 3)).toEqual([8, 6, 6]); // Sub3 keeps its default 6
    expect(organA.drawbars![0].footage).toBe('16′');
    expect(organA.chips).toContain('Percussion');
    expect(d.sections.map((s) => s.id)).toEqual(['OA', 'PA', 'SA', 'XA', 'OB', 'PB', 'SB', 'XB']);
    const farf = ns1Decoded(nspg({ 'common.organModel': 2 }), 0x18).sections[0];
    expect(farf.engines[1]).toEqual({ label: 'Tabs', parts: expect.arrayContaining(['Bass 16′', '2⅔′']) });
  });

  it('routes nspg to the ns1 codec and presenter (Stage Classic, the tag\'s anchor model)', () => {
    const file = nspg();
    expect(identifyNordFile(file).modelId).toBe('stage-classic');
    const f = parseClaviaFile(file);
    expect(f.model).toBe('ns1');
    expect(f.program.warnings.length).toBeGreaterThan(0);
    expect(decodedProgramFor(file)?.title).toBe('Nord Stage Classic / EX · Program');
  });

  it('maps both models over the 400-byte record as candidate, not a full map', () => {
    for (const id of ['stage-classic', 'stage-ex']) {
      const d = decodeForModel(id);
      expect(d).toMatchObject({ status: 'partial', bodyBytes: 400, coveredBytes: 0, fullMap: false });
      expect(d.candidateBytes).toBeGreaterThan(300);
      expect(new Set(getModelProgress(id)!.regions!.map((r) => r.status)).has('confirmed')).toBe(false);
    }
  });
});
