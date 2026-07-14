import { describe, it, expect } from 'vitest';
import { parseNoteMessage } from './note-input';

describe('parseNoteMessage', () => {
  it('parses note-on with velocity', () => {
    expect(parseNoteMessage([0x90, 60, 100])).toEqual({ type: 'noteOn', note: 60, velocity: 100 });
  });
  it('treats note-on velocity 0 as note-off', () => {
    expect(parseNoteMessage([0x90, 60, 0])).toEqual({ type: 'noteOff', note: 60 });
  });
  it('parses an explicit note-off', () => {
    expect(parseNoteMessage([0x80, 60, 64])).toEqual({ type: 'noteOff', note: 60 });
  });
  it('is omni — ignores the channel nibble', () => {
    expect(parseNoteMessage([0x95, 48, 80])).toEqual({ type: 'noteOn', note: 48, velocity: 80 });
  });
  it('parses sustain (CC64) down and up', () => {
    expect(parseNoteMessage([0xb0, 64, 127])).toEqual({ type: 'sustain', down: true });
    expect(parseNoteMessage([0xb0, 64, 0])).toEqual({ type: 'sustain', down: false });
  });
  it('ignores other CCs and short messages', () => {
    expect(parseNoteMessage([0xb0, 1, 100])).toBeNull(); // mod wheel
    expect(parseNoteMessage([0xf8])).toBeNull();         // clock
    expect(parseNoteMessage([0x90, 60])).toBeNull();     // truncated
  });
});
