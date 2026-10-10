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
- **Envelopes and LFOs (structure confirmed, details inferred).** Envelopes are per-voice
  exponential segments (`x ← c·x + d`) computed inline in the main loop at block rate, with
  stage coefficients supplied by the host. The LFO shapes (triangle, saw, inverse saw,
  square, S/H) are five tiny phase→value functions run in six generator slots per core.
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
| Sample rate | 44.1 kHz | inferred: no 48000 constant on the ARM side, one integer 44100; the piano engine runs at 44.1 kHz |

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
| — | (not in the analog menu) | 55 / 56 / 57 | `0x124B6A` / `0x1247B6` / `0x124B6D` | unknown; 57 is the menu root's id |
| — | unused | 6, 14, 15, 40, 58–73 | `0x125275`, `0x125281`…`0x125335` | zero-output stubs (read for `0x125275`/`0x125281`/`0x12528D`; the rest inferred from identical size) |

The menu builder makes five FM-H and five FM-I categories (`"Harmonic %c"` /
`"Inharmonic %c"`, A–E). FM-H has 25 ratio steps and FM-I has 61 semitone steps (−12…+48).
`deps.generated.ts` lists FM categories A–H. Whether F–H exist on a newer OS, or are simply
not reachable, is open.

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
`h[7] << 8`. How the PCM reaches DSP memory (at boot, or per program) is not yet traced.

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
`FEXT 24:3 (SE)` is the gate state, and `FEXT 8:24 (SE)` is a note serial compared with the
voice's last one to detect retriggers. So the shape is analog-style exponential segments, and
the host turns panel times (0.5 ms … 45 s, decay "inf" = sustain) into coefficients.

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
output then passes a one-pole smoother. Six slots per core rather than 16 suggests per-layer
(or per-layer-and-vibrato) LFOs, not per-voice LFOs. That is inferred.

## 6. What this opens for OpenNord

**Tier 1: parameters only (no firmware). Built:** `src/lib/ns4/synth-preview.ts` renders an
approximate note for an ANALOG/PURE layer. It uses a polyBLEP oscillator with a Nyquist fade,
all six filter types (SVF, SVF×2, ladder with soft clip, HP→LP), and exponential envelopes.
The inputs are the decoded display values (`"3.7 kHz"`, `"244 ms"`, `"inf"`, …). Every
constant in it is our own choice. It does not claim bit-exactness, and its assumptions are
marked in the code (filter-envelope amount read as octaves, key tracking around middle C,
envelope time definitions).

**Tier 1 next.** The other analog categories (Shape, Shape Sine, Sub, Multi, Super, Sync) are
closed-form kernels with no tables, except Super Organ / Saw Bright / Square Bright. Two things
are missing for them:

- the per-category OSC CTRL → kernel-parameter mapping, which the host computes
  (`0xC01CC85C` area) and which we have not traced;
- for Sync and Bell, the 256-point ratio curve, which can be replaced by `2^x`.

FM-H/FM-I need the 129-point OSC CTRL → depth curve. It can be approximated, or extracted
locally (it sits in the DSP image inside the same CODE section).

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
| FM-H / FM-I | ✅ ratios are in the program (deps tables) | optional: 129-point depth curve (can be approximated) | categories F–H |
| WAVE (46 single-cycle waves) | | ✅ wave directory + PCM | vowel waves' use |
| Filters (LP12, LP24, LPM, LPHP, BP, HP) | ✅ SVF / ladder structure, cutoff in Hz | optional: cutoff and saturator curves for exactness | resonance and drive scaling |
| Envelopes (A/D/R, decay "inf" = sustain) | ✅ exponential segments, times in ms | | time definition, velocity scaling |
| LFO (5 shapes, rate, amount, target) | ✅ | | rate units, smoothing time |
| Samples layers | | sample files (separate path, already decoded) | |

So a playable engine can start from parameters alone for every analog wave and FM, with
WAVE and the three wavetable-based Super waves switched on once the user supplies an
`os.cab`. The largest blocker for sounding *right* rather than *close* is the host-side
parameter scaling (OSC CTRL, resonance, envelope amounts), which lives in ARM code around
`0xC01CC85C` and is the next thing to trace.

## 7. Open questions

- OSC CTRL semantics per analog category: which kernel parameter it drives, and the host-side
  scaling.
- What the band-table words 3 and 4 mean (a few small value pairs shared across waves).
- Algorithm ids 55–57 (`0x124B6A`, `0x124B6D`) and which feature uses the vowel waves.
- FM categories F–H (A–H in `deps.generated.ts`, A–E in the v1.66 menu builder).
- How wave PCM gets into DSP-addressable memory: uploaded at boot, or per program.
- Exact envelope time definitions (time to which level), and the velocity and amount
  scalings.
- The post-filter table stage at `sw:0x127CE3…`: drive, VCA curve, or both.
- Product polyphony. There are 16 voice slots on each of the three cores. How the host
  allocates voices across cores and layers is not traced.

## Reproduction

All of this came from local, gitignored artefacts: the unpacked CODE image, the per-core
instruction listings exported with the Ghidra SHARC+ module, and small Python helpers. The
helpers were a directory parser, a pointer/xref scanner, a register tracker over the
menu-builder disassembly, and a DM reader. ARM disassembly used `llvm-objdump --triple=armv7a`
on the unpacked image. None of the outputs are committed.
