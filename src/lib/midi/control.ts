/**
 * Decode live MIDI Control Change / NRPN into high-level "a control moved" events.
 *
 * The Nord's panel can transmit parameter moves over its USB-MIDI interface as CC
 * or NRPN. We pair these with the USB byte-diff to auto-label a captured change:
 * MIDI says *what* moved (CC#/NRPN + value), the diff says *where* it's stored.
 *
 * NRPN spans several CC messages (param MSB=99, param LSB=98, data MSB=6, data
 * LSB=38), so decoding is stateful — feed every message through one decoder.
 */

export interface MidiControlEvent {
  kind: 'cc' | 'nrpn';
  channel: number; // 0-15
  /** CC number (0-127) or 14-bit NRPN parameter. */
  controller: number;
  /** CC value (0-127) or NRPN data value (7- or 14-bit). */
  value: number;
  /** Human-ish id, e.g. "CC 70" or "NRPN 1:23". */
  label: string;
}

const CONTROL_CHANGE = 0xb0;

/** Stateful CC/NRPN decoder. Returns an event for a meaningful control move, else null. */
export class MidiControlDecoder {
  // Per-channel NRPN assembly state.
  private nrpn: Array<{ msb?: number; lsb?: number; dataMsb?: number }> = [];

  /** Feed one raw MIDI message (status, data1, data2). */
  decode(data: ArrayLike<number>): MidiControlEvent | null {
    if (data.length < 3) return null;
    const status = data[0];
    if ((status & 0xf0) !== CONTROL_CHANGE) return null; // only Control Change carries CC/NRPN
    const ch = status & 0x0f;
    const num = data[1];
    const val = data[2];
    const st = (this.nrpn[ch] ??= {});

    switch (num) {
      case 99: st.msb = val; return null; // NRPN parameter MSB
      case 98: st.lsb = val; return null; // NRPN parameter LSB
      case 101: case 100: // RPN select → cancel any pending NRPN
        st.msb = st.lsb = st.dataMsb = undefined;
        return null;
      case 6: // data entry MSB
        if (st.msb !== undefined && st.lsb !== undefined) {
          st.dataMsb = val;
          return { kind: 'nrpn', channel: ch, controller: (st.msb << 7) | st.lsb, value: val, label: `NRPN ${st.msb}:${st.lsb}` };
        }
        return { kind: 'cc', channel: ch, controller: 6, value: val, label: 'CC 6' };
      case 38: // data entry LSB → refine a pending NRPN to 14-bit
        if (st.msb !== undefined && st.lsb !== undefined && st.dataMsb !== undefined) {
          return { kind: 'nrpn', channel: ch, controller: (st.msb << 7) | st.lsb, value: (st.dataMsb << 7) | val, label: `NRPN ${st.msb}:${st.lsb}` };
        }
        return { kind: 'cc', channel: ch, controller: 38, value: val, label: 'CC 38' };
      default:
        return { kind: 'cc', channel: ch, controller: num, value: val, label: `CC ${num}` };
    }
  }
}
