import { describe, it, expect } from 'vitest';
import { resolveProgramPartition } from './program-partition';
import { PARTITION_PROGRAM } from './opcodes';

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
