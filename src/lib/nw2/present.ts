/**
 * Nord Wave 2 → DecodedProgram. Surfaces the confirmed per-slot layer on/off +
 * volume (Stage synth engine head) and the slot drawbar values. Oscillator/filter/
 * envelope params are identified but not yet field-decoded.
 */
import { decodeNw2 } from './decode';
import type { Nw2VoiceSlot } from './types';
import type { DecodedProgram, DecodedSection } from '../clavia/decoded';

function slotSection(i: number, s: Nw2VoiceSlot): DecodedSection {
  const parts = [s.on ? `on · level ${s.volume}` : 'off'];
  // Slot source kind is confirmed (bundle meta.xml correlation, see types.ts).
  parts.push(s.waveform.kind === 'sample' ? 'Sample' : 'Oscillator');
  return { id: `S${i}`, label: `SLOT ${i + 1}`, engines: [{ label: 'Voice', parts }] };
}

export function nw2Decoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNw2(bytes);
  return {
    title: 'Nord Wave 2 · Program',
    header: [['Version', `v${p.version}`]],
    sections: p.slots.map((s, i) => slotSection(i, s)),
    note: 'Wave 2: per-slot layer on/off + volume confirmed (Stage synth engine head). Oscillator/filter/envelope params identified but not yet decoded.',
    warnings: p.warnings,
  };
}
