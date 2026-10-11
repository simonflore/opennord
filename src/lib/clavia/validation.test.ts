import { describe, it, expect } from 'vitest';
import { statusFor, CAPABILITIES, VALIDATION } from './validation';
import { ALL_MODELS } from './partitions';

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
  it('electro-4 file-read and backup are re (NSM-traced + fixtures; partition set from the OS 1.22 firmware)', () => {
    expect(statusFor('electro-4', 'file-read').status).toBe('re');
    expect(statusFor('electro-4', 'backup').status).toBe('re');
  });
  // Every model whose own OS image was read (docs/FIRMWARE-LINE.md) has its
  // FileTransfer version and partition order from that firmware: `re`, not a
  // sibling inference. Still not hardware-tested, so never `validated`.
  const FIRMWARE_READ = [
    'electro-3', 'electro-3-hp', 'electro-4', 'electro-5', 'electro-6', 'electro-7', 'piano-1', 'piano-2',
    'piano-3', 'piano-4', 'piano-5', 'piano-6', 'wave', 'wave-2', 'c2d', 'grand', 'grand-2', 'organ-3',
  ] as const;
  it('transfer caps are re wherever the model\'s own firmware was read', () => {
    for (const id of FIRMWARE_READ) {
      for (const cap of ['enumerate', 'pull', 'push', 'delete', 'backup'] as const) {
        expect(statusFor(id, cap).status, `${id} ${cap}`).toBe('re');
        expect(statusFor(id, cap).note, `${id} ${cap}`).toMatch(/firmware/);
      }
    }
  });
  it('transfer caps stay inferred where no OS image was read (Stage Classic, Stage EX, C2)', () => {
    for (const id of ['stage-classic', 'stage-ex', 'c2'] as const) {
      for (const cap of ['enumerate', 'pull', 'push', 'delete', 'backup'] as const) {
        expect(statusFor(id, cap).status, `${id} ${cap}`).toBe('inferred');
      }
    }
  });
  // CLead4Base::ConvertLocation @0x00000001000ddcf8 — slot display NSM-traced.
  // CLead4Base::CLead4Base @0x00000001000dd364 — 3-partition spec NSM-traced.
  // CLead4Base::Archive_OnPostUnZip @0x00000001000dda94 — backup flow NSM-traced (nl4b).
  // All three validated against real .nl4p + .nl4s fixtures (fixtures/lead-4/).
  // Transfer caps: FileTransfer v8 in the OS 1.32 firmware (see the test below).
  it('lead-4 file-read and backup are re (NSM-traced + fixture-validated)', () => {
    expect(statusFor('lead-4', 'file-read').status).toBe('re');
    expect(statusFor('lead-4', 'backup').status).toBe('re');
  });
  it('lead-4 transfer caps are re (FileTransfer v8 in the OS 1.32 firmware, not HW-tested)', () => {
    for (const cap of ['enumerate', 'pull', 'push', 'delete'] as const) {
      expect(statusFor('lead-4', cap).status, `lead-4 ${cap}`).toBe('re');
    }
  });
  it('lead-4 samples is unsupported (sampleCodec null — no sample engine)', () => {
    expect(statusFor('lead-4', 'samples').status).toBe('unsupported');
  });
  // CBIN container identify validated against 52 real .nlap/.nlas fixtures.
  // CMini inherits base-class defaults only (constructor-only in NSM); no model-specific body decoder needed.
  // Transfer caps: see the firmware-based lead-a1 test below (FileTransfer present, v8).
  // CWave2::ConvertLocation @0x0000000100034508 — slot display NSM-traced (programs → unhandled → formatSlot).
  // CWave2::BankToCategories @0x100034d64 — sample partition only; programs: 19-entry Category_Add loop.
  // CWave2::CWave2 @0x100033a7c — NSM's 6-partition spec (samplib-native + samplib + program nw2p + live nw2l +
  //   settings nw2s + ffs) NSM-traced.
  // CWave::Backup_RenameFolder @0x1000ad288, CWave2::Archive_OnPostUnZip @0x0000000100034ca0 — backup traced.
  // All validated against 26 real .nw2p fixtures (2026-06-20); not HW-tested.
  it('wave-2 file-read and backup are re (NSM-traced + 26 fixture-validated)', () => {
    expect(statusFor('wave-2', 'file-read').status).toBe('re');
    expect(statusFor('wave-2', 'backup').status).toBe('re');
  });
  it('wave-2 samples is re (sampleCodec codec3 decoded)', () => {
    expect(statusFor('wave-2', 'samples').status).toBe('re');
  });

  it('lead-a1 file-read is re (52 fixtures, CBIN container validated)', () => {
    expect(statusFor('lead-a1', 'file-read').status).toBe('re');
  });
  // Lead A1 OS 1.36 runs the Lead 4's FileTransfer code (FUN_c0013728, c0181730,
  // FUN_c0166c74): SysEx is an extra path, not the only one.
  it('lead-a1 transfer caps are re (FileTransfer present in the firmware), not validated', () => {
    for (const cap of ['enumerate', 'pull', 'push', 'delete', 'backup'] as const) {
      expect(statusFor('lead-a1', cap).status, `lead-a1 ${cap}`).toBe('re');
      expect(statusFor('lead-a1', cap).note, `lead-a1 ${cap}`).not.toMatch(/SysEx \(A1 user manual\)/);
    }
  });

  it('C1 has no USB transfer: every transfer capability is unsupported', () => {
    for (const cap of CAPABILITIES) {
      expect(statusFor('c1', cap).status, `c1 ${cap}`).toBe('unsupported');
    }
  });

  it('Electro 7: read from its firmware but not tried on one; its sample generation is still a guess', () => {
    for (const cap of ['file-read', 'enumerate', 'pull', 'push', 'delete', 'backup'] as const) {
      expect(statusFor('electro-7', cap).status, `electro-7 ${cap}`).toBe('re');
    }
    expect(statusFor('electro-7', 'samples').status).toBe('inferred');
  });

  it('Piano 1 samples are unsupported (no sample library in its firmware)', () => {
    expect(statusFor('piano-1', 'samples').status).toBe('unsupported');
  });

  it('has a row for every registered model, and none is hardware-validated besides Stage 4', () => {
    for (const m of ALL_MODELS) {
      expect(VALIDATION[m.id], m.id).toBeDefined();
      if (m.id === 'stage-4') continue;
      for (const cap of CAPABILITIES) expect(statusFor(m.id, cap).status, `${m.id} ${cap}`).not.toBe('validated');
    }
  });

  it('marks samples unsupported exactly where the registry has no sample codec', () => {
    for (const m of ALL_MODELS) {
      expect(statusFor(m.id, 'samples').status === 'unsupported', m.id).toBe(m.sampleCodec === null);
    }
  });
});
