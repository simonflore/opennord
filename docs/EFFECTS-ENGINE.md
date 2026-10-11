# Nord Stage 4 effects engine: RE notes

This note covers what the Stage 4's SHARC+ DSPs do with a program's effect settings: which
core runs which effect, which algorithm each effect uses, and how a program value reaches the
DSP. It follows on from the firmware work in `docs/NSP-FORMAT.md` (2026-10-10 sections:
`os.cab` unpack, the five DSP images, the Ghidra SHARC+ module in `tools/ghidra-sharc/`,
DSP 3 = NW1 sample decoder, DSP 4 = piano decoder).

Source: Stage 4 OS v1.66, unpacked locally. Everything firmware-derived (listings, decompiler
output, tables, coefficients) stays in the gitignored scratch area (`docs/LEGAL.md`). This file
documents structure, addresses, formulas and behaviour. It contains no firmware tables: no
curves, coefficient sets, delay-length sets, waveshaper or cabinet data. Formulas fitted to the
firmware's behaviour and a few small constants appear; where a number describes behaviour (a
time constant, a delay in ms) it is rounded. Data that a faithful engine needs but that may not
be copied is listed in §10.13.

Confidence labels: **high** means the algorithm is unambiguous in the code. **Medium** means
the algorithm is clear but its mapping to a panel effect is inferred. **Low** means it is a
hypothesis.

Sample rate: the DSPs process 4-frame stereo blocks. §1–§8 assumed 48 kHz. The second pass
(§10) found that the effects run at **≈43,402 Hz** (22.222 MHz / 512), so block rate ≈ 10,851 Hz.
Where §1–§8 give a time "at 48 kHz", scale it by 48,000 / 43,402. **§10 supersedes §1–§8
wherever they disagree** (§10.1 lists the corrections).

## 1. Core roles

| Core | Role | Evidence | Confidence |
|---|---|---|---|
| **DSP0 core 1** | Audio I/O master and effects. Runs five effect chains, the final output mix, a 4-section biquad cascade on each output bus, and an output peak limiter with soft clip. Converts the result to fixed point for the SPORTs. | Only core that programs the SPORT DMA (`0x3100_2xxx`), the DAI/SRU routing (`0x310C_9xxx`) and SPI2 (`0x3104_4xxx`). Main loop at `sw:0x1211E3`. | high |
| **DSP0 core 2** | Effects. Runs five more chains on the same module library, with the same main-loop shape as core 1 but no peripheral setup. | Main loop `sw:0x1211E3` (different build); the TDM input reaches both cores through 2-D DMA that writes alternately into core 1 and core 2 memory. | high |
| **DSP1 core 1** | Organ effects. Runs the **rotary speaker** and two 7-slot effect chains on the same module library. It also feeds the paired voice core: eight generator slots plus LFO, phase and noise state are written into DSP1 core 2 memory every block. | Main loop `sw:0x121007`. Rotary at `sw:0x1256AD`. Writes to the core-2 multiprocessor alias (`0x0A2B_xxxx` word addresses). | high (rotary), medium (rest) |
| DSP1 core 2, DSP2 core 1/2 | Voice engines (near-identical builds) | `docs/NSP-FORMAT.md`; none of the effect library is present | high |
| DSP3 | NW1 sample decoder | `docs/NSP-FORMAT.md` | high |
| DSP4 | Piano (`CNSP`) decoder | `docs/NSP-FORMAT.md` | high |

The effect library is **byte-identical** in DSP0 c1, DSP0 c2 and DSP1 c1: same instructions,
shifted addresses. The comparison hashes each function's text with its addresses removed
(a scratch `fnhash.py`, not committed). The voice cores share none of it. Addresses below are
DSP0 c1 addresses.

**Chain count.** The ARM driver addresses **12 effect chains** (it bounds the chain index at
11). There are 10 chains on DSP0 (5 per core) and 2 on DSP1 c1. A program has 6 effect sets:
organ 1, piano 2, synth 3 (see `offset-map.generated.ts`). One plausible reading of
12 = 2 × 6 is two complete programs' worth of chains. That would let the outgoing program keep
ringing during a Seamless Transition. Under that reading, each DSP0 core holds piano A/B and
synth A/B/C, and DSP1 c1 holds the organ chain twice. **Low confidence.**

Memory supports the split. Each DSP0 core reserves a 400 KB L2 buffer (102,400 words), and
DSP1 c1 reserves 640 KB of L2. Those are the long delay lines. The voice cores reserve 240 KB
each, which looks like streaming buffers. (*Corrected in §10.1:* the delay lines either stream
through TDM slots to external memory (`0x1206B0`, `0x1208AF`) or keep the line in L2 (`0x120AB5`,
0x3C000 bytes per chain on DSP1), chosen by resources (§10.9). What the DSP0 L2 buffers hold has
not been re-checked.)

## 2. The effects framework

Each core's main loop runs a **fixed slot graph**:

- **Chains.** DSP0: 5 chains per core, each **5 serial slots** followed by **2 post slots**.
  DSP1 c1: chains of 7, 7, 3 and 1 slots after the eight generator slots.
- **Node.** A slot is a node structure. Field `-0x20` holds the **module entry point**, called
  as `CALL (M8,I8)` with `I8 = DM(-0x20,I1)` and `I1` pointing at the node. Other fields hold
  the input pointer, the coefficients and the state. At boot every slot holds a null module
  (`sw:0x125346`), and **no DSP code ever writes a module pointer**. The graph is built from
  outside the DSP (§4).
- **Dry/wet per slot.** Around every module call the main loop crossfades the slot's output
  with its input, using a smoothed gain clamped at 0. This is what makes effect on/off and
  switching click-free.
- **Stereo by SIMD.** Modules run in SHARC SIMD mode (`MODE1 |= PEYEN`). Processing element X
  computes left and Y computes right from the same code. Coefficients load as L/R pairs, which
  gives stereo variants (LFO phase offsets, separate taps) at no extra cost. One consequence:
  the decompiler shows only the left channel, so stereo behaviour has to be read from the
  coefficient layout.
- **Block size.** 4 frames per block (about 83 µs at 48 kHz; 92 µs at the real 43.4 kHz,
  §10.12). Control values are smoothed **once per block** with a one-pole filter (time constant
  about 9 ms at 48 kHz; τ ≈ 10 ms at 43.4 kHz, §10.4). Every rate, depth and time parameter
  therefore glides rather than steps.
- **16-bit packed delay memory.** Reverb tanks and diffusers store their delay lines as
  **16-bit floats**, packed and unpacked with `FPACK`/`FUNPACK`. That halves memory use.
- **Reduced-rate reverbs.** The reverb and spring modules decimate their input with fixed
  biquad anti-alias cascades, run the tank at a fraction of the audio rate, then interpolate
  back up.
- **Send bus to a global effect.** One send module (`sw:0x125103`) and one decimating send
  module (`sw:0x125142`) accumulate a layer into a shared bus with a level, then read the
  bus's return with a smoothed gain. This is what a "Global" Delay, Reverb or Comp setting
  (`Edt_Com_kEffects{Dly,Rvb,Cmp}Global`) needs. The routing is inferred from the code shape.
- **Clear routines.** Most modules have a companion that zeroes state and delay memory
  (`sw:0x123203`, `0x124CE8`, `0x120F7B`, …). The ARM binds these alongside the module: it
  asks for `frmDelay` together with `DelayClr` and `delayBuffer`.
- **CPU accounting.** The main loops read `EMUCLK` around each section and keep min/max cycle
  counts. These are profiling counters with no audio effect.

## 3. Effect catalogue

Stage 4 menus are taken from the firmware's own UI label tables (§5). The modules are in the
shared library unless noted.

> **Superseded in part.** The "Likely menu entries" columns below were inferred from the
> algorithms. §10.3 settles the mapping from the firmware's own type tables, and several
> guesses here turned out wrong: 0x123798 is Chorus, 0x123E01 is Flanger, 0x124270 is
> Phaser II, 0x1245F8 is Vibe, 0x123ECB is Spin, 0x124344 is Ring Mod, and
> 0x1206B0/0x1208AF/0x120AB5 are the delay lines, not bus compressors.

### Effect 1 (Auto-Pan, Tremolo, Ring Mod, A-Wah, Wah-Wah, Pump)

| Module | Algorithm | Likely menu entries | Conf. |
|---|---|---|---|
| `0x124344` | Per-sample amplitude modulation. Triangle LFO, shaped to a sine by an odd polynomial. Gain = `1 − depth·(lfo·scale + offset) + depth`, with L/R using different offset coefficients (SIMD). The LFO can slave to another node's phase (master clock / tempo sync). | Auto-Pan Soft/Hard. Possibly also Ring Mod: the LFO runs per sample, so it can reach audio rate. | medium |
| `0x1235AD` | Block-rate sine LFO driving amplitude, applied to a blend of the dry signal and a first-order filtered copy | Tremolo Soft/Hard (tone-shaped tremolo) | medium |
| `0x1236A0` | LFO shaped by a curve that blends linear and squared, with **phase reset** when its sync input changes, and a depth crossfade | Pump (LFO): a ducking ramp | medium |
| `0x123707` | Sine LFO × depth + offset, clipped, gain modulation | Tremolo or Pump (Pedal) variant | low |
| `0x124746` | 2-pole state-variable band-pass, run twice per sample (2× oversampled). Its centre is either a sine LFO **or a fixed position** (pedal mode, selected by a flag). The position is squared and smoothed, then mixed with the input. | **Wah-Wah (LFO) / Wah-Wah (Pedal)** | high |
| `0x12480F` | **Envelope follower**: block energy (sum of squares, L+R), separate attack and release one-poles, sensitivity, threshold. It drives the same 2-pole SVF. | **A-Wah Envelope / A-Wah Cry** | high |
| `0x124270`, `0x124562` | 3-stage cascaded SVFs swept by an LFO. `0x124270` saturates (clips) its integrators and feeds back from the output. | Another wah or filter flavour: Cry, or the Ring Mod tone path | low |

Ring Mod is the one Effect 1 type not yet tied to a module. The candidate is `0x124344` at an
audio-rate LFO, with the carrier set by Rate.

### Effect 2 (Phaser, Flanger, Chorus, Vibe, Ensemble, Spin)

| Module | Algorithm | Likely menu entries | Conf. |
|---|---|---|---|
| `0x12410F` | **4-stage first-order all-pass phaser**. Coefficient from a bilinear warp (computed on the DSP with `RECIPS`), swept by an LFO read from an interpolated sweep table, with feedback. Output = ½·(dry + all-pass), giving classic notches. Extra one-pole tone filters. | **Phaser Type I / II**. Vibe is a candidate too: a Uni-Vibe is a 4-stage phaser with an asymmetric lamp LFO. | high (phaser) |
| `0x123798` | Modulated delay, 512-sample buffer (10.7 ms at 48 kHz; 11.8 ms at 43.4 kHz), linear interpolation, **feedback**. The LFO is a raw triangle or a polynomial sine, chosen by a flag. Left and right have separate taps, and the right channel can use the other phase. | **Flanger Stereo / Mono** | high |
| `0x1243EF` | **Multi-tap chorus**: 512-sample buffer, 6 taps (3 per channel) modulated from a shared 1024-entry sine table | **Ensemble Stereo / Mono** (also the delay feedback "Ensemble / Ensemble Deep") | high |
| `0x1238EB` | Modulated delay (512) driven by an abs/smoothed LFO, with two 2-pole filters on the wet path | **Chorus / Chorus Analog** | medium |
| `0x123ECB` | Modulated delay (about 200 samples) with three interpolated taps, a sine LFO (odd polynomial), smoothing, feedback and two all-pass sections | Vibe, or Chorus Analog | medium |
| `0x1245F8` | LFO-swept 3-stage SVF, then a short delay with two 2-pole sections | Vibe (Stereo/Mono), or Spin | low |

Spin Treble/Bass is presumably the rotary horn or drum path applied to one layer (the Amp
type "To Rotary" sends the layer into the real rotary). No dedicated module has been
identified. **Open.**

### Amp/EQ (Clean, Twin I/II, JC I/II, Small Speaker, Very Small Speaker, To Rotary, LP24, HP24)

| Module | Algorithm | Conf. |
|---|---|---|
| `0x12500A` | **Overdrive**: DC blocker (a few Hz), smoothed Drive, drive-dependent pre-gain and make-up gain from two interpolated lookup tables, then a **table waveshaper** (10-bit index with linear interpolation) and a clip. Wet/dry rises steeply from Drive = 0, so Drive 0 is a true bypass. **Amp Drive**, and very likely Rotary Drive too. | high |
| `0x123243` | **Amp voicing**: biquad (pre-EQ) → table waveshaper → biquad (post-EQ) → 2-pole resonant section. Twin/JC/Small character. | medium |
| `0x123391`, `0x123491` | **Cabinet**: short FIR convolution with a tap count set per node, followed by a **cascade of biquads**. The input is scaled down by 128 before the cascade and up by 128 after it. `0x123491` sums a second FIR path, which could be a second mic or the Type II variant. | medium |
| `0x124EFA` + `0x124F6F`/`0x124FAB` | **Resonant SVF** with Q normalised by reciprocal square root (`RSQRTS`). Two topologies are selectable, and two stages are cascaded for 24 dB/oct. **LP24 / HP24**, with the "Filter Resonance" UI parameter. | medium |
| Bass/Mid/Treble/Mid Freq | No dedicated module. These are almost certainly the biquad coefficients of the amp and cabinet cascades, which the ARM writes (§4). | medium |

### Delay (Normal/Analog, ping-pong, feedback filter, feedback effect)

| Module | Algorithm | Conf. |
|---|---|---|
| `0x123A3E` | **Delay line in 16-bit packed floats** with feedback and wet/dry. At 2 samples per word, the 400 KB DSP0 L2 buffer holds about 2.1 s of stereo at 48 kHz. That matches the delay's range. *Corrected in §10.1:* `0x123A3E` is the Flam feedback unit's short delay line (§10.3, medium), and the main delay lines are `0x1206B0`/`0x1208AF`/`0x120AB5` (§10.9); the 2.1 s figure does not describe the delay. | superseded |
| `0x123E01` | Modulated delay with **smoothed delay time**: changing the time glides the read head, which bends pitch like tape or BBD. LFO or noise wobble, feedback. **Delay Mode = Analog.** | medium |
| `0x124D68`, `0x124E0B` | 2× oversampled SVF with **clipped (saturating) integrators** and one-pole tone/DC sections. LP, HP and BP outputs are mixed by coefficients. **Delay Filter Type** (Bypass / Low-pass / High-pass / Band-pass) in the feedback path. | medium |
| Feedback effect | Ensemble, Ensemble Deep, Vibe, Vibe Stereo, Chorus, Chorus Analog, Flam 20/40 ms, Space 50/100 Wet. These are Effect 2 modules placed in the feedback loop, plus a short fixed delay for Flam. Inferred from the menu and the slot design. | low |

Ping-pong is a routing choice: crossing L and R in the feedback path. No separate module.

### Compressor

| Module | Algorithm | Conf. |
|---|---|---|
| `0x120630` (DSP1 c1: `0x120454`) | **Log-domain feed-forward compressor**. Stereo-linked peak detector over the block, peak hold and release, then log2 via `LOGB`/`MANT`. The gain computer has a threshold and a slope, and attack/release one-poles in the log domain choose their coefficient by direction. Gain comes back through an exponential approximation and is applied to both channels. Amount sets threshold/ratio together; **Response normal/fast** switches the time constants. | high |
| `0x1206B0` / `0x1208AF` / `0x120AB5` (DSP0, `0x1208AF` also on DSP1 c1) | **Bus compressor/limiter** variants. Peak follower with an adaptive release, a gain floor and ceiling, and a **soft-clip waveshaper** (table). They also read 16-bit control words from the incoming TDM frame. These sit at the end of the chain (master or global compressor, output protection). *Corrected in §10.1:* these are the delay lines; the 16-bit TDM words are delay samples streamed to and from external memory (§10.9). | superseded |

### Reverb (Spring, Spring2, Booth, Room, Stage, Hall, Cathedral, ±Predelay/Chorale; Normal/Dark/Bright)

| Module | Algorithm | Conf. |
|---|---|---|
| `0x120D8A` (+ `0x120F18` output taps; **DSP0 only**) | **Figure-of-eight tank, Dattorro-style.** 4 serial input all-pass diffusers, a **modulated all-pass** (its own LFO phase with interpolated read), a damping one-pole and decay feedback. The two tank halves run on alternate calls. Output is a **7-tap weighted sum**. Delay memory is 16-bit packed. Booth, Room, Stage, Hall and Cathedral differ in delay lengths, decay, damping and taps. "Chorale" variants turn up the tank modulation, and "Predelay" variants add a delay ahead of the tank. | high (algorithm), medium (per-type mapping) |
| `0x120FDB` | Wraps the tank: 3 fixed biquads to decimate → tank → 3 biquads to interpolate. The tank runs at a **fraction of the audio rate**; the decimation factor is 4 if read literally. | medium |
| `0x123ABE`, `0x123C0F` | **Schroeder all-pass diffuser chains**, 4 cascaded stages in 16-bit packed delay memory, stereo and quad versions. Early diffusion ahead of the tank, or the lighter Booth/Room types. | high (algorithm) |
| `0x124AF2` → `0x1248D5` (clear `0x124CE8`) | **Spring reverb.** Biquad decimation, then a **long cascade of identical 2nd-order all-pass sections** (the dispersive chirp of a spring), feedback delay lines with all-pass sections, and interpolation back up. This is the textbook digital spring model: dispersion through stretched all-pass chains, run at a reduced rate. **Spring / Spring2.** §10.3 and §10.10 give the spring unit as `0x124AF2`/`0x124CD0` (same clear routine); whether `0x1248D5` is a routine the unit calls or a misread of `0x124CD0` is not checked. | medium-high |
| Color (Normal/Dark/Bright) | Damping and output EQ coefficients. Inferred. | low |

### Rotary speaker (organ; also reachable from other layers via Amp "To Rotary")

`sw:0x1256AD` on **DSP1 c1** (about 1,440 instructions). Confidence **high**.

- **Rotor state.** Two phase accumulators, horn and drum. When stop mode is on, the rotor
  phase is clamped at a **stop angle** (the "ROTOR STOP ANGLE" UI and the program's "rotary
  spkr stop position"). The decoder (`values.generated.ts`, param `108-5`) names 0 = Free and
  1–6 = Front Center, Front Left, Front Right, Back Left, Back Right, Back Center; 7 is not
  decoded. How Free and each position map to an angle is not traced. Speed and acceleration
  ramp the increment toward slow or fast targets. The rates come from system settings: `Edt_Sys_kLeslie{Horn,Rotor}{Speed,Acc}`.
- **Angle-indexed lookup.** The top 6 bits of the rotor phase index 64-entry tables, with
  linear interpolation. Per rotor there are several tables: a **delay offset (Doppler)**, split
  into an integer and a fractional part for an interpolated delay read, plus **gain curves for
  several mic positions** (amplitude modulation and directivity). Mic distance
  (`kLeslieMicDistance`) and horn/bass balance (`kLeslieBalance`) select or weight them.
- **Signal path.** Input sum → **crossover** (2-pole sections) into horn and drum bands → **tube
  drive**: a table waveshaper with smoothed Drive, oversampled by the polyphase FIR helpers
  `0x121E90`/`0x122296` (13- and 7-tap kernels, zero-stuffed upsampling, decimation) → per-rotor
  Doppler delay plus AM per mic → stereo mic mix. The horn and drum processors are separate
  module slots called from the rotary routine.
- **Peak follower** on the input, used for drive or level metering.

## 4. How parameters reach the DSPs

```
program file (.ns4p bits)  ──►  ARM "Edt_*" parameter model (ids, ranges, defaults)
                                   │  morphs, master clock, globals resolved here
                                   ▼
                     ARM DSP-object layer (one C++ object per DSP algorithm)
                     binds DSP entry points + buffers, picks chain slot 0..11
                                   │  writes {DSP address, 32-bit word} pairs
                                   ▼
          host link: SPI2 slave on DSP core 1, served by DMA descriptors only
                                   ▼
          node fields in DSP memory (module pointer, coefficients, modes)
                                   ▼
          module reads them each block; the DSP smooths them (τ ≈ 10 ms, §10.4)
```

- **Parameter model.** A registration function at ARM `0xC01A44C4` registers about 440 edit
  parameters, each with a name, id and range. Effects are ids 403–444. Ranges from that
  registry:

  | Parameter | Range |
  |---|---|
  | Fx1/Fx2 Type | 0–11 |
  | Rate, Amount | 0–127 |
  | Amp Bass/Mid/Treble | **−60…+60** in the edit domain (the program stores 7 bits) |
  | Amp Type (`AmpTypeNew`) | 0–9 |
  | Comp Amount | 0–127, default 95 |
  | Delay rate | a **14-bit** value (0–16383) |
  | Delay feedback filter | 0–3 |
  | Delay feedback FX type | 0–11 |
  | Reverb Type | 0–11, default 6 |
  | Reverb Color | 0–2 |
  | Reverb Amount | default 38 |
  | Leslie drive, speed, stop mode, stop preset | registered |
  | Leslie mic distance, balance, horn/rotor speed and acceleration | system level |

  The ids are firmware-internal. They are documented here only to cross-reference the
  program offset map.
- **The ARM does no floating-point maths** (*corrected in §10.1*: it has no VFP code, but it
  computes most coefficients with a soft-float library). A full decompile of all 3,544 ARM
  functions finds essentially no VFP use. Instead:
  - The ARM **pokes ready-made 32-bit words**. Constants such as 1.0 are written as raw IEEE
    bit patterns.
  - It **uploads whole float tables** word by word. For example, `0xC020DF28` streams a
    455-word table from ARM rodata (near `0xC0442AFC`) into consecutive DSP addresses, with
    one table per mode. Waveshapers, cabinet responses and sweep tables are tables of this
    kind.
  - Any per-value curve, such as knob to time or knob to frequency, is therefore either an
    ARM lookup table or computed **on the DSP at block rate**. Block-rate maths seen in the
    modules includes the bilinear warp with `RECIPS` (phaser), the SVF Q with `RSQRTS`, the
    log/exp gain computer (compressor) and the phase-to-table interpolation (rotary, LFOs).
- **DSP-object layer.** Each DSP algorithm is a C++ object. Its constructor requests its DSP
  resources through a resolver interface by **16-byte descriptors** (virtual calls `+4`, `+8`,
  `+0xC`, `+0x10`). Debug names survive for two of them:
  - delay at `0xC0012140`: `frmDelay` (the per-block function), `DelayClr` (clear) and
    `delayBuffer` (memory);
  - compressor at `0xC01FC17C`: `frmCompressor`.

  Setters then write `slotBase + fieldOffset` for the chosen chain (for example
  `0xC0012270` writes delay fields; `0xC01FC17C` writes compressor mode words). How a
  descriptor resolves to a DSP code address is **not found**: module entry points appear
  neither in the ARM image (as 32-bit or 16-bit immediates) nor in DSP data (§6).
- **Transport.** DSP core 1 runs SPI2 as a slave whose receive DMA chain writes into the
  *transmit* descriptor's start-address word. The ARM can therefore **read any DSP address
  without DSP software running** (the reply defaults to `0xCAFEBABE`). A memory-DMA chain on
  the same core handles writes. On the ARM side, `0xC006CA4C`/`0xC006CCBC` implement a
  flow-controlled FIFO: a GPIO handshake, then a 0x40-word chunked transfer. The setters choose
  between that FIFO (address word, then value word) and a mailbox path, per DSP.
- **Audio-rate control.** DSP1 c1 writes LFO, phase and noise values into the voice core every
  block. (*Struck, §10.1:* this bullet also had "bus compressors" reading 16-bit control words
  from the TDM frames. Those modules are the delay lines and the words are delay samples streamed
  to external memory (§10.9); no control words in the TDM frame are known.)

## 5. Display names (from the firmware's label tables)

The firmware's own enum label tables give names for the `"… variation"` / `"not decoded"`
placeholders in `values.generated.ts`:

| Program field (example id) | Values 0…n |
|---|---|
| FX mod 1 mode (`183-1`, `275-1`) | Auto-Pan Soft, Auto-Pan Hard, Tremolo Soft, Tremolo Hard, Ring Mod, Ring Mod Stereo, A-Wah Cry, A-Wah Envelope, Wah-Wah (LFO), Wah-Wah (Pedal), Pump (LFO), Pump (Pedal) |
| FX mod 2 mode (`191-4`, `283-4`) | Phaser Type I, Phaser Type II, Flanger Stereo, Flanger Mono, Chorus, Chorus Analog, Vibe Stereo, Vibe Mono, Ensemble Stereo, Ensemble Mono, Spin Treble, Spin Bass |
| Amp sim/EQ mode (`225-6`, `317-6`) | Clean, Twin Type I, Twin Type II, JC Type I, JC Type II, Small Speaker, Very Small Speaker, To Rotary, LP24, HP24 |
| Delay effects (`219-8`, `311-8`) | None, None, Ensemble, Ensemble Deep, Vibe, Vibe Stereo, Chorus, Chorus Analog, Flam 20 ms, Flam 40 ms, Space 50 Wet, Space 100 Wet |
| Delay filter type (`215-7`) | Bypass, Low-pass, High-pass, Band-pass |
| Reverb type (`224-6`, `316-6`) | Spring, Spring2, Booth, Booth Predelay, Room, Room Predelay, Stage, Stage Chorale, Hall, Hall Chorale, Cathedral, Cathedral Chorale |
| Reverb dark/bright (`224-4`) | Normal, Dark, Bright |
| Comp response (`203-8`) | Normal, Fast |
| Delay mode (`215-5`) | Normal, Analog |

`*.generated.ts` must not be hand-edited. These names belong in a small hand-maintained
overlay in `interpret.ts`, citing this section.

Amp type 0 is "Clean" in the firmware's label table but "off" in the decoder
(`values.generated.ts`, `225-6`). §10.3 shows Clean selects a real amp variant (6), not a bypass,
so the overlay should show "Clean".

## 6. What this enables for OpenNord

1. **Accurate "explain this patch".** The AI layer can describe what an effect *does*, not just
   name it. Examples:
   - "Wah-Wah (Pedal): a 2-pole band-pass you sweep with the pedal; Amount sets the range."
   - "A-Wah Envelope: your playing dynamics open the filter."
   - "Hall Chorale: a plate-style tank with extra modulation."
   - "Delay Analog: changing the time bends pitch."
   - "Amp Drive 0 is a true bypass."
   - "Comp Fast: a much shorter release (40 ms instead of 200 ms), with a slower attack (4 ms
     instead of 0.86 ms)" (§10.8; this bullet first said "shorter attack/release").

   This needs only the catalogue above and the program values. No firmware data ships.
2. **Better Stage 2/3 → 4 migration** (`docs/MIGRATION.md`). Migration currently *drops* the
   rotary speaker (`src/lib/migrate/from-ns2.ts`, `from-ns3.ts`), although the Stage 4 has a
   full rotary.
   - Organ programs map to the organ rotary: `104-1` on/off, `105-5` drive, `109-4` slow/fast,
     `109-3`/`108-5` stop.
   - Piano and synth layers can use **Amp type "To Rotary"** (`225-6`/`317-6` = 7), which
     routes the layer into the same rotary.
   - **Effect 2 Spin Treble/Bass** is the fallback.

   Effect-type mapping can also use the real Stage 4 menu names above, instead of guessing
   from placeholder labels.
3. **Effects preview and the iPad player** (Web Audio). §7 rates each effect by how well it
   can be rebuilt from program values alone.
4. **Display names** in the Library and inspector (§5): a cheap, visible win.

## 7. Web Audio approximation guide (program params only)

"Feasible" means a convincing approximation from the decoded program values and public DSP
recipes. Nothing here needs firmware tables. Use an `AudioWorklet` wherever a delay is
modulated per sample.

| Effect | Web Audio recipe | Fidelity from params alone |
|---|---|---|
| **Rotary (priority for the organ engine)** | Split at about 800 Hz (two biquads per band). Horn and drum each get a modulated delay for Doppler (a few ms of swing) and a gain LFO for AM, plus a direction-dependent low-pass for the horn. Two virtual mics at ±90° for stereo. Speed slow/fast ramps the rotor rate exponentially, with the horn accelerating faster than the drum. Stop mode parks each rotor at the stop position (0 = Free, 1–6 = six named positions, §3; the angles are not traced). Drive is a `WaveShaperNode` with a tanh curve and `oversample: '4x'`, ahead of the split. Speeds from §10.11 (defaults): horn 0.80 → 7.0 Hz, drum 0.73 → 6.4 Hz. Spin-up: horn about 1 s, drum several seconds (§10.11; the time base is not confirmed). This row first quoted public Leslie figures (horn 0.8 → 6.7 Hz, drum 0.7 → 5.8 Hz). | **Good.** The structure matches the firmware exactly. Its angle tables are measured responses we won't copy, so tune by ear or against a hardware recording. |
| Tremolo / Auto-Pan / Pump | Gain LFO (sine for Tremolo/Pan; a ducking ramp, phase-reset on each beat, for Pump). Pan uses opposite-phase L/R gains. Rate in Hz, or master-clock subdivision when MST CLK is on. | Good |
| Ring Mod | Multiply by an oscillator (`GainNode` gain driven by an `OscillatorNode`). Stereo: offset the carrier phase. | Good |
| Wah (LFO/Pedal), A-Wah | `BiquadFilterNode` band-pass with high Q. Sweep it from an LFO, the pedal, or an envelope follower in a worklet (attack/release one-poles). | Good |
| Phaser I/II | 4 first-order all-passes (worklet, or 4 `IIRFilterNode`s rebuilt per block), LFO sweep, ½·(dry + wet), feedback | Good |
| Flanger / Chorus / Ensemble / Vibe | Modulated `DelayNode`s: flanger about 1–10 ms with feedback; chorus 1 voice; ensemble 3 voices per side; vibe as a phaser with an asymmetric LFO | Good (character differs) |
| Amp/EQ | Clean = 3-band EQ (low shelf, peaking at Mid Freq, high shelf). Twin/JC/Small: waveshaper (tanh plus asymmetry) between pre and post EQ, then a cabinet as biquads or a short `ConvolverNode` with **our own** synthetic IR. LP24/HP24 = two cascaded biquads with resonance. | Medium. Cabinets and voicings are measured data on the instrument. |
| Delay | Stereo `DelayNode` with feedback. Ping-pong crosses the feedback. LP/HP/BP biquad in the loop. Analog = smoothed time plus slight wow and soft clip. Feedback effect = chorus/ensemble in the loop. | Good |
| Compressor | `DynamicsCompressorNode` (threshold/ratio from Amount; Normal vs Fast attack/release) | Medium |
| Reverb | Our own Dattorro plate in a worklet: decay, damping and size per type, extra modulation for Chorale, predelay for the Predelay types, damping for Dark/Bright. Or algorithmically generated IRs in a `ConvolverNode`. Spring: an all-pass chain plus feedback delay (Välimäki/Parker spring model). | Medium. Recognisable types; the exact tunings are firmware data. |

All recipes above use public algorithms and our own parameters. Deriving tunings by measuring
your own instrument's audio output is the clean route. Copying firmware tables is not
(`docs/LEGAL.md`).

## 8. Open questions and dead ends

> **Status after §10.** Module binding, the type → module mapping, the scaling curves, the
> output rate and the reverb decimation factor are settled in §10. §10.13 lists what is still
> open. The bullets below are kept as the original record.

- **Module binding.** The DSP-object layer resolves 16-byte descriptors (pointers into ARM RAM
  around `0xC0546xxx`) to DSP entry points, but the source of the addresses is not found. It
  is not in the ARM image (32-bit or 16-bit immediates), not in DSP DM, and not in the boot
  streams (no symbol blocks). Next step: decompile the resolver behind vtable slot `+4` (find
  the caller of `0xC0012140`). It may compute entry points from an offset table, or read them
  back from DSP memory through the SPI peek path.
- **Type → module mapping** for Effect 1/2 entries marked low or medium. Settling it needs the
  ARM setters that choose a module per type (same resolver), or a hardware memory peek.
- **Scaling curves** (knob to Hz, ms, dB): not mapped. The ARM has no FP maths, so they are
  ARM lookup tables or DSP block-rate maths. Find the per-parameter setters (delay setter
  `0xC0012270` is one) and follow the table index.
- **Organ tone generation.** DSP1 c1 feeds DSP1 c2 every block (generator slots, phase
  accumulators, LCG noise, which could be key click). Whether DSP1 c2 is the tonewheel
  generator or a generic voice core is open.
- **Output rate** (48 kHz assumed) and the reverb decimation factor (4 if read literally).
- **Dead end:** looking for module pointers as literals. They are written at runtime from the
  ARM, never by DSP code.
- **Dead end:** looking for coefficient maths on the ARM. There is essentially none; the
  coefficients are tables or DSP-side maths.

## 9. Reproducing

Tools: the vendored Ghidra module (`tools/ghidra-sharc/`), the boot-stream splitter and image
builder (`scripts/sharc-boot-split.py`, `scripts/sharcplus-image.py`), headless decompilation,
and an ARM full decompile. The per-core instruction listings are TSV. The scratch scripts used
here are not committed:

- a function-hash comparison across cores, used for the shared-library finding;
- a DM dumper;
- a parameter-registry parser;
- a literal/xref/decompile Ghidra helper.

Any outputs stay local.

## 10. Replication spec

Second pass, 2026-10-10. This section gives a Web Audio engine what it needs to rebuild each
effect: which DSP module a menu entry runs, how the program value reaches it, and the
structural constants. It **supersedes §1–§8 where they disagree** (§10.1).

**Method.** The ARM image was run in an emulator (Unicorn) from its static initialiser
(`0xC00002A4`). The emulator then built one effects section (`0xC01155EC`) and swept every
parameter setter over its full range, capturing each `{DSP address, word}` the ARM would send.
The formulas below were fitted to those captures, or read from the setter code, and checked
against the DSP module decompiles and the DSP images' initialised data. The emulator, captures
and decompiles stay in scratch (`docs/LEGAL.md`). Only formulas and a few constants are here.

**Notation.**

- `v`: the program's raw 7-bit value, 0–127. The edit model receives it as Q16 (`v << 16`).
- `x = v/127` and `q = v/128`.
- `fs = 43,402.34 Hz`; `fb = fs/4 = 10,850.6 Hz` is the block rate.
- `I1±k`: a module field, as a word offset from the module's parameter pointer. The ARM's node
  address is `I1 − 0x20` words.
- Addresses are DSP0 core 1 short-word code addresses, or ARM addresses (`0xC0…`).

**Confidence.** **High**: read from code and confirmed by the emulator. **Medium**: one of the
two, or the meaning of a field is inferred. **Low**: hypothesis.

### 10.1 Corrections to §1–§8

| Earlier statement | Now | Evidence | Conf. |
|---|---|---|---|
| Output rate assumed 48 kHz | Effects run at **43,402.34 Hz** (22.222 MHz / 512). See §10.12. | §10.12 | high |
| "The ARM does no floating-point maths" | It has no VFP code, but it computes coefficients with a **soft-float library** (single precision `0xC0270xxx`, double `0xC025Cxxx`; `exp`/`tan`-type routines near `0xC0271618`). Curves are mostly ARM maths, not tables. | setters in §10.5–§10.11 | high |
| Module binding not found | Solved (§10.2). DSP code addresses sit in the ARM's pool tables as DSP **byte** addresses. | `0xC00002A4`, `0xC021DA80` | high |
| `0xC0012270` is a delay setter | It is the **compressor Response** setter. `0xC0012140` (frmDelay/DelayClr/delayBuffer) is the delay object's resource request. | §10.8 | high |
| 0x1206B0/0x1208AF/0x120AB5 = bus compressors | They are the **delay lines** (§10.9). | resolver pool `0xC0544AF8` | high |
| Reverb decimation "4 if read literally" | Confirmed: the tank runs once per 4-frame block, at `fb`. | `0x120FDB` calls `0x120D8A` once per block | high |
| 0x124D68/0x124E0B = delay filter | They belong to the **amp**. The delay filter is inside the delay module. | §10.7, §10.9 | high |
| Rotary rates "from system settings" (values unknown) | Decoded (§10.11) | `0xC0112A90` | high |
| §4 "Audio-rate control": bus compressors read 16-bit control words from the TDM frame | Struck. Those modules are the delay lines, and the 16-bit TDM words are delay samples streamed to external memory (§10.9). | resolver pool `0xC0544AF8`, §10.9 | high |
| §1/§3: the DSP0 L2 buffers are the long delay lines; `0x123A3E` holds about 2.1 s | The delay lines stream to external memory (`0x1206B0`, `0x1208AF`) or keep the line in L2 (`0x120AB5`), chosen by resources (§10.9). `0x123A3E` is the Flam unit's short line (§10.3). What the DSP0 L2 buffers hold is not re-checked. | §10.3, §10.9 | medium |
| Untagged 48 kHz times: block ≈ 83 µs (§2), 512-sample buffer ≈ 10.7 ms (§3), smoothing ≈ 9 ms (§2, §4) | ≈ 92 µs, ≈ 11.8 ms and τ ≈ 10 ms at `fs` (§10.4) | §10.12 | high |
| §7 rotary speeds (public Leslie figures, horn 0.8 → 6.7 Hz, drum 0.7 → 5.8 Hz) | Firmware defaults: horn 0.80/7.0 Hz, drum 0.73/6.4 Hz (§10.11) | `0xC0112A90` | high |
| Rotary stop position "0–7 → angle" | 0 = Free, 1–6 = six named positions, 7 not decoded (`values.generated.ts`, `108-5`); the angles are not traced | decoder | high (names) |
| §6 "Comp Fast: shorter attack/release" | Fast shortens the release but lengthens the attack (§10.8) | `0xC0012270` | high |
| §3 spring module `0x124AF2` → `0x1248D5` | §10 has `0x124AF2`/`0x124CD0`. Whether `0x1248D5` is a callee or a misread is **not resolved**. | §10.3 | open |

### 10.2 How a menu entry becomes DSP code

- **Descriptors and pools.** A DSP resource request passes a 16-byte descriptor
  `{pool*, 0, 1, count}`. The pool is an array of 16-byte entries
  `{dsp, byte address, flags/core mask, …, variant byte (+0xD), chain byte (+0xF)}`. Field
  `dsp` is 0 for DSP0 core 1, 1 for DSP0 core 2 and 2 for DSP1 core 1. The static initialiser
  `0xC00002A4` fills every pool, about 85 of them, with constants. That initialiser failed to
  decompile, which is why §8 never found the addresses.
- **Code addresses are byte addresses.** A code entry holds `0x28000000 + 4·sw`; core 2 uses
  the `0x28800000` alias. The link code converts it with `(a − 0x28000000) >> 2`.
  Example: `0x28481AC0` → `0x1206B0`. Earlier searches looked for `sw` values and missed them.
  Link writers: `0xC021DA80`/`0xC021DC14`. Graph commit: `0xC021EEA0` (two phases), run from
  a timer.
- **Resolver.** The resolver vtable is at `0xC0443C84`:
  - `+4` allocates a node (`0xC021E3B0`);
  - `+8` a code entry (`0xC0220D3C`);
  - `+0xC` a clear routine (`0xC0220C18`);
  - `+0x10` memory (`0xC021E4D8`).

  All four allocate from a pool through `0xC0013928`, matching on chain, core mask and variant
  byte.
- **Units.** A *unit* is one node, one code pool and an optional clear routine. The generic unit
  constructor is `0xC0228B74(unit, graph, slot, codeDesc, nodeDesc, clearDesc, n)`.
  `0xC02237D0(unit, variant)` selects a variant and marks the graph dirty.
- **Section.** The section constructor `0xC01155EC` builds one chain:
  - **graph A** (Effect 1, slots 0–5) and **graph B** (Effect 2, slots 0–9);
  - the amp (`0xC0220E4C`), the compressor (`0xC01FC17C`) and the delay (`0xC0201B0C`, which
    owns seven feedback-FX units);
  - the reverb tank and the spring.

  The 12 node-pool entries per unit are the 12 chains: 5 on DSP0 c1, 5 on DSP0 c2 and 2 on
  DSP1 c1.
- **Parameter dispatch.** There are three section methods:
  - `0xC010E1FC`: enables and types;
  - `0xC010C040`: continuous values (FX rate and amount, drive, mid frequency, delay
    tempo/mix/feedback, reverb amount);
  - `0xC010C990`: EQ gains, compressor, delay mode/ping-pong/filter, rotary drive.

  Values arrive as Q16, after morphs. A unit's Rate setter is vtable `+0x6C` and its Amount
  setter is `+0x70`.
- **Type selection.** `0xC010E1FC` looks up `unit = T_unit[type]` and `variant = T_var[type]`
  in small tables at `0xC02BA708`–`0xC02BA820` (Effect 1, Effect 2, amp variant, delay FB-FX),
  then calls `0xC0223488(graph, unit, variant)`. Only the selected
  unit is linked into the slot chain.

### 10.3 Menu entry → module (settled)

Effect 1, graph A. `0xC010E1FC` case 0x198.

| Menu (value) | Unit (slot) | Variant | Module | Conf. |
|---|---|---|---|---|
| Auto-Pan Soft (0) / Hard (1) | 0 | 0 / 1 | `0x123707` | high |
| Tremolo Soft (2) / Hard (3) | 1 | 0 / 1 | `0x1235AD` | high |
| **Ring Mod (4) / Ring Mod Stereo (5)** | 2 | 0 / 1 | **`0x124344`** | high |
| A-Wah Cry (6) / A-Wah Envelope (7) | 4 | 0 / 1 | `0x12480F` | high |
| Wah-Wah LFO (8) / Pedal (9) | 3 | 2 / 0 | `0x124746` | high |
| Pump LFO (10) / Pedal (11) | 5 | 1 / 0 | `0x1236A0` | high |

Effect 2, graph B. Case 0x19D.

| Menu (value) | Unit (slot) | Variant | Module | Conf. |
|---|---|---|---|---|
| Phaser Type I (0) | 0 | 0 | `0x12410F` (4 first-order all-passes) | high |
| Phaser Type II (1) | 1 | 0 | `0x124270` (3 saturating SVF stages with feedback) | high |
| Flanger Stereo (2) / Mono (3) | 2 | 1 / 0 | `0x123E01` (clear `0x123EAD`) | high |
| Chorus (4) | 3 | 0 | `0x123798` (clear `0x1238C9`) | high |
| Chorus Analog (5) | 4 | 0 | `0x1238EB` (clear `0x123A20`) | high |
| Vibe Stereo (6) / Mono (7) | 7 | 1 / 0 | `0x1245F8` (clear `0x124728`) | high |
| Ensemble Stereo (8) / Mono (9) | 8 | 1 / 0 | `0x1243EF` (clear `0x124544`) | high |
| **Spin Treble (10) / Bass (11)** | 9 | 0 / 1 | **`0x123ECB`** (clear `0x1240F1`) | high |

Graph B slots 5 and 6 are unused by the menu.

The remaining effects:

- **Amp/EQ type** (case for `0x1A7`). The variant comes from a table: Clean→6, Twin I→0,
  Twin II→1, JC I→2, JC II→3, Small→4, Very Small→5, To Rotary→9, LP24→7, HP24→8 (high). The amp
  container `0x1231CF` calls three stage pointers in series (§10.7).
- **Reverb type** (case 0x1BA). Spring and Spring2 select the spring unit (`0x124AF2`/`0x124CD0`,
  clear `0x124CE8`), with variant `colour` (Spring) or `colour + 3` (Spring2). Every other type
  selects the tank (`0x120FDB`, which calls the tank `0x120D8A`) with a size: Booth 0, Room 1,
  Stage 2, Hall 3, Cathedral 4. The odd entries (Booth/Room Predelay, Stage/Hall/Cathedral
  Chorale) set one flag on the tank (high).
- **Delay feedback FX** (case 0x1B6). The menu index maps to an internal 0–10 (both "None" → 0).
  The delay owns these units, created in this order:
  - Chorus `0x123798`;
  - Chorus Analog `0x1238EB`;
  - Flam `0x123A3E` (short delay line);
  - Space `0x123ABE` (stereo) and `0x123C0F` (quad) all-pass diffusers;
  - Ensemble `0x1243EF`;
  - an SVF `0x124746`;
  - Vibe `0x124562`.

  The menu-to-unit pairing follows the module algorithms (medium).

### 10.4 Shared conventions

- **LFOs.** A 32-bit phase accumulator gains `inc` once per 4-frame block, giving one cycle per
  2³². So `f = inc·fb / 2³² = inc × 2.5264e-6 Hz`. The exception is Ring Mod, which advances per
  sample (`f = inc·fs/2³²`).
  - Shape: a triangle `t = 2|φ| − 1`, turned into a sine by a 5th-order odd polynomial
    approximation of `sin(πt/2)`.
  - "Hard" variants raise the gain before a clip, which squares the wave.
  - The right channel is the SIMD Y lane, with its own phase offset and coefficients. This is
    how the stereo variants differ from mono.

  Evidence: node defaults at DSP0 c1 DM `0xC1508`, and `0x123707`. Conf. high.
- **Control smoothing.** Every target field is smoothed once per block,
  with a one-pole of τ ≈ 10 ms (high).
- **Master clock.** With MST CLK on, the Effect 1 rate knob picks one of 15 divisions:
  `idx = floor(v / 8.533)`. Each index sets a phase multiplier from
  {2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256}, applied to a shared master-clock
  phase instead of the free-running `inc` (`0xC010A840`, table `0xC02FD3D4`). The master phase's
  own rate per beat is not decoded (medium).

### 10.5 Effect 1

| Type | Signal flow | Rate → DSP → units | Amount → DSP → units | Conf. |
|---|---|---|---|---|
| **Auto-Pan** `0x123707` | Block-rate LFO gain on each channel. L/R in antiphase (Y lane). Soft = sine. Hard = higher pre-clip gain, a near-square wave. | `inc = 256·(64v + 50)`, so **f = 0.0323 + 0.04139·v Hz** (0.03–5.29 Hz) | `depth = 0.25x`, `offset = 1 − 0.5x`. Gain per channel ≈ `offset + depth·k·shape`, with k = 4 before the clip in the variant read. With k = 4 the gain spans `1 − 1.5x … 1 + 0.5x`, so if the clip is at 0 and 1, a sine's peaks would clip at any depth (above 1 for every x > 0, below 0 once x > 2/3); an unclipped sine needs k ≤ 2. So k = 4 is probably Hard's gain, and Soft's k is not decoded. | high (law), low (k per variant, clip level) |
| **Tremolo** `0x1235AD` | Same LFO. Gain = `(1 − x/2) + (x/2)·lfo`, applied to a blend of dry and one-pole-filtered signal (tone). Soft/Hard switch a blend field (0.5 / 0). | same law as Auto-Pan | `I1−0x1A = x/2`, `I1−0x19 = 1 − x/2`: depth up to 100 % | high |
| **Ring Mod** `0x124344` | Per-sample triangle → poly-sine carrier. `out = in·(1 + d·(1 − g·s(φ) − o))` crossfades dry to fully ring-modulated. The Stereo variant offsets the R carrier phase. | **exponential**: `f = 1.1642·2^(v/12.5) Hz`, i.e. 1.16 Hz to 1.33 kHz at 0.08 octave per step | target `g = x`, complement `1 − x`: dry → ring crossfade | high |
| **Wah-Wah** `0x124746` | 2-pole Chamberlin SVF band-pass, run twice per sample (2×). Centre from the LFO (variant 2) or the pedal (variant 0). | LFO mode: same law as Auto-Pan. Also writes `I1−0x10 = q`. | `I1+0 = −0.496 + q/2`, the sweep offset. Variant 2 doubles the base to −0.992. | high (structure), medium (field roles) |
| | SVF frequency coefficients from node constants: about 0.0175–0.14 and 0.055–0.40. At the 2× rate (86.8 kHz) that is roughly 240 Hz–1.9 kHz and 770 Hz–5.6 kHz of sweep. | | | low |
| **A-Wah** `0x12480F` | Block-energy envelope (L+R sum of squares) → attack/release one-poles → the same SVF | Rate knob = **sensitivity** = `(v/256)²` | `I1−2 = −0.5 + x/2`, the sweep range/offset | medium |
| | Envelope one-poles of ≈13 ms (attack) and ≈250 ms (release) at `fb` | | | medium |
| **Pump** `0x1236A0` | Ducking ramp from an LFO, blending linear and squared. Phase resets on each sync edge (LFO variant 1, Pedal variant 0). | same law as Auto-Pan | depth `= x` (`I1−0x1B`) | high |

### 10.6 Effect 2

| Type | Signal flow | Rate | Amount | Conf. |
|---|---|---|---|---|
| **Phaser I** `0x12410F` | 4 first-order all-passes plus feedback. The break frequency sweeps on a log scale between `f_lo` and `f_hi`. The DSP gets `42.6633·(log10 f − 1)`, an index into its warp. | `f = 0.02575 + 6.163·x⁴ Hz` | `d = q`: written as depth (`I1−0x1A`) | high |
| | Range, with `r = rate/127`: `f_hi = 10^(3.17609 + 0.77791·d)` (1.5–9 kHz). `f_lo0 = 10^(1.47712 − 0.79424·d)` for d < 0.5, else `10^(1.08 + 1.334·(2d − 1))`. Then `f_lo = f_lo0 + r·(10^(2.845 + 0.196·d) − f_lo0)`, a linear blend in Hz (the sweep between `f_lo` and `f_hi` is what runs on a log scale). **The rate knob raises the bottom of the sweep.** | | | high (`0xC0213E50`) |
| **Phaser II** `0x124270` | 3 cascaded 2-pole SVFs with clipped integrators and output feedback (an OTA-style phaser). | `f = 0.0161 + 2.608·x² Hz` | `I1−0x16 = 0.8759·x` | high (law), medium (roles) |
| **Flanger** `0x123E01` | Modulated delay with a smoothed read position, linear interpolation and feedback. Stereo/Mono by variant. | `f = 0.05 + 5.95·x² Hz` (exact) | Excursion `min(0.1125·v, 10)` samples (capped from v ≈ 89) around a base of `100 − excursion` samples (≈2.1–2.3 ms). A 10-sample (0.23 ms) maximum swing is small for a flanger, so this field may be scaled elsewhere or be only part of the sweep; unverified. A field that reads as **feedback** stays 0 up to v ≈ 38, then falls linearly to **−0.85** at 127 (negative feedback). | high (rate law), medium (amount roles and units) |
| **Chorus** `0x123798` | Multi-voice modulated delay, 512-sample buffer, linear interpolation. Four base taps spread over about 1.6–7.9 ms. | `inc = 12800 + 4096·v`: **f = 0.0323 + 0.01035·v Hz** (to 1.35 Hz) | Voice 1 rises 0 → 0.707 over v = 0–64. Voice 2 rises 0 → 0.707 over v = 64–127. Dry falls 1 → 0.707. | high |
| **Chorus Analog** `0x1238EB` | BBD model: modulated delay with two 2-pole filters on the wet path and a rate-dependent one-pole (`0.9998 − 0.0028·x`) | `f = 0.25 + 3.75·x² Hz` (exact). The rate also sets base `226 + 12x` and excursion `48 − 24x` samples, so pitch deviation stays roughly constant. | base `238 − 108x`, excursion `24 + 216x` samples (to ≈5.5 ms) | high (rate law), low (base and excursion) |
| | Rate and Amount both write base and excursion, with different formulas, and how the two writes combine is not decoded. Taken as written, Amount 127 gives excursion 240 > base 130, so a ± swing would read before the write position. They must combine in another way (or the fields mean something else). **Open.** | | | |
| **Vibe** `0x1245F8` | LFO-swept 3-stage SVF, then a short delay with two 2-pole sections | `f = 0.0322 + 5.216·x² Hz` | depth `I1−2 = q`, phase constant π/2 | high (law), medium (structure) |
| **Ensemble** `0x1243EF` | 3 taps per channel, read from a 1,024-entry sine table at two phase offsets, around a short buffer | slow component `f = 0.0323 + 0.00129·v Hz` (to 0.2 Hz). A faster component is likely in the Y lane, not decoded. | tap mix `0.33 + 0.33q`, depths `q`, `q`, `0.8q` | medium |
| **Spin** `0x123ECB` | Mini-rotary. Short Doppler taps (about 0.8–2.4 ms) plus a longer (≈14 ms) high-feedback line, two all-pass sections, and a biquad band split (Treble = horn band, Bass = drum band, by variant). | `inc = 138539 + 8727·v`: **f = 0.35 + 0.02205·v Hz** (0.35–3.15 Hz, exact ends) | depth gains: `I1−0x19` 0 → 0.88 (fast rise, then flattens), `I1−0x18` 1 → 0.58, `I1−0x14` 1 → 0.1 | high (rate), medium (structure) |

### 10.7 Amp / EQ

- **Chain.** The container `0x1231CF` calls three stages in series through pointers it holds.
  For the Twin I default, the emulator shows:
  1. `0x124E0B`: 2×-oversampled SVF with saturating integrators (tone stack / pre-EQ);
  2. `0x123243`: biquad → table waveshaper → biquad → resonant 2-pole (voicing);
  3. `0x123491`: two-path short FIR plus a biquad cascade (cabinet, two mics).

  The amp object also owns `0x124EFA` (resonant SVF, two stages for 24 dB/oct: LP24/HP24),
  `0x12500A` (overdrive) and the send `0x125103`/`0x125142` (To Rotary). The per-type swap of
  stage pointers is not decoded; the cabinet and waveshaper data are firmware tables (medium).
- **Drive.** `d = x` (`v·(1/127)`, constant `0xC010C95C`), written to both overdrive nodes.
  Drive 0 is a true bypass (§3). High.
- **Bass.** First-order low shelf, **corner 100 Hz**. The pole coefficient is `tan(π·100/fs)`;
  in cut, Zölzer's symmetric form scales it by the linear gain (high).
- **Treble.** First-order high shelf, **corner 2 kHz** (all-pass coefficient
  `(tan(π·2000/fs) − 1)/(tan(π·2000/fs) + 1) = −0.7455`). Same boost/cut form (high).
- **Gains.** The program stores 7-bit two's complement in **0.25 dB** steps; the edit model
  clamps to ±60, i.e. **±15 dB**. Cut is exact (−15 dB → 0.17783). Full boost lands at
  +14.77 dB (5.474×). High.
  The decoder labels the raw values past the clamp as well: raw 61–63 as +15.2…+15.8 dB and
  64–67 as −16.0…−15.2 dB (`values.generated.ts`, e.g. `192-1`). The edit model clamps them to
  ±15 dB, so a display overlay should too. Whether the panel ever stores those values is not
  checked.
- **Mid.** Peaking filter, ±15 dB on the same scale. **Mid Freq**: `f = 200·5^(v/64) Hz` for
  v ≤ 64, and `1000·8^((v − 64)/63) Hz` above. So 200 Hz, 1 kHz at 64, 8 kHz at 127. The table
  is interpolated with the Q16 fraction. The coefficient is computed on the ARM from `π·f/fs`
  through a trig routine (`0xC010C040` case 0x1A2) (high for f, medium for the exact
  coefficient).

### 10.8 Compressor `0x120630`

| Item | Value | Conf. |
|---|---|---|
| Detector | Stereo-linked peak over the block. The peak decays with the release coefficient. Level `L = 6·log2(peak)` (≈ dBFS). | high |
| Ratio | **Fixed 4:1** (slope field 0.75) | high |
| Threshold | **T = −36·x dB** (Amount 0 → 0 dB, 127 → −36 dB) | high |
| Make-up gain | **1 + 5.72·x²** linear (+16.5 dB at 127), smoothed | high |
| Attack/release | One-poles at `fb` on the over-threshold amount. **Normal: attack 0.86 ms, release 200 ms. Fast: attack 4 ms, release 40 ms** (setter `0xC0012270`). | high |

Node defaults are at DSP0 c1 DM `0xB0148`. The gain is applied to both channels through an
exponential approximation.

Fast thus has the shorter release but the **slower** attack. That is unexpected for a "Fast"
setting, and §6 first said the opposite. The setter is the only evidence for which branch is
Fast; a hardware check (a fast transient through each Response setting) would confirm it.

### 10.9 Delay

- **Tempo** (program 7-bit `p`, edit value `p·128`). The knob is a **BPM scale**, and the delay
  time is `60000/BPM` ms (0 → 1,500 ms, 127 → 20 ms; default `p` = 86 ≈ 240 BPM). The scale is
  close to piecewise linear in BPM:

  | `p` | BPM | Step |
  |---|---|---|
  | 0–10 | 40–60 | +2 |
  | 10–16 | 60–80 | ≈+3.3 |
  | 16–31 | 80–110 | +2 |
  | 31–61 | 110–140 | +1 |
  | 61–71 | 140–160 | +2 |
  | 71–81 | 160–200 | +4 |
  | 81–86 | 200–240 | +8 |
  | 86–89 | 240–276 | +12 |
  | 89–101 | 276–480 | ≈+16 |
  | 101–107 | 480–641 | |
  | 107–118 | 641–1,519 | ≈+80 |
  | 118–127 | 1,519–3,000 | |

  The firmware stores the inverse map at 1 ms resolution and interpolates it (`0xC010C040` case
  0x1AF). High.
  Every breakpoint matches, to within 1 BPM, the delay-time strings the decoder already carries
  (`deps.generated.ts`, `204-3`, from ns4decode; e.g. p = 71 → "375 ms (80 x2 bpm)", p = 127 →
  "20 ms (750 x4 bpm)"), so the scale can be checked against those strings or on the panel
  display, without the firmware (the strings give 640 and 1,520 BPM at p = 107 and 118). Between
  breakpoints the strings are the reference: p = 90–99, 102–106 and 119–126 depart from the
  straight lines (p = 90 shows 304 BPM, not 293; p = 122 shows 2,000, not 2,178).
- **Tempo, MST CLK on.** The time is `frac × 4 × 60000 / tempo` ms. The knob `p` selects one
  of 17 divisions in steps of 7–8 (index table at `0xC02B9800`):
  1/2, 3/8, 1/3, 0.29, 1/4, 3/16, 1/6, 0.145, 1/8, 3/32, 1/12, 0.0725, 1/16, 1/24, 1/32, 1/48 and
  1/64 of a whole note. The 0.29 family is probably a swing value. High.
- **Mix.** Wet `= min(1, (v/64)²)`, dry `= min(1, ((128 − v)/64)²)`. Both are 1.0 at
  `v = 64`. High.
- **Feedback.** Linear, `g_fb = x` (to 1.0). It stays stable because the loop holds a
  peak-tracking gain normaliser (gain clamped between two limits) and a soft clip
  (`0.3·y` → clip → table waveshaper). High.
- **Ping-pong.** A 2×2 feedback matrix, straight terms vs cross terms, each smoothed. Ping-pong
  moves the feedback into the cross terms. High.
- **Filter** (Bypass/LP/HP/BP). The type sets two one-pole coefficients inside the delay
  module:
  - Bypass ≈ 9.6 kHz low-pass with a ≈5 Hz DC block;
  - Low-pass moves the low-pass to ≈1 kHz;
  - High-pass moves the high-pass pole to ≈60 Hz;
  - Band-pass sets ≈1 kHz and ≈50 Hz.

  The filter acts on every repeat, so its effect compounds. Low-medium on the exact corners.
- **Normal vs Analog** (one flag in the module, `I1+0x14`).
  - Normal reads an integer position. A time change crossfades old to new over 0x4000 steps,
    which is click-free and does not bend pitch.
  - **Analog** smooths a fractional read position (one-pole glide), with linear interpolation.
    Time changes bend pitch, like tape or a BBD.

  High.
- **Storage.** 16-bit samples, two channels per 32-bit word.
  - `0x120AB5` keeps the line in DSP L2. On DSP1, 0x3C000 bytes per chain = 61,440 words ≈
    1.42 s at `fs`.
  - `0x1206B0` (core 1) and `0x1208AF` (core 2) stream the line through TDM slots to an
    external memory and read it back as 16-bit words.

  Which one runs is a resource decision, not a user setting (medium).

  **Conflict, open:** 1.42 s is shorter than the 1,500 ms maximum delay (Tempo at `p` = 0), and at
  the 2× rate DSP1 may run at (§10.12) the same buffer would hold only 0.71 s. Either the organ
  chains don't use `0x120AB5` for the longest times, the buffer size or word layout is misread, or
  the delay is shortened there. Not checked.

### 10.10 Reverb

- **Amount.** Wet `= 2q² − q³` (`v` = 127 forced to 1). Dry `= √(1 − wet²)`, an equal-power
  crossfade. High.
- **Tank** `0x120D8A`, inside `0x120FDB`.
  - The input is decimated by **4** through a 3-biquad cascade. The tank runs at
    `fb` ≈ 10.85 kHz, so its bandwidth is about 5 kHz. The output is interpolated back through
    3 biquads.
  - Figure-of-eight Dattorro layout with 16-bit packed delay memory. The delay lengths are DSP
    data and are not reproduced here.

  High.
- **Per-size fields.** Each size sets the tank's decay gain, a second decay/diffusion gain,
  a damping one-pole, an output tone and the input diffusion. Decay and diffusion grow from
  Booth through Room, Stage and Hall to Cathedral; damping and tone darken slightly as the
  size grows, and the two small sizes use almost no input diffusion. The values themselves are
  firmware data (§10.13): tune them by ear or read them from the user's `os.cab`. Field roles
  are medium.
- **Colour.** Dark raises damping and lowers the tone, and lengthens the decay to compensate;
  Bright does the opposite. Colour retunes decay to keep the length perceptually constant.
  Medium.
- **Chorale.** The tank's modulation LFO rises from 0.25 to **0.50 Hz** and its excursion
  grows **×4**. High.
- **Predelay.** A pre-tank delay grows with the Predelay setting, from about 6 ms to roughly
  30–40 ms depending on size (if the field is in samples at `fs`). Medium-low: the unit and the
  node attribution are inferred.
- **Spring** `0x124AF2`/`0x124CD0`. Reduced rate. Several pairs of closely spaced taps, two
  long lines, a cascade of about 20 dispersion all-pass stages, and fixed biquads. The line
  lengths are firmware data (§10.13). Spring2 is the variant set 3–5. Medium.

### 10.11 Rotary (organ; also reached by Amp "To Rotary")

| Item | Value | Conf. |
|---|---|---|
| Horn speed (slow / fast), system setting 0/1/2 | 0.74/6.5, **0.80/7.0 (default)**, 0.86/7.5 Hz | high (`0xC0112A90` case 0x91) |
| Drum speed (slow / fast) | 0.65/5.7, **0.73/6.4 (default)**, 0.76/6.65 Hz | high (case 0x93) |
| Horn acceleration (up = down) | 0.03 / **0.06** / 0.12 per update | high value, low time unit (case 0x92) |
| Drum acceleration (up / down) | 0.006/0.012, **0.010/0.0218**, 0.020/0.024 per update | high value, low time unit (case 0x94) |

The drum decelerates faster than it accelerates (1.2–2.2×). With a 100 Hz control tick, a linear ramp
would give a horn spin-up of about 1 s and a drum spin-up of about 5.7 s, which is in line with
a real Leslie, but the tick is not confirmed.

Drive is `x`, linear (`v·(1/127)`), written to two drive fields (case 0x18A, organ sections
only). The structure is unchanged from §3: 64-entry angle tables per rotor and mic, a
crossover, and a tube drive. The node defaults include two DC/low-cut biquads. The crossover
frequency is not decoded.

### 10.12 Sample rate and the organ path

- **Effects sample rate = 43,402.34 Hz** (high). The evidence:
  1. The ARM designs coefficients with `fs = 43,402.35` (doubles at `0xC0032664`,
     `0xC0116630`, `0xC0201314`, `0xC020EB50` and `0xC0210ED0`).
  2. A float table `{21,701.2; 43,402.3; 86,804.7}` sits at `0xC027A6BC`.
  3. With that rate, and one LFO step per 4-frame block, every designed constant comes out
     round: flanger 0.05–6.00 Hz, chorus analog 0.25–4.00 Hz, Spin 0.35–3.15 Hz, reverb
     modulation 0.25/0.50 Hz, compressor 4/40/200 ms, shelf corners 100 Hz and 2 kHz. None of
     these is round at 48 kHz.

  43,402.34375 is exactly 22.222 MHz / 512. DSP0 c1 drives the SPORTs, so the converter rate is
  presumably the same (medium). How USB audio and other 48 kHz paths are converted was not
  studied.
- **Two DSP kinds.** The amp constructor picks `fs = 43,402` for DSP kind 1 and
  **86,804.7 (2×)** for kind 2 (`0xC0220E4C`, `0xC0221DB8`). The section built here was kind 1
  (DSP0). Kind 2 is most likely DSP1, so the organ DSP probably runs its effect modules at 2×,
  which suits a tonewheel generator. Low-medium.
- **Tonewheels.** Nothing new beyond §1: DSP1 c1 feeds DSP1 c2 eight generator slots every
  block. Another agent is tracing this.

### 10.13 What a faithful Web Audio engine still needs

1. **Run at 43,402 Hz,** or resample every formula above. Use `AudioContext({ sampleRate:
   43402 })` where the browser allows it; otherwise scale times and frequencies by `fs`. Update
   LFOs and control smoothing per 4-frame block.
2. **Firmware data we may not copy**, to be measured or rebuilt by ear:
   - the amp waveshaper curves and cabinet FIRs;
   - the overdrive gain tables;
   - the rotary angle tables;
   - the reverb and spring delay-line lengths;
   - the phaser sweep warp table;
   - the delay soft-clip table.

   Every recipe in §7 still applies; §10 replaces its guessed ranges with the real ones. For
   per-user fidelity, these tables can be extracted at runtime from the user's own `os.cab`
   (`docs/LEGAL.md`).
3. **Still open:**
   - the per-amp-type stage pointers and EQ placement;
   - the exact delay filter corners;
   - the predelay unit;
   - the Ensemble fast component;
   - Wah sweep limits in Hz;
   - the master-clock phase reference for Effect 1;
   - the rotary acceleration time base and crossover;
   - which DSP is kind 2;
   - the rotary stop angles, and what "Free" and position 7 do;
   - how Chorus Analog's Rate and Amount writes to base and excursion combine (§10.6);
   - the Flanger's full Amount sweep (the 10-sample excursion, §10.6);
   - Auto-Pan's k per variant and its clip level (§10.5);
   - the DSP1 delay buffer vs the 1.5 s maximum delay (§10.9);
   - the spring module's second address, `0x1248D5` (§3) vs `0x124CD0` (§10.3);
   - Comp Response on hardware: Fast's slower attack (§10.8).

   Most are reachable with the same emulator: drive the remaining setters, or emulate an organ
   section. The last one needs the instrument.

### 10.14 Reproducing the second pass

This is a scratch-only toolchain, not committed:

- an emulator harness that runs `0xC00002A4`, then `0xC01155EC`, with stubs for `new`, the
  timer, the SPI peek and the DSP-write primitives. Low-memory mailbox writes are captured as
  address/value pairs.
- per-setter sweeps;
- a pool/descriptor dumper;
- a math-only decompile filter for the ARM setters.

Outputs stay local.

### 10.15 The Electro 7 runs this library

The Electro 7 (OS 1.30) carries a subset of these modules as the same code, pooled the same
way (§10.2 entries, filled by its static initialiser `0xC0118010`). So §10.3–§10.11 describe
its effect algorithms too; its knob formulas were not re-derived and its menu order is open.
Which modules it has and lacks: [`ELECTRO7-ENGINES.md`](ELECTRO7-ENGINES.md) §5.
