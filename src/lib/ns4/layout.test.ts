import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { decodeFwProgram, fieldBodyBit, walkBlockChain } from '../clavia/block-chain';
import { CBIN_BODY_OFFSET } from '../clavia/cbin';
import { NS4_LAYOUT } from './layout.generated';
import { NS4_OFFSET_MAP } from './offset-map.generated';

const FIXTURES = join(__dirname, '__fixtures__');
const programs = readdirSync(FIXTURES).filter((f) => f.endsWith('.ns4p')).map((f) => ({
  name: f,
  bytes: new Uint8Array(readFileSync(join(FIXTURES, f))),
}));

/** Absolute body bit range of every layout field. */
const fieldBits = NS4_LAYOUT.fields.map((f) => {
  const start = fieldBodyBit(NS4_LAYOUT, f);
  return { key: f.key, start, end: start + f.width - 1 };
});

describe('NS4_LAYOUT (Stage 4, firmware registry OS 1.66)', () => {
  it('is an 824-byte body of 24 blocks', () => {
    expect(NS4_LAYOUT.bodyBytes).toBe(824);
    // Common · Organ, 2 × (layer, drawbars, vib/perc), effects · Piano, 2 layers, 2 effects ·
    // Synth, 3 layers, 3 sounds, 3 effects.
    expect(NS4_LAYOUT.blocks.map((b) => b.length)).toEqual(
      [44, 17, 3, 23, 2, 3, 23, 2, 54, 12, 11, 11, 54, 54, 30, 50, 50, 50, 47, 47, 47, 54, 54, 54]);
  });

  it('matches the block chain of every committed program', () => {
    expect(programs.length).toBeGreaterThan(0);
    for (const { name, bytes } of programs) {
      const walk = walkBlockChain(bytes.slice(CBIN_BODY_OFFSET));
      expect(walk.ok, name).toBe(true);
      expect(walk.blocks.map((b) => [b.offset, b.length]), name)
        .toEqual(NS4_LAYOUT.blocks.map((b) => [b.offset, b.length]));
    }
  });

  it('reads every committed program with each value inside its firmware range', () => {
    for (const { name, bytes } of programs) {
      const p = decodeFwProgram(bytes, NS4_LAYOUT);
      expect(p.layoutMatched, name).toBe(true);
      expect(p.outOfRange, name).toEqual([]);
      expect(p.warnings, name).toEqual([]);
    }
  });

  it('agrees with the ns4decode-derived map: its body fields sit inside one firmware parameter each', () => {
    let exact = 0;
    let total = 0;
    for (const param of NS4_OFFSET_MAP) {
      for (const layer of param.layers) {
        const start = layer.begBit - CBIN_BODY_OFFSET * 8;
        const end = layer.endBit - CBIN_BODY_OFFSET * 8;
        if (start < 32) continue; // CBIN header fields and the body's format version
        total++;
        const owner = fieldBits.find((f) => f.start <= start && start <= f.end);
        // Two disagreements. The delay tempo's After Touch and Ctrl Pedal morphs: ns4decode
        // read three 8-bit deltas where the firmware stores three 15-bit ones. And the organ
        // "vib/chorus type": one 7-bit value there, three parameters in the firmware (the
        // B3, Vox and Farfisa vibrato types, 3 + 2 + 2 bits).
        if (/delay tempo with (A\.T\.|ctrlped)|organ vib\/chorus type/.test(param.name)) continue;
        expect(owner, `${param.id} ${param.name}`).toBeDefined();
        expect(end, `${param.id} ${param.name}`).toBeLessThanOrEqual(owner!.end);
        if (owner!.start === start && owner!.end === end) exact++;
      }
    }
    expect(total).toBe(877);
    expect(exact).toBe(807);
  });

  it('names what the older map left unclaimed', () => {
    const keys = new Set<string>(NS4_LAYOUT.fields.map((f) => f.key));
    for (const k of ['common.masterClockRate', 'common.orgPresetNameHash', 'common.synPresetNameHashC',
      'synthA.externCCNumber1', 'organ.leslieRotorAngle', 'synth.multiLayerLFO']) {
      expect(keys.has(k), k).toBe(true);
    }
  });
});
