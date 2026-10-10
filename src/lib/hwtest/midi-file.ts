/**
 * Standard MIDI files for the hardware test kit: a fixed velocity sweep and a few held keys,
 * so a take can be repeated exactly from any DAW or MIDI player (`docs/HARDWARE-TEST-PLAN.md`).
 */

export interface MidiNote {
  /** MIDI note number. */
  note: number;
  /** 1–127. */
  velocity: number;
  /** Start and length in seconds. */
  startS: number;
  durS: number;
}

const PPQ = 480;
/** 120 BPM: 500,000 µs per quarter note, so one second is 960 ticks. */
const TICKS_PER_S = (PPQ * 120) / 60;

function vlq(n: number): number[] {
  const out = [n & 0x7f];
  for (let v = n >>> 7; v > 0; v >>>= 7) out.unshift((v & 0x7f) | 0x80);
  return out;
}

/** A format-0 MIDI file at 120 BPM with these notes on `channel` (0 = MIDI channel 1). */
export function writeMidiFile(notes: readonly MidiNote[], channel = 0): Uint8Array {
  const ch = channel & 0x0f;
  const events: { tick: number; order: number; bytes: number[] }[] = [];
  for (const n of notes) {
    const on = Math.round(n.startS * TICKS_PER_S);
    const off = Math.round((n.startS + n.durS) * TICKS_PER_S);
    events.push({ tick: on, order: 1, bytes: [0x90 | ch, n.note & 0x7f, Math.max(1, Math.min(127, Math.round(n.velocity)))] });
    events.push({ tick: off, order: 0, bytes: [0x80 | ch, n.note & 0x7f, 64] }); // note-offs first at equal ticks
  }
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const track: number[] = [0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20]; // tempo 500,000 µs/quarter
  let tick = 0;
  for (const e of events) {
    track.push(...vlq(e.tick - tick), ...e.bytes);
    tick = e.tick;
  }
  track.push(0x00, 0xff, 0x2f, 0x00); // end of track
  const len = track.length;
  return Uint8Array.from([
    0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, PPQ >> 8, PPQ & 0xff, // MThd: format 0, 1 track
    0x4d, 0x54, 0x72, 0x6b, (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff,
    ...track,
  ]);
}

/** The sweep's velocities, loudest first: 127, then down in steps of 8 to 7. */
export const SWEEP_VELOCITIES: readonly number[] = [127, ...Array.from({ length: 15 }, (_, i) => 119 - 8 * i)];

/** One key at each sweep velocity: held 1.2 s, a new note every 2.5 s. */
export function velocitySweep(note: number, velocities: readonly number[] = SWEEP_VELOCITIES): MidiNote[] {
  return velocities.map((velocity, i) => ({ note, velocity, startS: 0.5 + 2.5 * i, durS: 1.2 }));
}

/**
 * Compressor timing: a soft A2 held 6 s, and a loud C5–E5–G5 burst at 2.5 s for 0.25 s. While
 * the burst sounds the compressor pulls the A2 down; after it, the A2 comes back up at the
 * compressor's release speed.
 */
export function compressorBurst(): MidiNote[] {
  return [
    { note: 45, velocity: 40, startS: 0.5, durS: 6 },
    ...[72, 76, 79].map((note) => ({ note, velocity: 127, startS: 2.5, durS: 0.25 })),
  ];
}

/** Several keys one after another at one velocity: held `holdS`, then `gapS` of silence. */
export function heldKeys(notes: readonly number[], velocity = 100, holdS = 3, gapS = 1.5): MidiNote[] {
  return notes.map((note, i) => ({ note, velocity, startS: 0.5 + (holdS + gapS) * i, durS: holdS }));
}
