import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import type { FwLayout } from '../clavia/block-chain';
import { CBIN_BODY_OFFSET } from '../clavia/cbin';
import { writeField } from './bits';
import { buildParamMap, buildPortParamMap } from './maps';
import { decodeAllParams } from './coverage';
import { collapseMorphs } from './params-view';
import { buildFirmwareParams, ns4FirmwareFixes, ns4FirmwareParams, NS4_FIRMWARE_SETTINGS } from './firmware-params';
import { NS4_LAYOUT } from './layout.generated';
import { NS4_OFFSET_MAP } from './offset-map.generated';

const fixture = (name: string) => new Uint8Array(readFileSync(join(__dirname, '__fixtures__', `${name}.ns4p`)));
const reader = (bytes: Uint8Array) => {
  const decoded = decodeAllParams(bytes, buildParamMap());
  return (param: string, group?: string) =>
    decoded.find((d) => d.name === param && (!group || d.group === group))?.display;
};
const portLayers = (id: string) => NS4_OFFSET_MAP.find((p) => p.id === id)!.layers;

describe('ns4FirmwareFixes (delay tempo morphs)', () => {
  const ROWS = [['204-3', '206-1', '207-1', '208-1'], ['296-3', '298-1', '299-1', '300-1'], ['734-3', '736-1', '737-1', '738-1']];

  it('reads three 15-bit deltas right after the 14-bit tempo', () => {
    const fixes = ns4FirmwareFixes();
    for (const [tempo, wheel, at, pedal] of ROWS) {
      portLayers(tempo).forEach((t, k) => {
        [wheel, at, pedal].forEach((id, n) => {
          expect(fixes[id].layers[k]).toEqual({ begBit: t.begBit + 14 + 15 * n, endBit: t.begBit + 28 + 15 * n });
          expect(fixes[id].morphOf).toMatchObject({ baseId: tempo, span: 16383, shift: 7 });
          expect(fixes[id].morphOf!.base[k]).toEqual({ begBit: t.begBit, endBit: t.begBit + 13 });
        });
      });
    }
  });

  it('reads "none" where no such morph is set (the port read "20 ms" on every program)', () => {
    const v = reader(fixture('BreakFreeSolo'));
    for (const name of ['organ FX delay tempo', 'FX delay tempo']) {
      for (const layer of name.startsWith('organ') ? [''] : [' [A]', ' [B]']) {
        expect(v(`${name} with A.T.${layer}`)).toBe('none');
        expect(v(`${name} with ctrlped${layer}`)).toBe('none');
      }
    }
  });

  it('reads the morphs the regression program sets on its synth layers', () => {
    const v = reader(fixture('regressionTest'));
    expect(v('FX delay tempo with wheel [A]', 'p')).toBe('577 ms (104 bpm)');
    expect(v('FX delay tempo with wheel [C]', 'y')).toBe('94 ms (160 x4 bpm)');
    expect(v('FX delay tempo with A.T. [B]', 'y')).toBe('170 ms (88 x4 bpm)');
    expect(v('FX delay tempo with ctrlped [B]', 'y')).toBe('462 ms (130 bpm)');
    expect(v('FX delay tempo with A.T. [C]', 'y')).toBe('none');
  });

  it('shows a morph smaller than one tempo step instead of "none"', () => {
    const bytes = fixture('BreakFreeSolo');
    const { begBit, endBit } = ns4FirmwareFixes()['207-1'].layers[0];
    writeField(bytes, begBit, endBit, 16383 + 5);
    const v = reader(bytes);
    expect(v('organ FX delay tempo with A.T.')).toBe(v('organ FX delay tempo'));
  });
});

describe('ns4FirmwareParams', () => {
  it('claims no bit the ported map already reads', () => {
    const claimed = new Set<number>();
    for (const p of NS4_OFFSET_MAP) for (const l of p.layers) for (let b = l.begBit; b <= l.endBit; b++) claimed.add(b);
    for (const p of ns4FirmwareParams()) {
      for (const l of p.layers) {
        if (l.begBit < 0) continue;
        for (let b = l.begBit; b <= l.endBit; b++) expect(claimed.has(b), p.name).toBe(false);
      }
    }
  });

  it('names the settings a player has, with values in their units', () => {
    const shown = ns4FirmwareParams().filter((p) => !p.internal).map((p) => `${p.group}:${p.name}`);
    expect(shown).toEqual(expect.arrayContaining([
      'm:master clock tempo', 'm:aux keyboard', 'm:pedal layer scene', 'm:synth multi-layer LFO',
      'y:extern CC number 1', 'y:extern mod wheel',
    ]));
    const v = reader(fixture('regressionTest'));
    expect(v('master clock tempo')).toBe('120 bpm');
    expect(v('extern mod wheel [A]')).toBe('on');
  });

  it("shows the instrument’s own value labels", () => {
    const v = reader(fixture('regressionTest'));
    expect(v('master clock keyboard sync')).toBe('Off');
    expect(v('organ output (per-program routing)')).toBe('Main');
    expect(v('organ rotary type')).toBe('Close');
    expect(v('synth aux keyboard layers')).toBe('---');
    // Each value of a labelled parameter has a label.
    const bytes = fixture('regressionTest');
    const curve = ns4FirmwareParams().find((p) => p.name === 'aux keyboard curve')!;
    expect([0, 1, 2].map((raw) => {
      writeField(bytes, curve.layers[0].begBit, curve.layers[0].endBit, raw);
      return reader(bytes)('aux keyboard curve');
    })).toEqual(['Soft', 'Medium', 'Hard']);
    const layers = ns4FirmwareParams().find((p) => p.name === 'synth aux keyboard layers')!;
    writeField(bytes, layers.layers[0].begBit, layers.layers[0].endBit, 7);
    expect(reader(bytes)('synth aux keyboard layers')).toBe('ABC');
  });

  it('reads the output buses, the shared output and the Extern pages', () => {
    const v = reader(fixture('regressionTest'));
    expect(v('rotary output (per-program routing)')).toBe('Auto');
    expect(v('piano B output (per-program routing)')).toBe('Main');
    expect(v('extern keyboard velocity [A]')).toBe('Medium');
    expect(v('extern program change MSB [A]')).toBe('--');
    const bytes = fixture('regressionTest');
    const set = (name: string, raw: number) => {
      const { begBit, endBit } = ns4FirmwareParams().find((p) => p.name === name)!.layers[0];
      writeField(bytes, begBit, endBit, raw);
    };
    set('piano B output (per-program routing)', 2);
    set('synth B output (per-program routing)', 4);
    set('synth C output (per-program routing)', 4);
    set('rotary output (per-program routing)', 4);
    set('extern program change MSB', 1);
    set('extern program change LSB', 128);
    const w = reader(bytes);
    expect(w('piano B output (per-program routing)')).toBe('Sub II');
    // The arrow value: the output of the entry before it in the firmware's routing order.
    expect(w('synth B output (per-program routing)')).toBe('same as synth A');
    expect(w('synth C output (per-program routing)')).toBe('same as synth B');
    expect(w('rotary output (per-program routing)')).toBe('same as organ');
    expect(w('extern program change MSB [A]')).toBe('0');
    expect(w('extern program change LSB [A]')).toBe('127');
    expect(ns4FirmwareParams().find((p) => p.name === 'extern CC number 1')!.layers).toHaveLength(3);
  });

  it('keeps links and editor state out of the product rows, and in the decode', () => {
    const decoded = decodeAllParams(fixture('regressionTest'), buildParamMap());
    const hash = decoded.find((d) => d.name === 'organ preset name hash');
    expect(hash).toMatchObject({ internal: true, display: 'none' });
    const rows = collapseMorphs(decoded).map((r) => r.name);
    expect(rows).toContain('master clock tempo');
    const internal = ns4FirmwareParams().filter((p) => p.internal).map((p) => p.name);
    expect(internal).toEqual(expect.arrayContaining(['organ preset name hash', 'fx section focus', 'organ rotary rotor angle', 'lib name']));
    expect(rows.filter((n) => internal.some((i) => n === i || n.startsWith(`${i} [`)))).toEqual([]);
  });

  it('leaves a parameter out of a file older than the version that introduced it', () => {
    const at = (version: number) => {
      const bytes = fixture('regressionTest');
      writeField(bytes, CBIN_BODY_OFFSET * 8, CBIN_BODY_OFFSET * 8 + 31, version);
      return reader(bytes);
    };
    expect(at(313)('aux keyboard')).toBe('off');
    expect(at(309)('aux keyboard')).toBeUndefined();
    expect(at(309)('organ aux keyboard layers')).toBeUndefined();
    expect(at(309)('pedal layer scene')).toBe('off');
    expect(at(308)('pedal layer scene')).toBeUndefined();
    expect(at(307)('master clock tempo')).toBe('120 bpm');
  });

  it('has a layout field, outside the port, for every entry of the settings table', () => {
    // A key that matches nothing would silently leave its setting internal and unlabelled.
    const shown = ns4FirmwareParams().filter((p) => !p.internal);
    for (const key of Object.keys(NS4_FIRMWARE_SETTINGS)) {
      const matches = NS4_LAYOUT.fields.filter((f) => {
        const [block, k, morph] = f.key.split('.');
        return !morph && (key === `${block}.${k}` || key === k);
      });
      expect(matches.length, key).toBeGreaterThan(0);
    }
    expect(shown).toHaveLength(Object.keys(NS4_FIRMWARE_SETTINGS).length);
  });

  it('keeps two same-named parameters of one layer apart', () => {
    const field = (key: string, block: number) =>
      ({ key, name: `Edt_${key}`, block, bit: 0, width: 2, min: 0, max: 3, def: 0, enc: 'u', confidence: 'high', src: 'test' }) as const;
    const layout: FwLayout = {
      model: 'test', source: 'test', container: 'test', versionRange: null, bodyBytes: 8,
      blocks: [{ key: 'synthA', name: 'Synth A', offset: 4, length: 1 }, { key: 'synthASound', name: 'Synth A Sound', offset: 6, length: 1 }],
      fields: [field('synthA.mode', 0), field('synthASound.mode', 1)],
    };
    const params = buildFirmwareParams(layout, []);
    expect(params.map((p) => p.name)).toEqual(['mode', 'mode (sound)']);
    expect(params.map((p) => p.layers[0].begBit)).toEqual([(CBIN_BODY_OFFSET + 5) * 8, (CBIN_BODY_OFFSET + 7) * 8]);
  });
});

describe('the shared map', () => {
  it('is frozen, so a caller cannot change it for every reader', () => {
    const map = buildParamMap();
    expect(() => map.push(map[0])).toThrow();
    expect(() => { map[0].layers[0].begBit = 0; }).toThrow();
    expect(() => { buildPortParamMap()[0].name = 'x'; }).toThrow();
    // The generated constants it is built from stay as they were.
    expect(Object.isFrozen(NS4_OFFSET_MAP[0])).toBe(false);
    expect(Object.isFrozen(NS4_OFFSET_MAP[0].layers)).toBe(false);
  });
});
