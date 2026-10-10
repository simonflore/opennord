# Nord Stage 4 effects engine: RE notes

This note covers what the Stage 4's SHARC+ DSPs do with a program's effect settings: which
core runs which effect, which algorithm each effect uses, and how a program value reaches the
DSP. It follows on from the firmware work in `docs/NSP-FORMAT.md` (2026-10-10 sections:
`os.cab` unpack, the five DSP images, the Ghidra SHARC+ module in `tools/ghidra-sharc/`,
DSP 3 = NW1 sample decoder, DSP 4 = piano decoder).

Source: Stage 4 OS v1.66, unpacked locally. Everything firmware-derived (listings, decompiler
output, tables, coefficients) stays in the gitignored scratch area (`docs/LEGAL.md`). This file
documents structure, addresses and behaviour only. It contains no tables and no coefficient
values. Where a number appears, it describes behaviour (a time constant, a buffer length in
samples) and is rounded.

Confidence labels: **high** means the algorithm is unambiguous in the code. **Medium** means
the algorithm is clear but its mapping to a panel effect is inferred. **Low** means it is a
hypothesis.

Sample rate: the DSPs process 4-frame stereo blocks. The output rate is assumed to be 48 kHz
but is not confirmed. Times below are given in samples, with the 48 kHz equivalent in brackets.

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
(`scripts/fnhash.py` in scratch). The voice cores share none of it. Addresses below are
DSP0 c1 addresses.

**Chain count.** The ARM driver addresses **12 effect chains** (it bounds the chain index at
11). There are 10 chains on DSP0 (5 per core) and 2 on DSP1 c1. A program has 6 effect sets:
organ 1, piano 2, synth 3 (see `offset-map.generated.ts`). One plausible reading of
12 = 2 × 6 is two complete programs' worth of chains. That would let the outgoing program keep
ringing during a Seamless Transition. Under that reading, each DSP0 core holds piano A/B and
synth A/B/C, and DSP1 c1 holds the organ chain twice. **Low confidence.**

Memory supports the split. Each DSP0 core reserves a 400 KB L2 buffer (102,400 words), and
DSP1 c1 reserves 640 KB of L2. Those are the long delay lines. The voice cores reserve 240 KB
each, which looks like streaming buffers.

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
- **Block size.** 4 frames per block (about 83 µs). Control values are smoothed **once per
  block** with a one-pole filter (time constant about 9 ms at 48 kHz). Every rate, depth and
  time parameter therefore glides rather than steps.
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
| `0x123798` | Modulated delay, 512-sample buffer (about 10.7 ms), linear interpolation, **feedback**. The LFO is a raw triangle or a polynomial sine, chosen by a flag. Left and right have separate taps, and the right channel can use the other phase. | **Flanger Stereo / Mono** | high |
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
| `0x123A3E` | **Delay line in 16-bit packed floats** with feedback and wet/dry. At 2 samples per word, the 400 KB DSP0 L2 buffer holds about 2.1 s of stereo at 48 kHz. That matches the delay's range. | medium |
| `0x123E01` | Modulated delay with **smoothed delay time**: changing the time glides the read head, which bends pitch like tape or BBD. LFO or noise wobble, feedback. **Delay Mode = Analog.** | medium |
| `0x124D68`, `0x124E0B` | 2× oversampled SVF with **clipped (saturating) integrators** and one-pole tone/DC sections. LP, HP and BP outputs are mixed by coefficients. **Delay Filter Type** (Bypass / Low-pass / High-pass / Band-pass) in the feedback path. | medium |
| Feedback effect | Ensemble, Ensemble Deep, Vibe, Vibe Stereo, Chorus, Chorus Analog, Flam 20/40 ms, Space 50/100 Wet. These are Effect 2 modules placed in the feedback loop, plus a short fixed delay for Flam. Inferred from the menu and the slot design. | low |

Ping-pong is a routing choice: crossing L and R in the feedback path. No separate module.

### Compressor

| Module | Algorithm | Conf. |
|---|---|---|
| `0x120630` (DSP1 c1: `0x120454`) | **Log-domain feed-forward compressor**. Stereo-linked peak detector over the block, peak hold and release, then log2 via `LOGB`/`MANT`. The gain computer has a threshold and a slope, and attack/release one-poles in the log domain choose their coefficient by direction. Gain comes back through an exponential approximation and is applied to both channels. Amount sets threshold/ratio together; **Response normal/fast** switches the time constants. | high |
| `0x1206B0` / `0x1208AF` / `0x120AB5` (DSP0, `0x1208AF` also on DSP1 c1) | **Bus compressor/limiter** variants. Peak follower with an adaptive release, a gain floor and ceiling, and a **soft-clip waveshaper** (table). They also read 16-bit control words from the incoming TDM frame. These sit at the end of the chain (master or global compressor, output protection). | medium |

### Reverb (Spring, Spring2, Booth, Room, Stage, Hall, Cathedral, ±Predelay/Chorale; Normal/Dark/Bright)

| Module | Algorithm | Conf. |
|---|---|---|
| `0x120D8A` (+ `0x120F18` output taps; **DSP0 only**) | **Figure-of-eight tank, Dattorro-style.** 4 serial input all-pass diffusers, a **modulated all-pass** (its own LFO phase with interpolated read), a damping one-pole and decay feedback. The two tank halves run on alternate calls. Output is a **7-tap weighted sum**. Delay memory is 16-bit packed. Booth, Room, Stage, Hall and Cathedral differ in delay lengths, decay, damping and taps. "Chorale" variants turn up the tank modulation, and "Predelay" variants add a delay ahead of the tank. | high (algorithm), medium (per-type mapping) |
| `0x120FDB` | Wraps the tank: 3 fixed biquads to decimate → tank → 3 biquads to interpolate. The tank runs at a **fraction of the audio rate**; the decimation factor is 4 if read literally. | medium |
| `0x123ABE`, `0x123C0F` | **Schroeder all-pass diffuser chains**, 4 cascaded stages in 16-bit packed delay memory, stereo and quad versions. Early diffusion ahead of the tank, or the lighter Booth/Room types. | high (algorithm) |
| `0x124AF2` → `0x1248D5` (clear `0x124CE8`) | **Spring reverb.** Biquad decimation, then a **long cascade of identical 2nd-order all-pass sections** (the dispersive chirp of a spring), feedback delay lines with all-pass sections, and interpolation back up. This is the textbook digital spring model: dispersion through stretched all-pass chains, run at a reduced rate. **Spring / Spring2.** | medium-high |
| Color (Normal/Dark/Bright) | Damping and output EQ coefficients. Inferred. | low |

### Rotary speaker (organ; also reachable from other layers via Amp "To Rotary")

`sw:0x1256AD` on **DSP1 c1** (about 1,440 instructions). Confidence **high**.

- **Rotor state.** Two phase accumulators, horn and drum. When stop mode is on, the rotor
  phase is clamped at a **stop angle** (the "ROTOR STOP ANGLE" UI and the program's "rotary
  spkr stop position" 0–7). Speed and acceleration ramp the increment toward slow or fast
  targets. The rates come from system settings: `Edt_Sys_kLeslie{Horn,Rotor}{Speed,Acc}`.
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
          module reads them each block; the DSP smooths them (about 9 ms)
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
- **The ARM does no floating-point maths.** A full decompile of all 3,544 ARM functions
  finds essentially no VFP use. Instead:
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
- **Audio-rate control.** Some controls travel **inside the TDM audio frames** as 16-bit fields:
  the bus compressors read them from the SPORT input buffer. DSP1 c1 also writes LFO, phase
  and noise values into the voice core every block.

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

## 6. What this enables for OpenNord

1. **Accurate "explain this patch".** The AI layer can describe what an effect *does*, not just
   name it. Examples:
   - "Wah-Wah (Pedal): a 2-pole band-pass you sweep with the pedal; Amount sets the range."
   - "A-Wah Envelope: your playing dynamics open the filter."
   - "Hall Chorale: a plate-style tank with extra modulation."
   - "Delay Analog: changing the time bends pitch."
   - "Amp Drive 0 is a true bypass."
   - "Comp Fast: shorter attack/release."

   This needs only the catalogue above and the program values. No firmware data ships.
2. **Better Stage 2/3 → 4 migration** (`docs/MIGRATION.md`). Migration currently *drops* the
   rotary speaker ("Stage 4 has no equivalent effect slot"). That is wrong: the Stage 4 has a
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
| **Rotary (priority for the organ engine)** | Split at about 800 Hz (two biquads per band). Horn and drum each get a modulated delay for Doppler (a few ms of swing) and a gain LFO for AM, plus a direction-dependent low-pass for the horn. Two virtual mics at ±90° for stereo. Speed slow/fast ramps the rotor rate exponentially, with the horn accelerating faster than the drum. Stop mode parks each rotor at the stop position (0–7 → angle). Drive is a `WaveShaperNode` with a tanh curve and `oversample: '4x'`, ahead of the split. Public Leslie figures to start from: horn about 0.8 → 6.7 Hz, drum about 0.7 → 5.8 Hz; horn spin-up under 1 s, drum several seconds. | **Good.** The structure matches the firmware exactly. Its angle tables are measured responses we won't copy, so tune by ear or against a hardware recording. |
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
