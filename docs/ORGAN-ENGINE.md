# Organ engine

OpenNord's own organ voice, used to play a Stage 4 program's organ layer from the
on-screen keys or any MIDI keyboard. It is **our model of the instruments the Stage 4
emulates**. It is built from public, general organ knowledge so far; what the firmware
research learns about the Stage 4's own organ (structure, behaviour, parameter ranges)
may be built in too, under `docs/LEGAL.md` ("Firmware, DSP and desktop-binary
research": knowledge yes, copies no). It is not Nord's sound, and it contains no Nord
firmware, no tables dumped from it, and no Nord audio.

Code: `src/lib/engine/organ/`. UI hook: `src/components/program/OrganPlay.tsx`
(the **Play** panel on each organ card of the program view).

## Architecture

| File | Role |
|---|---|
| `tonewheel.ts` | Tonewheel facts: gear-ratio tuning, the nine footages, foldback, drawbar level curve |
| `voicing.ts` | Per-model voicing: which generators a key feeds, keying (attack/release, contact scatter, click/chiff) |
| `scanner.ts` | Vibrato/chorus (scanner approximation) |
| `core.ts` | `OrganCore`, the pure, deterministic synth (`noteOn`, `noteOff`, `setParams`, `allNotesOff`, `render`) plus `renderOffline` |
| `types.ts`, `params.ts` | Engine params; `organParamsFromLayer(layer, organFx, morph?)` bridges a decoded `NS4Layer` |
| `organ.worklet.ts` | AudioWorklet processor hosting `OrganCore` on the audio thread |
| `organ-voice.ts` | `createOrganVoice(ctx)`: the Web Audio integration point (worklet, or a ScriptProcessor fallback). `dispose()` fades out over ~10 ms; the processor then returns `false` from `process()` so the browser can release it, and the node is disconnected after the fade |

**Why a shared generator bank, and why an AudioWorklet.** Real tonewheel organs
don't have voices. 91 wheels spin all the time, and each key closes nine contacts
that switch wheels onto nine drawbar buses. The core does the same thing. Each held key
adds its drawbar levels to the *target gain* of the generators it touches. Every
generator that is sounding costs one wavetable read per sample, and two keys that
need the same wheel share it. Cost scales with the number of distinct pitches
sounding (at most 79 wheels on a B3 manual), never with the number of keys. So
full polyphony is free. The transistor organs (divider chains) and pipe ranks (one
pipe per pitch) map onto the same structure.

Rendering runs on the audio thread in one AudioWorklet node per organ layer, so it
doesn't stutter when the UI is busy. Measured in Node on a dev machine with a
10-note chord, all drawbars out, vibrato and percussion on: B3 runs about 90× faster
than realtime, Vox/Farfisa about 50×, pipes about 35×. That leaves wide headroom for
an iPad. The worklet bundle is about 11 kB and self-contained (no decoder code).

```ts
const voice = await createOrganVoice(ctx, { params: organParamsFromLayer(layer, program.organFx) });
voice.noteOn(60); voice.noteOff(60);
voice.setParams(organParamsFromLayer(layer, program.organFx, { wheel: 0.5 })); // morphs
voice.output; // AudioNode, where a rotary speaker / FX chain plugs in
```

## B3 tonewheel model (close to the real instrument)

- **Tuning:** 91 wheels at `20 rps × teeth × driving/driven`. The twelve gear pairs
  (C 85/104 … B 108/70), 2…128 teeth per octave, and the top seven wheels on 192
  teeth using the gears a fourth up. A4 = 440 Hz exactly; the other notes sit
  within ~2 cents of equal temperament, as on the real organ.
- **Drawbars:** 16′ 5⅓′ 8′ 4′ 2⅔′ 2′ 1⅗′ 1⅓′ 1′ (−12, +7, 0, +12, +19, +24,
  +28, +31, +36 semitones; the 1⅗′ is the tempered third). The step levels are
  the Stage 4's own: 0, −3.3, −6.2, −10.3, −15.2, −19.8, −26.5, −32.5 dB for
  8…1, and 0 is silent (see "The Stage 4's own organ" below).
- **Foldback:** the manual's lowest C (MIDI 36) plays wheel 13 on the 8′. The 16′
  folds its lowest octave up (manuals never reach wheels 1–12). Harmonics above
  wheel 91 fold down an octave at a time. This matches the published B-3 table.
  Notes outside the 61-key range fold the same way. `B3 BASS` reaches wheels
  1–12, whose more complex, square-ish profile is modelled.
- **Percussion:** the Stage 4's charge model. A charge drains while any key is
  held and recharges (τ ≈ 26 ms) while the keyboard is clear; the percussion
  amplitude is the charge squared. So it is single-trigger: legato notes get no
  hit, and quick re-strikes get a partial one. 2nd = the 4′ wheel, 3rd = the 2⅔′
  wheel. Fast decay falls 20 dB in ~0.13 s and is silent by ~0.22 s; slow in
  ~0.4 s / ~0.68 s. Soft is ~12.7 dB below normal, slow peaks ~3.2 dB below fast.
  While percussion is on, the 1′ drawbar is silenced (it borrows that key contact),
  and at normal volume the drawbars drop to 0.7 (−3.1 dB). Percussion bypasses
  the vibrato.
- **Key click:** each key's nine contacts close (and open) at slightly scattered
  times, up to 3 ms apart. The instant gain steps plus a short burst of bright noise
  per contact give the click. Level comes from `keyClick` (default 0.5).
- **Vibrato/chorus:** a modulated delay of up to 1 ms, swept by a ~7 Hz triangle
  (V1/V2/V3 sweep 0.35/0.65/1.0 ms). Chorus mixes the swept signal with the dry
  signal.
- **Output:** layer volume (dB), then a soft limiter that is transparent below ±0.6.
  Each model's level carries a fixed −22 dB trim (`HEADROOM` in `voicing.ts`), so a
  ten-note chord with all nine drawbars out, chorus on, peaks at about 0.5–0.56 before
  the limiter on the B3 and at 0.4 or less on the other models. Fewer keys or drawbars
  stay quieter, as on the instrument (one key on 888000000 peaks about −33 dBFS).

Sources: Hammond B-3 service manual data as summarized in Electric Druid,
"Technical aspects of the Hammond organ" (gear table, 192-tooth top octave,
foldback table, scanner description). The drawbar steps, percussion model and
wheel waveforms come from the Stage 4 firmware research below (knowledge, not
copied tables).

## Other models (labelled approximations)

These are sketches from general organ knowledge, not measurements of Nord's models:

- **VOX** (transistor): drawbars 1–4 are the footages 16′, 8′, 4′ and a IV mixture
  (2⅔′+2′+1⅗′+1′). Drawbars 5 and 6 act as tone-colour controls: a mellow
  ("flute") and a bright ("reed") path. Drawbars 7–8 and the ninth control (a 1–5
  selector) are **not voiced**. Equal-tempered divider tuning.
- **FARF** (transistor): nine on/off tabs in compact-organ order: Bass 16′,
  Strings 16′, Flute 8′, Oboe 8′, Trumpet 8′, Strings 8′, Flute 4′, Strings 4′,
  2⅔′. The decoder's "5+6+7+8" means tab down (on).
- **PIPE1 / PIPE2:** each drawbar is a stop at the B3 footages. Mutations sound at
  pure ratios (3:2, 3, 5, 6), and ranks break back an octave to stay between about
  30 Hz and 8 kHz (and inside MIDI 0–127 at an extreme octave shift). Pipe 1 leans on principals, Pipe 2 on flutes. Slow speech
  (35/55 ms) with a short chiff.
- Vibrato on these models uses the same delay vibrato. The Vox uses a ~6.1 Hz
  triangle, the Stage 4's Vox rate (on the instrument it modulates the oscillator
  pitch directly). Farfisa and pipes use a sine at a generic rate (not instrument
  data).

## What the program drives

From `organParamsFromLayer`: organ model, nine drawbars (wheel / aftertouch / pedal
morphs applied linearly when amounts are passed; Farfisa tabs switch at half-way),
percussion on / 3rd / fast / soft, vib/chorus on plus the per-model type from the
global `organ vib/chorus type` map, layer volume (morphable), octave shift, and organ
sustain (notes fade over ~0.5 s, ~0.9 s for pipes, instead of stopping).

## Not modelled (yet)

- **Rotary speaker:** not in this engine. `voice.output` is the hook where a rotary
  stage (and the organ FX chain: mod, amp/EQ, comp, delay, reverb) goes. Build it
  from the Stage 4 rotary structure documented in `docs/EFFECTS-ENGINE.md` (two rotors,
  Doppler delay + amplitude modulation, ~800 Hz crossover, horn low-pass by direction,
  two virtual mics, tube drive, exponential speed ramps, stop position), with speeds and
  timings from public Leslie figures or measured by ear — not from dumped tables.
- The rest of the Stage 4's own organ that this engine does not do yet: see
  "Differences from this engine" at the end of this file (contact-bounce click,
  wheel loading, crosstalk and leakage, the scanner ladder, per-key contact levels,
  the B3 Bass composite drawbars, the transistor organs' own oscillators).
- Keyboard split zones, layer scenes and the program's other layers: a future
  "play this program" layer routes notes into each organ voice per zone.
- Velocity is ignored (as on the instruments). Sustain pedal holds notes through the
  shared MIDI sustain gate.

## The Stage 4's own organ (firmware)

What the Stage 4 OS v1.66 firmware does for its organ, recovered from the DSP
images and the full ARM decompile (method and tooling: `docs/EFFECTS-ENGINE.md`,
`docs/SYNTH-ENGINE.md`). Per `docs/LEGAL.md` this section records structure,
formulas and a handful of rounded constants. It holds no tables: the wave
shapes, level matrices, crosstalk matrix and timing tables stay in the firmware
and are only summarised here.

Notation: DSP code addresses are SHARC+ short-word addresses on **DSP1 core 1**
(`sw:0x12xxxx`), DSP data addresses are `dm:`, ARM addresses are virtual
(`0xC0xxxxxx`). Confidence: **high** = read directly from code or data;
**medium** = the structure is clear but a value or mapping is inferred;
**low** = hypothesis. Rates assume a 44.1 kHz output (the synth note's
inference). At 48 kHz the times below shrink by about 8 %.

### Where the organ runs

| Finding | Evidence | Confidence |
|---|---|---|
| DSP 1 is the organ DSP: the service image names its cores `DSPOrgCore1`/`DSPOrgCore2` (DSP0 `DSPFx`, DSP2 `DSPSyn`, DSP3 `DSPSmp`, DSP4 `DSPPiano`). | strings in the second OS image (`p2-code`) | high |
| **Core 1 generates the organ tones** and runs the organ effects and rotary. The tonewheel bank, the drawbar buses, percussion, scanner, contact transients and the transistor/pipe oscillator banks are all in `sw:0x121BBE…0x122EF5`. | code below | high |
| Core 2 is a synth voice core. Its code matches DSP2 core 2 except for one block: it reads the synth LFO, phase and noise values that core 1 writes into it each block (`dm:0xB00C8`/`0xC00C8`). | listing diff DSP1 c2 vs DSP2 c2 | high |
| The organ modules sit in core 1's eight "generator slots" (`dm:0xC01D6…`, module pointer + node, called at `sw:0x1212F0…`) ahead of the effect chains. The ARM loads the pointers at runtime. | main loop `sw:0x121007` | medium |
| Each module call renders **two samples** (outer `DO LCNTR = 2`). | `sw:0x121BC3`, `sw:0x121E48` | high |

### Tonewheel generator (`sw:0x121BBE`)

- **104 generators, table oscillators.** 12 "shaft" phase accumulators
  (32-bit, increment × a master-tune factor `dm:0xB33B8`), then 92 wheels whose
  phase is `(shaft phase + fixed offset) << octave`. So every wheel on a shaft is an
  exact octave multiple (2, 4 … 256 × the shaft), with a per-wheel starting phase in
  1/16-turn steps. The top octave uses ×256 on the same shafts; there is no
  192-tooth anomaly. **high**
- **Tuning:** the 12 shaft increments sit within ±0.6 cent of equal temperament,
  with small per-note offsets. They do **not** follow the B-3 gear ratios.
  Master tune is a ratio from a 1/128-semitone table (ARM `0xC027D9D8`, written by
  `0xC002187C`). Index 464 of it gives A4 = 440.0 Hz at 44.1 kHz; how the
  default index is formed is not traced. **high** (relative), **medium** (absolute)
- **Numbering:** generator g = Hammond wheel + 11. g 12–23 are wheels 1–12,
  g 24–102 are the manual wheels 13–91 (g 103 is unused). g 0–11 sit an octave
  below wheel 1 and only the B3 Bass reaches them. **high** (from the key tables)
- **Waveforms:** each generator reads a 128-point single cycle with linear
  interpolation (`FEXT` top 7 bits, 25-bit fraction). A per-wheel pointer list
  (`dm:0x951DA`) assigns four shapes, summarised as harmonic levels relative to
  the fundamental. **high**

  | Wheels | Shape |
  |---|---|
  | 1–12 (and g 0–11) | strong odd harmonics: h2 −16.5, h3 −5.6, h4 −24, h5 −12.3, h7 −19, h9 −26 dB |
  | 13–16 | h2 −15.7, h3 −31.5, h4 −44 dB |
  | 17–24 | h2 −19, h3 −37, h4 −45 dB |
  | 25–91 | almost a sine: h2 −35, h3 −55 dB |

  A fifth 128-point shape (h2 −19, h3 −36, h4 −44, h5 −48 dB) is present but not
  pointed at by default (possibly a tone-wheel mode). **medium**
- **Per-wheel amplitude is live.** The ARM rewrites each generator's amplitude
  (`dm:0x9510A + g`) as contacts open and close. It models **wheel loading**: the
  more key contacts draw on one wheel, the lower its output.
  `amp[g] = base[g] · (32640 − sag[n] · k[g]) / 2²³`, where n is the number of
  closed contacts on wheel g. `sag[]` is a 100-entry curve that rises steeply
  (n = 0–1 → 60/255, 2 → 98, 10 → 193, then saturating near 247). `base` and `k`
  are per-wheel. ARM `0xC00BF890` (key down), `0xC00BF610` (key up). A slow per-wheel
  level variation is written separately by `0xC00BAD74` (only in some modes).
  **high** (formula), **medium** (meaning of base/k)

### Drawbars, contacts and buses (ARM side)

- **Bus model.** The DSP does not see keys. Each organ part has two 80-wheel gain
  vectors, the **manual bus** (`dm:0x951F1 + 0xA0·part`) and the **percussion bus**
  (`dm:0x95241 + 0xA0·part`), for wheels 13–92. The B3 module forms
  `Σ wheel[g]·gain[g]` for each (`sw:0x121E5A`, `sw:0x122102`). The ARM keeps the
  gains as integers and writes `float(Σ + leak[g]) · scale[g]` (`0xC022DDC8`,
  `0xC00BE348`). **high**
- **Gain of one contact** = `drawbarStep[position] · ((L[key][bar] · v) >> 4)`.
  - `drawbarStep` = **0, 3, 6, 13, 22, 39, 62, 87, 127** for positions 0–8
    (ARM `0xC02B0EC0`, read in `0xC00BE348`). That is 0, −3.3, −6.2, −10.3, −15.2,
    −19.8, −26.5, −32.5 dB for 8 … 1.
  - `L` is an 8-bit level per key and contact (128 × 9, ARM `0xC02809DC`). It is a
    measured-looking voicing table: flat below MIDI 36 and above 96. Per-drawbar
    means are −5 to −9 dB; the 1⅗′ is the weakest (≈ −11.7 dB), bass keys' 16′ is
    down to −17 dB, and treble keys' upper harmonics are down to −13 dB.
  - `v` is a per-key multiplier set at key down (16 = unity presumably).
  - A morphed drawbar is rounded to a whole step (`(v + 0x8000) >> 16`,
    `0xC011AB8C`).
  - While percussion is on, the 1′ step is forced to 0.
  **high**
- **Foldback** (per-key wheel table, ARM `0xC0281BDC`): wheel = key − 23 + footage,
  folded up by octaves below wheel 13 and down above wheel 91. This is exactly the
  B-3 manual rule this engine already uses. **high**
- **Contact timing.** On key down the nine contacts close at staggered times:
  - 17 rotating patterns of sorted offsets (ARM `0xC027B940`; first gap ≈ 30, last
    contact at 534–748 ticks, so ≈ 12–17 ms if a tick is one sample).
  - 17 rotating permutations of which bus closes when (ARM `0xC02B0EE8`). The 1′
    contact always closes first.
  - Key up uses evenly spaced offsets (0, 31 … 248 ticks), or all at once for a fast
    release (release value > 900).
  **high** (structure), **medium** (tick unit)
- **Contact transients (the key click).** Each contact change takes one of
  20 transient slots on the DSP (`sw:0x121D1C`, slot records `dm:0x954E6`). A slot
  plays a stored 16-bit **bounce envelope** that multiplies **the wheel's own
  signal** and is added into the bus. Its gain decays per sample by 0.9997, 0.9993
  or 0.99 depending on the case (ARM `0xC00BEA08`). There is no noise source: the
  click is gated tonewheel signal, as on the real organ. The system "Organ Click
  Level" (0–1) scales it. **high** (mechanism), **medium** (envelope shape and level)
- **Crosstalk and leakage** (ARM `0xC00BD9E0`). Per bus,
  `leak[g] = Σ_j gain[j] · M[g][j] >> 12`, where M is a 79 × 79 byte matrix
  (ARM `0xC02B114C`, ~29 % non-zero, mean 3.9). Typical leakage is about −60 dB;
  the strongest pairs are near −40 dB at fixed wheel offsets such as +48, which
  looks like the generator's shared compartments. There are three modes:
  - mode 1: only sources from an octave below upward, `>> 14`;
  - mode 2: the full matrix;
  - mode 3: the full matrix plus a constant per-wheel floor on the manual bus, so
    some wheels hum with no key down.
  The mode is most likely the system "Tone Wheel Mode" (3 values, default 1).
  **high** (formula), **medium** (mode mapping)

### Percussion

- **Envelope** (`sw:0x122102…`, node fields written by ARM `0xC00C1998`; values
  from the ARM constant block `0xC02AFF88 + 0x824…0x8B0`). A charge c in [0, 1]:
  - while any key is down: `c ← d·c − ε`, floored at 0;
  - while the keyboard is clear: `c ← 0.99912·c + 0.00089`, capped at 1. That is a
    recharge toward 1.011 with τ ≈ 26 ms.
  - The percussion signal is `c² · level · percBus`.

  So single trigger, legato behaviour and weak quick re-strikes all fall out of
  one recharge rule. **high**
- **Decay**, at 44.1 kHz. Each speed has three variants; the object init selects
  variant 0, but what selects the others is not traced.

  | | d | ε | −20 dB at | silent at |
  |---|---|---|---|---|
  | fast, variant 0 | 0.99991 (τ 0.25 s) | 6.5e-5 | 0.13 s | 0.22 s |
  | fast, variants 1 / 2 | 0.99994 / 0.999975 | 5.5e-5 / 4.6e-5 | 0.17 / 0.25 s | 0.28 / 0.40 s |
  | slow, variant 0 | 0.999974 (τ 0.87 s) | 2.2e-5 | 0.40 s | 0.68 s |
  | slow, variants 1 / 2 | 0.99999 / 0.999996 | 2.3e-5 / 1.4e-5 | 0.53 / 0.95 s | 0.82 / 1.45 s |

  **high** (values), **medium** (which variant is live)
- **Levels.** Normal is 4.33× soft (+12.7 dB); fast is 1.45× slow (+3.2 dB), the
  same ratio in every variant. Normal also sets the manual-bus gain to **0.7**
  (−3.1 dB); soft leaves it at 1.0. In the firmware, percussion level 1 = soft.
  **high**
- **Routing.** The percussion wheel is the 4′ or 2⅔′ contact of each held key: a
  separate 2-contact keyboard with its own per-key levels (ARM `0xC027BC80`).
  The harmonic switch sets that keyboard's bus steps to (127, 0) or (0, 127). The
  percussion bus is filtered (biquad) and joins the output after the scanner, so it
  bypasses vibrato. **high**

### Vibrato / chorus scanner (B3)

- **Delay line:** a ladder of **8 cascaded second-order sections**, all-pass-like,
  stands in for the LC line (`sw:0x121E9D…0x121FA1`; coefficients `dm:0x955B0`,
  boot values pole radius 0.9). The section outputs are stored in a tap buffer
  (`dm:0xB46E6`). **high** (structure), **low** (that the boot coefficients are the
  live ones; with them the ladder is far shorter than the B-3's ~1 ms)
- **Scanner:** `out = Σ_{k=0..8} (w[k] + w[16−k]) · tap[idx_k]`, with
  w[0] and w[8] used once. That is **16 stator plates folded onto 9 taps**, as on
  the B-3 (`sw:0x121FB3`). The 9 tap positions `idx_k` are node fields written by
  the host, presumably per V1/V2/V3. **high** (formula), **medium** (depth = tap set)
- **Rotor:** the plate weights come from a 128-point coupling curve (`dm:0xC0262`,
  signed index, interpolated). Two rotor phases half a turn apart update a
  32-entry ring of plate weights (`dm:0xC0202`); the ring position advances on each
  phase wrap (`sw:0x121DC3`). Boot rate is `0x2A454D`/sample ≈ 28.4 Hz plate
  crossings at 44.1 kHz. If a turn is four crossings, that is ≈ 7.1 Hz, close to
  the B-3's 6.9 Hz. **medium**
- **Chorus:** `out = filtered scanner + dry manual bus · c`, where c is a node
  field: 0 for vibrato, non-zero for chorus (`sw:0x121FB3…`). Its value per C1–C3
  is not traced. **medium**

### Output stage (B3 module, per sample)

`(percussion path · 16 + manual path · 0.7 · manualGain) · 8` → biquad → a
one-pole (0.01) crossfade between the filtered and unfiltered signal → a
one-pole shelf → part level. There is also a cubic soft clipper `x − c·x³` and
several biquads (`dm:0x954D9`, `0x95491`) and short FIRs (`0x95471`, `0x9549D`)
whose roles (preamp, tone, oversampling) are not pinned down. **medium**
(structure), **low** (roles)

### Other models

- **B3 Bass** (ARM `0xC00BDC3C`, per-key tables `0xC027E9DC`/`0xC027F9DC`):
  composite pedal drawbars, eight contacts per key. With a, b, c the step levels
  of drawbars 1–3, the contacts are:
  - 16′ wheel ← 0.55a;
  - a second wheel (the 8′ below MIDI 48, a 5⅓′ from there up, i.e. a twelfth
    above the 16′) ← 0.7a;
  - 8′ ← 0.35a + 0.75b;
  - 4′ ← 0.28a + 0.6b;
  - 2⅔′, 2′, 1⅗′, 1⅓′ ← 1.1c, 0.84c, 0.53c, 0.35c.

  It reaches an octave below wheel 1 for the lowest keys. **high** (formula),
  **medium** (that this is the B3 Bass)
- **Vox** (`sw:0x12272D`): its own oscillator bank. Vibrato **modulates the
  oscillators' pitch** with a ~6.07 Hz triangle (`0x905A3`/sample at 44.1 kHz,
  slightly flattened at the peaks). Depth for V1/V2/V3 is in the ratio
  1 : 1.65 : 2.5 (ARM `0xC011FFB8`, written to `dm:0xE20E3`). **medium**
- **Farfisa** (`sw:0x122A71`): its own oscillator bank with a polynomial-sine
  pitch LFO. The 4 vibrato types are {light, heavy} depth (1 : 2) × {slow, fast}
  rate (≈ 5.1 / 5.9 Hz if the LFO steps once per two samples). **medium**
- **Pipe (presumably)** (`sw:0x122620`, `sw:0x12268F`; ARM `0xC022AFC4`): 92
  oscillators reading two interleaved 4096-point waves, one 5-harmonic and mellow,
  one brighter. They are mixed per generator (`w`, `1 − w`) and use the same
  drawbar step table. **medium** (structure), **low** (model mapping)

### How program parameters reach it

| Program parameter (Edt id) | ARM handler | Effect |
|---|---|---|
| Drawbars 1–9 (365–373) | `0xC011AB8C` → `0xC00BE348` | rounded to a step; bus gains rebuilt from held keys |
| Perc on / harmonic / speed / level (363, 375, 376, 377) | `0xC011FFB8` → `0xC00C1998` | 1′ off; perc bus (127,0)/(0,127); d, ε; level; manual 0.7 |
| B3 vib type (360) | `0xC011FFB8` (deferred task) | scanner taps / chorus mix (values not traced) |
| Vox vib type (361) | `0xC011FFB8` | `dm:0xE20E3` depth |
| Farfisa vib type (362) | `0xC011FFB8` | `dm:0xC27D6` rate, `dm:0xC27D7` depth |
| Model (358) | `0xC011FFB8` | engine/module per part |
| Layer level A/B (177/178) | `0xC011AB8C`/`0xC011A7A4` → `0xC023195C` | part mix level |
| Tone Wheel Mode, Click Level (system 141, 142) | not traced end to end | leakage mode, click scale (inferred) |

All values travel as `{DSP address, float}` pairs. `0xC001FF18` converts a
1.23 fixed-point integer to a float; `0xC0020DBC` sends `value << 8`.

### Differences from this engine

Fixed in this change (knowledge re-implemented, with tests):

1. **Drawbar curve:** the 3 dB-per-step law is replaced by the instrument's step
   levels (`DRAWBAR_STEPS`). Fractional morph positions interpolate between steps;
   the instrument rounds to whole steps.
2. **Percussion:** the instant-retrigger exponential is replaced by the
   charge/recharge model, with a squared amplitude and variant-0 timings. Soft is
   0.231 × normal (was 0.5), slow is 0.69 × fast, and the manual drop is 0.7.
3. **Wheel waveforms:** wheels 1–12 get the instrument's richer odd-harmonic
   shape, wheels 13–24 get their 2nd/3rd-harmonic content, and wheels 25+ keep a
   trace of 2nd and 3rd (they were pure sines).
4. **Vox vibrato:** a 6.1 Hz triangle (was a 5.6 Hz sine).

Still different (not changed here):

5. **Key click.** The instrument gates each wheel with a stored contact-bounce
   envelope. The contacts spread over ≈ 12–17 ms in 17 rotating patterns, with
   the 1′ contact first. This engine uses gain steps plus a differentiated-noise
   burst within 3 ms. To do: drop the noise, ramp each contact over a short bounce
   envelope of our own design, and widen and order the scatter.
6. **Wheel loading (sag):** missing. To add: scale each generator by
   `1 − s(n)` with n = its closed contacts. Keep a gentle curve of our own; don't
   copy `sag[]`.
7. **Crosstalk / leakage:** missing. To add: a small (≈ −60 dB) leak from
   compartment partners (+48 wheels, etc.) and an optional static floor for a
   "vintage" mode.
8. **Per-key contact levels:** missing (all contacts are equal). To add: a gentle
   per-drawbar trend (1⅗′ ≈ −5 dB vs the rest; bass 16′ and treble upper harmonics
   rolled off) rather than the measured table.
9. **Tuning:** this engine uses B-3 gear ratios, including the 192-tooth top
   octave (up to ~2 cents off). The instrument uses near-ET shafts with exact
   octaves. The difference is ≤ 2 cents.
10. **Scanner:** a single swept delay versus a ladder with 16 plates folded onto 9
    taps and a rotor coupling curve. The depth, rate and chorus mix per setting are
    not yet known from the firmware.
11. **Percussion path filtering and output stage** (biquads, cubic soft clip,
    shelf) are not modelled.
12. **B3 Bass:** composite pedal drawbars (formula above) versus plain footages.
13. **Vox/Farfisa:** the instrument modulates oscillator pitch. Farfisa has 4
    vibrato types (light/heavy × slow/fast) that `VibChorusType` cannot express yet.

### Open questions

- Output sample rate (44.1 vs 48 kHz). Every absolute time above scales with it.
- What selects the three percussion variants; the live scanner coefficients,
  taps, rate and chorus mix per V/C setting.
- The contact-timing tick unit; the per-key multiplier `v`; the `base`/`k` wheel
  arrays and the slow level variation in `0xC00BAD74`.
- How Tone Wheel Mode and Click Level map onto the leakage mode and click scale.
- Absolute percussion level against a full drawbar (the output path has
  ×16/×0.7 gain staging and filters in between).
