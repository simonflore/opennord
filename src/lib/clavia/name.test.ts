import { describe, it, expect } from 'vitest';
import { programNameFromFilename } from './name';

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
