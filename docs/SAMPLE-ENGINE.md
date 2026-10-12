# Nord Stage 4 sample engine: how a sample voice plays

This note describes what the Stage 4 does with a `.nsmp*` stroke between "key pressed on a
Samples layer" and "audio leaves the sample DSP". It is the build spec for OpenNord's sample
player (`src/components/sample/sampleEngine.ts`). It follows on from
[`NSMP-CODEC.md`](NSMP-CODEC.md) (file format and block codec) and mirrors
[`PIANO-ENGINE.md`](PIANO-ENGINE.md), which covers the sister chip.

Sources, all local and gitignored (`docs/LEGAL.md`): the sample DSP image (DSP 3, ADSP-214xx)
from a Stage 4 OS image, read through `tools/ghidra-sharc`; the ARM side of OS v1.66 from the
full Ghidra project; the Nord Sample Editor decompile (`nse_decomp/`); and the local sample
corpus in `fixtures/`. This file records structure, formulas and a few behavioural constants.
Nothing ran on hardware.

**Confidence.** **High**: read directly from code, or checked on every stroke of the corpus.
**Medium**: the mechanism is clear, one mapping is inferred. **Low**: a hypothesis.

**Status.** §1 and §2 are implemented in the player, with the approximations each section
names. Of §3, the voice limit and the fades are built; the resampler is not.

---

## 1. Regions, loop and loop decay (implemented)

### 1.1 The stroke header's pointers are stream positions

The four pointers of a `stk` header (`+0x12`, `+0x1b`, `+0x24`, `+0x2d`) count **words of the
stroke's compressed stream** (24-bit words in the OG layout, 32-bit otherwise). They are not
audio sample positions. The DSP addresses a stroke by (page, word offset) and jumps its stream
reader to these positions (chunk fetcher `sw:0x1c0c2d…`). **High.**

| Pointer | Name (editor: `EncodeStrokePhase0`) | Meaning |
|---|---|---|
| `+0x12` | start | where the stream begins |
| `+0x1b` | second start | an alternate start point that skips the attack; the ARM starts a voice from one or the other by a layer start mode (`0xC01E00AC`) |
| `+0x24` | loop begin | where the reader jumps back to |
| `+0x2d` | end | end of the stream, and the loop's end |

A one-shot has loop begin = end.

Checked on the local corpus (17 files, OG / codec 3 / codec 4, every stroke; test
`nsmp-loop.test.ts`): second start, loop begin and end each land exactly on a segment-opening
block (header bit 23), and `end` is the stop block. The decoder may enter the stream a few
words from `start`, so `strokeLoop` anchors on the end. **High.**

Earlier notes and code read `+0x1b`/`+0x24` as "loop in / loop out" in audio samples. That
looped a wrong window in the middle of the note.

### 1.2 The loop is a hard jump

At the loop end the stream reader loads the loop-begin position and carries on. There is no
crossfade on the sample DSP: the render reads one decoded ring, and its only gain terms are
those in §3. The block at loop begin is a segment-opening block (predictor reset, history
taken from the output), and the audio is cut so the join is continuous: across the corpus the
step from the last frame to the loop-begin frame is within about three average sample steps.
**High** (reachable DSP code; corpus).

So `loopXFade*` in the editor's model is not applied by this chip. Whether anything downstream
uses it is not traced.

### 1.3 Loop decay

The block that opens the loop carries **header bit 18**. When the DSP decodes a block with that
bit it switches the voice's decay on (`sw:0x1c1253…`); from then on the voice's gain is
multiplied by a per-stroke coefficient once per envelope update (`sw:0x1c06ce…`). In the corpus
bit 18 is set on exactly the loop-begin block of every looped stroke and nowhere else. **High.**

The coefficient is the signed 24-bit field at `+0x28`, stored as −c·2²³; the DSP takes the
absolute value, so `0x800000` (−1.0) is "hold". The editor computes it as
(`NW1::Decay2DSP`, `SMetric::kEnvelopeUpdateRate` = 21,700):

> c = 0.01^(1 / (T · 21700)), so the level falls **40 dB in T seconds**, T being the editor's
> Decay time.

**High** (formula and constant read directly; the DSP's own tick rate was estimated
independently at about 21.7 kHz).

Corpus values: strings, organs and pads store "hold" and loop one to four seconds. Pianos,
guitars, basses and vibes loop a few milliseconds (a few cycles) and decay at 2 to 27 dB per
second. The decay starts when the *decoder* reaches the loop, up to about 100 frames ahead of
playback; the player starts it when playback reaches the loop.

---

## 2. Unison and repeated notes on a Samples layer (implemented)

Source: ARM `0xC01D7108` (loader), `0xC01E5404` (unison tables), `0xC01E00AC` (voice set-up).
Unison is the *program's* setting (0–3, dispatcher key `0x37`); the sample only stores what each
setting does to it.

### 2.1 The voicing block

31 bytes after the per-note rows of a codec-4 `map`, read by the instrument as: `mode`,
`topKey`, **four u16 BE** (detune of Unison 1, 2, 3, then the same-recording detune), **three
pan bytes** (width of Unison 1, 2, 3), four voice counts, four u24 gains, `randomStrokeMode`,
`blockRandomSustPed`. **High** (read order). The three codec-4 files in the corpus only give
round numbers this way (detune 0 / 15 / 40 or 0 / 15 / 30, widths 70 / 70 / 70); the earlier
layout, with pan and detune interleaved, gave 10240 and 17990.

- `mode` 0: the instrument's built-in detune and width. `mode` 1: the file's. It is not an
  on/off switch. **High.**
- The voice counts are stored but not read on the paths traced. **Medium.**

### 2.2 Voices

- Unison off = 1 voice; 1 and 2 = 2 voices; 3 = 3 voices where the key has two alternate keys,
  else 2. **High.**
- **Extra voices play neighbouring recordings.** Voice 0 plays the key's own stroke; the others
  play the strokes of the key's alternate keys, repitched to the played key. Above `topKey`
  the key's own stroke is doubled. **High.**
- **Alternate keys** are in the per-note rows: each 10-byte row is level (u24), three bytes,
  then four key bytes `b0..b3`. `b0`/`b1` are the unison alternates (a byte equal to the key
  means none). `b2`/`b3` mark which of them a repeated note may also use: both match → both;
  one matches → that one; neither → none. `0xFF` in key 0's `b0` marks the table unused.
  **High.**
- **Detune.** File values: ± raw·25 pitch units, one unit being 1/65536 semitone, so 40 is
  ±1.53 cents. Built in: 512 units per unison step at middle C, × 2^((60 − key)/20), capped
  at 2560 (±3.9 cents). With two voices one goes up and one down; with three the centre voice
  is not detuned. The same-recording value replaces Unison 1's when both voices share a
  stroke. **High** (arithmetic).
- **Pan.** p = 0.5 + (width/2)/100, L = √p, R = √(1 − p), mirrored for the second voice.
  Built in: (0.933, 0.361). The centre voice of a three-voice stack gets the tier gain
  (raw/2²⁰) on both sides. **High.**
- **Level.** Velocity is not applied in the sample path; it sets the synth voice's level
  downstream. Per-key gain is stroke gain × per-note gain. **High.**

### 2.3 Repeated notes

With `randomStrokeMode` non-zero, each key keeps a strike counter and steps through its own
stroke and its repeat alternates, for keys up to `topKey`. With one alternate it alternates
strictly. With two the instrument follows a fixed order of 38 steps (the first used once, then
a period of 37) in which no source plays twice in a row. With `blockRandomSustPed` the counter
does not advance while the sustain pedal is down. Values 1, 2 and 3 of the mode byte are not
told apart in the code traced. **High** (mechanism), **medium** (pedal flag).

OpenNord uses its own six-step order with the same never-twice-running property, rotates only
a single (unison-off) voice, and ignores the pedal block.

Not traced: velocity-layer switching on this path, key-up handling, the steal order, the
`map_info` global gain.

## 3. Voices, resampling and gain on the DSP (voice limit and fades implemented)

- **56 voice slots.** **High.** The player caps at 56, counting voices still fading after
  key-up; it cuts those first, then the oldest held note. The instrument's own steal order is
  not traced.
- **Headroom is ours.** The unison gains of §2.2 leave none over a single voice, and the
  player's buffers are normalised to full scale, so it scales a stack back until its voices
  cannot sum above full scale. Unison is therefore not louder than a single voice here.
- **Resampling** is on the sample DSP: 12 taps × 256 phases, Kaiser-windowed sinc; six kernels
  with cutoffs from 1.10 down to 0.895 of the source Nyquist, chosen by key octave. Pitch-up is
  allowed, to 4×. Pitch and gate arrive from the synth voice over the audio bus. **High**
  (structure), **medium** (kernel selection). Not built: the player uses the browser's
  resampler.
- **Gain:** a 1 ms start fade (1 − x²), a fade of about 10 ms when the synth voice gates the
  sample off, smoothed left/right gain, and the loop decay of §1.3. A stolen voice is faded with
  a per-update coefficient of 0.965 (60 dB in 9 ms). The amp envelope proper is in the synth
  voice. **High.**

## 4. Open questions

- Velocity layers, key-up and steal order on the ARM side.
- What selects among the six interpolation kernels exactly, and the post-decode one-pole filter
  (passthrough by default).
- Whether `.nsmp4` zero-sample marker blocks carry anything beyond segment boundaries.
