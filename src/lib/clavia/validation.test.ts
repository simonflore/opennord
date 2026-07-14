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
  it('electro-5 file-read and backup are re (fixture-validated)', () => {
    expect(statusFor('electro-5', 'file-read').status).toBe('re');
    expect(statusFor('electro-5', 'backup').status).toBe('re');
  });
  it('electro-4 file-read is re (fixture-validated); backup stays inferred (not specifically checked)', () => {
    expect(statusFor('electro-4', 'file-read').status).toBe('re');
    expect(statusFor('electro-4', 'backup').status).toBe('inferred');
  });
  it('electro-5 and electro-4 transfer caps stay at inferred (hardware-gated)', () => {
    for (const cap of ['enumerate', 'pull', 'push', 'delete'] as const) {
      expect(statusFor('electro-5', cap).status, `electro-5 ${cap}`).toBe('inferred');
      expect(statusFor('electro-4', cap).status, `electro-4 ${cap}`).toBe('inferred');
    }
  });
  // Slot display: 2 banks of 50.
  // 3-partition spec.
  // Backup flow (nl4b).
  // All three validated against real .nl4p + .nl4s fixtures (fixtures/lead-4/).
  // Transfer caps (enumerate/pull/push/delete) stay inferred — hardware-gated.
  it('lead-4 file-read and backup are re (fixture-validated)', () => {
    expect(statusFor('lead-4', 'file-read').status).toBe('re');
    expect(statusFor('lead-4', 'backup').status).toBe('re');
  });
  it('lead-4 transfer caps stay at inferred (hardware-gated)', () => {
    for (const cap of ['enumerate', 'pull', 'push', 'delete'] as const) {
      expect(statusFor('lead-4', cap).status, `lead-4 ${cap}`).toBe('inferred');
    }
  });
  it('lead-4 samples is unsupported (sampleCodec null — no sample engine)', () => {
    expect(statusFor('lead-4', 'samples').status).toBe('unsupported');
  });
  // CBIN container identify validated against 52 real .nlap/.nlas fixtures.
  // CMini inherits base-class defaults only (constructor-only in NSM); no model-specific body decoder needed.
  // Transfer caps stay inferred: A1 native transfer is MIDI SysEx (A1 user manual); FileTransfer path unverified.
  // Slot display (programs → unhandled → formatSlot).
  // Categories: sample partition only; programs: 19 categories.
  // 6-partition spec (samplib-native + samplib + program nw2p + live nw2l +
  //   settings nw2s + ffs).
  // Backup flow (nw2b).
  // All validated against 26 real .nw2p fixtures (2026-06-20); not HW-tested.
  it('wave-2 file-read and backup are re (26 fixtures validated)', () => {
    expect(statusFor('wave-2', 'file-read').status).toBe('re');
    expect(statusFor('wave-2', 'backup').status).toBe('re');
  });
  it('wave-2 transfer caps stay at inferred (hardware-gated)', () => {
    for (const cap of ['enumerate', 'pull', 'push', 'delete'] as const) {
      expect(statusFor('wave-2', cap).status, `wave-2 ${cap}`).toBe('inferred');
    }
  });
  it('wave-2 samples is re (sampleCodec codec3 decoded)', () => {
    expect(statusFor('wave-2', 'samples').status).toBe('re');
  });

  it('lead-a1 file-read is re (52 fixtures, CBIN container validated)', () => {
    expect(statusFor('lead-a1', 'file-read').status).toBe('re');
  });
  it('lead-a1 transfer caps stay at inferred (MIDI SysEx native; FileTransfer unverified)', () => {
    for (const cap of ['enumerate', 'pull', 'push', 'delete', 'backup'] as const) {
      expect(statusFor('lead-a1', cap).status, `lead-a1 ${cap}`).toBe('inferred');
    }
  });
});
