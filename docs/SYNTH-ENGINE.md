# Stage 4 synth engine (firmware RE notes)

How the Nord Stage 4 synth section works, recovered from Stage 4 OS v1.66, and what that
means for previewing a program's synth layer in the browser. This builds on the firmware work
in [`NSP-FORMAT.md`](NSP-FORMAT.md) (the 2026-10-10 sections): the `os.cab` unpack
([`scripts/fw-unpack.py`](../scripts/fw-unpack.py)), the DSP boot images
([`scripts/sharc-boot-split.py`](../scripts/sharc-boot-split.py),
[`scripts/sharcplus-image.py`](../scripts/sharcplus-image.py)), and the SHARC+ Ghidra module
([`tools/ghidra-sharc/`](../tools/ghidra-sharc/README.md)). The piano codec on DSP 4, decoded
the same way, is in `NSP-FORMAT.md` ("CNSP audio decoded").

Legal: this file documents structure, algorithms and addresses only (`LEGAL.md`). No
firmware bytes, tables, coefficients, wave data or audio are committed. Firmware-derived
outputs stay in local scratch folders.

Notation: ARM addresses are virtual addresses in the unpacked CODE image (base `0xC0000000`).
DSP code addresses are SHARC+ short-word (VISA) addresses (`sw:0x12xxxx`). DSP data addresses
are `dm:`. "Confirmed" means read directly from code or data. "Inferred" means it follows
from the structure but was not traced end to end.

## Summary

- **Where it runs (confirmed).** The synth voices run on three SHARC+ cores: DSP1 core 2,
  DSP2 core 1 and DSP2 core 2. All three have the same kernels at the same addresses
  (byte-identical code for every kernel checked); only the main loop and I/O routing differ.
- **How it is organised (confirmed).** The ARM host picks one oscillator kernel per voice
  from a 74-entry table and one filter kernel from a 7-entry table. It writes the chosen
  DSP code addresses into the voice slots. Each core's main loop calls the kernels through
  those pointers, in 4-sample blocks, for 16 voice slots per core.
- **Oscillators (confirmed for the kernels named below).** The analog oscillators are
  computed, not read from tables: polyBLEP saws, pulses built from two saws, polynomial
  sines and LCG noise. Each one fades out as its pitch approaches Nyquist. The WAVE
  oscillator, and the Super Organ / Saw Bright / Square Bright analog waves, read
  band-limited single-cycle wavetables through an 8-tap, 512-phase interpolator.
- **Wave data (confirmed).** The 16-bit data at `0xC0300000–0xC0430000` is the WAVE
  oscillator's wavetable set: 55 named waves. Each wave is a pyramid of band-limited single
  cycles, with 8 bands per octave, chosen from the pitch increment.
- **Filters (confirmed structure).** LP12, BP and HP are a trapezoidal (zero-delay-feedback)
  state-variable filter. LP24 is two of them in series. LPM is a four-stage one-pole ladder
  with a soft clipper in the feedback path. LPHP is a high-pass into a low-pass, with the
  resonance knob setting the high-pass corner. The seventh entry is bypass.
- **Envelopes and LFOs (confirmed).** Envelopes are per-voice segments (`x ← c·x + d`)
  computed inline in the main loop at block rate. The attack is linear, and decay and release
  are exponential. The DSP looks the coefficients up from the raw knob values. The LFO shapes
  (triangle, saw, inverse saw, square, S/H) are five tiny phase→value functions run in six
  generator slots per core, one per synth layer.
- **Parameter scaling (§7, new).** Raw value → DSP value → Hz/ms/semitones is recovered for
  pitch, the FM ratios, cutoff, key tracking, resonance, the envelope times, LFO rate and
  depth, and amp velocity. `src/lib/ns4/synth-scaling.ts` implements them. Envelope and
  filter amounts in semitones, OSC CTRL per algorithm, unison detune and glide remain open.
- **Preview feasibility.** Analog oscillators, filters and envelopes can be approximated
  from program parameters alone; `src/lib/ns4/synth-preview.ts` does this for the PURE
  waves. WAVE needs the wavetables. A user's own `os.cab` can supply them locally, because
  the CODE image holds them with a self-describing directory.

## 1. Cores, main loop and dispatch

| Item | Where | Status |
|---|---|---|
| Voice cores | DSP1 c2, DSP2 c1, DSP2 c2 | confirmed: same kernel bytes at the same addresses on all three |
| Main loop | `sw:0x125C88` (DSP1 c2) | confirmed |
| Block size | 4 samples per kernel call | confirmed: kernels write 4 outputs; white noise runs `DO LCNTR = 4` |
| Voice slots | 16 per core: 8 oscillator calls, 8 filter calls, repeated twice | confirmed |
| Oscillator pointer slots | `dm:0xC10B8`, `0xC10B9`, `0xC10D0`, … (pairs, stride `0x18`) | confirmed; boot default `sw:0x120BF7` |
| Filter pointer slots | `dm:0xC0B8C + 0x26·k` | confirmed; boot default `sw:0x125B79` (bypass) |
| Sample rate | ≈ 86.8 kHz (control rate fs/4 ≈ 21.7 kHz) | inferred, strong: three curves and the WAVE fade agree (§7.1). This replaces the earlier 44.1 kHz guess |

The main loop waits for an audio-interrupt flag (`dm:0xB00E2`). For each block it then:

1. runs six generator slots (LFOs, §5) with one-pole smoothing,
2. runs per-voice envelopes and modulation (§5),
3. calls the oscillator kernel for each voice through `CALL (M8,I8)` (`sw:0x127A87…`),
4. calls the filter kernel for each voice (`sw:0x127B19…`),
5. runs a per-voice table shaper with linear interpolation and accumulates into the mix bus
   (`sw:0x127CE3…`; inferred to be the output/drive stage).

Host messages are parsed at `sw:0x120300` and its neighbours: an 8-bit opcode in bits 24–31
and a 24-bit payload, split with `FEXT 0:24` / `FEXT 24:8 (SE)`. This handler also points the
generator slots at their functions.

### Host side (ARM)

| Item | Address | Status |
|---|---|---|
| Oscillator algorithm table (74 × DSP code address) | `0xC02FA050` (= `0xC02F9E88 + 0x1C8`) | confirmed |
| Its use: `ptr = table[obj+0xC8]`, ids above 73 fall back to a default | `0xC01CC85C`, `0xC01CFDAC` | confirmed |
| Filter kernel table (7 × DSP code address) | `0xC02F72F0` | confirmed |
| Its use: `ptr = table[obj+0x7C]`; bits 24–30 are OR'd with a per-DSP field before sending | `0xC01CCF84` | confirmed |
| Oscillator menu builder (UI name → algorithm id) | `0xC01ADBC0` | confirmed |
| Algorithm-object constructors: `(id)` / `(id, waveIndex)` / WAVE `(waveIndex)` | `0xC01ACCF4` / `0xC01ACBF4` / `0xC01ACCD8` (always id 54) | confirmed |

The constructors build small key/value lists: key 0 holds `algorithmId << 16`, key 4 a
wave-directory index, and key 10 a flag. The same addresses appear in the DSP2 c1/c2
listings, so one host table serves all three voice cores.

## 2. Oscillator algorithms

The menu builder pairs every analog wave name with an algorithm id. Ids 6, 14, 15 and 40 are
used by no menu entry, and their table entries are exactly the zero-output stub
`sw:0x125275`. That is an independent check on the mapping.

| Category | Wave (program value) | Id | DSP kernel | Recovered structure |
|---|---|---|---|---|
| Pure | Sine | 0 | `0x120CD0` | calls the polynomial sine `0x12522E` (§2.1), confirmed |
| Pure | Triangle | 1 | `0x121183` | — |
| Pure | Saw | 2 | `0x1215FB` | two polyBLEP saws (`0x12501F`), confirmed |
| Pure | Square / Pulse 33 / Pulse 10 | 3 / 4 / 5 | `0x121B99` (shared) | one kernel, width parameter; inferred pulse = saw − shifted saw |
| Pure | White Noise | 46 | `0x121FD8` | 32-bit LCG, 4 samples per call, confirmed |
| Shape | Triangle / Saw / Square | 7 / 8 / 9 | `0x1212D3` / `0x12169D` / `0x121AB5` | — |
| Shape | Half Sine / Parabolic | 43 / 44 | `0x120F55` / `0x12145E` | — |
| Shape Sine | Pulse | 13 | `0x1232A5` | — |
| Shape Sine | ESaw / ESquare | 36 / 37 | `0x122F1F` / `0x1230DF` | — |
| Shape Sine | Saw / Square | 38 / 39 | `0x123427` / `0x1235C9` | — |
| Shape Sine | Squeeze / Fold | 41 / 42 | `0x12377D` / `0x120DAB` | — |
| Sub Osc | Square Saw / Pulse Saw / Sine Saw | 10 / 11 / 12 | `0x12179A` / `0x121867` / `0x1219C3` | — |
| Multi | Saw, 8ve, 8ve 8ve+, 5th, 5th+, 8ve 5th+ | 16, 17, 18, 19, 20, 21 | `0x121C54` (shared) | one kernel, interval parameters |
| Super | Saw / Square | 22 / 23 | `0x121D6D` / `0x121E9D` | — |
| Super | Organ / Saw Bright / Square Bright | 24 / 25 / 26 | `0x124985` (shared) | wavetable reader; the constructor passes wave index 8 / 24 / 25 (FullOrganPlus / SawBright / SqrBright), confirmed |
| Sync | Sine / Triangle / Saw | 27 / 28 / 29 | `0x12255D` / `0x1226DD` / `0x122A32` | float-exponent table lookup (§2.1) |
| Sync | Square / Pulse 33 / Pulse 10 | 30 / 31 / 32 | `0x122C5C` (shared) | as above |
| Sync | Chop Saw 1 / Chop Saw 2 / Chop Square | 33 / 34 / 35 | `0x1239BE` / `0x123C7C` / `0x123FE9` | as above |
| Misc | Pink Noise / Red Noise | 47 / 48 | `0x122030` / `0x122151` | — |
| Misc | Bell | 45 | `0x122417` | polynomial sines, exp-table ratio, cubic shaping |
| FM-H / FM-I | categories A–E | 49–53 | `0x124269` (A, E), `0x12453F` (B–D) | 2-operator phase modulation (§2.1) |
| WAVE | any wave | 54 | `0x1247B6` | band-limited wavetable reader (§3) |
| — | (not in the analog menu) | 55 / 56 / 57 | `0x124B6A` / `0x1247B6` / `0x124B6D` | 55 silent; 56 = WAVE kernel; 57 = sample-voice initialiser that installs `0x124C3A` (inferred: the Samples layer, §7.3) |
| — | unused | 6, 14, 15, 40, 58–73 | `0x125275`, `0x125281`…`0x125335` | zero-output stubs (read for `0x125275`/`0x125281`/`0x12528D`; the rest inferred from identical size) |

The menu builder makes five FM-H and five FM-I categories (`"Harmonic %c"` /
`"Inharmonic %c"`, A–E). FM-H has 25 ratio steps and FM-I has 61 semitone steps (−12…+48).
`deps.generated.ts` lists FM categories A–H only because the decoder labels the whole 3-bit
field. v1.66 builds exactly five (A–E = algorithm ids 49–53). See §7.2.

### 2.1 Kernel notes

- **polyBLEP saw (`sw:0x12501F`, confirmed).** The phase is a 32-bit accumulator. The naive
  saw is `phase XOR 0x80000000`. The distance to the wrap is measured in samples using a
  Newton-refined reciprocal of the increment. The kernel subtracts
  `sign · (1 − min(1, |t|))²`, the standard two-sample polynomial BLEP. A gain derived from
  the increment fades the output to zero over roughly the octave below a quarter of the
  sample rate. The Pure Saw kernel calls this twice, with two increments and two gains, and
  sums the results. The two phase accumulators per kernel are inferred to serve
  detune/sub/sync variants through per-algorithm ratios.
- **Polynomial sine (`sw:0x12522E`, confirmed shape).** This converts phase to float,
  folds with `ABS`, and evaluates an odd polynomial whose coefficients come from the kernel's
  parameter block. Four samples are computed per call. Bell (`0x122417`) and several
  Shape-Sine kernels call it, then add cubic and other shaping.
- **Sync and Bell (confirmed shape).** These kernels convert a control value to 30-bit fixed point,
  take bits 23–30 as an index (`FEXT 23:8`) into a 256-entry table at `dm:0xB074C`, and use
  the low 23 bits for linear interpolation. This is a table-driven exp/ratio curve (inferred:
  OSC CTRL → slave/master frequency ratio).
- **FM (`sw:0x124269`, partly confirmed).** A 7-bit control (`FEXT 25:7`; inferred to be
  OSC CTRL) indexes a 129-point curve (row stride `0x81`) with linear interpolation. That curve gives the
  modulation depth. Two operator phases run through inline polynomial sines, with the same
  Nyquist fade.
- **White noise (`sw:0x121FD8`, confirmed).** `x ← a·x + c` (32-bit, constants from
  `dm:0xE08C8`), scaled to ±1, 4 samples per call.

## 3. WAVE data: the 1.2 MB region at `0xC0300000`

The "4-way interleaved, slowly varying" data is the wavetable set. It is described by a
directory, not by pointers from code (no code word points into the region).

**Directory (confirmed).** The directory is at `0xC02FD4B0`: 55 records of seven u32 each.

| Word | Meaning |
|---|---|
| 0 | pointer to the wave name (C string; `"Second"`, `"Flute1"`, `"2nd-spectra"`, `"DX1"`, `"Bell"`, `"AAA"`, …) |
| 1, 2 | header pointer, count 8 (u16 units) |
| 3, 4 | band-table pointer, count `0x200` (u32 units) |
| 5, 6 | PCM pointer, sample count (int16 LE) |

Each wave's PCM, band table and header lie contiguously, and the waves are packed downward
from `0xC0441144` to `0xC02FDDF0`. Total size is 605,109 samples (1.21 MB), which is the
whole region. The ARM registers all 55 waves into 72-byte objects at boot (`0xC01EC9D8`,
literal `0xC02FD4B0` at `0xC01ECCE8`). It copies the name and pointers and reads header
fields `h[0]` (sequence id), `h[1]` (category, cleared if ≥ 10), `h[2]`, `h[6]` and
`h[7] << 8`. The PCM reaches DSP memory per layer, uploaded by `FUN_c01c05c8` when the
layer's wave changes (§7.3).

**Band table (confirmed).** 128 entries of four u32: `{offset, cycleLength, a, b}`.
`offset`/`cycleLength` select one single cycle in the wave's PCM. Bands get longer as the
index rises: 6 samples at index 1, then 8, 10, …, up to 128–4,096 depending on the wave, about
×1.09 per step. The last band repeats to index 127. `a`/`b` take only a handful of value
pairs shared across waves; their meaning is open.

**Band selection (confirmed in the DSP code, `sw:0x1247D5…0x12481F`).** The kernel clips
twice the pitch increment and converts it to fixed point. It shifts by a per-wave amount,
then takes the leading-zero count (`EXP`) and the next three mantissa bits. The result is
`band = 8 · octave + (3-bit fraction)`, so there are **8 bands per octave**: 128 bands cover
16 octaves, and band 0 is the highest pitch. The kernel reads `{offset, length}` for that band
from program memory (`PM(I9)`).

**Playback (confirmed).** `phase × length` (unsigned 32×32 multiply) gives the sample index
(high word) and a 9-bit fraction (`FEXT` at bit 23). The fraction selects one of 512 phases of
an 8-tap polyphase FIR (`dm:0x9531F` region), applied with two MAC accumulators. Samples are
first copied into a small contiguous buffer (`dm:0xB6F80`) so the taps don't straddle the
cycle wrap.

**Content checks (confirmed, statistics only).** 46 of the 55 waves are clean pyramids. Every
band is one periodic cycle (the wrap step is no larger than the steps inside the cycle), with
40, 48, 56, 64 or 68 bands and peaks of about −6 to −3 dBFS. Their names match the WAVE
oscillator's list in program order: the 1/2/3/4/5 categories Bells/Tines, Acoustic,
Digital, Organ and Keys. For example, the menu passes wave index 40 = `Bell`, 41 = `Bar1`, …,
45 = `TubBells`. The nine vowel waves (`AAA`, `EEE`, `III`, `OOO`, `UUU`, `YYY`, `AO`, `AE`,
`OE`, header category 9) are different. They have 36 bands, a fixed 512-sample maximum, and
overlapping, non-periodic segments, which suggests formant grains. These produce the
"interleaved" look. Which panel feature uses them is open, possibly the undecoded WAVE
categories 6+.

## 4. Filters

Filter kernel table at `0xC02F72F0`, indexed by the program's filter type:

| Index | Type | Kernel | Recovered structure |
|---|---|---|---|
| 0 | LP12 | `sw:0x1253BD` | trapezoidal SVF: `g` from a 256-entry pitch→coefficient table (`dm:0xB0D0F`, `FEXT 24:8` + linear interpolation), damping from resonance with an `RSQRTS` normalisation, `(a+b)/2` state updates, `CLIP` on one integrator state; 4 samples in place |
| 1 | LP24 | `sw:0x12566E` | the same SVF section twice in series per sample (confirmed: two state sets) |
| 2 | LPM | `sw:0x12549D` | four cascaded one-pole trapezoidal stages (ladder) with resonant feedback through a saturator table (below) |
| 3 | LPHP | `sw:0x1257B2` | separate coefficient tables, no `RSQRTS`; the program's `filter resonance / freq HP` doubles as the HP corner (inferred HP → LP) |
| 4 | BP | `sw:0x125913` | SVF, band output, own coefficient table (`dm:0xB0D90`) |
| 5 | HP | `sw:0x125A50` | SVF, high-pass output |
| 6 | off | `sw:0x125B79` | bypass: copies the gain field and returns |

**LPM saturator (confirmed shape).** A 1024-entry signed table centred at `dm:0xC02DE`,
indexed by a 10-bit sign-extended field (`FEXT 22:10 (SE)`) with linear interpolation. It is an
odd, sine-shaped soft clipper. It is linear near zero, bends smoothly over about a sixth of
the input range, and saturates at about 0.63.

Cutoff arrives as a 32-bit pitch-like value. Its top 8 bits index the 256-entry coefficient
table and the rest interpolate, so cutoff modulation is exponential (octave-linear) at the
input.

## 5. Envelopes and LFOs

**Envelopes (structure confirmed, mapping inferred).** There is no envelope kernel. Each
voice's envelopes run inline in the main loop (`sw:0x127600…`) at block rate as one-pole
segments `x ← c·x + d`, with `MAX`/`MIN` clamps and `IF GT`/`IF LT` stage switches. The
coefficient pairs `(c, d)` are loaded per voice and stage through pointers (`I4 = dm:0xC11CE`,
`0xC11F2`, `0xC11FE`, `0xC120C`, …). A host word (`dm:0xC1DD0`) carries the gate:
`FEXT 24:3 (SE)` is the gate state, and `FEXT 8:24 (SE)` is the rest of the note-on word
(note, velocity and a toggling bit), which is compared with the voice's last value to detect
retriggers. Correction from §7.5: the host does *not* compute the coefficients. It sends the
raw times, and the DSP's note-on handler looks the coefficients up in DM tables. The attack
is a linear ramp. Decay and release are exponentials that fall 40 dB in the displayed time.

**LFOs (confirmed shapes).** Six generator slots per core (`dm:0xC13A6 + 0x28·k`) are called
with a phase and a held random value. The shape functions are:

| Address | Shape |
|---|---|
| `sw:0x12538C` | triangle: `2·|phase + ¼| − 1` |
| `sw:0x1253A7` | saw: `phase + ½` |
| `sw:0x12539E` | inverse saw: `−(phase + ½)` |
| `sw:0x1253AE` | square: saw minus saw shifted by half a cycle |
| `sw:0x1253BA` | S/H: the held value |

This is exactly the program's LFO shape list (triangle, saw, inv saw, square, S/H). Each
output then passes a one-pole smoother. There is one slot per synth layer (confirmed: the
note-on handler points a voice at slot `0xC13A6 + 0x28·layer`), so the LFOs are per layer,
not per voice. Rates and depths are in §7.6.

## 6. What this opens for OpenNord

**Tier 1: parameters only (no firmware). Built:** `src/lib/ns4/synth-preview.ts` renders an
approximate note for an ANALOG/PURE layer. It uses a polyBLEP oscillator with a Nyquist fade,
all six filter types (SVF, SVF×2, ladder with soft clip, HP→LP), and envelopes. The inputs
are the decoded display values (`"3.7 kHz"`, `"244 ms"`, `"inf"`, …). It now follows the
firmware's envelope shapes (linear attack; decay and release that fall 40 dB in the displayed
time) and its resonance law `k = 2·(1 − r/128)²` (§7), taken from `synth-scaling.ts` rather
than restated. It plays the layer's pitch (octave shift, coarse, fine). Its other constants
are our own choices: the filter input is scaled down as resonance rises (`(k/2)^¼`, at most
−10.5 dB), LP24 resonates on its second stage only, the band-pass state saturates softly, and
the output runs through a soft limiter with headroom, so resonance 7–10 sings instead of
clipping. A note still sounding at the length cap is released and faded over 8 ms. It does
not claim bit-exactness, and its remaining assumptions are marked in the code
(filter-envelope amount read as octaves, key tracking around middle C).

**Tier 1 next.** The other analog categories (Shape, Shape Sine, Sub, Multi, Super, Sync) are
closed-form kernels with no tables, except Super Organ / Saw Bright / Square Bright. Two things
are missing for them:

- the per-category OSC CTRL → kernel-parameter mapping. The host side is in §7.3; the
  per-kernel use is still open;
- for Sync and Bell, the 256-point ratio curve, which can be replaced by `2^x`.

FM-H/FM-I need the OSC CTRL → depth curve. The host-side curve is now known as a formula
(§7.3, `depthCurveSemitones`). The DSP's own 129-point curve can be approximated, or read
locally from the user's image.

**Tier 2: WAVE via the user's own `os.cab` ("BIOS" model).** This is feasible, and stays
inside `LEGAL.md`'s local-access line if done this way:

1. The user picks an `os.cab` they downloaded from Nord. It is parsed in the browser and
   never uploaded.
2. Unpack CODE. It is LZO1X; [`scripts/fw-unpack.py`](../scripts/fw-unpack.py) documents
   the container and checksums. LZO1X decompression is about 100 lines of TypeScript.
3. Find the wave directory by its signature rather than a fixed address, so other OS versions
   work: a run of seven-word records whose words 2 and 4 are `8` and `0x200`, whose pointers
   fall inside CODE, and whose word 0 points to a printable name.
4. Read 55 × (int16 PCM, 128-band table). This is about 1.2 MB in memory, kept only in the
   page or IndexedDB on that device.
5. Play it the way the DSP does: 8 bands per octave from the pitch increment, then interpolate
   inside the selected single cycle with our own windowed-sinc kernel. Don't use the firmware
   FIR table.

Nothing extracted is ever stored server-side, shared, or included in exports. That is the
same stance as decoding factory pianos and samples locally.

**Tier 3: samples.** "Samples" layers use the sample library (`.nsmp`, DSP 3 NW1 codec), which
OpenNord already decodes from the user's own files. That path is separate from this one.

### What a playable synth-layer engine needs

For playing a program's synth layer live (for example from a MIDI keyboard), each part falls
into one of three groups:

| Part | Program params alone | Needs tables from the user's `os.cab` | Still unknown |
|---|---|---|---|
| Voice structure: per-voice osc → filter → amp, 4-sample control blocks, LFOs per layer | ✅ | | voice allocation across layers |
| PURE analog waves (sine, tri, saw, square, pulse 33/10, noise) | ✅ closed form (polyBLEP, LCG) | | exact level per wave |
| Other analog categories (Shape, Shape Sine, Sub, Multi, Super Saw/Square, Sync, Misc) | ✅ closed-form kernels | | OSC CTRL → kernel-parameter scaling per category |
| Super Organ / Saw Bright / Square Bright | | ✅ wavetables (wave index 8 / 24 / 25) | super detune spread |
| Sync, Bell ratio curve | ≈ `2^x` replaces the 256-point table | optional, for exactness | |
| FM-H / FM-I | ✅ ratios are in the program (deps tables), ratio lists in §7.2 | optional: 129-point depth curve (can be approximated) | — (A–E only on v1.66) |
| WAVE (46 single-cycle waves) | | ✅ wave directory + PCM | vowel waves' use |
| Filters (LP12, LP24, LPM, LPHP, BP, HP) | ✅ SVF / ladder structure, cutoff formula, LP12 resonance law (§7.4) | optional: saturator curves for exactness | env amount in semitones, drive pre-gain, LPM/LPHP Q |
| Envelopes (A/D/R, decay "inf" = sustain) | ✅ linear attack, 40 dB exponential decay/release, time formulas (§7.5) | | velocity → time amounts, osc env amount |
| LFO (5 shapes, rate, amount, target) | ✅ rate formula, depth curve, smoothing (§7.6) | | filter-depth semitone scale |
| Samples layers | | sample files (separate path, already decoded) | |

So a playable engine can start from parameters alone for every analog wave and FM, with
WAVE and the three wavetable-based Super waves switched on once the user supplies an
`os.cab`. Most of the parameter scaling is now recovered (§7). What still keeps it at *close*
rather than *right* is listed in §7.8: the envelope and filter amounts in semitones, OSC CTRL
per algorithm, unison detune and glide.

## 7. Parameter scaling (replication spec)

This section answers "what number does the DSP get for a knob, and what does it sound like".
It was recovered from the ARM edit-parameter router, the per-layer dispatcher, the ARM's
soft-float maths, and the voice core's note-on handler and lookup tables in DM. Where the
firmware uses a lookup table, the table is described by a fitted formula with its error. The
tables themselves are not copied. `src/lib/ns4/synth-scaling.ts` implements every formula
marked ✅ or 🟡 below, and its tests check them against the decoder's display tables: the
cutoff, envelope times, LFO rate and depth curve over every raw value.

Confidence: ✅ = read from code or data, and cross-checked against the displayed value.
🟡 = mechanism confirmed, one link inferred. ❓ = open.

### 7.1 How a knob reaches the DSP

```
program value ─► Edt parameter id (registry, e.g. 0x12E = 302 AmpEnvAtk)
   │  router FUN_c011bdb4: switch on the Edt id
   ▼
per-layer dispatcher FUN_c0017088(layer, key, value 16.16)      key = 0x00 … 0x41
   │  most keys: write one word into a per-layer DSP block, on all 3 voice cores
   ▼
voice core DM: layer blocks  A[L] = 0xE0000 + 0x3E·L,  B[L] = 0xE0174 + 0x3E·L,
                             C[L] = 0xE02E8 + 0x10·L   (L = 0…5 = synth layers A1…C2)
   │  note-on (sw:0x120300) and the per-block loop read them and look curves up in DM tables
   ▼
per-voice state (16 voices per core) ─► oscillator / filter / envelopes / VCA
```

- **Layers (✅).** The six synth layers (A1, A2, B1, B2, C1, C2) are layer indices 0–5. The
  host keeps, per layer, a 48-byte table of three `{dsp, address}` pairs, one per voice core
  (`0xC0547288`, `0xC05473A8`, …). Every parameter write goes to all three cores. A note-on
  word carries the layer index in bits 28–30 (`FUN_c01d04fc` builds it; the DSP decodes it at
  `sw:0x120322`), and the DSP then points the voice at that layer's blocks. So voices are
  allocated per note, and parameters are per layer.
- **Value formats (✅).** The dispatcher sends one of four formats:
  - *centred Q31*, `(v − 64)·2^24`, for the envelope times;
  - *float*, `v/127 − 0.5` (the "decay = inf" flags) or `v/127` (the amounts);
  - *pitch*, in units of 2^24 per semitone;
  - *raw integers*, for the switches.
- **The ARM does maths, in software (✅).** Contrary to the effects notes, the synth path uses
  the soft-float library (`__aeabi_fmul` `0xC0270C80`, `fadd` `0xC0270A3C`, `fsub`
  `0xC0270A38`, `i2f` `0xC0270BD4`, `f2iz` `0xC0270F78`, double `dadd`/`dmul`/`ddiv`
  `0xC025C740`/`0xC025CAF4`/`0xC025CD60`, `pow` `0xC0271B24`). Several curves are therefore
  ARM tables or ARM arithmetic. The rest are DSP DM tables.
- **The sample rate (🟡, strong).** Three independent curves agree on a voice-core rate of
  **fs ≈ 86.8 kHz**, with a control (envelope/LFO) rate of fs/4 ≈ 21.7 kHz:
  - the attack table against the displayed attack times;
  - the LFO table against the displayed LFO rates;
  - the filter's `tan` pre-warp table against the displayed cutoff.

  The WAVE kernel's anti-alias fade starts at 0.2304·fs, which is 20.0 kHz at 86.8 kHz
  (§7.3). This replaces the "44.1 kHz" guess in §1. The exact clock is not read from a
  register. The formulas below are in seconds and Hz, so an implementation can run at any
  rate.

Dispatcher keys and where they come from (router `0xC011BDB4`; ids are firmware-internal Edt
ids):

| Key | Parameter (Edt id) | Sent as | DSP field |
|---|---|---|---|
| 0x01 / 0x02 | osc coarse (298) / fine (297) | pitch word | layer pitch (`FUN_c01c5520`/`c01c5328`) |
| 0x0B / 0x0C / 0x0E | osc env A / D / R (287–289) | centred Q31 | A+0x20/0x21/0x22 |
| 0x0D | osc env decay = inf | float ±0.5 | B+0x0E |
| 0x10 / 0x11 | osc env destination / velocity | int | recompute |
| 0x12 / 0x13 / 0x15 | amp env A / D / R (302–304) | centred Q31 | A+0x1A/0x1B/0x1C |
| 0x14 | amp env decay = inf | float ±0.5 | B+0x0A |
| 0x16 | amp env velocity (305) | via `FUN_c01cdc68` | gain pair at +0x35 |
| 0x18 / 0x19 / 0x1B | filter env A / D / R (313–315) | centred Q31 | A+0x1D/0x1E/0x1F |
| 0x1A | filter env decay = inf | float ±0.5 | B+0x0B |
| 0x1C / 0x1D / 0x2B | filter env velocity (316) / sign / amount | float v/127 | `FUN_c01cd6c8` |
| 0x1E / 0x20 / 0x21 | LFO shape (283) / destination (282) / amount | int / int / float v/127 | LFO slot |
| 0x1F / 0x22 | LFO rate free / clocked | table | LFO slot (`FUN_c01d6004`) |
| 0x06 / 0x07 | unison (300) | int 0–3 | oscillator recompute |
| 0x09 | FM ratio (from the oscillator menu object) | 16.16 | oscillator recompute |
| 0x0F | OSC CTRL modulation | float v/127 | `FUN_c01c61f0` |
| 0x26 / 0x29 / 0x2A | filter type (307) / drive (311) / key track (310) | int | A+0x01 kernel pointer, +0x26 |
| 0x27 | filter cutoff | ARM table | `FUN_c01c56cc` |
| 0x30 / 0x31 | voice mode (257: poly/mono/legato) | flags | voice allocator |
| 0x35 | vibrato amount (260 mode × 262 amount) | 0–127 | `FUN_c011521c` |

The continuous morphable knobs (cutoff, resonance, OSC CTRL, the amounts, LFO rate, glide)
go through the morph engine before the dispatcher. Their keys (0x27, 0x0F/0x09, 0x2B, 0x21,
0x1F) are identified as above. Keys 0x03 and 0x28 carry two more morphable floats
(`v/127 − 0.5`, into B+0x06 and B+0x07). They are probably glide and resonance, but that is a
guess (❓).

### 7.2 Pitch

| Parameter | Raw | Formula | Units | Evidence | Conf. |
|---|---|---|---|---|---|
| Pitch word | — | `semitones · 2^24` (signed) | 8.24 semitones | `FUN_c01c5520` (`coarse·0x100` on a 16.16 value) | ✅ |
| Osc coarse | −24…+24 | `+coarse` semitones | st | same | ✅ |
| Osc fine | −50…+50 | `+fine/100` semitones (exactly cents: `2^24/100` = `0x28E00 + 0xAE15/128`) | st | `FUN_c01c5328` | ✅ |
| Layer pitch sent to DSP | — | coarse + fine + two offset fields (octave shift / transpose, inferred) | pitch word | `obj[0x44]` | 🟡 |
| FM-H ratio | wave 0–24 | `{0.5, 1, 2, …, 24}` (modulator : carrier) | ratio | menu builder `0xC01ADBBC` (25 doubles ×65536) | ✅ |
| FM-I ratio | wave 0–60 | `2^((i − 12)/12)`, displayed −12…+48 st | ratio | menu builder (`i·65536`) | ✅ |
| FM categories | A–E | algorithm ids 49–53 (A, E → kernel `0x124269`; B–D → `0x12453F`) | — | menu loop runs exactly 5 times per family | ✅ |

**FM A–E vs A–H (settled).** v1.66 builds exactly five Harmonic and five Inharmonic categories.
`deps.generated.ts` labels all eight values of the 3-bit field because ns4decode labels it
generically. Values 5–7 are unreachable on v1.66.

### 7.3 Oscillator controls

| Parameter | Raw | Formula | Evidence | Conf. |
|---|---|---|---|---|
| OSC CTRL | 0–127 | `x = v/127` (the 16.16 value × 1/(127·65536)) | `FUN_c01c61f0` | ✅ |
| OSC CTRL, "curve" mode (FM depth) | x | `C(127·x)/48`, where C is the depth curve below | `FUN_c01cd540` | ✅ (which algorithms use it: ❓) |
| OSC CTRL, linear mode | x | `x` | `FUN_c01c61f0` (mode 2) | ✅ (which algorithms: ❓) |
| Depth curve C(v) | 0–127 | smooth `0.5·(v/20)^2.5` up to 0.5 st at v = 20, then piecewise linear through 28 points of the displayed curve (`DEPTH_LANDMARKS` in `synth-scaling.ts`, e.g. (36, 2), (73, 12), (116, 38), (127, 48) semitones). Within the display's rounding at every v ≥ 20 (±0.05 st below 12.5 st, ±0.25 st above); within 3 cents below 20. The earlier 14-point fit was up to 0.67 st sharp (v = 116) | ARM table `0xC02CA2C0` (129 floats) | ✅ |
| WAVE anti-alias fade | inc f (cycles/sample) | `g = clamp((0.4608 − f)/0.2304, 0, 1)`: full level to 0.2304·fs (≈ 20 kHz), silent at 0.4608·fs | WAVE kernel `sw:0x1247B6` | ✅ |
| Unison | 0–3 | keys 6 and 7 both get the setting (0–3) | `FUN_c0115478` | ✅ (detune amounts: ❓) |

The depth curve is also the LFO→pitch amount curve (§7.6). Its displayed values match it
exactly ("50 cent" at 20, "8.7 semi" at 64, "48 semi" at 127).

**Algorithm ids 55–57 (resolved, 🟡).** 55 (`0x124B6A`) is an empty kernel, a silent
oscillator. 56 is the WAVE kernel again. 57 (`0x124B6D`) is a voice *initialiser*: it seeds
the LCG and resets state, then installs `sw:0x124C3A` as the per-block routine. That routine
reads a stream from the TDM I/O buffer. Id 57 is the menu root's id. It is inferred to be the
**sample-voice path** (the Samples layer, fed from the sample DSP), not an oscillator.

**WAVE PCM (resolved, ✅).** The PCM is not in any DSP boot image. It is uploaded at run time
by `FUN_c01c05c8(slots, layer, waveIndex)`, one wave slot per synth layer and voice core:

1. The 128-entry band table is copied, and bands that share an offset are deduplicated.
2. Each band's int16 samples are packed two per 32-bit word (`low = s[n]`, `high = s[n+1]`).
3. A 12-sample wrap guard is appended after each band, so the 8-tap reader never wraps.
4. The band offsets are rewritten to word offsets in the packed buffer.
5. The buffer is written word by word to the layer's slot address on each core.

The upload happens when a layer's WAVE changes, and once per slot at boot
(`0xC01EC9D8`). The vowel waves (header category 9) are registered with the rest. Which
feature selects them is still ❓.

### 7.4 Filter

| Parameter | Raw | Formula | Units | Evidence | Conf. |
|---|---|---|---|---|---|
| Cutoff | 0–127 | `fc = 277.18·2^(T/12)` with `T = v − 52` for v ≤ 117, `T = 65 + 1.7·(v − 117)` for 118–126, `T = 106` at 127 (wide open). That is `440·2^((v−60)/12)` up to 12 kHz, then 1.7 st per step to 29 kHz | Hz | ARM table `0xC02F9968` (exact integers ×2^24); matches every displayed value within display rounding | ✅ |
| Cutoff on the DSP | pitch | `g = tan(π·fc/fs)`, clamped at g = 1.99. Table spacing is one semitone (non-LPM, centred at `dm:0xB0ACD`) or a half semitone (`dm:0xB069B` family), linear interpolation | coefficient | DM tables; `atan(g)/π` is exactly exponential (error < 2e-4) | ✅ |
| Key tracking | 0–3 | `+k·note` semitones, `k ∈ {0, 1/3, 2/3, 1}` (exactly 0.33333 and 0.66666) | st | floats at `0xC02F9E88+0x300`; Q31 `−k` sent to A+0x26; multiplied by the note at note-on (`sw:0x120420`) | ✅ (reference note ❓) |
| Resonance (LP12/LP24/BP/HP) | 0–127 | SVF damping `k = 2·(1 − v/128)²` (Q = 1/k; k = 2 is no resonance, near self-oscillation at 127) | — | DM table `0xB0F94`, LP12 kernel `sw:0x1253BD` | ✅ table, 🟡 index = raw resonance |
| LPHP high-pass corner | 0–127 (resonance knob) | same law as the cutoff: `fc_HP = cutoffHz(v)` (display: 14 Hz at 0, 554 Hz at 64, 32 kHz at 127) | Hz | display table `591-5`, type 3 | 🟡 |
| Filter env amount | 0–127 (sign from key 0x1D) | `a = ±v/127`. With velocity on, `a·vel/127`, otherwise `a` | — | case 0x2B, `FUN_c01cd6c8`, note-on `sw:0x120475` | ✅ |
| Filter env depth in semitones | a | the cutoff sum adds `(amount + vel term)·env·4` in pitch units. The full-scale semitone value is ❓. The display is linear 0.0–10.0 | — | `sw:0x126298` | ❓ |
| Drive | 0–3 | post-filter **waveshaper**: identity table `{−1, 0, 1}` when off; otherwise a 1024-point odd soft-clip table (LPM: `dm:0xC06DF`; other types: `dm:0xB02E8`), 10-bit signed index with 22-bit interpolation, after a pre-gain from the layer block | — | `sw:0x120BFF`, stage `sw:0x127CE3` | ✅ structure, ❓ pre-gain per setting |

**The table stage after the filter (resolved, ✅).** This is the stage at `sw:0x127CE3`. Per
sample it computes `y = Shape(filter_out · ampEnv · layerGain · velGain)`, where `Shape`
interpolates linearly in a table. Without drive the table is `{−1, 0, 1}`, which makes the
stage a plain VCA. With drive it is the soft-clip table.

### 7.5 Envelopes

All three envelopes (amp, filter, osc) share the same tables. Each stage record holds four
words, `{c, d, floor, next}`, and the per-block update is `x ← c·x + d`, clamped
(`sw:0x127511…`).

| Parameter | Raw | Formula | Units | Evidence | Conf. |
|---|---|---|---|---|---|
| Attack | 0–127 | **linear** rise 0→1: `d = 1/(t·fs/4)`, `c = 1`, with `t = 0.5 ms·(1 + v/40.2)^8` (0.5 ms … 45 s, fit error 0.4 %) | s | DM table `0xB07CD` (129 increments, indexed by `(v−64)` around `0xB080D`); within 5 % of every displayed attack time | ✅ |
| Attack, alternate curve | 0–127 | `T1[v] = 0.1747·T0[v−33]`, clamped at `T0[0]` (the fast end is flat up to v ≈ 25) | — | DM `0xB084E`, chosen when A+0x27 ≠ 0 (key 0x17, a boolean not driven by the synth router; inferred to be for samples) | 🟡 |
| Decay / release | 0–127 | **exponential towards 0**: `c = exp(−ln(100)/(t·fs/4))`, `d = 0`. The displayed time `t = 3 ms·(1 + v/54.1)^7.958` is the **40 dB** point (3 ms … 45 s, fit error 0.5 %) | s | DM table `0xB08CF` (multipliers around `0xB090F`); displayed time / τ = 4.605 = ln 100 at every v | ✅ |
| Decay = 127 | — | "inf": the key 0x14/0x1A/0x0D flag (+0.5) holds the level until release | — | router cases 0x120/0x12F/0x13A | ✅ |
| Release = 127 | — | 45 s (not infinite) | s | display `586-2` | ✅ |
| Velocity → times | — | per-voice offsets added to the raw time before the table lookup: `vel·(layer field)` | raw steps | note-on `sw:0x12045D…` | 🟡 (amounts ❓) |
| Osc env amount | −60…+60 | ❓ (Edt range ±60, display ±10 semitone-like) | — | — | ❓ |

The unused DM table at `0xB09D1` holds `−(1 − c)/18`. With it, a decay would reach exactly 0 in
`ln 19` time constants. No code references it in v1.66.

### 7.6 LFO and vibrato

| Parameter | Raw | Formula | Units | Evidence | Conf. |
|---|---|---|---|---|---|
| LFO rate (free) | 0–127 | `f = 0.02846·2^(v/8.966)` (0.028 Hz … 523 Hz); phase increment `T[v]·256` per control tick, with `T[0] = 22` and `T[127] = 404526`. Against every displayed rate: within the display's rounding plus 4.5%. The display table steps +15% between v = 34 and 35 (0.38 → 0.44 Hz, against ~8% per step elsewhere); the exponential runs between the two halves, ~4% high below 35 and ~3% low just above | Hz | ARM table `0xC027A76C+0x324`, interpolated by the 16.16 value (case 0x1F) | ✅ |
| LFO rate (master clock) | 0–127 | clock divisions from a 128-entry table computed at boot (`FUN_c011b190`); "4/1" … "1/64" | — | key 0x22 | 🟡 |
| LFO shapes | 0–4 | triangle, saw, inverse saw, square, S/H (`sw:0x12538C…`) | — | §5 | ✅ |
| LFO output smoothing | — | one-pole `y += (x − y)·(1 − 0.99078)` per tick for the OSC CTRL and FILTER destinations; none for PITCH | — | `0xC01BBE40` returns `0x7ED1D5/2^23`; `0xC01C94C4` returns 0 for PITCH | 🟡 |
| LFO amount → pitch | 0–127 | `±C(v)` semitones (the depth curve, §7.3), max 48 st | st | `FUN_c01c72cc` (`C·2^24`, then ×0.5 in some modes) | ✅ |
| LFO amount → filter | 0–127 | `(v/127)·2^31` Q31 scaled by 0.5 or 1, added to the cutoff pitch | — | `FUN_c01c6ee0`, `FUN_c01c72cc` | ✅ value, ❓ semitone scale |
| LFO amount → OSC CTRL | 0–127 | `v/127` (×0.5 unless the algorithm is Shape Triangle or Shape Square) | — | `FUN_c01c6ee0` | ✅ |
| Vibrato amount | mode 0–5 × amount 0–50 | off → 0; wheel/aftertouch modes → `amount·127/50` (0–127); delay modes ramp | — | `FUN_c011521c` | 🟡 |

### 7.7 Velocity and voice modes

| Parameter | Raw | Formula | Evidence | Conf. |
|---|---|---|---|---|
| Amp velocity | 0–3 | gain at velocity 0 = {0, −6, −12, −18} dB; gain at velocity 127 = {0, +2, +4, +6} dB; linear in amplitude in between (`g = lo + (hi − lo)·vel/127`) | `FUN_c01cdc68` (two 4-entry tables of exact dB steps), note-on `sw:0x12048B` | 🟡 |
| Filter env velocity | 0/1 | off: amount × 1; on: amount × vel/127 | `FUN_c01cd6c8`, `sw:0x120475` | ✅ |
| Voice mode | 0–2 | poly / mono / legato → keys 0x30/0x31 | router case 0x101 | ✅ |
| Glide | 0–127 | morph path; possibly key 0x03 | — | ❓ |

### 7.8 What a faithful real-time engine still lacks

- The **semitone scale of the filter-envelope amount** and the **osc-envelope amount**. These
  are the largest gaps for sound.
- **OSC CTRL per algorithm**: which algorithms use the curve mode and which the linear mode,
  and what each kernel does with the value (pulse width, sync ratio, sub level, detune).
  The deferred recompute behind `FUN_c01c4178` was not followed into every kernel.
- **Unison detune**, the **glide** time curve, and the **drive** pre-gain per setting.
- The **key-tracking reference note**.
- **Velocity → envelope-time** amounts.
- **LP24/LPM/BP/HP resonance** use their own kernels. Only the LP12 table is read here. LPM's
  feedback gain and the LPHP Q are not.
- Voice allocation across the three cores, and the polyphony limit.

## 8. Open questions

- OSC CTRL semantics per analog category (§7.8).
- What the band-table words 3 and 4 mean (a few small value pairs shared across waves).
- Which feature uses the vowel waves.
- Envelope and filter amounts in semitones (§7.4, §7.5).
- The exact voice-core clock: about 86.8 kHz from three curves and the WAVE fade. No register
  read confirms it.
- Product polyphony. There are 16 voice slots on each of the three cores. How the host
  allocates voices across cores and layers is not traced.

## Reproduction

All of this came from local, gitignored artefacts: the unpacked CODE image, the per-core
instruction listings exported with the Ghidra SHARC+ module, and small Python helpers. The
helpers were a directory parser, a pointer/xref scanner, a register tracker over the
menu-builder disassembly, and a DM reader. ARM disassembly used `llvm-objdump --triple=armv7a`
on the unpacked image. None of the outputs are committed.

The scaling work (§7) added four more local helpers:

- a full ARM decompile with a function extractor;
- a DM table dumper for the voice-core image;
- a unicorn harness that calls the soft-float and libm helpers to identify them;
- small least-squares fits of the DM and ARM curves against the decoder's display tables.

The fits are the only thing carried into the repo, as formulas in `synth-scaling.ts`.
