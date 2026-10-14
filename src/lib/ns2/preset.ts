/**
 * Stage 2 synth preset (`.ns2s`) reader.
 *
 * A synth preset is one container of a Stage 2 program record: after the u16
 * record version come the 32 bytes of a slot's synth container, the 256 bits a
 * `.ns2p` keeps from record bit 1416 in slot A (convert.ts), in the same layout.
 * So the preset reads with the program's own `slotA_synth` fields: oscillator,
 * filter, envelopes, LFO, voice and the sample's name hash. The synth's level,
 * zone and octave (the slot's common container) and the arpeggiator and LFO
 * master clock (its arp/LFO container) are program settings and not part of a
 * preset; they read as their defaults. Checked on the ten `.ns2s` in fixtures/
 * (78 bytes, NSM-era header, record version 6): every field is inside its range
 * and every one reads as a sample synth, as their names (pianos, a drum kit, a
 * pad) suggest. Chris55's nord-documentation (BSD-3-Clause, "NS2 Synth File
 * Structure") gives the same place: the program's bytes 0x00DF–0x00FE, which is
 * data byte 177 behind the NSM-era header's 0x2E. Their values differ from the
 * sample synths of the Stage 2 programs on hand (a low cutoff, LFO rate 127), so
 * these presets are just set that way; nothing else has confirmed a value.
 */
import { readLegacyFile, type LegacyLayout } from '../clavia/legacy-record';
import { NS2_LAYOUT, type Ns2FieldKey } from './layout.generated';
import { ns2SynthOf, type Ns2SynthSlot } from './decode';

const SYNTH_FIELDS = NS2_LAYOUT.fields.filter((f) => f.key.startsWith('slotA_synth.'));
/** Record bit where slot A's synth container starts (its first field). */
const CONTAINER_BIT = Math.min(...SYNTH_FIELDS.map((f) => f.bit));

/** The record version seen on real synth presets; the container layout is the program's at it. */
const KNOWN_VERSION = 6;

/** The program layout narrowed to the synth container (256 bits), its bits counted from the container's start. */
export const NS2_SYNTH_PRESET_LAYOUT: LegacyLayout<Ns2FieldKey> = {
  ...NS2_LAYOUT,
  unit: 'synth preset',
  recordVersion: KNOWN_VERSION,
  dataBytes: 32,
  fields: SYNTH_FIELDS.map((f) => ({ ...f, bit: f.bit - CONTAINER_BIT })),
};

export interface Ns2SynthPreset {
  /** The record version stored in front of the container. */
  readonly recordVersion: number;
  /** The synth container's fields by program key (`slotA_synth.*`). */
  readonly values: Partial<Record<Ns2FieldKey, number>>;
  /** The synth, read as the Program view reads slot A's (program settings at their defaults). */
  readonly synth: Ns2SynthSlot;
  readonly warnings: readonly string[];
}

/** Decode a Stage 2 synth preset. Never throws. */
export function decodeNs2SynthPreset(bytes: Uint8Array): Ns2SynthPreset {
  // No version list: the instrument's set is unknown, so the warning says what OpenNord has seen.
  const read = readLegacyFile(bytes, NS2_SYNTH_PRESET_LAYOUT, []);
  const warnings = read.recordVersion === KNOWN_VERSION ? read.warnings : [
    ...read.warnings,
    `This synth preset is version ${read.recordVersion}; OpenNord has only read version ${KNOWN_VERSION}, so some settings may show wrong.`,
  ];
  return { recordVersion: read.recordVersion, values: read.values, synth: ns2SynthOf(read.values), warnings };
}
