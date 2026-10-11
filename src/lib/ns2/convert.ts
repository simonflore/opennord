/**
 * Stage 2 record versions 0–6 → 7, as the OS 3.00 load path converts them.
 *
 * The record keeps its size (519 bytes); each step rewrites a few fields in
 * place, per slot (slot B = slot A + 249 bytes). Reimplemented from the
 * firmware's behaviour, step by step (version → version + 1):
 *
 * - 0 → 1 (FUN_30079744): the synth container (256 bits from data bit 1416 in
 *   slot A) had another layout — oscillator shape and filter frequency with five
 *   morph deltas each, separate LFO amounts for shape and filter, the 32-bit
 *   sample hash later, the resonance last. It is rebuilt in the current layout:
 *   the first three deltas become Wheel / After Touch / Ctrl Pedal (the last two
 *   are dropped); the shape-mod and filter-mod amounts take the old value when it
 *   is above 64, else 63 − LFO amount / 2 (63 when the LFO amount is 0); the
 *   oscillator detune takes the old shape value (sic) with each shape delta
 *   × 25 / 128 (rounded down); skip-attack is 0; the old velocity amount goes to
 *   filter mod 1.
 * - 1 → 2 (FUN_30079188): the two filter-mod amounts are remapped (below 64 the
 *   mod 2 amount a gives mod 1 = (63 − a) · 127 / 63 and mod 2 = (127 − mod 1) ·
 *   64 / 127, integer division; else mod 1 = 0), and the LFO waveform index
 *   moves up by one.
 * - 2 → 3 (FUN_300789EE): the organ and synth levels move to a new curve,
 *   F(x) = trunc(√(((x ± 0.5) / 127)² · g) · 127) with g = 0.7079 (organ) and
 *   0.3548 (synth); each morph delta d becomes F(level + d) − F(level).
 * - 3 → 4 (FUN_30078066): glide, voice mode, unison and vibrato mode (15 bits)
 *   move from the start of the arpeggiator/LFO container to the synth container.
 * - 4 → 5: the version only.
 * - 5 → 6 (FUN_30078496): the piano's and the sample's 32-bit name hashes are
 *   computed from the names of the installed library sounds (MurmurHash2 of the
 *   name, see docs/STAGE2-3-FIRMWARE.md). OpenNord can't see the instrument's
 *   library, so it leaves them 0 (unknown) and says so.
 * - 6 → 7: piano dynamics 0, 1, 2, 3 → 1, 2, 2, 3.
 *
 * NSM refuses Stage 2 programs below version 6, but the instrument converts
 * them; OpenNord reads them as the instrument does. Pure; never throws.
 */
import { recordEditor, type RecordConverter, type RecordEditor } from '../clavia/record-convert';
import { NS2_LAYOUT, type Ns2FieldKey } from './layout.generated';

type Slot = 'A' | 'B';
type Ed = RecordEditor<Ns2FieldKey>;

const BIT = new Map<string, number>(NS2_LAYOUT.fields.map((f) => [f.key, f.bit]));
const bitOf = (key: Ns2FieldKey): number => BIT.get(key) ?? 0;

/** The note shown for a file from before version 6, whose sound names can't be resolved. */
export const NS2_NAMELESS_SOUNDS_NOTE =
  'This program comes from an early Stage 2 OS that stored its piano and synth sample by their place in the ' +
  'instrument’s library instead of by name, so OpenNord can’t tell which piano or sample it uses.';

/** The level curve of the 2 → 3 step. */
function levelCurve(x: number, g: number): number {
  const t = (x + (x < 0 ? -0.5 : 0.5)) / 127;
  return Math.trunc(Math.sqrt(t * t * g) * 127);
}

const SOURCES = ['morphWheel', 'morphAfterTouch', 'morphCtrlPedal'] as const;

/** 0 → 1: rebuild one slot's synth container from the version 0 layout. */
function synthV0(r: Ed, s: Slot): void {
  const y = (k: string) => `slot${s}_synth.${k}` as Ns2FieldKey;
  const base = bitOf(y('modEnvelopeAttack'));
  const at = (o: number, w: number) => r.bits(base + o, w);
  const delta = (o: number, i: number) => r.signedBits(base + o + 8 * i, 8);
  const head = at(0, 35); // mod envelope A/D/R + velocity, oscillator mode and waveform: unchanged
  const shapeDeltas = [0, 1, 2].map((i) => delta(35, i));
  const shape = at(75, 7);
  const shapeModAmount = at(82, 7);
  const oscLfoAmount = at(89, 7);
  const freqDeltas = [0, 1, 2].map((i) => delta(96, i));
  const freq = at(136, 7);
  const fltModAmount = at(143, 7);
  const fltLfoAmount = at(150, 7);
  const fltVelAmount = at(157, 7);
  const kbTrack = at(164, 1);
  const filterMode = at(165, 3);
  const amp = [at(168, 7), at(175, 7), at(182, 7), at(189, 1)];
  const lfoRate = at(190, 7);
  const lfoWave = at(197, 2);
  const hashHi = at(199, 16);
  const hashLo = at(215, 16);
  const resonance = at(231, 7);
  const reserved = at(238, 18);
  /** Above 64 the amount stays; else it comes from the LFO amount. */
  const modAmount = (amount: number, lfo: number) => (amount > 64 ? amount : lfo === 0 ? 63 : 63 - (lfo >> 1));

  for (let o = 0; o < 256; o += 32) r.setBits(base + o, 32, 0);
  r.setBits(base, 35, head);
  SOURCES.forEach((m, i) => {
    r.set(y(`oscShape.${m}`), shapeDeltas[i]);
    r.set(y(`oscDetune.${m}`), (shapeDeltas[i] * 25) >> 7);
    r.set(y(`filterFrequency.${m}`), freqDeltas[i]);
  });
  r.set(y('oscShape'), shape);
  r.set(y('shapeModAmount'), modAmount(shapeModAmount, oscLfoAmount));
  r.set(y('oscDetune'), shape);
  r.set(y('sampSkipAttack'), 0);
  r.set(y('filterFrequency'), freq);
  r.set(y('filterResonance'), resonance);
  r.set(y('fltFreqMod2Amount'), modAmount(fltModAmount, fltLfoAmount));
  r.set(y('fltFreqMod1Amount'), fltVelAmount);
  r.set(y('fltKBTTrack'), kbTrack);
  r.set(y('filterMode'), filterMode);
  r.set(y('ampEnvelopeAttack'), amp[0]);
  r.set(y('ampEnvelopeDecay'), amp[1]);
  r.set(y('ampEnvelopeRelease'), amp[2]);
  r.set(y('ampEnvelopeVelocity'), amp[3]);
  r.set(y('lFORate'), lfoRate);
  r.set(y('lFOWave'), lfoWave);
  r.setBits(base + 198, 16, hashHi);
  r.setBits(base + 214, 16, hashLo);
  r.setBits(base + 230, 26, reserved); // written 26 bits wide: the old 18 bits land at 238
}

/** 1 → 2: the filter-mod amounts and the LFO waveform. */
function filterModV1(r: Ed, s: Slot): void {
  const y = (k: string) => `slot${s}_synth.${k}` as Ns2FieldKey;
  const a = r.get(y('fltFreqMod2Amount'));
  const v = r.get(y('fltFreqMod1Amount'));
  if (a < 64) {
    r.set(y('fltFreqMod1Amount'), Math.floor(((63 - a) * 127) / 63));
    r.set(y('fltFreqMod2Amount'), Math.floor(((127 - v) * 64) / 127));
  } else {
    r.set(y('fltFreqMod1Amount'), 0);
  }
  r.set(y('lFOWave'), r.get(y('lFOWave')) + 1);
}

/** 2 → 3: the organ and synth level curves, morph deltas included. */
function levelsV2(r: Ed, s: Slot): void {
  for (const [key, g] of [[`slot${s}_common.organLevel`, 0.7079], [`slot${s}_common.synthLevel`, 0.3548]] as const) {
    const level = r.get(key as Ns2FieldKey);
    const now = levelCurve(level, g);
    for (const m of SOURCES) {
      const d = `${key}.${m}` as Ns2FieldKey;
      r.set(d, levelCurve(level + r.get(d), g) - now);
    }
    r.set(key as Ns2FieldKey, now);
  }
}

/** 3 → 4: glide / voice / unison / vibrato move from the arp/LFO container to the synth one. */
function synthModesV3(r: Ed, s: Slot): void {
  const from = bitOf(`slot${s}_arpLfo.arpeggiatorRun`) - 15;
  r.setBits(bitOf(`slot${s}_synth.glideRate`), 15, r.bits(from, 15));
}

/** 5 → 6: the sound-name hashes can't be computed without the instrument's library: 0 = unknown. */
function nameHashesV5(r: Ed, s: Slot): void {
  for (const k of ['piano.param9', 'piano.param10', 'piano.param11', 'synth.param22', 'synth.param23', 'synth.param24']) {
    r.set(`slot${s}_${k}` as Ns2FieldKey, 0);
  }
}

const PIANO_DYNAMICS_V6 = [1, 2, 2, 3] as const;

/** 6 → 7: piano dynamics. */
function dynamicsV6(r: Ed, s: Slot): void {
  const k = `slot${s}_piano.pianoDynamics` as Ns2FieldKey;
  r.set(k, PIANO_DYNAMICS_V6[r.get(k)] ?? 0);
}

const STEPS: readonly ((r: Ed, s: Slot) => void)[] = [
  synthV0, filterModV1, levelsV2, synthModesV3, () => {}, nameHashesV5, dynamicsV6,
];

/** Convert Stage 2 record data (in place) from `from` (0–6) to version 7. */
export const convertNs2: RecordConverter = (data, from) => {
  const r = recordEditor<Ns2FieldKey>(data, NS2_LAYOUT);
  for (let v = Math.max(0, from); v < STEPS.length; v++) {
    for (const s of ['A', 'B'] as const) STEPS[v](r, s);
  }
  return from < 6 ? [NS2_NAMELESS_SOUNDS_NOTE] : [];
};
