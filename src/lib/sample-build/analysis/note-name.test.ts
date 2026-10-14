import { describe, it, expect } from 'vitest';
import { rootFromFileName } from './note-name';

describe('rootFromFileName', () => {
  it.each([
    ['Rhodes_C3.wav', 48], ['Rhodes_F#2_soft.wav', 42], ['Pad Db4.aiff', 61], ['c3.wav', 48],
    ['A0.wav', 21], ['Bass A#0.wav', 22], ['Sub c-1.wav', 0], ['Strings_Bb5_long.wav', 82],
    ['Piano-E1-ff.wav', 28], ['note_048_.wav', 48], ['/some/folder/G7.WAV', 103], ['Cs4.wav', 61],
    ['Piano-E1-mf.wav', 28], ['Piano-C3-mf.wav', 48], ['Piano-C3-2.wav', 48], ['Rhodes_C3_001.wav', 48],
    ['midi 100.wav', 100], ['Key-60.wav', 60], ['C#-1.wav', 1],
  ])('%s → %i', (name, midi) => expect(rootFromFileName(name)).toBe(midi));

  it.each([
    'Pad 120bpm.wav', 'Take2.wav', 'Bass.wav', 'Room tone.wav', 'Recording 14.02.wav', 'H3.wav', 'C12.wav',
    'Take_001.wav', 'Kick_010.wav', '001_Rhodes.wav',
  ])('%s has no root', (name) => expect(rootFromFileName(name)).toBeUndefined());
});
