/**
 * Universal MIDI Packet (UMP) words → MIDI 1.0 byte stream.
 *
 * On iOS 14+ CoreMIDI delivers input as a MIDIEventList of UMP words. The iPad
 * plugin asks for the MIDI 1.0 protocol, so in practice we get message type 0x2
 * (MIDI 1.0 channel voice), 0x1 (system common / real-time) and 0x3 (7-bit
 * SysEx in 6-byte chunks). A MIDI 2.0 source (type 0x4) is down-converted for
 * the messages a keyboard actually plays (notes, CC, pressure, program, bend);
 * the rest of UMP (utility, flex data, stream, 8/16-byte data) has no MIDI 1.0
 * byte form a player needs, and is skipped by its declared packet size.
 *
 * The output is a flat MIDI 1.0 byte stream; feed it through a per-source
 * {@link MidiStreamParser} to get whole messages (SysEx chunks are only joined
 * there). Reference: MIDI Association, "Universal MIDI Packet (UMP) Format and
 * MIDI 2.0 Protocol" v1.1, §2 (message types) and §7 (translation to MIDI 1.0).
 */
import { dataLengthForStatus } from './midi-stream';

/** Size of one UMP message in 32-bit words, by message type (high nibble). */
export function umpWordCount(messageType: number): number {
  switch (messageType & 0xf) {
    case 0x0: case 0x1: case 0x2: case 0x6: case 0x7:
      return 1;
    case 0x3: case 0x4: case 0x8: case 0x9: case 0xa:
      return 2;
    case 0xb: case 0xc:
      return 3;
    default: // 0x5, 0xd, 0xe, 0xf
      return 4;
  }
}

/** Scale an n-bit unsigned value down to 7 bits (MIDI 2.0 → 1.0, spec §7.1). */
function to7(value: number, bits: number): number {
  return (value >>> (bits - 7)) & 0x7f;
}

function midi2ChannelVoice(w0: number, w1: number, out: number[]): void {
  const opcode = (w0 >>> 20) & 0xf;
  const channel = (w0 >>> 16) & 0xf;
  const index = (w0 >>> 8) & 0x7f;
  switch (opcode) {
    case 0x8: // note off: velocity is the top 16 bits of w1
      out.push(0x80 | channel, index, to7(w1 >>> 16, 16));
      return;
    case 0x9: {
      // A MIDI 2.0 Note On is always a note-on — velocity 0 included (UMP spec,
      // MIDI 2.0 → 1.0 translation: velocity 0 becomes 1). 7-bit 0 would mean off.
      const v7 = Math.max(1, to7(w1 >>> 16, 16));
      out.push(0x90 | channel, index, v7);
      return;
    }
    case 0xa: // poly pressure
      out.push(0xa0 | channel, index, to7(w1, 32));
      return;
    case 0xb: // control change
      out.push(0xb0 | channel, index, to7(w1, 32));
      return;
    case 0xc: // program change (bank-valid option bit ignored)
      out.push(0xc0 | channel, (w1 >>> 24) & 0x7f);
      return;
    case 0xd: // channel pressure
      out.push(0xd0 | channel, to7(w1, 32));
      return;
    case 0xe: { // pitch bend: 32-bit → 14-bit
      const v14 = (w1 >>> 18) & 0x3fff;
      out.push(0xe0 | channel, v14 & 0x7f, v14 >>> 7);
      return;
    }
    default: // registered/assignable per-note controllers etc.: no 1.0 form needed
  }
}

/**
 * Convert UMP words to a MIDI 1.0 byte stream. Truncated trailing messages
 * (fewer words than the type declares) are dropped.
 */
export function umpToMidi1Bytes(words: ArrayLike<number>): number[] {
  const out: number[] = [];
  let i = 0;
  while (i < words.length) {
    const w0 = words[i] >>> 0;
    const mt = w0 >>> 28;
    const size = umpWordCount(mt);
    if (i + size > words.length) break;
    if (mt === 0x1) {
      // System common / real-time: status + up to 2 data bytes.
      const status = (w0 >>> 16) & 0xff;
      const n = dataLengthForStatus(status);
      out.push(status);
      if (n >= 1) out.push((w0 >>> 8) & 0x7f);
      if (n >= 2) out.push(w0 & 0x7f);
    } else if (mt === 0x2) {
      // MIDI 1.0 channel voice: the bytes are in the low 24 bits verbatim.
      const status = (w0 >>> 16) & 0xff;
      if (status >= 0x80 && status < 0xf0) {
        out.push(status, (w0 >>> 8) & 0x7f);
        if (dataLengthForStatus(status) === 2) out.push(w0 & 0x7f);
      }
    } else if (mt === 0x3) {
      // 7-bit SysEx: status nibble 0 = complete, 1 = start, 2 = continue, 3 = end.
      const w1 = words[i + 1] >>> 0;
      const form = (w0 >>> 20) & 0xf;
      const count = Math.min((w0 >>> 16) & 0xf, 6);
      const payload = [
        (w0 >>> 8) & 0x7f, w0 & 0x7f,
        (w1 >>> 24) & 0x7f, (w1 >>> 16) & 0x7f, (w1 >>> 8) & 0x7f, w1 & 0x7f,
      ];
      if (form === 0 || form === 1) out.push(0xf0);
      for (let k = 0; k < count; k++) out.push(payload[k]);
      if (form === 0 || form === 3) out.push(0xf7);
    } else if (mt === 0x4) {
      midi2ChannelVoice(w0, words[i + 1] >>> 0, out);
    }
    i += size;
  }
  return out;
}
