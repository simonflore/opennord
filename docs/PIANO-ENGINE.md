# Nord Stage 4 piano engine: replication spec

This note describes what the Stage 4 does with a `.npno` piano between "key pressed" and "audio
leaves the piano DSP". It is meant as a build spec for a browser piano that behaves like the
instrument. It follows on from `docs/NSP-FORMAT.md` ("CNSP audio decoded"), which covers the file
format and the block codec, and from `docs/NPNO-WRITE.md`, which names most stroke-record fields.

Source: Stage 4 OS v1.66, unpacked locally (`scripts/fw-unpack.py`). DSP 4 (ADSP-214xx) was read
from the Ghidra 214xx import and its own instruction listing. The ARM side was read from the full
ARM decompile. Firmware, listings, decompiler output and tables stay in the gitignored scratch area
(`docs/LEGAL.md`). This file records structure, formulas and a few behavioural constants. Where a
firmware table matters, it gives a closed formula fitted to the table and the fit error, not the
table.

Three factory pianos were used for local checks: Clavinet D6 6.1 (v6, stereo), Electric Grand 1
CP80 5.3 and Wurlitzer 1 200A 5.3 (v5, mono). None of their audio is in the repo.

**Confidence.** **High**: read directly from code and, where possible, checked against the factory
files. **Medium**: the mechanism is clear, but a mapping or one branch is inferred. **Low**: a
hypothesis.

**Offsets.** Stroke-record offsets follow `NPNO-WRITE.md` (record *i* at `CNSP + 0x732 + i·0x76`).
`NSP-FORMAT.md` counts the same records from `CNSP + 0x72C`, so its offsets are 6 higher (its
`+0x0A` "velocity floor" is byte `+0x05` here, with the flags byte `+0x04` above it). Header offsets
are relative to the `CNSP` tag.

**Units used below.**
- *att*: attenuation in **0.2 dB** steps (the touch-curve domain, 0…200 = 0…40 dB).
- *lvl*: level index in **0.1 dB** steps, gain = 2^(−lvl/60) (exactly 60 steps per 6.02 dB).
- *ticks*: DSP 4 samples at **44.1 kHz**. Envelopes update every second tick (22.05 kHz).

---

## 0. Corrections to earlier notes

1. **Stroke order within a zone is loudest first, and the "velocity floor" is an attenuation
   floor.** Layer 0 (floor 0) is the hardest hit. Larger floors are softer strokes. Evidence: the
   selector compares the floors with an attenuation value (§2.1). The spectral centroid of the
   factory strokes falls monotonically with the floor: CP80 zone 0 goes from 450 to 255 Hz,
   Wurlitzer from 888 to 209 Hz, Clavinet from 1089 to 572 Hz. `NSP-FORMAT.md` ("velocity layers
   run softest first") and `nsp-audio.ts` `strokeFor` (which treats the floor as a MIDI velocity)
   have it backwards. Both still pick *a* stroke, just not the one the instrument would play.
   **High.**
2. **Key-map roots are 4 semitones below the sounding pitch at 44.1 kHz.** Each zone's strokes
   measure +397…+408 cents above the MIDI note of their stored root (f0 by autocorrelation on all
   three files, 47 zones). The pitch formula compensates with a built-in −4 semitones (§2.3).
   **High.**
3. Record `+0x2E` is the **loop sustain decay** (applied once playback is inside the loop region).
   It is not a key-release coefficient. `+0x72`/`+0x73` are the key-release (damper) rates. **High.**
4. A stereo stroke uses **one** DSP voice. The two channels are decoded side by side in SIMD (§1.2).
   **High.**

---

## 1. DSP 4: the voice engine

DSP 4's code is small: about 2,000 instructions. Apart from boot, flash DMA and CRC helpers, it is
one audio interrupt (`sw:0x1C058C`, vector P6I) plus the per-voice streaming routine `sw:0x1C0A89`
and the block-setup routine `sw:0x1C0C5A`. DSP 4 does **no** EQ, resonance or effects modelling.
Everything except decode, resampling, gain, damping and the bus mix is decided on the ARM.

### 1.1 Voice slots and the control path

| Item | Value | Evidence | Conf. |
|---|---|---|---|
| Voice slots | **114** (0x72), struct stride 0x36 words, slot *v* at `I3 = dm:0x92848 + v·0x36` (fields from `I3−0x20` to `I3+0x14`) | init loop in `0x1C0A89` (`0x72` entries); ARM loops `0x72` (`0xC00B6948`, `0xC00B6CC0`) | high |
| Active list | DSP list at `dm:0x92534`: first *n_mono* voices, then *n_stereo* (counts `0x9268B`/`0x9268A`) | `0x1C07D1`/`0x1C0858`; ARM rebuilds it in `0xC00B6CC0` | high |
| ARM → DSP writes | host FIFO of (address, value) word pairs; top nibble ≠ 0 calls a handler table at `dm:0x92182` | `0x1C05D7` loop | high |
| Voice start | two-phase mailbox, 2 slots at `dm:0x9251A`/`0x92526` (12 words each): ARM posts the voice pointer (`+0`), DSP clears the voice and acks (`+0xB`); ARM writes history, stream state, routing and pitch, then posts `voice<<2 | flags` (`+1`); DSP latches pitch and gains and sets the voice active | `0x1C0B67…`, `0x1C0B08`; ARM `0xC00B64C8` (prepare) + `0xC00B63BC` (go) | high |
| Level meter back to ARM | per voice, 2 bytes = dB of (envelope × block level) without and with the ramp, a 6-dB-per-octave log via `LEFTZ` plus a fractional table; −0x60 = silent | `0x1C0714` loop → ring `dm:0x92772`; ARM reads it in `0xC00B6948`/`0xC00B6B34` | high |

### 1.2 Per-tick signal path (every voice, every 44.1 kHz tick)

```
bitpos = frame·bitsPerFrame − blockBitBase                 (streaming state, §1.4)
r      = sign-extend(width bits at bitpos)                  stereo: L and R in SIMD
x      = r + Σ c_k·hist[k]   (binomial order 0–4)           pushed into an 8-frame ring
y      = Σ_{j=0..5} h_phase[j]·ring[n−5+j]                  phase = top 8 bits of the fraction
y      = y << 17                                            int16 → Q31 range
busL  += y·gainL ; busR += y·gainR                          gains from §1.3 (mono voice)
busW  += yL·gain[0] ; busW+1 += yR·gain[1]                  (stereo voice)
frac  += incFrac ; frame += incInt + carry                  32-bit fraction
```

- **One frame per tick at most.** The decoder decodes the frame at the integer position each
  tick. Repeating a frame is harmless (same bits, same ring slot), but skipping one would break
  the predictor. So the increment must be below 1.0. The ARM always writes `incInt = 0` and clamps
  the fraction to `0xFFFFFF·2^8` (§2.3). **Strokes are only ever pitched down or played at the
  recorded rate.** (`0x1C07D8` mono, `0x1C0864` stereo; ARM `0xC00A9AEC` writes `incInt = 0`.)
  **High.**
- **Interpolator:** 6 taps × 256 phases, symmetric, unity DC gain per phase. Phase 0 is a pure
  delay of two frames. It matches a **Kaiser-windowed sinc** (half-width 3 taps, β ≈ 5.2, cutoff at
  the source Nyquist, renormalized per phase) within 0.0014 on every coefficient. That design can
  be regenerated, so the table does not need copying. (`pm:0xE3400`, stride 0x100.) **High**
  (structure), **medium** (window family).
- **Stereo voices:** in SIMD mode, PEx decodes the left residual and PEy the right from the same
  interleaved words (bits per frame = 2w). The history ring and the MACs are paired, and the
  output goes to two adjacent bus words with `gain[0]`/`gain[1]`. **High.**

### 1.3 Gain, envelope and pan (every second tick, 22.05 kHz)

The DSP processes 57 voices per tick, alternating halves (the double buffer at `dm:0x94036/0x94038`
loads `I2`/`I3` as a long-word pair). Each voice is updated at 22.05 kHz. Per voice
(`0x1C06B9`; field names are offsets from `I3`):

```
q  = v[0x12]   (1.0)                p = v[0x11]  = preLoop (v[7]) or loopDecay (v[6]), §1.4
g' = max(v[0x10]·v[0xE]·q + v[0xC], 0)        "damper rate" generator        → v[0x10], v[0xD]
f' = max(f·v[0xD]·p + v[0xB], 0)              main envelope f = v[0xF]       → v[0xF]
ramp' = clamp(ramp + rate, lo, hi)            v[−2] += v[−1], limits v[2]/v[3]
gainL = f'·ramp'·panL (v[0x13]) → v[0]        gainR = f'·ramp'·panR (v[0x14]) → v[1]
```

The multiply uses last tick's `v[0xD]`, so the damper rate takes effect one update late. Ordering
inside the SIMD pair is **medium**; the formulas match every ARM writer below.

The ARM programs the envelope with three primitives:

| ARM function | Writes | Behaviour | Used for | Conf. |
|---|---|---|---|---|
| `0xC00B5F20(v, c)` | `v[0x10]=c, v[0xE]=1, v[0xC]=0, v[0xB]=0` | exponential: f ×= c per update; c = 1.0 holds | damper / key release / sustain | high |
| `0xC00B602C(v, p)`, p ≤ 49 | `v[0x10]=1, v[0xE]=A_p, v[0xC]=−B_p, v[0xB]=0` | the rate g runs `g ← A·g − B` from 1 down to 0 and f follows: an **accelerating cut-off**, silent after t₀(p) ≈ 1 ms·2^(p/4) (1 ms at p = 0, 5 s at p = 48) | release mode 3 (§3.2) | medium |
| `0xC00B61AC(v, t)` | `v[0xB] = −f/(t·k)` | **linear** fade to 0 | release mode 2 | medium |
| `0xC00B5C98(v, target, ms)` | ramp rate = (target − current)/(ms·22.05) and the limits | linear ramp of the extra voice gain | note-on level, string-res fade-in, steal fades | high |

The `B_p` value is converted with the opposite sign to every other value. In
`0xC00B602C` the positive branch uses `asr` and the negative branch uses `lsr` (checked in the ARM
disassembly), so the DSP receives `−B_p`. Its fixed point is `B/(A−1) ≈ 1.0055` for every p, which
is what makes g fall to zero. **High** (sign), **medium** (intent).

**Damper rate table** (`0xC052B8C8`, 101 entries, used as `c = −table[i]`): it fits
`c_i = exp(−0.20885·10^(−i/20))` to within 9 LSB (Q23). At 22.05 kHz updates that is

> **T60(i) = 1.5 ms · 10^(i/20)** (i = 0 → 1.5 ms, 20 → 15 ms, 40 → 150 ms, 60 → 1.5 s, 100 → 150 s)

so each index step makes the release 1 dB slower per decade. **High.**

### 1.4 Streaming, loop and loop decay

Per voice (`0x1C0A89`, `0x1C0C5A`; fields from `I3`): `−0x0B` page-table index, `−0x0A` next block
number, `−9` stroke length, `−8` loop end, `−7` loop length, `−6`/`−5` loop-block first frames,
`−4` loop-block index, `−0x13` width, `−0x1C` bits per frame, `−0x11` predictor pointer, `−0x14`
block level gain.

- **Block level byte** → `v[−0x14] = 10^(−level/20)` (gain table `dm:0x941AC`, 1 dB steps; entries
  100+ are 0). It is used **only for metering**: the PCM is never scaled by it. The meter value
  `f·blockGain` (and `f·ramp·blockGain`) lets the ARM estimate each voice's loudness without
  computing audio. That estimate drives stealing (§2.5) and release-sound levels (§3.3). **High.**
- **Loop:** when `frame ≥ loopEnd`, then `frame −= loopLength`, the history ring index shifts by the
  same amount, and streaming restarts at the loop block. A stroke with loop length 0 has
  `loopEnd = 0x7FFFFFFF`. The voice ends at `frame ≥ length`: state cleared, voice inactive.
  **High.**
- **Loop sustain decay:** `p = v[0x11]` is `v[7]` until `frame > loopEnd − loopLength` (that is,
  past the loop start), then `v[6]`. `v[6]` is record `+0x2E` (Q23), so inside the loop the envelope
  decays by `c = (+0x2E)/2^23` per update. Factory values `2^23 − 146 … 2^23 − 2782` give **about
  3 to 63 dB/s**, faster for higher notes. The loop is a recorded, seamless cycle, and this decay
  makes it sound like a continuing piano tail. If request field `+0x48` is 2, the coefficient is
  halfway to 1.0 (`c + (1 − c)/2`, a slower decay). Source: `0xC00A8370`. **High** (mechanism),
  **low** (what sets the halving).
- **Pre-loop factor `v[7]`:** one of the record's 14 Q23 values at `+0x36`, indexed by
  `min(root − key + 1, 13)` (`0xC00A90A0`). All are 1.0 in factory v6 records, so it is a
  per-transposition decay correction that Nord doesn't currently use. For v5 *release-sound*
  strokes the loader fills it with a decay rate instead (`0xC0020088`). **High.**

### 1.5 Buses and the output stage

- **Bus address** = `dm:0x9404E + group·6 + offset`. `group` is the piano part 0–3 (firmware strings
  "Piano Part A0/A1/B0/B1": layers A/B × the current and previous program, so a held note can ring
  through a program change). `offset` is 0 normally. A per-key signed table moves strokes to
  offset 2 or 3 (`0xC00A1BF4`; purpose unknown, possibly pickup or polarity routing). The voice
  writes words `offset` and `offset + 1`. **High** (addressing), **low** (offset meaning).
- **Output stage** (`0x1C0918…0x1C0A51`, SIMD L/R): per group, `x = float((w0 + w3), (w1 + w4)) ·
  2^−29`. It applies two smoothed gains and a smoothed dry/processed crossfade (one-pole smoothing,
  0.99 previous / 0.01 new, once per sample), an average of the current and previous sample, and
  the master gain `dm:0x94098`. The result goes to the SPORT TX frame: 4 stereo pairs, slots
  0–3 and 10–13 of a 20-word buffer. Smoothed control values are also copied into a side buffer
  (`dm:0xB2033…`), consistent with the effects DSPs reading control words from the TDM frame
  (`EFFECTS-ENGINE.md` §4). **Medium** (gains and crossfade), **low** (exact filter topology).
- **Where it goes next:** the four group outputs are the piano inputs of the effect chains ("Fx
  Piano A1/B1/A2/B2"). Per `EFFECTS-ENGINE.md`, each piano layer has its own chain on DSP 0 (Effect
  1, Effect 2, Amp/EQ, Delay, Compressor, plus Reverb). **Medium.**

---

## 2. Note-on (ARM)

### 2.1 Which stroke plays

```
v10   = keyboard velocity, 10-bit (0–1023)
att   = touchCurve[curve][v10]                        0…200, 0.2 dB/step, 0 = hardest
sel   = att + typeOffset + 20(*) + repetitionOffset
zone  = keyMap[key] (root note); list = strokes of that zone and stroke type, loudest first
stroke = last i with xfade[i] ≤ sel   (i = 0 if none)
xfade[i] = floor[i] − trunc((floor[i] − floor[i−1]) / 2),  xfade[0] = 0      (record +0x74)
floor  = record +0x05 (v6, att units; v5 stores floor/5)
```

(*) The note-on path `0xC00AD77C` sets request field `+0x34 = 20`.

- **No velocity crossfade.** Exactly one stroke is chosen. Layers switch at the midpoint between
  floors. Loudness stays continuous because level does not depend on the layer (§2.2). The second
  voice that `0xC00AA2E8` builds is the **unison partner**, not a crossfade partner.
  (`0xC00A2A54` selector, `0xC00A3988` per-key lists, `0xC00AB028`/`0xC0020088` record loaders.)
  **High.**
- **Touch curves:** 10 curves of 1,024 bytes, built at boot by `0xC001F430` from double-precision
  parameters, piecewise in dB, clamped 0…200. The factory shapes fall from 40 dB at very soft
  velocities to 0 dB at about 60% of the 10-bit range. Curves 6–8 are near-linear dB ramps, and
  curve 9 is flat. A second curve set is built the same way. The program's **Touch** (heavy /
  medium / light) selects the curve. Rebuild the curves from the parameters rather than copying
  them. (Curve tables `0xC0532664`, `0xC052BA64`.) **High** (role), **medium** (Touch → index).
- **Stroke types:** record `+0x04` bits 0–1. 0 = normal, 1 = an alternative list chosen when a
  per-root flag is set (`0xC00AD77C` second path), 2 = release sound (§3.3). **Medium.**

### 2.2 Level

```
att' = b + att·(128 − a)/128            Dyn Comp: (a, b) per setting
lvl  = level' + 2·att' + 60 − trim10C[key] − trim38C[key] − trim40C        (0.1 dB, signed int8 trims)
gain = 2^(−lvl/60)  (≈ 10^(−lvl/200))   → envelope start value f
level' = record +0x34                   (v6)
level' = 10·L − 2·(5·floor5)            (v5, converted at load)
```

- **Level word `+0x34`:** factory files satisfy "level + 10·(dB the PCM peak sits below 7782) =
  constant within a zone" (`NPNO-WRITE.md`), so every stroke of a zone produces the **same output
  peak at the same att**. Dynamics come entirely from the touch curve (up to 40 dB, ×2 → 0.2 dB
  per att step). The layer only changes timbre. `0xC00A1EB4`. **High.**
- **Dyn Comp** (`Edt_Pno_kDynComp` 0–3): pairs (a, b) = (0, 0), (19, 0), (38, 5), (57, 10)…; the
  table continues to (128, 20), which is full compression. It compresses the attenuation toward
  `b`. Base `0xC02A1208 + 0xB80`. **High** (formula), **medium** (setting → row).
- **Header level trims:** `+0x10C` (per key), `+0x38C` (per key), `+0x40C` (one byte), all signed,
  0.1 dB. The CP80 trims its top keys by about ±2 dB. **High** (addressing), **medium** (units).
- **Pan:** mono strokes `(0.875, 0.875)` (−1.16 dB each side). Unison voices are `(0.703, 0.297)`
  and the mirror image. The Clavinet type keeps 0.875. Per-key ±1 sign tables (Clavinet pickup
  combinations, layer `+0x794/+0x798`, split at `+0x79C`) can flip polarity. `0xC00A1EB4`.
  **High** (values), **low** (pickup reading).
- **Extra ramp gain:** each voice also has the linear ramp from §1.3. Normal notes jump straight to
  the target (time 0). String-resonance voices fade in over 200–600 ms.

### 2.3 Pitch

```
cents = 100·(key − root − 4)            root from the key map at CNSP+0x8C
      + int8(header+0x18C [key])        per-key stretch tuning, cents
      − uint8(record+0x32)              per-stroke fine tune, cents (0 in factory files)
      ± unisonDetune(level, key)        level 1: ±1 c, 2: ±2 c, 3: ±3…5 c (more in the bass)
      + layer/transpose tuning
      + masterTune + 27
ratio = min(2^(cents/1200), 1 − 2^−24)            frames per 44.1 kHz tick
```

- The `2^(c/1200)` table spans 0…−1,200 cents and covers whole octaves by shifting
  (`0xC00A1C60`, `0xC00A8370`; master-tune hook `0xC011C798` stores `tune + 0x1B`). **High.**
- Stretch tuning is real. The CP80 header runs from −23 cents (A0) to +21 cents (C8), and the
  measured zone pitches follow it. **High.**
- **Consequence for a browser engine:** play stroke PCM at `44100·2^(cents/1200)` Hz relative to a
  44.1 kHz output, with the −4 semitone offset. Zones never reach `root + 4`: in factory files the
  maximum key is `root + 1` or `root + 4` (top zone).
- **Open:** the constant **+27 cents**. With master tune 0 the instrument would be 27 cents sharp
  unless the stored master tune is centred at −27, or DSP 4's real clock is 27 cents below
  44.1 kHz. The envelope maths assumes exactly 22,050 updates/s (`0xC00B5C98`), so the clock is
  44.1 kHz nominal. Treat +27 as part of master-tune calibration until it is checked on hardware.

### 2.4 Unison

`Edt_Pno_kUnison` 0–3 starts a second voice with the opposite detune and mirrored pan (§2.2, §2.3).
`0xC00AA2E8` builds the partner request and `0xC00A9CFC` starts both. Each stroke is still a single
voice, so unison doubles voice use. **High.**

### 2.5 Allocation and stealing

- Free voices come from a 256-entry ring (`0xC00A9274`). Each new voice is placed in the mono or
  stereo part of the DSP active list, and the list is re-sent to DSP 4 (`0xC00B6CC0`).
- **Steal order** (`0xC003DDC0`): each candidate gets a 32-bit sort key. Shell sort ascending; the
  lowest key goes first.
  - bit 30: still protected (a time comparison; the voice is fresh)
  - bit 29: ramped level > 29 (above about −71 dB)
  - bit 28: unramped level > 0
  - bit 27: the newest voice for its key
  - bits 15…8: unramped level
  - bits 7…0: ramped level

  Quiet, old voices that are not the latest for their key are stolen first. Levels come from the
  DSP meter (§1.1), refreshed at most every 73 ms. **High.**
- **Steal fade:** the victim gets damper index 12 (T60 ≈ 6 ms, §1.3), and the new note's start is
  delayed by a few milliseconds (`0xC00A9274` → `0xC00B7640(v, 0xC)`). **High.**
- **Same-key restrike** (`0xC00AD77C`): the new stroke's attenuation is shifted using the metered
  level of the voice still sounding on that key, plus a small pseudo-random wobble (an LCG,
  triangle-shaped). Repeated notes therefore vary slightly. **Medium.**

---

## 3. Release, sustain and damper

### 3.1 Key-up and the sustain pedal

The sustain pedal is quantized to **5 states (0…4)** (`0xC00B6F14`):

| Pedal state | Effect on a released note |
|---|---|
| 0 (up) | release with the key's damper index (below) |
| 1 (half) | damper index **+15…+28** steps (T60 ×5.6…×25). The offset depends on the voice and pedal type (tables `0xC0283BA8`/`0xC0283BF8`; `0xC029E594` gives +20 when no partner voice exists) |
| 2–4 | full sustain (`c = 1.0`) |

For the Clavinet type, state 1 does not count as sustained; it needs state 2 or more. For the
other piano types, any state ≥ 1 counts. **High** (structure), **medium** (state boundaries on a
real pedal).

**Damper index per note:**
- Header byte `+0x410 = 1` in all factory files. With it set, the voice uses record `+0x72`
  (normal) or `+0x73` (**Soft Release** on). Factory values are CP80 41–43 / 51–52 (T60 ≈ 0.17 s /
  0.55 s), Wurlitzer 34 / 44–45, Clavinet 13 / 33–36 (T60 ≈ 7 ms / 70–95 ms). Soft Release is
  simply a slower damper.
- Otherwise the per-key header table `+0x20C` is used. Factory values are CP80 41→34 and
  Clavinet 13.

Evidence: `0xC00B6F14`, `0xC00B7640`, `0xC00B84CC` (header byte `0x410` → layer `0x6317`).
**High.**

### 3.2 Release modes

Each piano file chooses a release mode for normal release (header `+0x49C`) and for soft release
(header `+0x8B`). Raw byte → mode: 0 → mode 1, 2 → mode 3, 0xFF → mode 0, other → mode 2.

| Mode | Behaviour |
|---|---|
| 1 | exponential damper |
| 2 | linear fade over a per-key time |
| 3 | accelerating cut-off over t₀ ≈ 1 ms·2^(p/4) (§1.3) |
| 0 | no release processing |

The v6 Clavinet has 2/2 (mode 3), the v5 files 0/0 (mode 1). Evidence: `0xC00A3988`,
`0xC00B84CC`. **Medium.**

### 3.3 Release sounds (key-off noise)

Strokes with flag 2 form a separate per-zone list (the Wurlitzer has them). On key-up,
`0xC003A8E4` takes the meter levels of the voices still sounding on that key. It converts the
quietest or most relevant one to an attenuation, `(level − 100)·−5`, clamped. For electric types,
when the level is below 58 it uses the touch curve instead. It then starts a type-2 stroke with
that attenuation as both selection and level. So **the release noise follows how loud the note
still is**, not the key velocity. **Medium-high.**

### 3.4 Loop region

See §1.4: the seamless recorded loop and a per-stroke exponential decay (`+0x2E`) while inside it.
The damper multiplies on top.

---

## 4. Piano program settings

| Setting (program / `Edt_Pno_*`) | Mechanism | Conf. |
|---|---|---|
| **Touch** (`kKbdTouch` 0–2) | selects the touch curve (§2.1) | medium |
| **Dyn Comp** (`kDynComp` 0–3) | attenuation compression `att' = b + att·(128−a)/128` (§2.2) | high (formula) |
| **Unison** (`kUnison` 0–3) | second detuned voice, ±1/±2/±3–5 cents, pan 0.70/0.30 (§2.4) | high |
| **Soft Release** | damper index from record `+0x73` instead of `+0x72`, and the soft-release mode byte (§3) | high |
| **String Resonance** (on/off; system level `Edt_Sys_kStringResonanceLevel`) | extra **sympathetic voices** (below) | medium |
| **Pedal Noise** (on/off; system level) | on pedal events, plays special noise strokes: "key" 14 for one direction, another for the other, velocity = pedal speed × 5 (`0xC00BC334`), from a separate source (`0xC00A89DC`) | medium (trigger), low (sample source) |
| **Timbre** (`kEq` 0–7: Soft/Mid/Bright; EP adds Dyno 1/2; Clavinet combines Soft+Mid+Bright as a bitmask) | not on DSP 4 as per-voice EQ. The ARM writes a per-group 2×2 output-mix mode (5 modes, `0xC00B3640`) and two preset filter slots per group (3 presets: flat, and two "dry + delayed" blends, `0xC00B29E8`). The full timbre EQ most likely lives in the piano effect chain on DSP 0 | low |
| **Model variation** (`kVariation` 0–3; Clavinet pickups) | not traced. Candidates: the per-key polarity tables (§2.2) and the output-mix modes | low |

### String resonance

Event queue `0xC00BD33C` → `0xC00AE174`. It runs only when the layer's string-res flag and the
piano's support flag (header `+0x51F`) are set.

- **Trigger.** For each played key, a list of 31 intervals from −48 to +28 semitones gives a
  coupling gain. Examples:

  | Interval | Gain |
  |---|---|
  | octave below | −1 dB |
  | octave + fifth below | −2 dB |
  | two octaves below | −3 dB |
  | fifth / fourth below | −3 / −2 dB |
  | octave above | −12 dB |
  | fifth above an octave | −15 dB |
  | two octaves above | −18 dB |

  Lower strings couple more strongly.
- **Grouping.** Entries are grouped into up to 5 resonance voices. Each voice is tagged with the
  harmonic it excites: 2, 3, 4, 5, 6, 8, 9, 10, 12 or 16 (12, 19, 24, 28, 31, 36, 38, 40, 43, 48
  semitones, detuned by the just-intonation deviation, for example 5th harmonic −14 c, 3rd
  harmonic +2 c).
- **Which strings resonate.** A target string resonates only if it is free (not damped: held key
  or pedal). When the pedal is pressed with no note, every free key below `max(64, key)` gets a
  type-11 resonance voice.
- **Playback.** Resonance voices replay the target key's own strokes. Their attenuation is raised
  (about +15–17 dB: `att + 0x55` or a scaled version). They fade in over 200 ms, or 600 ms when
  triggered by a delayed event, using the ramp (§1.3). On key-up (`0xC00ADF74`) they fade out
  (100 ms ramp) or are released with damper index 40.
- **Voice budget.** Resonance only uses spare capacity: it runs only if more than half of the
  candidate voices meter below level 30.

**Medium** (mechanism and constants read directly), **low** (exact grouping semantics).

---

## 5. What a faithful browser piano needs

1. **Stroke player:** the existing decoder (`nsp-audio.ts`) plus a 6-tap Kaiser-sinc fractional
   resampler (β ≈ 5.2, 256 phases or computed), ratio ≤ 1 from §2.3, and a frame-exact loop jump.
2. **Selection:** a 10-bit velocity, or MIDI velocity scaled up, through a touch curve to att
   (0.2 dB); pick the last stroke with `xfade ≤ att + 20`. **Fix `strokeFor`**: the floor is an
   attenuation, and layer 0 is the loudest.
3. **Level:** `gain_dB ≈ −0.1·(level' + 2·att' + 60 − trims)`; peaks are normalized across a zone.
4. **Envelope at 22.05 kHz:** constant until the loop, ×`(+0x2E)/2^23` per update inside the loop,
   and on release ×`exp(−0.20885·10^(−i/20))` with i from `+0x72`/`+0x73` (+15…28 at half pedal,
   1.0 when sustained). Add modes 2 and 3 for pianos that use them.
5. **Unison, release sounds and pedal noise** as above. String resonance as extra quiet voices of
   the target keys' own strokes, faded in.
6. **Polyphony:** 114 voices. Steal the quietest old non-latest voice, fading it over about 6 ms.
7. **Bus:** sum into one stereo bus per piano layer, then into that layer's effect chain
   (`EFFECTS-ENGINE.md`).

## 6. Open questions

- The +27-cent constant in the pitch sum (§2.3).
- Timbre: where Soft/Mid/Bright/Dyno and the Clavinet EQ are applied, and the full DSP 4 output-stage
  filter topology (`0x1C0918…`), including what the `0xB2073…` five-coefficient blocks feed.
- Model variation (Clavinet pickups) and the per-key bus-offset table (`+0x34C`, offsets 2/3).
- Pedal-noise sample source (`0xC00A89DC`) and its two trigger keys.
- Exact touch-curve parameters per Touch setting, and the 10-bit velocity scale from the keybed.
- Header bytes `+0x51D…+0x51F` and `+0x5A0` (copied by the loader; roles partly guessed).
