import { describe, it, expect } from 'vitest';
import { freeName, pianoNameFromFilename, programNameFromFilename } from './name';

describe('programNameFromFilename', () => {
  it('strips path and extension', () => {
    expect(programNameFromFilename('Bank 1/My Patch.ns4p')).toBe('My Patch');
  });

  it('strips a multi-part extension', () => {
    expect(programNameFromFilename('BreakFree Solo.ns4p')).toBe('BreakFree Solo');
  });

  it('drops a Nord User Forum timestamp prefix', () => {
    expect(programNameFromFilename('1623840000000-BreakFree Solo.ns4p')).toBe('BreakFree Solo');
  });

  it('handles a backslash (Windows) path', () => {
    expect(programNameFromFilename('Backup\\Synths\\Lead.ns4l')).toBe('Lead');
  });

  it('falls back to Unnamed for empty or extension-only input', () => {
    expect(programNameFromFilename('')).toBe('Unnamed');
    expect(programNameFromFilename(undefined)).toBe('Unnamed');
    expect(programNameFromFilename('.ns4p')).toBe('Unnamed');
  });
});

describe('pianoNameFromFilename', () => {
  it('keeps the version a piano name ends in', () => {
    expect(pianoNameFromFilename('Pianos/White Grand XL 6.3.npno')).toBe('White Grand XL 6.3');
    expect(pianoNameFromFilename('Electric_Grand_1_CP80__5.3.NPNO')).toBe('Electric_Grand_1_CP80__5.3');
  });

  it('falls back to Unnamed for an extension-only name', () => {
    expect(pianoNameFromFilename('.npno')).toBe('Unnamed');
  });
});

describe('freeName', () => {
  it('keeps a name the Nord does not hold', () => {
    expect(freeName('Pad', ['Bass'])).toBe('Pad');
  });

  it('numbers a taken name, past the numbers already used', () => {
    expect(freeName('Pad', ['Pad'])).toBe('Pad (1)');
    expect(freeName('Pad', ['Pad', 'Pad (1)', 'Pad (2)'])).toBe('Pad (3)');
  });
});
