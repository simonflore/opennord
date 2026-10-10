/**
 * Organ engine parameters, and the bridge from a decoded Stage 4 organ layer.
 *
 * The engine speaks plain numbers (drawbar positions 0..8, dB, flags). This
 * module turns the decoded program's display strings ("4", "-4.7 dB",
 * "B3->C1; VOX->V2; …", Farfisa tab strings) into those numbers, and applies
 * the wheel / aftertouch / pedal morphs when a caller passes morph amounts.
 */
import type { Morphable, NS4Layer, Ns4OrganFx } from '../../ns4/types';
import { vibChorusTypeFor } from '../../ns4/view';
import {
  DEFAULT_ORGAN_PARAMS, ORGAN_ENGINE_MODELS, VOLUME_OFF_DB, type OrganModel, type OrganParams, type VibChorusType,
} from './types';

/** How far each morph source is pushed, 0..1. Absent sources count as 0. */
export interface MorphAmounts { wheel?: number; aftertouch?: number; pedal?: number }

/** Normalize a decoded model string ("B3", "PIPE1", "b3 bass") to an engine model, B3 when unknown. */
export function toOrganModel(s: string | undefined): OrganModel {
  const u = (s ?? '').trim().toUpperCase();
  return (ORGAN_ENGINE_MODELS as readonly string[]).includes(u) ? (u as OrganModel) : 'B3';
}

/**
 * One drawbar display value → position 0..8. Numbers pass through. The Farfisa
 * model's tabs decode as the lit LED group: "1+2+3+4" (lower half, tab off) or
 * "5+6+7+8" (upper half, tab on). The Vox's ninth control decodes as a 1..5
 * selector ("1".."4", "4+5"); it is not a level and stays unvoiced, so it maps
 * to its selector index for completeness.
 */
export function drawbarPosition(display: string | undefined): number {
  if (display == null) return 0;
  const s = display.trim();
  if (s === '' || s === 'none') return 0;
  if (s === '5+6+7+8') return 8;
  if (s === '1+2+3+4') return 0;
  if (s === '4+5') return 5;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? Math.max(0, Math.min(8, n)) : 0;
}

/**
 * "-4.7 dB" → −4.7; a silent setting ("volume off", as the Stage 4 volume table
 * shows raw 0, or "-oo dB" / "-∞") → −Infinity; unparseable → 0.
 */
export function parseDb(display: string | undefined): number {
  if (/oo|∞|inf|\boff\b/i.test(display ?? '')) return -Infinity;
  const n = Number.parseFloat((display ?? '').replace(/[^0-9+\-.]/g, ' ').trim().split(/\s+/)[0] ?? '');
  return Number.isFinite(n) ? n : 0;
}

/** "C1" / "v3" → typed vib/chorus setting, or undefined. */
export function parseVibChorus(s: string | undefined): VibChorusType | undefined {
  const m = /^\s*([VC])\s*([123])\s*$/i.exec(s ?? '');
  return m ? (`${m[1].toUpperCase()}${m[2]}` as VibChorusType) : undefined;
}

/**
 * The layer volume knob's position (0..1) for a level in dB, and back. The Stage 4
 * volume table is dB = 40·log10(raw / 127) (raw 1 = −84.2 dB, 64 = −11.9 dB, 127 =
 * 0 dB; values.generated.ts "095-7"), so the position is 10^(dB / 40) and "volume
 * off" is position 0. Morphing in knob position, as the instrument moves its own
 * raw value, keeps a swell from silence finite: no −Infinity arithmetic, no NaN.
 */
function volumePosition(display: string | undefined): number {
  const db = parseDb(display);
  return Number.isFinite(db) ? 10 ** (db / 40) : 0;
}
function positionDb(pos: number): number {
  return pos > 0 ? Math.max(VOLUME_OFF_DB, 40 * Math.log10(pos)) : VOLUME_OFF_DB;
}

/** Linear morph: base moved toward each assigned target by that source's amount. */
function morphNumber<T extends string>(
  m: Morphable<T> | undefined, toNum: (s: string | undefined) => number, amt: MorphAmounts,
): number {
  if (!m) return toNum(undefined);
  const base = toNum(m.value);
  let v = base;
  const push = (target: T | undefined, a: number | undefined) => {
    if (target === undefined || !a) return;
    v += Math.max(0, Math.min(1, a)) * (toNum(target) - base);
  };
  push(m.wheel, amt.wheel);
  push(m.aftertouch, amt.aftertouch);
  push(m.pedal, amt.pedal);
  return v;
}

/**
 * Engine params for one decoded organ layer. `organFx` supplies the global
 * vib/chorus type map; `morph` (optional) applies the program's wheel /
 * aftertouch / pedal assignments to the drawbars and volume.
 */
export function organParamsFromLayer(
  layer: NS4Layer, organFx?: Ns4OrganFx, morph: MorphAmounts = {},
): OrganParams {
  const model = toOrganModel(layer.organModel);
  const drawbars = Array.from({ length: 9 }, (_, i) => {
    const v = morphNumber(layer.drawbars?.[i], drawbarPosition, morph);
    // Farfisa tabs are switches: a morph flips them past half-way, never fades.
    return model === 'FARF' ? (v >= 4 ? 8 : 0) : Math.max(0, Math.min(8, v));
  });
  const perc = layer.percussion ?? {};
  return {
    model,
    drawbars,
    percussion: {
      on: !!perc.on,
      harm3rd: !!perc.harm3rd,
      decayFast: !!perc.decayFast,
      volSoft: !!perc.volSoft,
    },
    vibrato: {
      on: !!layer.vibChorus,
      type: parseVibChorus(vibChorusTypeFor(organFx, layer.organModel)) ?? 'C3',
    },
    volumeDb: layer.volume ? positionDb(morphNumber(layer.volume, volumePosition, morph)) : 0,
    octaveShift: layer.octaveShift ?? 0,
    sustain: !!layer.organSustain,
    keyClick: DEFAULT_ORGAN_PARAMS.keyClick,
  };
}
