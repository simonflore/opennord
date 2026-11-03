/**
 * A Stage 3 program's stored settings, as the instrument plays them: the body
 * read against the OS 2.64 layout (layout.generated.ts), the settings a 3.x
 * format added set to their defaults, and the firmware's load-time fix-ups
 * applied (convert.ts). No display tables: decode.ts turns these values into
 * words. Kept apart so a caller that needs only the values (the writer, a
 * model-agnostic reader) doesn't take the display tables with them.
 */
import { decodeFwProgram, type FwProgram } from '../clavia/block-chain';
import { NS3_LAYOUT, type Ns3FieldKey } from './layout.generated';
import { convertNs3Values } from './convert';

type Values = Partial<Record<Ns3FieldKey, number>>;
type Slot = 'A' | 'B';

const DEFAULTS = new Map<Ns3FieldKey, number>(NS3_LAYOUT.fields.map((f) => [f.key, f.def]));

/**
 * Parameters added inside 3.x took reserved (zero) bits; on loading an older 3.x
 * file the firmware sets them to their defaults (version fix-ups,:
 * Pitch Stick Range 1 below 3.03, the Extern volume-pedal switches on below
 * 3.04 — both their defaults). The other fix-ups (Dual-KB style below 3.02, the
 * 3.00 delay rate) change stored values; convert.ts applies them.
 */
const ADDED_IN: readonly { before: number; keys: readonly Ns3FieldKey[] }[] = [
  { before: 303, keys: ['common.pitchStickRange'] },               // id 157
  { before: 304, keys: ['externA.volPedalEnable', 'externB.volPedalEnable'] }, // id 245
];

/** Fields a body of `formatVersion` does not store yet: the firmware loads them at their defaults. */
export function ns3FieldsAbsent(formatVersion: number): Ns3FieldKey[] {
  return ADDED_IN.filter((a) => formatVersion < a.before).flatMap((a) => a.keys);
}

function withVersionDefaults(values: Values, formatVersion: number): Values {
  const absent = ns3FieldsAbsent(formatVersion);
  if (absent.length === 0) return values;
  const out = { ...values };
  for (const k of absent) out[k] = DEFAULTS.get(k) ?? 0;
  return out;
}

/** Lowest body format the layout describes; 2.0x bodies (converted by the Nord on load) differ. */
const FIRST_LAYOUT_VERSION = NS3_LAYOUT.versionRange?.[0] ?? 300;

export interface Ns3Values {
  /** The layout read as stored. */
  readonly fw: FwProgram<Ns3FieldKey>;
  /** False for a body OpenNord doesn't read (a 2.0x one, or one the instrument refuses). */
  readonly layoutMatched: boolean;
  /** Every layout field as the instrument plays it; empty when `layoutMatched` is false. */
  readonly values: Values;
  readonly warnings: readonly string[];
  /** Panels whose free-running delay rate is kept on the OS 3.00 scale (0–127). */
  readonly os300DelayRate: readonly Slot[];
}

/** A Stage 3 program's settings, as the instrument plays them. Never throws. */
export function readNs3Values(bytes: Uint8Array): Ns3Values {
  const fw = decodeFwProgram(bytes, NS3_LAYOUT);
  let { layoutMatched, values, warnings } = fw;
  const v = fw.formatVersion;
  if (layoutMatched && v !== null && v < FIRST_LAYOUT_VERSION) {
    // A 2.0x body: Piano, SynthCommon and Organ have other sizes and fields
    // (firmware "Multi v1" registry), so reading it with the 3.x layout would misplace values.
    layoutMatched = false;
    values = {};
    warnings = [
      `This program uses the Stage 3's format ${(v / 100).toFixed(2)} from an early OS, which the Nord converts ` +
      `when it loads it. OpenNord reads formats ${(FIRST_LAYOUT_VERSION / 100).toFixed(2)}–` +
      `${((NS3_LAYOUT.versionRange?.[1] ?? 304) / 100).toFixed(2)}; showing the file header only.`,
    ];
  }

  let os300DelayRate: readonly Slot[] = [];
  if (layoutMatched && v !== null) {
    const c = convertNs3Values(withVersionDefaults(values, v), v);
    if (c.refused) {
      layoutMatched = false;
      values = {};
      warnings = [c.refused];
    } else {
      values = c.values;
      os300DelayRate = c.os300DelayRate;
      if (os300DelayRate.some((s) => values[`effects${s}.dlyEnable`] === 1)) {
        warnings = [...warnings,
          'This program comes from Stage 3 OS 3.00, which set the free-running delay time on its original ' +
          '0–127 scale. OpenNord shows that delay time as the file stores it, on the old scale.'];
      }
    }
  }
  return { fw, layoutMatched, values, warnings, os300DelayRate };
}
