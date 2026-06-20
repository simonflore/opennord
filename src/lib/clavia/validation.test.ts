import { describe, it, expect } from 'vitest';
import { statusFor, CAPABILITIES } from './validation';

describe('validation matrix', () => {
  it('Stage 4 is validated for transfer + file-read', () => {
    expect(statusFor('stage-4', 'enumerate').status).toBe('validated');
    expect(statusFor('stage-4', 'file-read').status).toBe('validated');
  });
  it('Stage 3 transfer is reverse-engineered, not yet validated', () => {
    expect(statusFor('stage-3', 'enumerate').status).toBe('re');
  });
  it('only Stage 4 is hardware-validated', () => {
    const others = ['stage-3', 'stage-2', 'electro-6', 'piano-6', 'grand-2'] as const;
    for (const id of others) {
      expect(statusFor(id, 'pull').status, id).not.toBe('validated');
    }
  });
  it('marks samples unsupported for models with no sample engine', () => {
    expect(statusFor('lead-a1', 'samples').status).toBe('unsupported');
    expect(statusFor('c2', 'samples').status).toBe('unsupported');
  });
  it('never leaves a transfer capability unknown for a registered model (shared transport)', () => {
    expect(statusFor('electro-4', 'enumerate').status).not.toBe('unknown');
    expect(statusFor('wave-2', 'backup').status).not.toBe('unknown');
  });
  it('falls back to unknown for an unregistered model', () => {
    expect(statusFor('totally-unknown' as never, 'samples').status).toBe('unknown');
  });
  it('exposes the capability column order', () => {
    expect(CAPABILITIES).toContain('enumerate');
    expect(CAPABILITIES[0]).toBe('file-read');
  });
});
