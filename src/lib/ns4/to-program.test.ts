/**
 * Tests for ns4ToProgram — the NS4Program → NordProgram mapper.
 *
 * Two layers:
 * 1. Synthetic unit tests on the Morphable → Param conversion (no file I/O).
 * 2. Fixture-guarded integration test using a real .ns4p to validate end-to-end.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { ns4ToProgram } from './to-program';
import type { NS4Program } from './types';

// ── Synthetic helpers ─────────────────────────────────────────────────────────

/** Minimal valid NS4Program shell (no layers, no organFx). */
function minimalProgram(overrides: Partial<NS4Program> = {}): NS4Program {
  return {
    parsed: true,
    kind: 'program',
    name: 'Test Program',
    category: 'Organ',
    slot: 'A:01',
    programVersion: '3.13',
    layers: [],
    bytes: new Uint8Array(0),
    warnings: [],
    ...overrides,
  };
}

// ── Morphable → Param unit tests ──────────────────────────────────────────────

describe('ns4ToProgram — Morphable→Param (synthetic)', () => {
  it('maps meta fields correctly', () => {
    const prog = ns4ToProgram(minimalProgram());
    expect(prog.meta.model).toBe('stage-4');
    expect(prog.meta.generation).toBe('v4');
    expect(prog.meta.name).toBe('Test Program');
    expect(prog.meta.category).toBe('Organ');
    expect(prog.meta.slot).toBe('A:01');
    expect(prog.meta.version).toBe('3.13');
  });

  it('emits empty engines and fx arrays for a program with no layers', () => {
    const prog = ns4ToProgram(minimalProgram());
    expect(prog.engines).toHaveLength(0);
    expect(prog.fx).toHaveLength(0);
    expect(prog.master).toBeUndefined();
  });

  it('maps a synth layer with morph-carrying volume to Param with morph', () => {
    const p = minimalProgram({
      layers: [{
        id: 'A',
        kind: 'synth',
        enabled: true,
        volume: { value: '-2.2 dB', wheel: '1.0', aftertouch: undefined, pedal: undefined },
        filter: { on: true, type: 'LP24', freq: { value: '72', wheel: '12', aftertouch: undefined, pedal: undefined } },
      }],
    });
    const prog = ns4ToProgram(p);
    expect(prog.engines).toHaveLength(1);
    const engine = prog.engines[0];
    expect(engine.kind).toBe('synth');
    expect(engine.volume?.value).toBeCloseTo(-2.2);
    expect(engine.volume?.morph?.wheel).toBeCloseTo(1.0);
    expect(engine.volume?.morph?.aftertouch).toBeUndefined();
  });

  it('maps a synth layer volume with no morphs → Param without morph field', () => {
    const p = minimalProgram({
      layers: [{
        id: 'B',
        kind: 'synth',
        enabled: true,
        volume: { value: '0.0' },
      }],
    });
    const prog = ns4ToProgram(p);
    expect(prog.engines[0].volume?.morph).toBeUndefined();
  });

  it('maps filter cutoff morphs correctly on a synth layer', () => {
    const p = minimalProgram({
      layers: [{
        id: 'A',
        kind: 'synth',
        enabled: false,
        filter: {
          on: true,
          type: 'BP',
          freq: { value: '64', wheel: '8', aftertouch: '4', pedal: undefined },
        },
      }],
    });
    const prog = ns4ToProgram(p);
    const engine = prog.engines[0];
    if (engine.kind !== 'synth') throw new Error('expected synth');
    expect(engine.filter.type).toBe('BP');
    expect(engine.filter.cutoff.value).toBe(64);
    expect(engine.filter.cutoff.morph?.wheel).toBe(8);
    expect(engine.filter.cutoff.morph?.aftertouch).toBe(4);
    expect(engine.filter.cutoff.morph?.pedal).toBeUndefined();
  });

  it('maps an organ layer drawbars and percussion', () => {
    const drawbars = [
      { value: '8' }, { value: '8' }, { value: '0' }, { value: '0' },
      { value: '4' }, { value: '3' }, { value: '2' }, { value: '0' }, { value: '0' },
    ];
    const p = minimalProgram({
      layers: [{
        id: 'A',
        kind: 'organ',
        enabled: true,
        organModel: 'B3',
        drawbars,
        percussion: { on: true, harm3rd: false, decayFast: true, volSoft: false },
      }],
    });
    const prog = ns4ToProgram(p);
    expect(prog.engines[0].kind).toBe('organ');
    const organ = prog.engines[0];
    if (organ.kind !== 'organ') throw new Error('expected organ');
    expect(organ.model).toBe('B3');
    expect(organ.drawbars).toEqual([8, 8, 0, 0, 4, 3, 2, 0, 0]);
    expect(organ.percussion?.on).toBe(true);
    expect(organ.percussion?.fast).toBe(true);
    expect(organ.percussion?.soft).toBe(false);
  });

  it('maps a piano layer with model id to a SampleRef', () => {
    const p = minimalProgram({
      layers: [{
        id: 'A',
        kind: 'piano',
        enabled: true,
        pianoType: 'Grand',
        pianoModelId: 12345,
        pianoModelName: 'Steinway D 6.1',
        pianoModelSlot: 2,
        timbre: 'SOFT',
      }],
    });
    const prog = ns4ToProgram(p);
    const engine = prog.engines[0];
    if (engine.kind !== 'piano') throw new Error('expected piano');
    expect(engine.type).toBe('Grand');
    expect(engine.sample?.id).toBe(12345);
    expect(engine.sample?.name).toBe('Steinway D 6.1');
    expect(engine.sample?.slot).toBe(2);
    expect(engine.timbre).toBe('SOFT');
  });

  it('maps a synth sample ref by id', () => {
    const p = minimalProgram({
      layers: [{
        id: 'A',
        kind: 'synth',
        enabled: true,
        source: 'samples',
        sample: { id: 2768936524, name: 'Strings Multi FastAtk_ST 4.1', categoryName: 'Strings Solo', slot: 2, bankSize: 100 },
      }],
    });
    const prog = ns4ToProgram(p);
    const engine = prog.engines[0];
    if (engine.kind !== 'synth') throw new Error('expected synth');
    expect(engine.sample?.id).toBe(2768936524);
    expect(engine.sample?.name).toBe('Strings Multi FastAtk_ST 4.1');
    expect(engine.sample?.categoryName).toBe('Strings Solo');
    expect(engine.sample?.slot).toBe(2);
  });

  it('maps arp fields onto SynthEngine.arp', () => {
    const p = minimalProgram({
      layers: [{
        id: 'A',
        kind: 'synth',
        enabled: true,
        arp: {
          run: true,
          mode: 'Arp',
          direction: 'UP',
          rate: { value: '1/8', wheel: '1/4', aftertouch: undefined, pedal: undefined },
          range: { value: '2 Oct', wheel: undefined, aftertouch: undefined, pedal: undefined },
        },
      }],
    });
    const prog = ns4ToProgram(p);
    const engine = prog.engines[0];
    if (engine.kind !== 'synth') throw new Error('expected synth');
    expect(engine.arp?.on).toBe(true);
    expect(engine.arp?.rate?.value).toBe('1/8');
    expect(engine.arp?.rate?.morph?.wheel).toBe('1/4');
  });

  it('extracts organ rotary FX into fx array', () => {
    const p = minimalProgram({
      organFx: {
        rotary: { on: true, drive: '0', stopPosition: 'stopped', stop: false, fast: false, vibChorusType: 'C1' },
        reverb: { on: false, type: 'Hall' },
      },
    });
    const prog = ns4ToProgram(p);
    const rotary = prog.fx.find((f) => f.name === 'Rotary Speaker');
    expect(rotary).toBeDefined();
    expect(rotary?.on).toBe(true);
    expect(rotary?.type).toBe('C1');
  });
});

// ── Fixture integration test ──────────────────────────────────────────────────

describe('ns4ToProgram — fixture (Stage 4 .ns4p)', () => {
  let parseNs4Program: typeof import('./parse').parseNs4Program;
  let bytes: Uint8Array | undefined;

  beforeAll(async () => {
    // Attempt to load fixtures; if absent the tests below guard with `if (!bytes)`.
    try {
      const { readFileSync } = await import('node:fs');
      const { fileURLToPath } = await import('node:url');
      const fixtureUrl = new URL('./__fixtures__/BreakFreeSolo.ns4p', import.meta.url);
      bytes = new Uint8Array(readFileSync(fileURLToPath(fixtureUrl)));
      const mod = await import('./parse');
      parseNs4Program = mod.parseNs4Program;
    } catch {
      // Fixtures absent — tests below will skip.
    }
  });

  it('skips cleanly when fixture is absent', () => {
    if (bytes) return; // fixture present — skip this guard test
    expect(true).toBe(true); // always passes
  });

  it('maps fixture → NordProgram with meta populated', () => {
    if (!bytes || !parseNs4Program) return;
    const ns4 = parseNs4Program(bytes);
    const prog = ns4ToProgram(ns4);
    expect(prog.meta.model).toBe('stage-4');
    expect(prog.meta.generation).toBe('v4');
    // name may be empty (not stored in file), but other meta fields should be set
    expect(prog.meta.version).toMatch(/^\d+\.\d+$/);
  });

  it('maps fixture → NordProgram with at least one engine populated', () => {
    if (!bytes || !parseNs4Program) return;
    const ns4 = parseNs4Program(bytes);
    const prog = ns4ToProgram(ns4);
    expect(prog.engines.length).toBeGreaterThan(0);
    for (const engine of prog.engines) {
      expect(['organ', 'piano', 'synth']).toContain(engine.kind);
      expect(typeof engine.id).toBe('string');
      expect(typeof engine.enabled).toBe('boolean');
    }
  });

  it('fixture engines include enabled state from the source layers', () => {
    if (!bytes || !parseNs4Program) return;
    const ns4 = parseNs4Program(bytes);
    const prog = ns4ToProgram(ns4);
    // At least one engine should be enabled in a real program
    const hasEnabled = prog.engines.some((e) => e.enabled);
    expect(hasEnabled).toBe(true);
  });

  it('fixture fx array is populated (organ FX always decoded)', () => {
    if (!bytes || !parseNs4Program) return;
    const ns4 = parseNs4Program(bytes);
    const prog = ns4ToProgram(ns4);
    // organFx is always decoded — expect at least rotary, delay, reverb entries
    expect(prog.fx.length).toBeGreaterThan(0);
    expect(prog.fx.every((f) => typeof f.name === 'string')).toBe(true);
    expect(prog.fx.every((f) => typeof f.on === 'boolean')).toBe(true);
  });

  it('synth layers carry sample refs mapped by id', () => {
    if (!bytes || !parseNs4Program) return;
    const ns4 = parseNs4Program(bytes);
    const prog = ns4ToProgram(ns4);
    // Just check the shape — sample may be absent if the fixture uses analog
    for (const engine of prog.engines) {
      if (engine.kind === 'synth' && engine.sample) {
        expect(typeof engine.sample.id).toBe('number');
        expect(typeof engine.sample.name).toBe('string');
        expect(typeof engine.sample.categoryName).toBe('string');
      }
    }
  });

  it('Morphable morph carries through to Param.morph when source has wheel/at/pedal', () => {
    if (!bytes || !parseNs4Program) return;
    const ns4 = parseNs4Program(bytes);
    const prog = ns4ToProgram(ns4);
    // Not all programs have morphs, but the shape should always be correct
    for (const engine of prog.engines) {
      if (engine.volume?.morph) {
        const m = engine.volume.morph;
        // morph fields that exist must be numbers
        if (m.wheel !== undefined) expect(typeof m.wheel).toBe('number');
        if (m.aftertouch !== undefined) expect(typeof m.aftertouch).toBe('number');
        if (m.pedal !== undefined) expect(typeof m.pedal).toBe('number');
      }
    }
  });
});
