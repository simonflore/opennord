import { describe, it, expect } from 'vitest';
import { fxTypeName, noteValueName } from './fx-names';
import { GENERATED_VALUES } from './values.generated';

describe('fxTypeName', () => {
  it('names each effect type, and its variation', () => {
    expect(fxTypeName('A-PAN')).toBe('Auto-pan');
    expect(fxTypeName('CHOR variation')).toBe('Chorus, variation');
    expect(fxTypeName('CATH')).toBe('Cathedral');
    expect(fxTypeName('TO ROTARY')).toBe('To rotary');
  });

  it('passes through what it does not know', () => {
    expect(fxTypeName('off')).toBe('off');
    expect(fxTypeName(undefined)).toBeUndefined();
  });

  it('covers every effect type in the decoded tables', () => {
    // FX mod 1 / mod 2 / amp sim mode / reverb type, as ns4decode names them.
    for (const id of ['183-1', '191-4', '224-6', '225-6']) {
      for (const code of Object.values(GENERATED_VALUES[id] ?? {})) {
        // 'JC' is the amp's own name on the panel, so it reads the same.
        if (code === 'off' || code === 'not decoded' || code.startsWith('JC')) continue;
        expect(fxTypeName(code), code).not.toBe(code);
      }
    }
  });
});

describe('noteValueName', () => {
  it('spells out dotted and triplet note values', () => {
    expect(noteValueName('1/8D')).toBe('1/8 dotted');
    expect(noteValueName('1/4T')).toBe('1/4 triplet');
    expect(noteValueName('1/8S')).toBe('1/8 swing');
  });

  it('leaves straight values and times alone', () => {
    expect(noteValueName('1/4')).toBe('1/4');
    expect(noteValueName('250 ms (120 x2 bpm)')).toBe('250 ms (120 x2 bpm)');
  });
});
