# `.npno` codec crack — recording recipe

Goal: capture clean ground-truth PCM of a known `.npno` piano so we can pin the CNSP
audio codec's exact block-header layout by correlation. Rationale + why this is the only
reliable unlock: `docs/NSP-FORMAT.md`. Harness: `scripts/npno-crack.ts` (validated).

## Piano: **CP80** (`Electric_Grand_1_CP80__5.3.npno`)

Chosen because we hold its `.npno` **and** a `.nsmp` twin (extra cross-check) and it's
**mono** (simplest). Load the CP80 / "Electric Grand 1" onto the Nord (factory library).

## What to record

Play these **root notes** (native pitch — no interpolation). One would do in theory; play
all five so a bad take never blocks us. Each is a real sample root in the file:

| Play this key | MIDI | Note |
|---|---|---|
| low        | 40  | **E2**   |
| low-mid    | 55  | **G3**   |
| middle     | 60  | **C4** (middle C) |
| high-mid   | 75  | **D#5**  |
| high       | 90  | **F#6**  |

## How to record (this part matters most)

- **Line / USB out**, *not* a microphone. A mic adds room tone + noise that breaks correlation.
- **All effects OFF** — no reverb, delay, EQ, compression, rotary, amp sim.
- **Small piano variant** (no string resonance), **sustain pedal UP**, **single notes**.
  Nothing else should ring.
- **One note per file** (or clearly separated). Let each note **ring out fully** (capture the
  whole decay, several seconds — don't clip the tail).
- Moderate, consistent velocity (~mezzo-forte). Avoid the very softest layer.
- Highest sample rate the interface offers (48 kHz is fine); 16- or 24-bit WAV.
- **Name each file with the key you played**, e.g. `cp80_60.wav`, `cp80_40.wav`.

## Then

```
npx tsx scripts/npno-crack.ts crack cp80_60.wav 60
```

It searches the `.npno` for the stroke whose decode matches your recording and prints the
block-header layout. A strong lock (corr > 0.8) means the codec is cracked — the same layout
then decodes every stroke in every `.npno`. If it doesn't lock, the output says what to check
(line-out? root note? FX off?) or that the search space needs widening.
