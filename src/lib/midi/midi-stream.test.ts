import { describe, expect, it } from 'vitest';
import { dataLengthForStatus, MidiStreamParser } from './midi-stream';

const arr = (ms: Uint8Array[]) => ms.map((m) => Array.from(m));

describe('dataLengthForStatus', () => {
  it('knows channel and system-common lengths', () => {
    expect(dataLengthForStatus(0x90)).toBe(2);
    expect(dataLengthForStatus(0x8f)).toBe(2);
    expect(dataLengthForStatus(0xc3)).toBe(1); // program change
    expect(dataLengthForStatus(0xd0)).toBe(1); // channel pressure
    expect(dataLengthForStatus(0xe0)).toBe(2); // pitch bend
    expect(dataLengthForStatus(0xf1)).toBe(1);
    expect(dataLengthForStatus(0xf2)).toBe(2);
    expect(dataLengthForStatus(0xf3)).toBe(1);
    expect(dataLengthForStatus(0xf6)).toBe(0);
    expect(dataLengthForStatus(0xf8)).toBe(0);
  });
});

describe('MidiStreamParser', () => {
  it('passes a single complete message through', () => {
    expect(arr(new MidiStreamParser().push([0x90, 60, 100]))).toEqual([[0x90, 60, 100]]);
  });

  it('splits several messages in one packet', () => {
    const p = new MidiStreamParser();
    expect(arr(p.push([0x90, 60, 100, 0x90, 64, 90, 0xb0, 64, 127]))).toEqual([
      [0x90, 60, 100], [0x90, 64, 90], [0xb0, 64, 127],
    ]);
  });

  it('expands running status (a chord, then releases as note-on velocity 0)', () => {
    const p = new MidiStreamParser();
    expect(arr(p.push([0x90, 60, 100, 64, 100, 67, 100]))).toEqual([
      [0x90, 60, 100], [0x90, 64, 100], [0x90, 67, 100],
    ]);
    // Running status carries across packets too.
    expect(arr(p.push([60, 0, 64, 0]))).toEqual([[0x90, 60, 0], [0x90, 64, 0]]);
  });

  it('handles running status for 1-data-byte messages', () => {
    const p = new MidiStreamParser();
    expect(arr(p.push([0xd0, 10, 20, 30]))).toEqual([[0xd0, 10], [0xd0, 20], [0xd0, 30]]);
  });

  it('assembles a message split across packets', () => {
    const p = new MidiStreamParser();
    expect(p.push([0x90])).toEqual([]);
    expect(p.push([60])).toEqual([]);
    expect(arr(p.push([100]))).toEqual([[0x90, 60, 100]]);
  });

  it('emits real-time bytes immediately without disturbing a message in progress', () => {
    const p = new MidiStreamParser();
    expect(arr(p.push([0x90, 60, 0xf8, 100, 0xfe, 62, 0xf8, 90]))).toEqual([
      [0xf8], [0x90, 60, 100], [0xfe], [0xf8], [0x90, 62, 90],
    ]);
  });

  it('system common cancels running status', () => {
    const p = new MidiStreamParser();
    expect(arr(p.push([0x90, 60, 100, 0xf3, 5, 61, 100]))).toEqual([
      [0x90, 60, 100], [0xf3, 5], // stray data after song select is dropped
    ]);
    expect(arr(p.push([0xf6]))).toEqual([[0xf6]]);
    expect(arr(p.push([0xf2, 1, 2]))).toEqual([[0xf2, 1, 2]]);
  });

  it('drops data bytes with no status to attach to', () => {
    const p = new MidiStreamParser();
    expect(p.push([60, 100, 61])).toEqual([]);
    expect(arr(p.push([0x80, 60, 0]))).toEqual([[0x80, 60, 0]]);
  });

  it('a new status abandons an incomplete message', () => {
    const p = new MidiStreamParser();
    expect(arr(p.push([0x90, 60, 0xb0, 1, 64]))).toEqual([[0xb0, 1, 64]]);
  });

  it('assembles SysEx across packets, with real-time interleaved', () => {
    const p = new MidiStreamParser();
    expect(p.push([0xf0, 0x7e, 0x7f])).toEqual([]);
    expect(arr(p.push([0x06, 0xf8, 0x01]))).toEqual([[0xf8]]);
    expect(arr(p.push([0xf7, 0x90, 60, 1]))).toEqual([
      [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7], [0x90, 60, 1],
    ]);
  });

  it('SysEx clears running status', () => {
    const p = new MidiStreamParser();
    expect(arr(p.push([0x90, 60, 100, 0xf0, 1, 0xf7, 61, 100]))).toEqual([
      [0x90, 60, 100], [0xf0, 1, 0xf7],
    ]);
  });

  it('a status byte aborts an unterminated SysEx', () => {
    const p = new MidiStreamParser();
    expect(arr(p.push([0xf0, 1, 2, 0x90, 60, 100]))).toEqual([[0x90, 60, 100]]);
  });

  it('drops (does not truncate) an over-long SysEx', () => {
    const p = new MidiStreamParser({ maxSysex: 8 });
    expect(arr(p.push([0xf0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0xf7, 0x80, 1, 0]))).toEqual([[0x80, 1, 0]]);
    expect(arr(p.push([0xf0, 1, 0xf7]))).toEqual([[0xf0, 1, 0xf7]]); // recovers
  });

  it('ignores stray end-of-SysEx and undefined status bytes', () => {
    const p = new MidiStreamParser();
    expect(arr(p.push([0x90, 60, 100, 0xf7, 61, 100, 0xf4, 0xf5]))).toEqual([[0x90, 60, 100]]);
  });

  it('reset() forgets running status and partial messages', () => {
    const p = new MidiStreamParser();
    p.push([0x90, 60]);
    p.reset();
    expect(p.push([100, 61, 100])).toEqual([]);
  });

  it('masks values to bytes', () => {
    expect(arr(new MidiStreamParser().push([0x190, 60, 100]))).toEqual([[0x90, 60, 100]]);
  });
});
