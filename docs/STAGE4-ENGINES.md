# Stage 4 engines: map, control path and arpeggiator

An index to how the Nord Stage 4's sound engines are specified in this repo, plus the parts
no other note covers: which program field drives which engine parameter, and the
arpeggiator. The engine details live in the per-engine notes:

| Engine | Note | Runs on |
|---|---|---|
| Synth (oscillators, WAVE, FM, filters, envelopes, LFO, scaling) | [`SYNTH-ENGINE.md`](SYNTH-ENGINE.md) | DSP 1 c2, DSP 2 c1/c2 |
| Effects (Effect 1/2, amp/EQ, delay, compressor, reverb, rotary) | [`EFFECTS-ENGINE.md`](EFFECTS-ENGINE.md) | DSP 0 c1/c2, DSP 1 c1 |
| Organ (tonewheels, drawbars, percussion, scanner, other models) | [`ORGAN-ENGINE.md`](ORGAN-ENGINE.md) | DSP 1 c1 |
| Piano (CNSP voices, release, string resonance) | [`PIANO-ENGINE.md`](PIANO-ENGINE.md) | DSP 4 |
| Samples (NW1 codec) | [`NSMP-CODEC.md`](NSMP-CODEC.md) | DSP 3 |
| Arpeggiator | §4 below | ARM |
| Electro 7 (same libraries, smaller synth) | [`ELECTRO7-ENGINES.md`](ELECTRO7-ENGINES.md) | — |

Source: Stage 4 OS v1.66, static analysis only. **Legal:** knowledge only
([`LEGAL.md`](LEGAL.md)); no firmware bytes, tables or decompiler output. Confidence words:
**confirmed** (read in code or data), **likely** (one link inferred), **guess**.

## 1. Which DSP core runs what

| DSP | Service name | Core 1 | Core 2 | Conf. |
|---|---|---|---|---|
| 0 | `DSPFx` | audio I/O master, 5 effect chains, output EQ and limiter | 5 effect chains | confirmed |
| 1 | `DSPOrg` | organ tone generation, organ effects, rotary; feeds LFO/phase/noise into core 2 | synth voices (16 slots) | confirmed |
| 2 | `DSPSyn` | synth voices (16 slots) | synth voices (16 slots) | confirmed |
| 3 | `DSPSmp` | NW1 sample decoder (older 48-bit SHARC) | — | confirmed |
| 4 | `DSPPiano` | CNSP piano decoder (older 48-bit SHARC) | — | confirmed |

Service names: strings in the second OS image (`ORGAN-ENGINE.md`). Roles: `EFFECTS-ENGINE.md`
§1, `SYNTH-ENGINE.md` §1, `ORGAN-ENGINE.md`, `PIANO-ENGINE.md` §1. Sample rates: synth voice
cores ≈ 86.8 kHz (likely, `SYNTH-ENGINE.md` §7.1), effects 43,402 Hz (confirmed,
`EFFECTS-ENGINE.md` §10.12), piano 44.1 kHz ticks (`PIANO-ENGINE.md` §1.2).

## 2. Control path, one picture

```
.ns4p bits ─► Edt parameter (registry 0xC01A44C4, ~440 ids)            ARM
   │  morph engine resolves wheel / aftertouch / pedal morphs, master clock, globals
   ├─ synth  ─► routers 0xC011BDB4 / 0xC011D53C ─► per-layer dispatcher 0xC0017088(layer, key, 16.16)
   │                 ─► layer blocks on all three voice cores (A/B/C at dm:0xE0000…)
   ├─ effects ─► section methods 0xC010E1FC / 0xC010C040 / 0xC010C990
   │                 ─► unit graph: pools of {dsp, code address, variant} ─► node fields
   ├─ organ  ─► contact / drawbar / bus model on the ARM ─► per-wheel gains in DSP 1 c1
   ├─ piano  ─► note-on (stroke, level, pitch) ─► DSP 4 voice slots
   └─ arpeggiator (ARM only) ─► note events into the synth layer, or the Gate flag (§4)
        ▼
host link: SPI2 slave on each DSP's core 1 (address word, value word) or a mailbox
```

Details: `SYNTH-ENGINE.md` §7.1, `EFFECTS-ENGINE.md` §4 and §10.2, `ORGAN-ENGINE.md`
("How program parameters reach it"), `PIANO-ENGINE.md` §2.

## 3. Program field → engine parameter (synth)

Program field ids and names are the decoder's (`offset-map.generated.ts`); Edt ids are the
firmware's; keys are the per-layer dispatcher's (`SYNTH-ENGINE.md` §7.1). The engine column
says where the behaviour is specified. All router → key pairs are read from
`0xC011BDB4`/`0xC011D53C` (confirmed) unless marked.

| Program field | Edt | Dispatcher key | Engine | Spec |
|---|---|---|---|---|
| `408-1` samples/analog | 250 `Syn_kMode` (0 = Samples, 1 = oscillators) | unison routing (below), generator choice | voice source | §3.1 below, SYNTH §7.3 (id 57) |
| `561-3`/`561-8`/`562-4` analog type / category / wave | 293 / 294 / 295 (`OscBank`, `OscCat`, `OscWave`) via the osc menu (`0xC01ADBC0`) | oscillator algorithm id → kernel pointer | oscillator | SYNTH §2 |
| `563-2` osc ctrl (+ morphs) | 296 | `0x0F` (and `0x09` FM ratio) | oscillator | SYNTH §7.3 |
| `567-8` / `567-1` pitch coarse / fine | 298 / 297 | `0x01` / `0x02` | pitch | SYNTH §7.2 |
| `568-8`, `569-7`, `570-6` osc env A/D/R | 287–289 | `0x0B`, `0x0C` (+ `0x0D` "inf"), `0x0E` | osc envelope | SYNTH §7.5 |
| `571-5` osc env amt (±60) | 290 | — (morph path) | osc envelope | open (SYNTH §7.8) |
| `575-4` / `575-5` osc env to pitch / velocity | 291 / 292 | `0x10` / `0x11` | osc envelope | SYNTH §7.1 |
| `575-8` LFO target | 282 | `0x20` (via a table) | LFO | SYNTH §7.6 |
| `576-2` LFO shape | 283 | `0x1E` | LFO | SYNTH §5 |
| `576-5` / `576-6` LFO master clock / rate | 284 / 285 | `0x24` / `0x1F`, `0x22` | LFO | SYNTH §7.6 |
| `580-5` LFO amount | 286 | `0x21` | LFO | SYNTH §7.6 |
| `584-4`, `585-3`, `586-2` amp env A/D/R | 302–304 | `0x12`, `0x13` (+ `0x14`), `0x15` | amp envelope | SYNTH §7.5 |
| `587-1` amp env velocity | 305 | `0x16` | VCA | SYNTH §7.7 |
| `602-5` filter on/off | 306 | — | filter | — |
| `587-3` filter type | 307 | `0x26` | filter kernel | SYNTH §4 |
| `587-6` filter freq (+ morphs) | 308 | `0x27` | filter | SYNTH §7.4 |
| `591-5` resonance / HP freq (+ morphs) | 309 | `0x28` (guess, SYNTH §7.1) | filter | SYNTH §7.4 |
| `595-4` filter track | 310 | `0x2A` | filter | SYNTH §7.4 |
| `595-6` filter drive | 311 | `0x29` | post-filter shaper | SYNTH §7.4 |
| `595-8` filter env amt (+ morphs) | 312 | `0x2B` | filter envelope | SYNTH §7.4 |
| `599-7`, `600-6`, `601-5` filter env A/D/R | 313–315 | `0x18`, `0x19` (+ `0x1A`), `0x1B` | filter envelope | SYNTH §7.5 |
| `602-4` filter velocity | 316 | `0x1C` | filter envelope | SYNTH §7.7 |
| `416-1`, `453-5`, `602-6`, `603-5` vibrato mode / delay / rate / amount | 260, 263, 261, 262 | `0x35` (`FUN_c011521c`) | vibrato | SYNTH §7.6 |
| `416-7` / `416-6` mono / legato | 257 | `0x30` / `0x31` | voice allocator | SYNTH §7.7 |
| `416-8` voice priority | 258 | — | voice allocator | open |
| `417-2` glide | 259 | morph path, probably `0x03` | portamento | open (guess) |
| `445-3` unison | 300 | `0x06`/`0x07` or `0x37` (§3.1) | unison | §3.1 |
| `423-7` KB hold | 252 | — | arpeggiator / hold | §4 |
| `423-8` … `441-3` arpeggiator | 267–281 | ARM only | arpeggiator | §4 |

Effects fields (`705-1` … `755-6` and the reverb/delay/compressor fields) map one to one onto
the `Edt_Effects_*` ids; `EFFECTS-ENGINE.md` §10.3–§10.11 gives each one's module and law.

### 3.1 Two notes on the synth path (new)

- **`Syn_kMode` (confirmed writes, likely meaning).** `FUN_c0115478` reads Edt 250 and the
  unison setting. With an oscillator layer (250 ≠ 0) the unison value 0–3 goes to keys 6 and
  7, the oscillator recompute. With a Samples layer (250 = 0) key 6 is 0, key 7 is 4 and the
  unison value goes to key `0x37` instead: sample layers have their own unison path.
- **Arp Gate drives the voices (confirmed write).** Arp mode Gate sends dispatcher key 0 =
  1.0 to the layer (§4.2); the other modes send 0.

## 4. Arpeggiator

The arpeggiator runs on the ARM, per synth layer; the DSP only sees note events (and, in Gate
mode, a flag). Labels for mode and direction are already in the decoder
(`interpret.generated.ts`).

### 4.1 Parameters (registry `0xC01A44C4`, confirmed ranges)

| Edt | Parameter | Range / default | Notes |
|---|---|---|---|
| 269 | Run | 0/1 | |
| 267 | Mode | 0–2: Arp, Poly, Gate | §4.2 |
| 272 | Direction | 0–3: Up, Down, Up/Down, Random | mapped to internal 0, 1, 2, 4 (`0xC011BDB4` case `0x110`); internal 3 (a Down/Up order) exists in the step generator but no menu entry selects it |
| 273 | Zigzag | 0/1 | §4.3 |
| 271 | Range | 0–127, morphable | §4.3 |
| 274 / 275 | Master clock / Rate | 0/1; 0–127, default 54, morphable | §4.4 |
| 270 | KB sync | 0/1 | sets a per-layer restart flag (`+0x1D`, case `0x10E`) |
| 268 | Pattern on/off | 0/1 | §4.5 |
| 278 | Pattern length | 1–15, default 7 | §4.5 |
| 279 / 280 / 281 | Pattern accent / gate (duration) / pan | 32-bit words | 2 bits per step, 16 steps (the decoder's `buildArpString`) |
| 276 | Pattern preset | 0–28 | UI recall; `277` marks it edited |
| 266 | Pattern step focus | 0–15 | UI only: 16 step positions |
| 254 | Multi-layer arp | 0/1 (common) | one arpeggiator across layers |

### 4.2 Modes (`0xC011D53C` case `0x10B`, confirmed writes)

| Mode | Arp object | DSP | Meaning |
|---|---|---|---|
| Arp | poly flag 0, step mode 0 | key 0 = 0 | one note per step (likely) |
| Poly | poly flag 1, step mode 0 | key 0 = 0 | each step plays the held chord, stepping through the range (likely, from the step generator's poly branch) |
| Gate | poly flag 0, step mode 2 | key 0 = 1.0 | the held notes sustain and the arpeggiator rhythmically gates them (likely) |

The mode is applied to the arp object only while Run is on (the handler reads Run first).

### 4.3 Step order (`FUN_c01dc280`, confirmed)

The generator keeps the held notes in a list and a step counter. With `n` held notes it plays
over `N = n·(o + 1) + min(n, e)` positions, where `o` is a whole number of octaves and `e` a
number of extra notes into the next octave. So **Range is continuous in notes**, not just in
whole octaves (the setter that turns Range 0–127 into `o` and `e` was not traced: likely).

- **Up:** position = step mod N. **Down:** N − 1 − (step mod N).
- **Up/Down:** a ping-pong over the positions (`FUN_c01dc17c`).
- **Random:** an 8-bit random value (a 32-bit LFSR mixed with an LCG) scaled to 0…N−1.
- **Zigzag** (with Up or Down): step s plays position `s/2 + 2·(s odd)`, i.e. 1-3-2-4-3-5…
  (Down mirrors it). Up/Down has its own zigzag branch whose exact order was not traced.

### 4.4 Rate

The Rate knob has two scales (display tables already in the decoder, `deps.generated.ts`
`428-8`, from ns4decode):

- **Free:** 16 to 990 BPM, then five "Fast" settings at the top of the knob.
- **Master clock:** note values 1/2, 1/2T, 1/4, 1/4T, 1/8, 1/8T, 1/16, 1/16T, 1/32, each over
  a band of about 14 knob steps.

The firmware's own rate scale was not traced; treat the display tables as the reference
(likely). The arpeggiator steps on the ARM, so its timing resolution is the ARM's event clock,
not the DSP sample clock (likely).

### 4.5 Pattern

`0xC011BDB4` case `0x116` writes `(length + 1)·2` into the layer's step object: a pattern has
**length + 1 steps** (2–16; two events per step, on and off). With Pattern on, `0xC011D53C`
case `0x117` copies the accent, gate and pan words into the layer's pattern state; with
Pattern off it clears them. Each word holds a 2-bit code per step: accent (off/on), gate
(three lengths) and pan (centre/left/right), as the decoder displays them.

The decoder shows pattern length raw 0–15 as 2–17. With the firmware's 1–15 range, that is
right if the file stores `length − 1` (then raw 15 never occurs); not checked on a file.

## 5. Confidence breakdown (Stage 4, all notes)

- **Confirmed:** the core map; every router → key pair listed above; the oscillator kernel
  table and kernel structures; WAVE directory and band selection; filter kernels; envelope,
  LFO, cutoff, key-track and pitch laws; the effects module catalogue, type → module tables
  and most effect laws; the organ generator and bus model; the piano voice path; the arp
  parameters, direction mapping, zigzag and step-count formula.
- **Likely:** the 86.8 kHz synth rate; Gate/Poly semantics; the Range → octave/extra-note
  split; Samples-layer unison; several effect field roles.
- **Open (by engine):**
  - Synth: OSC CTRL per algorithm, filter-envelope and osc-envelope semitone scales, unison
    detune, glide curve and key, drive pre-gain, key-track reference note, voice allocation
    across the three cores (SYNTH §7.8).
  - Effects: the 15 items in EFFECTS §10.13 (stop angles, rotary time base, delay corners,
    predelay unit, Chorus Analog and Flanger amount, …).
  - Arpeggiator: the Range setter, the firmware rate scale, the meaning of the 2-bit pattern
    codes beyond the decoder's display, Multi-layer arp behaviour.
