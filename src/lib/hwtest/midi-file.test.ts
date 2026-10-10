import { describe, it, expect } from 'vitest';
import { compressorBurst, heldKeys, SWEEP_VELOCITIES, velocitySweep, writeMidiFile } from './midi-file';

/** Minimal format-0 reader: [tick, status, data1, data2] channel events. */
function readEvents(b: Uint8Array): number[][] {
  expect(String.fromCharCode(...b.subarray(0, 4))).toBe('MThd');
  expect(String.fromCharCode(...b.subarray(14, 18))).toBe('MTrk');
  const len = (b[18] << 24) | (b[19] << 16) | (b[20] << 8) | b[21];
  expect(22 + len).toBe(b.length);
  const out: number[][] = [];
  let p = 22;
  let tick = 0;
  while (p < b.length) {
    let d = 0;
    for (;;) { const v = b[p++]; d = (d << 7) | (v & 0x7f); if (!(v & 0x80)) break; }
    tick += d;
    if (b[p] === 0xff) { const l = b[p + 2]; p += 3 + l; continue; }
    out.push([tick, b[p], b[p + 1], b[p + 2]]);
    p += 3;
  }
  return out;
}

describe('writeMidiFile', () => {
  it('writes a format-0 file at 480 PPQ / 120 BPM (960 ticks per second)', () => {
    const b = writeMidiFile([{ note: 69, velocity: 100, startS: 0.5, durS: 1 }]);
    expect(Array.from(b.subarray(8, 14))).toEqual([0, 0, 0, 1, 1, 0xe0]);
    expect(readEvents(b)).toEqual([[480, 0x90, 69, 100], [1440, 0x80, 69, 64]]);
    expect(Array.from(b.subarray(b.length - 4))).toEqual([0, 0xff, 0x2f, 0]);
  });

  it('encodes long gaps as multi-byte delta times', () => {
    const b = writeMidiFile([{ note: 60, velocity: 1, startS: 40, durS: 1 }]);
    expect(readEvents(b)[0]).toEqual([38400, 0x90, 60, 1]);
  });

  it('puts the sweep on channel 1, loudest first, 2.5 s apart', () => {
    expect(SWEEP_VELOCITIES).toHaveLength(16);
    expect(SWEEP_VELOCITIES[0]).toBe(127);
    expect(SWEEP_VELOCITIES[15]).toBe(7);
    const ons = readEvents(writeMidiFile(velocitySweep(69))).filter((e) => e[1] === 0x90);
    expect(ons.map((e) => e[3])).toEqual([...SWEEP_VELOCITIES]);
    expect(ons[1][0] - ons[0][0]).toBe(2400);
  });

  it('writes the compressor burst: a soft held A2 under a loud chord', () => {
    const ev = readEvents(writeMidiFile(compressorBurst()));
    expect(ev.filter((e) => e[1] === 0x90).map((e) => [e[0], e[2], e[3]])).toEqual([[480, 45, 40], [2400, 72, 127], [2400, 76, 127], [2400, 79, 127]]);
  });

  it('holds keys one after another', () => {
    const ev = readEvents(writeMidiFile(heldKeys([57, 68, 69], 100, 3, 1.5)));
    expect(ev.filter((e) => e[1] === 0x90).map((e) => [e[0], e[2]])).toEqual([[480, 57], [4800, 68], [9120, 69]]);
  });
});
