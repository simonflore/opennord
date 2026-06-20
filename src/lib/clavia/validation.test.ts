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
  it('electro-5 file-read and backup are re (NSM-traced + fixture-validated)', () => {
    expect(statusFor('electro-5', 'file-read').status).toBe('re');
    expect(statusFor('electro-5', 'backup').status).toBe('re');
  });
  it('electro-4 file-read is re (NSM-traced + fixture-validated); backup stays inferred (not specifically traced)', () => {
    expect(statusFor('electro-4', 'file-read').status).toBe('re');
    expect(statusFor('electro-4', 'backup').status).toBe('inferred');
  });
  it('electro-5 and electro-4 transfer caps stay at inferred (hardware-gated)', () => {
    for (const cap of ['enumerate', 'pull', 'push', 'delete'] as const) {
      expect(statusFor('electro-5', cap).status, `electro-5 ${cap}`).toBe('inferred');
      expect(statusFor('electro-4', cap).status, `electro-4 ${cap}`).toBe('inferred');
    }
  });
  // CLead4Base::ConvertLocation @0x00000001000ddcf8 — slot display NSM-traced.
  // CLead4Base::CLead4Base @0x00000001000dd364 — 3-partition spec NSM-traced.
  // CLead4Base::Archive_OnPostUnZip @0x00000001000dda94 — backup flow NSM-traced (nl4b).
  // All three validated against real .nl4p + .nl4s fixtures (fixtures/lead-4/).
  // Transfer caps (enumerate/pull/push/delete) stay inferred — hardware-gated.
  it('lead-4 file-read and backup are re (NSM-traced + fixture-validated)', () => {
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
  it('lead-a1 file-read is re (52 fixtures, CBIN container validated)', () => {
    expect(statusFor('lead-a1', 'file-read').status).toBe('re');
  });
  it('lead-a1 transfer caps stay at inferred (MIDI SysEx native; FileTransfer unverified)', () => {
    for (const cap of ['enumerate', 'pull', 'push', 'delete', 'backup'] as const) {
      expect(statusFor('lead-a1', cap).status, `lead-a1 ${cap}`).toBe('inferred');
    }
  });
});
