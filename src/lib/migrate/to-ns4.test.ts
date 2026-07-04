import { describe, expect, it } from 'vitest';
import { emitNs4, EMITTER_PARAMS } from './to-ns4';
import { buildParamMap } from '../ns4/maps';
import { findParam, editNs4Program, getRawParam } from '../ns4/writer';
import { buildMigrationTemplate } from './template';
import { naiveAdvisor } from './advisor';
import type { CommonProgram } from './common';

const map = buildParamMap();

it('every param the emitter touches exists in the ns4 map', () => {
  for (const [group, name] of EMITTER_PARAMS) {
    expect(findParam(map, group, name), `${group}:${name}`).toBeDefined();
  }
});

describe('emitNs4 organ', () => {
  const common: CommonProgram = {
    sourceModel: 'ns3',
    organ: {
      on: true,
      type: 'B3',
      drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0],
      percussion: { on: true, third: false, fast: true, soft: false },
      volumeMidi: 127,
      octaveShift: 1,
    },
  };

  it('round-trips through the template bytes', async () => {
    const { edits, report } = await emitNs4(common, [], { advisor: naiveAdvisor, sounds: [] });
    const bytes = editNs4Program(buildMigrationTemplate(), edits);
    expect(getRawParam(bytes, 'o', 'layer on/off', 0)).toBe(1);
    expect(getRawParam(bytes, 'o', 'drawbar 1', 0)).toBe(8);
    expect(getRawParam(bytes, 'o', 'drawbar 4', 0)).toBe(0);
    expect(getRawParam(bytes, 'o', 'percussion on/off', 0)).toBe(1);
    expect(getRawParam(bytes, 'o', 'perc decay fast on/off', 0)).toBe(1);
    expect(getRawParam(bytes, 'o', 'perc harm 3rd on/off', 0)).toBe(0);
    expect(getRawParam(bytes, 'o', 'volume', 0)).toBe(127);
    // octave shift +1 → raw 1 (OctaveShift table {1:"+1"})
    expect(getRawParam(bytes, 'o', 'octave shift', 0)).toBe(1);
    expect(report.notes.some((n) => n.field === 'Organ drawbars' && n.status === 'mapped')).toBe(true);
  });

  it('maps the organ model (B3) when a matching label exists', async () => {
    const { edits } = await emitNs4(common, [], { advisor: naiveAdvisor, sounds: [] });
    const e = edits.find((e) => e.group === 'o' && e.name === 'organ model');
    expect(e?.value).toBe(0); // interpret table: raw 0 => "B3"
  });

  it('maps second manual drawbars onto organ layer B and turns layer B on', async () => {
    const twoManual: CommonProgram = {
      sourceModel: 'ns2',
      organ: {
        on: true,
        type: 'B3',
        drawbars: [8, 0, 0, 0, 0, 0, 0, 0, 0],
        drawbars2: [0, 0, 0, 0, 0, 0, 0, 0, 8],
      },
    };
    const { edits } = await emitNs4(twoManual, [], { advisor: naiveAdvisor, sounds: [] });
    expect(edits.some((e) => e.group === 'o' && e.name === 'layer on/off' && e.layer === 1 && e.value === 1)).toBe(true);
    expect(edits.some((e) => e.group === 'o' && e.name === 'drawbar 9' && e.layer === 1 && e.value === 8)).toBe(true);
  });

  it('clamps octave shift beyond +/-2 and adds an approximated note', async () => {
    const shifted: CommonProgram = {
      sourceModel: 'ns2',
      organ: { on: true, type: 'B3', drawbars: [0, 0, 0, 0, 0, 0, 0, 0, 0], octaveShift: 4 },
    };
    const { edits, report } = await emitNs4(shifted, [], { advisor: naiveAdvisor, sounds: [] });
    const e = edits.find((e) => e.group === 'o' && e.name === 'octave shift');
    expect(e?.value).toBe(2); // clamped to +2
    expect(report.notes.some((n) => n.field === 'Organ octave shift' && n.status === 'approximated')).toBe(true);
  });
});

describe('emitNs4 sound matching', () => {
  const common: CommonProgram = {
    sourceModel: 'ns3',
    piano: { on: true, soundName: 'Royal Grand 3D XL', typeName: 'Grand', volumeMidi: 100 },
  };

  it('sets the matched piano id from available sounds', async () => {
    const { edits } = await emitNs4(common, [], {
      advisor: naiveAdvisor,
      sounds: [{ id: 4242, name: 'Royal Grand 3D Sml', kind: 'piano' }],
    });
    const e = edits.find((e) => e.group === 'p' && e.name === 'piano model ID/name');
    expect(e?.value).toBe(4242);
  });

  it('maps the piano type enum', async () => {
    const { edits } = await emitNs4(common, [], {
      advisor: naiveAdvisor,
      sounds: [{ id: 4242, name: 'Royal Grand 3D Sml', kind: 'piano' }],
    });
    const e = edits.find((e) => e.group === 'p' && e.name === 'piano type');
    expect(e?.value).toBe(0); // Grand
  });

  it('flags re-pick when nothing matches', async () => {
    const { edits, report } = await emitNs4(common, [], { advisor: naiveAdvisor, sounds: [] });
    expect(edits.some((e) => e.name === 'piano model ID/name')).toBe(false);
    const n = report.notes.find((n) => n.field === 'Piano sound');
    expect(n?.status).toBe('defaulted');
    expect(n?.note).toContain('Royal Grand 3D XL');
  });
});

describe('emitNs4 synth', () => {
  const common: CommonProgram = {
    sourceModel: 'ns3',
    synth: {
      on: true,
      mode: 'sample',
      sampleName: 'Mellotron Choir',
      filter: { type: 'LP24', resonanceMidi: 64 },
      cutoffHz: 1000,
      volumeMidi: 127,
      ampEnv: { attackMs: 50, decayMs: 200, releaseMs: 300 },
    },
  };

  it('turns the synth layer on and sets samples mode', async () => {
    const { edits } = await emitNs4(common, [], {
      advisor: naiveAdvisor,
      sounds: [{ id: 777, name: 'Mellotron Choir', kind: 'sample' }],
    });
    expect(edits.some((e) => e.group === 'y' && e.name === 'layer on/off' && e.value === 1)).toBe(true);
    const mode = edits.find((e) => e.group === 'y' && e.name === 'samples/analog');
    expect(mode?.value).toBe(0); // "samples"
    const s = edits.find((e) => e.group === 'y' && e.name === 'sample ID/name');
    expect(s?.value).toBe(777);
  });

  it('maps the filter type and a nearest cutoff', async () => {
    const { edits } = await emitNs4(common, [], {
      advisor: naiveAdvisor,
      sounds: [{ id: 777, name: 'Mellotron Choir', kind: 'sample' }],
    });
    const ft = edits.find((e) => e.group === 'y' && e.name === 'filter type');
    expect(ft?.value).toBe(1); // LP24
    const freq = edits.find((e) => e.group === 'y' && e.name === 'filter freq');
    expect(freq).toBeDefined();
    expect(typeof freq?.value).toBe('number');
  });

  it('maps amp envelope times by nearest interpretation', async () => {
    const { edits } = await emitNs4(common, [], {
      advisor: naiveAdvisor,
      sounds: [{ id: 777, name: 'Mellotron Choir', kind: 'sample' }],
    });
    expect(edits.some((e) => e.group === 'y' && e.name === 'amp env attack')).toBe(true);
    expect(edits.some((e) => e.group === 'y' && e.name === 'amp env decay')).toBe(true);
    expect(edits.some((e) => e.group === 'y' && e.name === 'amp env release')).toBe(true);
  });
});

describe('emitNs4 fx', () => {
  it('enables reverb and maps its type via invertEnum when a label matches', async () => {
    const common: CommonProgram = {
      sourceModel: 'ns3',
      synth: { on: true, mode: 'analog' },
      fx: [{ slot: 'reverb', on: true, type: 'Hall', amountMidi: 64 }],
    };
    const { edits } = await emitNs4(common, [], { advisor: naiveAdvisor, sounds: [] });
    expect(edits.some((e) => e.group === 'y' && e.name === 'FX reverb on/off' && e.value === 1)).toBe(true);
  });
});

describe('emitNs4 off-engines and dropped features', () => {
  it('emits only layer-off for engines that were off', async () => {
    const { edits } = await emitNs4(
      { sourceModel: 'ns2', piano: { on: false, typeName: 'Grand' } },
      [],
      { advisor: naiveAdvisor, sounds: [] },
    );
    const pianoEdits = edits.filter((e) => e.group === 'p');
    expect(pianoEdits).toEqual([{ group: 'p', name: 'layer on/off', layer: 0, value: 0 }]);
  });

  it('adds a mapped "left off" note for an off engine', async () => {
    const { report } = await emitNs4(
      { sourceModel: 'ns2', piano: { on: false, typeName: 'Grand' } },
      [],
      { advisor: naiveAdvisor, sounds: [] },
    );
    expect(report.notes.some((n) => n.status === 'mapped' && /off/i.test(n.note))).toBe(true);
  });

  it('turns dropped features into not-migratable notes', async () => {
    const { report } = await emitNs4({ sourceModel: 'ns2' }, ['arpeggiator'], {
      advisor: naiveAdvisor,
      sounds: [],
    });
    expect(report.notes.some((n) => n.status === 'not-migratable' && n.note.includes('arpeggiator'))).toBe(true);
  });

  it('always includes the unmapped-bytes disclaimer and the morph caveat', async () => {
    const { report } = await emitNs4({ sourceModel: 'ns2' }, [], { advisor: naiveAdvisor, sounds: [] });
    expect(report.globalNotes.some((g) => /no equivalent in this file/i.test(g))).toBe(true);
    expect(report.notes.some((n) => n.status === 'not-migratable' && /Morph/i.test(n.note))).toBe(true);
  });
});
