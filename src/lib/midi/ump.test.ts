import { describe, expect, it } from 'vitest';
import { umpToMidi1Bytes, umpWordCount } from './ump';
import { MidiStreamParser } from './midi-stream';

/** Build a UMP word from its four bytes. */
const w = (b0: number, b1: number, b2: number, b3: number) => ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;

describe('umpWordCount', () => {
  it('follows the UMP size table', () => {
    for (const mt of [0x0, 0x1, 0x2, 0x6, 0x7]) expect(umpWordCount(mt)).toBe(1);
    for (const mt of [0x3, 0x4, 0x8, 0x9, 0xa]) expect(umpWordCount(mt)).toBe(2);
    for (const mt of [0xb, 0xc]) expect(umpWordCount(mt)).toBe(3);
    for (const mt of [0x5, 0xd, 0xe, 0xf]) expect(umpWordCount(mt)).toBe(4);
  });
});

describe('umpToMidi1Bytes', () => {
  it('unwraps MIDI 1.0 channel voice (type 2), group ignored', () => {
    expect(umpToMidi1Bytes([w(0x20, 0x90, 60, 100)])).toEqual([0x90, 60, 100]);
    expect(umpToMidi1Bytes([w(0x23, 0xb1, 64, 127)])).toEqual([0xb1, 64, 127]);
    expect(umpToMidi1Bytes([w(0x20, 0xc0, 5, 0)])).toEqual([0xc0, 5]); // program change: 1 data byte
    expect(umpToMidi1Bytes([w(0x20, 0xd2, 33, 0)])).toEqual([0xd2, 33]);
  });

  it('handles several messages in one event list, including words ≥ 2^31', () => {
    const words = [w(0x20, 0x90, 60, 100), w(0x20, 0x80, 60, 0), w(0x10, 0xf8, 0, 0)];
    expect(umpToMidi1Bytes(words)).toEqual([0x90, 60, 100, 0x80, 60, 0, 0xf8]);
    // Signed (negative) numbers are tolerated, as JSON may hand them over that way.
    expect(umpToMidi1Bytes([w(0x40, 0x90, 60, 0) | 0, 0xffff0000 | 0])).toEqual([0x90, 60, 127]);
  });

  it('unwraps system common and real-time (type 1)', () => {
    expect(umpToMidi1Bytes([w(0x10, 0xf8, 0, 0)])).toEqual([0xf8]);
    expect(umpToMidi1Bytes([w(0x10, 0xf2, 0x10, 0x20)])).toEqual([0xf2, 0x10, 0x20]);
    expect(umpToMidi1Bytes([w(0x10, 0xf3, 7, 0)])).toEqual([0xf3, 7]);
  });

  it('rebuilds SysEx from 7-bit SysEx packets (type 3)', () => {
    // complete in one packet: 3 bytes
    expect(umpToMidi1Bytes([w(0x30, 0x03, 0x7e, 0x7f), w(0x06, 0, 0, 0)])).toEqual([0xf0, 0x7e, 0x7f, 0x06, 0xf7]);
    // start (6) + end (2)
    const words = [
      w(0x30, 0x16, 1, 2), w(3, 4, 5, 6),
      w(0x30, 0x32, 7, 8), w(0, 0, 0, 0),
    ];
    expect(umpToMidi1Bytes(words)).toEqual([0xf0, 1, 2, 3, 4, 5, 6, 7, 8, 0xf7]);
  });

  it('down-converts MIDI 2.0 channel voice (type 4)', () => {
    // note on, 16-bit velocity 0xFFFF → 127
    expect(umpToMidi1Bytes([w(0x40, 0x92, 60, 0), w(0xff, 0xff, 0, 0)])).toEqual([0x92, 60, 127]);
    // a tiny non-zero velocity must stay a note-on
    expect(umpToMidi1Bytes([w(0x40, 0x90, 60, 0), w(0x00, 0x01, 0, 0)])).toEqual([0x90, 60, 1]);
    // note off
    expect(umpToMidi1Bytes([w(0x40, 0x80, 60, 0), w(0x80, 0x00, 0, 0)])).toEqual([0x80, 60, 64]);
    // CC 64 (sustain), 32-bit value
    expect(umpToMidi1Bytes([w(0x40, 0xb0, 64, 0), w(0xff, 0xff, 0xff, 0xff)])).toEqual([0xb0, 64, 127]);
    // program change
    expect(umpToMidi1Bytes([w(0x40, 0xc0, 0, 0), w(12, 0, 0, 0)])).toEqual([0xc0, 12]);
    // pitch bend centre 0x80000000 → 0x2000 (LSB 0, MSB 64)
    expect(umpToMidi1Bytes([w(0x40, 0xe0, 0, 0), w(0x80, 0, 0, 0)])).toEqual([0xe0, 0, 64]);
  });

  it('skips utility and other message types by their declared size', () => {
    const words = [
      w(0x00, 0x20, 0x12, 0x34), // JR timestamp (1 word)
      w(0xd0, 0, 0, 0), 0, 0, 0, // flex data (4 words)
      w(0x20, 0x90, 60, 100),
    ];
    expect(umpToMidi1Bytes(words)).toEqual([0x90, 60, 100]);
  });

  it('drops a truncated trailing message', () => {
    expect(umpToMidi1Bytes([w(0x20, 0x90, 60, 100), w(0x40, 0x90, 60, 0)])).toEqual([0x90, 60, 100]);
  });

  it('feeds the stream parser to whole messages, SysEx across event lists', () => {
    const p = new MidiStreamParser();
    expect(p.push(umpToMidi1Bytes([w(0x30, 0x16, 1, 2), w(3, 4, 5, 6)]))).toEqual([]);
    const out = p.push(umpToMidi1Bytes([w(0x30, 0x31, 7, 0), 0, w(0x20, 0x90, 60, 1)]));
    expect(out.map((m) => Array.from(m))).toEqual([[0xf0, 1, 2, 3, 4, 5, 6, 7, 0xf7], [0x90, 60, 1]]);
  });
});
