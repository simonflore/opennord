# Electro 7 engines: synth, effects and samples (firmware RE notes)

What the Nord Electro 7's own OS says about its synth section, its effects and the sample
files it loads. Source: Electro 7 OS 1.30 (Nord's public updater), unpacked as in
[`FIRMWARE-LINE.md`](FIRMWARE-LINE.md). This builds on the Stage 4 work in
[`SYNTH-ENGINE.md`](SYNTH-ENGINE.md), [`EFFECTS-ENGINE.md`](EFFECTS-ENGINE.md) and
[`NSMP-CODEC.md`](NSMP-CODEC.md): much of the Electro 7 turns out to be the same code, so most
sections here say what is shared, what differs, and how the Electro 7's own program fields
(`src/lib/ne7/layout.generated.ts`) reach the DSPs.

**Legal.** Knowledge only ([`LEGAL.md`](LEGAL.md)): structure, parameter meanings and
ranges, enum labels, small constants and addresses cited as evidence. No firmware bytes,
tables, decompiler output or audio are in the repo. Where two firmware tables were found to
be the same, that was established by comparing them locally; neither is reproduced.

**Method.** Static analysis only (2026-10-11): a full Ghidra decompile and an `llvm-objdump`
listing of the ARM image; the four SHARC+ cores imported with the vendored module
(`tools/ghidra-sharc`); byte-level comparison of every Electro 7 DSP function against the
Stage 4 listings; constant propagation (by reading, not executing) over the ARM routine that
fills the DSP resource pools. Nothing was run. Scratch outputs stay local.

**Notation.** ARM addresses are virtual (`0xC0…`, CODE image at `0xC0000000`). DSP code
addresses are SHARC+ short-word (`sw:0x12xxxx`), data addresses `dm:`. Edt ids are the
firmware's parameter ids (the `src` column of the layout). Confidence: **confirmed** = read
in code or data; **likely** = the mechanism is clear but one link is inferred; **guess** = a
hypothesis worth testing.

## 1. Summary

- **Four DSP programs, three kinds of work (confirmed).** Two dual-core SHARC+ chips and two
  programs in the older 48-bit SHARC boot format. The service image (`p2-code`) names them
  `DSPFxSy` (effects + synth), `DSPOrg` (organ) and `DSPSmp` (samples); the second old-format
  program is the Stage 4's piano decoder.
- **The synth is a smaller sibling of the Stage 4's (confirmed structure).** Three modes,
  Sample / Analog / FM, on 12 voice slots per core, with the Stage 4's envelope curves and
  cutoff table, an inline resonant filter, and a vibrato instead of an LFO. Its parameters
  travel through a per-part key/value dispatcher like the Stage 4's.
- **The effects are the Stage 4 effects library (confirmed).** About thirty DSP functions
  (some 20 modules plus their clear routines and helpers) are identical or nearly identical
  to the Stage 4's. The Electro 7 carries a subset: five Effect 1 and five
  Effect 2 algorithms, the amp/overdrive/cabinet chain, delay, compressor, tank and spring
  reverbs. Which menu entry runs which module is **not** settled for the Electro 7 (§5.3).
- **Samples: `.nsmp3` and `.nsmp4` (confirmed).** The loader runs the same version→generation
  check as the Stage 4 and accepts generations 3 and 4 only. The sample DSP program is
  ~95 % the Stage 4's NW1 decoder, so the codec is the same NW1 codec (§6).

## 2. DSPs and what runs where

| Program | Image (CODE) | Cores | Runs | Evidence | Conf. |
|---|---|---|---|---|---|
| `DSPFxSy` | `0xC0513B14`, 2 ADI SHARC+ boot streams | c1, c2 | **synth voices + effect chains**, same code on both cores | strings `DSPFxSyCore1/2` in `p2-code`; identical voice functions at identical addresses in both cores; effect units pooled on both (§5.1) | confirmed |
| `DSPOrg` | `0xC054A178`, 2 SHARC+ streams | c1 (small, ~23 KB of L1 code), c2 | organ tone generation and organ effect chain (c2); reverb units are also pooled on c1 | `DSPOrgCore1/2`; c2 contains code matching parts of the Stage 4 organ generator (`sw:0x121505` ≈ Stage 4 `0x12272D`, the Vox bank; `0x12178A` ≈ `0x1229B3`); pool entries | confirmed (names), likely (roles) |
| `DSPSmp` | `0xC056F158`, older 48-bit SHARC format | — | NW1 sample decoder | 95 % of its code chunks also occur in the Stage 4 `DSPSmp` image (DSP 3) | confirmed (identity) |
| piano decoder | `0xC058CD18` (size word at `0xC058CD14`) | — | CNSP piano decoder | every code chunk also occurs in the Stage 4 piano image (DSP 4) | confirmed (identity) |

The ARM boot path loads them from a literal pool at `0xC01E22E0…0xC01E2320` (image
pointers and size words). The Stage 4 boots five DSPs; the Electro 7 drops `DSPSyn` (its
synth moved onto the effects DSP) and keeps the sample and piano decoders.

**Rotary.** The Stage 4 rotary module (`sw:0x1256AD`, ~1,440 instructions) has no match in
any Electro 7 core. The Electro 7 rotary is therefore different code (it also has parameters
the Stage 4 lacks: 16-bit horn and rotor stop angles and a "fixed angle" mode, Edt 297–299).
Where it runs is open (guess: `DSPOrg` c1 or c2).

## 3. Control path (ARM → DSP)

```
program value ─► Edt parameter (registry FUN_c009c394; ids in layout.generated.ts)
   │  section router: byte/halfword jump table on the Edt id
   │    synth: 0xC00FE234 (ids 114–229), 0xC00FEF20 (ids 161–176), effects: 0xC010395C (245–281),
   │    global reverb/rotary: 0xC01049E4 (284–295)
   ▼
synth part dispatcher 0xC006A4FC(part, key, value 16.16)
   │  stores the value per key, marks the key and its dependants dirty (deferred recompute)
   ▼
DSP words over the host link ─► DSPFxSy c1/c2 part blocks (dm:0xC0340 + 12·part; likely)
   ▼
note-on word ─► voice setup sw:0x120300 ─► per-voice generator via the kernel table dm:0xC0938
```

- **Router → key (confirmed, `0xC00FE25C` jump table).** Every synth Edt id becomes a
  dispatcher key, mostly as `value << 16`:

  | Key | Edt id → parameter | Value sent | Conf. |
  |---|---|---|---|
  | 0 | 169 `Syn_kMode` | 0, 1.0, 2.0; mode 0 then re-reads Edt 222 `Syn_kSmpId` to load the sample (`0xC00FF3B8`, §4.1) | confirmed |
  | 2 / 3 | 178 / 179 analog main / aux waveform | index | confirmed |
  | 4 / 5 / 6 | 181 detune / 182 semitone / 180 osc mix | value | confirmed |
  | 7 | 184 FM algorithm | 0–9 | confirmed |
  | 8 / 9 | 187 / 188 FM modulator freq S / B | index 0–42 | confirmed |
  | 10 / 11 | 191 / 192 FM carrier freq S / B | index 0–32 | confirmed |
  | 12 / 13 | 200 / 201 FM scaling lo / hi | 0–10 | confirmed |
  | 14 / 15 | 194 FM feedback / 195 FM balance | value | confirmed |
  | 17, 46 | 176 `Syn_kOscUnison` | 0–3, sent to both keys | confirmed |
  | 18–21 | 213–216 mod env A / D / S / R | 0–127 | confirmed |
  | 22 / 29 | 193 / 189 FM amount S / B | 0–127 | confirmed |
  | 23 | 217 mod env amount | 0–127 | confirmed |
  | 25–28 | 206–209 amp env A / D / S / R | 0–127 | confirmed |
  | 30 / 31 | 205 / 204 FM env track dec-rls / atk | 1–10, else 0 | confirmed |
  | 32 | 225 filter enable | 0/1 | confirmed |
  | 33 | 226 filter frequency, via the morph-resolved id 114 | 0–127 | likely |
  | 34 / 35 / 36 | 227 resonance / 228 key track / 229 drive | value | confirmed |
  | 39 | 170 voice mode (poly / mono / legato) | 0–2 | confirmed |
  | 42 | 171 glide | `v · 2^21` for v = 1–3, else 0 (off) | confirmed |
  | 43 | 173 vibrato rate | `floor(60·v/127)`: the knob is quantised to 61 steps | confirmed |
  | 47 | 212 dynamics | 1–3, else 0 | confirmed |

- **No oscillator table on the ARM side (confirmed).** Unlike the Stage 4 (74-entry
  oscillator table on the ARM), no address of an Electro 7 analog or FM kernel occurs in the
  ARM image outside the DSP boot images; only the sample-voice routines are pooled (§4.2).
  The DSP picks the generator itself.
- **Effects use the Stage 4 resource pools (confirmed).** The static initialiser at
  `0xC0118010` fills the pools at `0xC05C6D28…0xC05DFEA4` with 16-byte entries
  `{dsp, code byte address, flags, variant}` exactly as on the Stage 4 (`EFFECTS-ENGINE.md`
  §10.2); the code address is `0x28000000 + 4·sw` (core 1) or `0x28800000 + 4·sw` (core 2).
  Field `dsp` is 0 = `DSPFxSy` c1, 1 = `DSPFxSy` c2, 2 = `DSPOrg` c1, 3 = `DSPOrg` c2.

## 4. Synth

### 4.1 Modes and voices

| Item | Finding | Evidence | Conf. |
|---|---|---|---|
| `Syn_kMode` 0 / 1 / 2 | **Sample / Analog / FM** | 0 reloads the sample id (`0xC00FF3B8`); register default 1 together with default waveform Saw; the label lists put the analog waves before the FM algorithms; the DSP kernel table holds the analog kernel before the FM kernel (§4.2) | 0 confirmed; 1/2 likely |
| Voice slots | **12 per core**; the main loop (`sw:0x122024`) calls the per-voice generator through a pointer 12 times per block (per-voice loops also run `LCNTR = 12`), then calls the effect slots through pointers | `CALL (M8,I8)` ×12 at `sw:0x122ADA…0x122BD7` | confirmed |
| Cores | both `DSPFxSy` cores carry the same voice code, so up to 24 slots; how the ARM spreads notes across them is not traced | identical functions in c1/c2 | likely |
| Note-on word | bits 28–30 part index (one of eight 12-word part blocks at `dm:0xC0340`), bits 16–23 note, bits 8–14 velocity, bit 27 a flag, bits 24–26 a signed gate (negative = release, generator set to the silent stub `sw:0x121F0A`) | `sw:0x120300` | confirmed (fields), likely (bit 27) |
| Block size | 4 samples per generator call | `DO LCNTR = 4` in the sample kernel | confirmed |

The decoder's preset view (`ne7/present.ts`) holds the synth preset back because the mode
mapping was unknown. With mode 0 = Sample confirmed and 1/2 = Analog/FM likely, a follow-up
can show Sample presets now and the other two with a "likely" note.

### 4.2 Generators

The DSP keeps a 12-entry kernel table at `dm:0xC0938` (both cores). Entry 0 is the voice
setup routine, entries 7–10 are `0x121C25`, `0x120C48`, `0x12177B` and `0x1207D9`, the rest
point at the silent stub. The note-on handler installs entry 0; how a voice then reaches the
other entries was not traced.

| Mode | Kernel | Structure | Conf. |
|---|---|---|---|
| Sample | `0x121B67`, `0x121DA6`, `0x121E31` | routines the ARM allocates from its own pools (`0xC05D61F4…`, both `DSPFxSy` cores) and that resemble the Stage 4 sample-voice initialiser (`0x124B6D`), which installs the stream reader fed by the sample DSP | likely |
| ? | `sw:0x121C25` | a generator with a 1,024-word circular line of packed 16-bit floats and feedback, followed by a 4× polyphase interpolator (`PM` coefficients) that produces the 4-sample block; its role (a resonator, or the sample path) is open | confirmed (structure), open (role) |
| Analog | `sw:0x120C48` | two 32-bit phase accumulators (the second offset by a per-voice amount), naive saws with a **two-sample polyBLEP** correction, and their difference → **pulse/square with variable width**; a gain fades the output out as the pitch increment approaches Nyquist (the same fade shape as the Stage 4 WAVE kernel) | confirmed (structure) |
| Analog SuperSaw | `sw:0x12136B` (branched to from `0x120C48` when a per-voice flag is set) | **seven** polyBLEP saws per sample (seven sign-corrected BLEP terms per output), each with its own increment; 43 % of its code also occurs in the Stage 4 Super Saw kernel (`0x121D6D`) | likely (7 saws: 28 such terms in the unrolled 4-sample kernel), open (detune law) |
| Analog (other) | `sw:0x120F18` | same polyBLEP family plus a 4/3 factor (a triangle built from a saw is a likely reading) | guess |
| FM | `sw:0x12177B` | per-operator increments clamped with `MIN`/`MAX`, per-operator Nyquist fade, phase accumulators into polynomial sines, and operand selection by per-algorithm flags | likely |

**Analog oscillators (confirmed labels, `0xC04C7678`, `0xC04C87D4`).** Osc A (main) 0–5:
Triangle, Saw, Square, Pulse 33, Pulse 10, SuperSaw. Osc B (aux) 0–6: Off, Triangle, Saw,
Square, Pulse 33, Pulse 10, Noise. Osc B is set by Semitone (−24…+24) and Detune (0–30);
Osc Mix (−20…+20) balances A and B. There is no OSC CTRL knob and no wavetable (WAVE) mode:
the Electro 7 analog synth is built from the closed-form kernels only.

**FM (confirmed parameters, structure likely).** Four operators (`OP1`–`OP4` labels), ten
algorithms ("FM Algorithm 1"–"10"). The panel splits the patch into a **Body** and a
**Spectra** part, each with its own modulator frequency (0–42), carrier frequency (0–32) and
amount (0–127, keys 29 / 22), plus a common FM Amount (morphable), Feedback (0–28), Balance
between Body and Spectra (−15…+15), keyboard level scaling Lo/Hi (0–10, "Amt L"/"Amt H") and
envelope time tracking for attack and decay/release (0–10, "Time Track"). The ratio index →
frequency ratio mapping was not traced. The image carries a ratio label list from 0.25 to 24
in steps that widen as the ratio grows; which knob uses it is not established (guess). The
Stage 4's 256-point exp/ratio curve (used there by the Sync and Bell kernels) is also in the
Electro 7 voice image (`dm:0xB09FC`); which Electro 7 kernel reads it was not traced.

### 4.3 Filter

| Item | Finding | Evidence | Conf. |
|---|---|---|---|
| Type | one resonant filter, no type selector (the registry has no filter-type parameter); on/off (key 32) | registry | confirmed |
| Where | inline in the voice loop, two voices per SIMD pass, coefficients from a cutoff-indexed table with linear interpolation and an `RSQRTS`-normalised resonance term | `sw:0x122BF4…0x122CDA` | confirmed (structure) |
| Cutoff law | the coefficient table is the **same table as the Stage 4 voice cores' tan pre-warp table** (identical over its ~190-entry span), and the Electro 7's cutoff display list is the Stage 4's (14 Hz … 32 kHz). So `SYNTH-ENGINE.md` §7.4's cutoff formula applies | local table comparison (`dm:0x95094`), label array at `0xC05A9E88` | confirmed (table), likely (index = knob) |
| Resonance | uses its own damping tables (they differ from the Stage 4 LP12 law); one passes 1/√2 at the centre of its index range | `dm:0xB0F96`, `dm:0xB0E95` | likely (structure), open (law) |
| Key track | 0–3, default 2 (Stage 4: `k ∈ {0, 1/3, 2/3, 1}` per note) | registry; Stage 4 §7.4 | guess (same law) |
| Drive | 0–127 (the Stage 4 has 4 steps); the post-filter waveshaper table is the Stage 4's (all 1,024 points identical), so drive is a pre-gain into the same soft clipper | `dm:0xB0598` vs Stage 4 `dm:0xB02E8` | confirmed (shaper), open (pre-gain law) |

### 4.4 Envelopes, vibrato, glide, unison

| Item | Finding | Evidence | Conf. |
|---|---|---|---|
| Amp env | ADSR (0–127 each; Stage 4 has A/D/R plus "decay = inf") | registry, keys 25–28 | confirmed |
| Mod env | ADSR + Amount (0–127, default 64) + velocity (enable, 0–2). It is the **filter** envelope in Analog mode and the **Spectra** (modulator) envelope in FM mode; the amp env is the **Body** envelope in FM mode | UI labels "Filter/FM Envelope", "Amplitude/Body Envelope", "Spectra Envelope" | confirmed (labels), likely (routing) |
| Curves | the attack and decay/release tables are **the Stage 4's** (128 of 129 entries identical), and the Electro 7 shows the same time lists (0.5 ms … 45 s attack, 3 ms … 45 s decay/release). `SYNTH-ENGINE.md` §7.5 applies: linear attack, exponential decay/release that fall 40 dB in the shown time | local table comparison (`dm:0xB0A7D`, `0xB0C81`) | confirmed |
| Sample rate | equal tables imply the same voice-core rate as the Stage 4 (≈ 86.8 kHz) | inference | likely |
| Dynamics | 0–3 (key 47), the amp-velocity sensitivity | registry | likely (Stage 4 `AmpEnvVel` law) |
| Vibrato | on/off, rate (quantised to 61 steps, key 43), amount 0–50, delay 0–30, mod-wheel control; no LFO section | registry, `0xC00FE668` | confirmed |
| Glide | 4 settings: off and three rates (key 42) | `0xC00FE6A0` | confirmed |
| Unison | 0–3 to keys 17 and 46 | `0xC00FF418` | confirmed (path), open (detune) |
| Voice mode | poly / mono / legato (key 39) | registry | confirmed |

### 4.5 Where the synth preset lives

A program embeds the whole synth preset (block `Synth/SynthPreset`, 66 bytes) next to a
preset id (`Syn_kSynPresetId`, 0–3199 = 32 banks × 100, the `ne7r` partition). The
standalone preset file is the same archive under the `ne7r`/`ne7s` tags
([`NORD-PRODUCT-LINE.md`](NORD-PRODUCT-LINE.md)). In Sample mode the preset stores a sample id
(`Syn_kSmpId`, 0–16383) and a 32-bit name hash; the Stage 4 stores a 32-bit sample id.

## 5. Effects

### 5.1 Shared modules (confirmed)

Matched by comparing every Electro 7 `DSPFxSy` c1 function with the Stage 4 listings, then
tying the matched entry points to the Electro 7 resource pools. "Same" means ≥ 0.9 of the
function's code occurs unchanged in the Stage 4 module.

| Stage 4 module (`EFFECTS-ENGINE.md` §10) | Electro 7 `DSPFxSy` c1 | Pooled on |
|---|---|---|
| Auto-Pan `0x123707` | `0x12554C` (same) | FxSy c1, c2, Org c2 |
| Tremolo `0x1235AD` | `0x125459` (same) | FxSy c1, c2, Org c2 |
| Ring Mod `0x124344` | `0x12595A` (same) | FxSy c1, c2, Org c2 |
| Wah (SVF) `0x124746` | `0x125B53` (same) | FxSy c1, c2, Org c2 |
| A-Wah `0x12480F` | `0x125C1C` (same) | FxSy c1, c2, Org c2 |
| Phaser Type I `0x12410F` | `0x1257F9` (same) | FxSy c1, c2, Org c2 |
| Flanger `0x123E01` | `0x12572F` (same) | FxSy c1, c2, Org c2 |
| Chorus `0x123798` | `0x1255DD` (0.94) | FxSy c1, c2, Org c2 |
| Vibe `0x1245F8` | `0x125A05` (same) | FxSy c1, c2, Org c2 |
| Ensemble `0x1243EF` | `0x126441` (0.98) | FxSy c1, c2, Org c2 |
| Overdrive `0x12500A` | `0x126348` (same) | FxSy c1, c2, Org c2 |
| Amp voicing `0x123243` (0.87), cabinet (both Stage 4 cabinet modules `0x123391`/`0x123491` match code from `0x1250AB`), 2× SVF `0x124D68`/`0x124E0B` | `0x1250E3`, `0x1250AB`, `0x1261B6`/`0x126259` | FxSy c1, c2, Org c1, c2 |
| Delay lines `0x1206B0`/`0x120AB5` | `0x124342`/`0x124552` (≈ 0.8; two variants per pool, as on the Stage 4) | FxSy c1, c2, Org c2 |
| Decimating send `0x125142` | present (0.78) | — |
| Compressor `0x120630` | `0x1242BA` (0.5; shorter code) | FxSy c1, c2, Org c2 |
| Reverb tank + wrapper `0x120D8A`/`0x120FDB` | `0x123E61`/`0x1240B2` | FxSy c1, c2, Org c1 |
| Spring `0x124AF2` | `0x125F35` (0.92) | FxSy c1, c2, Org c1 |

**Not present on the Electro 7 (confirmed by absence):** Pump, Phaser Type II, Chorus
Analog, Spin, the delay feedback effects (Flam line, Space diffusers, the feedback Vibe), the
LP24/HP24 amp filter and the plain send module (`0x125103`, the Stage 4's "To Rotary" path).
Each scores at most 0.24 against every Electro 7 core. So the Electro 7 has no Comp
*Response*, no delay feedback effect and no amp filter types, which matches its registry (§5.2).

Because the DSP modules are the same code, everything `EFFECTS-ENGINE.md` §10 says about a
module's **signal flow** applies. The **knob → DSP value** formulas there were read from the
Stage 4 ARM setters; the Electro 7 setters were not re-derived, so treat them as likely.
The effects sample rate on `DSPFxSy` (which also runs the synth) was not established.

### 5.2 Parameters (from the registry; confirmed ranges)

| Section | Parameters (Edt id: range) | Differs from the Stage 4 |
|---|---|---|
| Effect 1 | enable, Rate 0–127 (256), Amount 0–127 (257), Type 0–4 (258), pedal/wheel assign on Rate and Amount | 5 types instead of 12; no master-clock switch |
| Effect 2 | enable, Rate, Amount, Type 0–4, **Mono** flag (264) | 5 types; stereo/mono is a separate switch, not separate types |
| Amp/EQ | enable, Drive 0–127, Type 0–5, Treble/Mid/Bass −60…+60 (0.25 dB steps on the Stage 4: ±15 dB), Mid Freq 0–127 | 6 types; no LP24/HP24 |
| Delay | enable, Tempo 14-bit, Mix, **Ping-pong 0–3**, Filter 0–3, Feedback, Mode (Normal/Analog) | ping-pong has four settings (Stage 4: on/off); no feedback effect |
| Compressor | enable, Amount (default 38), Global (Common) | no Response switch |
| Reverb (global) | enable, Type 0–4, **Chorale** flag, Colour 0–2, Send enable; Amount per section | Chorale is its own switch, 5 base types |
| Rotary (global) | enable, Speed 0–2, Source 0–2, Drive, horn/rotor stop angles (16-bit), stop-angle mode | stop angle is continuous |
| Global flags | Delay Global, Comp Global (Common block) | as on the Stage 4 |

### 5.3 Menu entry → module (open)

The Electro 7 has no text labels for effect types (the panel draws them). By elimination the
five Effect 1 modules are **Auto-Pan, Tremolo, Ring Mod, Wah, A-Wah** and the five Effect 2
modules **Phaser, Flanger, Chorus, Vibe, Ensemble** (confirmed as a set). Their order in the
menu is a **guess** (Stage 4 order without the missing entries). The reverb's five types
plausibly map to Spring plus four tank sizes, with Chorale as the Stage 4's chorale flag
(guess). The Electro 7 type-select tables were not found: its routers use `add pc` jump
tables that Ghidra does not follow, and the type setters behind the effects router
(`0xC010395C`, cases 258/263/280) were not traced to the unit selector.

What settles it: decode the section constructor and type setters (the Electro 7 equivalent
of the Stage 4's `0xC010E1FC` with tables `0xC02BA708…`), or a hardware check (cycle Effect 1
through its five types while watching a test tone).

## 6. Samples: the file format the Electro 7 loads

| Item | Finding | Evidence | Conf. |
|---|---|---|---|
| Accepted files | `.nsmp3` and `.nsmp4` (generations 3 and 4) | §6.1 | confirmed |
| Container | the CBIN envelope, root chunk tagged `NSMP` (or the older `NWS`) | literals `0x004E5753` / `0x4E534D50` at `0xC007E604`/`0xC007E608` | confirmed |
| Codec | NW1 (codec 3/4), decoded on `DSPSmp`, whose program is the Stage 4 sample decoder | §2 | confirmed |
| Header, zones, loops | as `NSMP-CODEC.md` (`map` zone table, stroke headers, loop/sustain model). The Electro 7's ARM parser of those sections was not re-traced | shared container check and decoder | likely |
| Program reference | sample id 0–16383 + 32-bit name hash in the synth preset | layout | confirmed |

### 6.1 The generation check (`0xC007DE44`)

The loader compares the root tag with `NWS` and `NSMP`, takes the file's version `v`, and
when `v − 8 ≤ 32` looks up the generation in a byte map (`0xC04BFD24`: 8 → 1, 11 → 2,
30 → 3, 40 → 4). It continues only when the generation is 3 or 4 and a second header field
equals 4. This is instruction for instruction the Stage 4's check (`0xC01D7A2C`), so the
Electro 7 loads the same sample files as the Stage 4 and refuses `.nsmp` (generations 1–2),
which must be converted up first. No new sample-format spec is needed:
[`NSMP-CODEC.md`](NSMP-CODEC.md) for codec 3/4 applies.

## 7. Confidence summary and what is open

- **Confirmed:** the DSP split and names; the shared effects modules and the missing ones;
  the synth parameter list and its dispatcher keys; mode 0 = Sample; 12 voice slots per
  core; the note-on word; the analog kernels' polyBLEP/pulse structure; the shared envelope and cutoff
  tables; the sample generation check; the identity of the sample and piano decoders.
- **Likely:** modes 1/2 = Analog/FM; the FM kernel structure; the sample-voice routines; the filter as an SVF-family
  filter with the Stage 4 cutoff law; the effects' knob formulas (from the Stage 4); the
  synth voice-core rate.
- **Guess:** effect menu order; reverb type → tank/spring mapping; the 4/3 kernel as a
  triangle; the use of the 0.25–24 ratio list.
- **Open:** rotary location and model; the role of the `0x121C25` generator; FM ratio tables and algorithm routings; resonance
  law; unison detune; glide times; Effect/Amp/Reverb type order; how notes are spread across
  the two `DSPFxSy` cores; the effects sample rate on `DSPFxSy`.

## 8. Reproducing

All local and gitignored: the unpacked OS 1.30 image; `scripts/sharc-boot-split.py` on
`0xC0513B14` (0x36660 bytes) and `0xC054A178` (0x24FCC bytes), then
`scripts/sharcplus-image.py` per core; a Ghidra SHARC+ import of each core with a listing
dump; a 12-byte chunk comparison of each function against the Stage 4 listings; a
constant-propagation pass over `0xC0118010` to list the pools; and an `llvm-objdump` jump-
table decoder for the ARM routers. None of the outputs are committed.
