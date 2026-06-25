/** Parse one raw MIDI message into a note/sustain event for the rompler, or null
 *  if it's not relevant. Omni: the channel nibble is ignored. Note-on with
 *  velocity 0 is a note-off (running-status convention). Sustain = CC#64. */
export type MidiNoteEvent =
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'noteOff'; note: number }
  | { type: 'sustain'; down: boolean };

const SUSTAIN_CC = 64;

export function parseNoteMessage(data: ArrayLike<number>): MidiNoteEvent | null {
  if (data.length < 3) return null;
  const status = data[0] & 0xf0;
  const a = data[1];
  const b = data[2];
  if (status === 0x90) return b > 0 ? { type: 'noteOn', note: a, velocity: b } : { type: 'noteOff', note: a };
  if (status === 0x80) return { type: 'noteOff', note: a };
  if (status === 0xb0 && a === SUSTAIN_CC) return { type: 'sustain', down: b >= 64 };
  return null;
}
