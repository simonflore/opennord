import { describe, it, expect } from 'vitest';
import { resolveProgramPartition, resolveModelProgramPartition } from './program-partition';
import { PARTITION_PROGRAM } from './opcodes';
import { MODELS } from '../clavia/partitions';
import type { ModelInfo } from '../clavia/partitions';

describe('resolveProgramPartition', () => {
  it('uses the model\'s hardware-confirmed program partition index', () => {
    expect(resolveProgramPartition(0x002e)).toBe(6); // Stage 4
    expect(resolveProgramPartition(0x0021)).toBe(6); // Stage 2 (issue #31)
  });

  it('falls back to the Stage-4 index for models whose layout is not yet confirmed', () => {
    // Stage 3's real index is unknown until the probe's Types column identifies it.
    // Fall back rather than block — behaviour-preserving until the registry is filled.
    expect(resolveProgramPartition(0x0026)).toBe(PARTITION_PROGRAM); // Stage 3
    expect(resolveProgramPartition(0x9999)).toBe(PARTITION_PROGRAM); // unknown device
    expect(resolveProgramPartition(0)).toBe(PARTITION_PROGRAM); // iPad DEXT placeholder pid
    expect(resolveProgramPartition(undefined)).toBe(PARTITION_PROGRAM);
  });
});

describe('resolveModelProgramPartition — index precedence', () => {
  const withProgram = (spec: Partial<{ index: number; staticIndex: number }>): ModelInfo => ({
    id: 'electro-5', name: 't', generation: 'NW1-v3', programTag: 'x', sampleCodec: null,
    partitions: [{ kind: 'program', label: 'Programs', native: false, ...spec }],
  });

  it('prefers the hardware-confirmed index over the RE-recovered static index', () => {
    expect(resolveModelProgramPartition(withProgram({ index: 6, staticIndex: 4 }))).toBe(6);
  });

  it('uses the RE-recovered static index when no hardware index is set', () => {
    expect(resolveModelProgramPartition(withProgram({ staticIndex: 4 }))).toBe(4);
  });

  it('falls back to the Stage-4 default when neither is set', () => {
    expect(resolveModelProgramPartition(withProgram({}))).toBe(PARTITION_PROGRAM);
    expect(resolveModelProgramPartition(undefined)).toBe(PARTITION_PROGRAM);
  });

  it('resolves the NSM-constructor-recovered program partition for each model', () => {
    // Ordinals from the product constructors (Add-order); Stage 2's HW-validated
    // pedal-shift map (index 6, issue #31) corroborates the pedal-bearing set.
    expect(resolveModelProgramPartition(MODELS['electro-5'])).toBe(4); // ne5p, no pedal
    expect(resolveModelProgramPartition(MODELS['wave'])).toBe(1);      // nwp, OG flash
    expect(resolveModelProgramPartition(MODELS['wave-2'])).toBe(2);    // nw2p, NW1-v3 skips Transient
    expect(resolveModelProgramPartition(MODELS['lead-4'])).toBe(0);    // nl4p Performance, only 3 partitions
    expect(resolveModelProgramPartition(MODELS['piano-4'])).toBe(6);   // pedal-shift → 6
    expect(resolveModelProgramPartition(MODELS['piano-5'])).toBe(6);
    expect(resolveModelProgramPartition(MODELS['grand-2'])).toBe(6);
  });

  it('still resolves hardware-validated models from their real index, unchanged', () => {
    expect(resolveModelProgramPartition(MODELS['stage-4'])).toBe(6);  // HW index
    expect(resolveModelProgramPartition(MODELS['stage-2'])).toBe(6);  // HW index (issue #31)
  });
});
