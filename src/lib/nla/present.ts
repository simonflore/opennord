/**
 * Nord Lead A1 → DecodedProgram. The body is a 7-bit packed bitstream; the
 * confirmed leading fields are layer on/off + volume (Stage synth engine head).
 * Osc/filter/envelope/FX sections are identified but not yet field-decoded.
 */
import { decodeNla } from './decode';
import type { DecodedProgram } from '../clavia/decoded';

export function nlaDecoded(bytes: Uint8Array): DecodedProgram {
  const p = decodeNla(bytes);
  const parts = [p.layerOn ? `on · level ${p.volume}` : 'off'];
  return {
    title: 'Nord Lead A1 · Program',
    header: [['Version', `v${p.version}`]],
    sections: [{ id: 'V', label: 'VOICE', engines: [{ label: 'Synth', parts }] }],
    note: 'Lead A1: layer on/off + volume confirmed. The rest of the 7-bit bitstream (osc/filter/envelope/FX) is identified but not yet field-decoded.',
  };
}
