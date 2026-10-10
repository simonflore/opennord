# Organ engine

OpenNord's own organ voice, used to play a Stage 4 program's organ layer from the
on-screen keys or any MIDI keyboard. It is **our model of the instruments the Stage 4
emulates**, built only from public, general organ knowledge. It is not Nord's sound,
and it does not use any Nord firmware, firmware-derived data or Nord audio.

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
| `organ-voice.ts` | `createOrganVoice(ctx)`: the Web Audio integration point (worklet, or a ScriptProcessor fallback) |

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
  +28, +31, +36 semitones; the 1⅗′ is the tempered third). Each step is ~3 dB;
  8 is full and 0 is silent.
- **Foldback:** the manual's lowest C (MIDI 36) plays wheel 13 on the 8′. The 16′
  folds its lowest octave up (manuals never reach wheels 1–12). Harmonics above
  wheel 91 fold down an octave at a time. This matches the published B-3 table.
  Notes outside the 61-key range fold the same way. `B3 BASS` reaches wheels
  1–12, whose more complex, square-ish profile is modelled.
- **Percussion:** single trigger. It fires only when a key goes down on a fully
  released keyboard; legato notes don't retrigger it. 2nd = the 4′ wheel,
  3rd = the 2⅔′ wheel. Decay time constants are 0.15 s (fast) and 0.6 s (slow).
  Peak level is 1.0 at normal and 0.5 at soft, relative to a full drawbar. While
  percussion is on, the 1′ drawbar is silenced (it borrows that key contact), and at
  normal volume the drawbars drop about 3 dB. Percussion bypasses the vibrato.
- **Key click:** each key's nine contacts close (and open) at slightly scattered
  times, up to 3 ms apart. The instant gain steps plus a short burst of bright noise
  per contact give the click. Level comes from `keyClick` (default 0.5).
- **Vibrato/chorus:** a modulated delay of up to 1 ms, swept by a ~7 Hz triangle
  (V1/V2/V3 sweep 0.35/0.65/1.0 ms). Chorus mixes the swept signal with the dry
  signal.
- **Output:** layer volume (dB), then a soft limiter that is transparent below ±0.6.

Sources: Hammond B-3 service manual data as summarized in Electric Druid,
"Technical aspects of the Hammond organ" (gear table, 192-tooth top octave,
foldback table, scanner description), plus general Hammond knowledge (3 dB
drawbar steps, the percussion rules).

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
  30 Hz and 8 kHz. Pipe 1 leans on principals, Pipe 2 on flutes. Slow speech
  (35/55 ms) with a short chiff.
- Vibrato on these models uses the same delay vibrato with a sine LFO at a generic
  rate (not instrument data).

## What the program drives

From `organParamsFromLayer`: organ model, nine drawbars (wheel / aftertouch / pedal
morphs applied linearly when amounts are passed; Farfisa tabs switch at half-way),
percussion on / 3rd / fast / soft, vib/chorus on plus the per-model type from the
global `organ vib/chorus type` map, layer volume (morphable), octave shift, and organ
sustain (notes fade over ~0.5 s, ~0.9 s for pipes, instead of stopping).

## Not modelled (yet)

- **Rotary speaker:** not in this engine. `voice.output` is the hook where a rotary
  stage (and the organ FX chain: mod, amp/EQ, comp, delay, reverb) goes. A rotary
  stage should come from public Leslie figures, independent of any firmware
  research.
- Tonewheel leakage/crosstalk, per-wheel level and filter tolerances, the scanner's
  frequency-dependent delay and HF loss, tube preamp character, and the Stage 4's
  own organ settings (click level, drawbar response options).
- Keyboard split zones, layer scenes and the program's other layers: a future
  "play this program" layer routes notes into each organ voice per zone.
- Velocity is ignored (as on the instruments). Sustain pedal holds notes through the
  shared MIDI sustain gate.
