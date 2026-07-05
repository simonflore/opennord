# Cross-generation migration: Stage 2 / 3 → Stage 4

## Overview

If you've got Stage 2 or Stage 3 programs, OpenNord can convert them into a
real, loadable Stage 4 program (`.ns4p`). It's a **good guess** at your
original sound — exact where the two instruments line up, an educated pick
where they don't, and always honest about what it couldn't figure out. Every
conversion comes with a plain-language report grouped into what carried over
cleanly, what's a close match, what you'll need to pick yourself on the
instrument, and what simply doesn't exist on Stage 4. Find it as **"Convert to
Stage 4"** on any Stage 2/3 program in the Library. Conversion only ever goes
*forward* (older → Stage 4) — there's no downgrade path.

## What carries over, by engine

| Engine | Carries over | Notes |
|---|---|---|
| **Organ** | On/off, model (B3/Vox/Farfisa/Pipe…), all 9 drawbars per manual (second manual → Stage 4's organ B layer), vibrato/chorus on-state, percussion (on, soft, fast, third harmonic), volume, octave shift | Vibrato/chorus is turned on but its exact character is left at a sensible default (Stage 4's vib/chorus mode is a different kind of field than the source) |
| **Piano** | On/off, instrument type (Grand/Upright/Electric/Clav/Digital), volume, octave shift | The exact piano *sound* only carries over if OpenNord can match it to one in your linked Library folder — see "How sound matching works" below |
| **Synth** | On/off, sample vs. analog oscillator mode, filter type + cutoff + resonance, amp envelope (attack/decay/release), LFO shape + rate, volume, octave shift | Sample-based synth sounds follow the same matching path as piano; analog oscillator waveform has no equivalent field on Stage 4 and is left at a default (see Fidelity notes) |
| **Effects** | Mod 1/2, delay, compressor, reverb — on/off plus type where the two instruments' effect menus line up | If your program is organ-only, effects route to the organ's own effects rather than the (disabled) piano/synth layers, so they're actually audible |

## What doesn't carry over

- **Morphs** (wheel/aftertouch/pedal assignments) — Stage 4's morph system
  doesn't map from older generations; you'll need to rebuild any you want.
- **Arpeggiator settings** — not migrated.
- **Second panel / second slot** — only the active panel/slot is converted.
- **Rotary speaker** — Stage 4 has no equivalent effect slot for it.
- **Sounds not on your Stage 4** — a piano or sample sound is only carried
  over if OpenNord can match it in your linked Library folder; otherwise
  you'll see a note to pick a similar sound yourself once the file is loaded.
- Organ-only programs: a couple of effect types (like amp simulation) have no
  organ-side counterpart on Stage 4 and are dropped with a note rather than
  guessed at.

Nothing above is silently dropped — every one of these shows up in the
conversion report so you know exactly what to touch up.

## How sound matching works

Piano and sample-based synth sounds are matched by name against the pianos
and samples OpenNord already knows about from your **linked Library folder**
(the same index used everywhere else in the app — no device connection
required). A confident match sets the real sound reference in the file; no
match (or no linked folder) leaves the donor's default sound in place and adds
a "pick this sound on your Stage 4" note naming what the original was.

Matching runs through the same seam as OpenNord's other AI features: a
built-in, zero-config matcher (closest name match) always works, and can be
upgraded to an AI-assisted matcher for trickier names. Either way, the match
is only ever a **pick from a list of your real sounds** — it can never invent
a sound reference that isn't actually on your instrument.

**Current limitation:** the piano/sample entries OpenNord reads from a folder
today don't carry the internal Stage 4 sound ID the file format needs — only
a name and file path. Until that ID is resolved, matching can't complete for
these two sound types, so every piano and every sample-based synth sound
currently gets a "pick on your Stage 4" note rather than an automatic match.
The matching machinery (menus, advisor, validation) is fully built and
tested; the missing piece is purely the ID lookup, not the matching logic
itself.

## Fidelity notes

- **Donor template.** Rather than building a Stage 4 file from nothing, the
  converter starts from a known-good `.ns4p` and edits only the fields it can
  confidently map, after first resetting every mappable field to a neutral,
  curated default (so none of the donor's own sound leaks through). About
  16% of the file's bytes have no identified meaning yet (see
  `docs/FORMAT.md`); those stay at the donor's values, and the report
  discloses this once, globally, rather than claiming full coverage.
- **No exact conversion for a few fields**, each left at a sensible default
  with a report note rather than a guess:
  - Organ model — matched by scanning Stage 4's own model names for the
    closest label (no direct lookup table exists yet).
  - Analog oscillator waveform — the synth's analog waveform field has no
    known inverse mapping.
  - Filter resonance — carried across as a raw scaled value (no unit
    conversion table).
  - LFO rate — falls back to a MIDI-scaled value when no frequency-based
    match is found.
- **Fidelity bar.** The target is "a good guess a player can finish by ear in
  a minute," not byte-for-byte equivalence — this is a from-scratch emitter
  onto a donor file, not a lossless format conversion.
- **Hardware acceptance is pending.** The real validation files (the Stage 3
  ABBA and Boston-organ programs, plus a Stage 2 program) still need to be
  converted and ear-checked on an actual Stage 4; any audible gaps found
  there (FX character and synth waveform mapping are the likely candidates)
  will be filed as follow-ups.

## Traceability

Every field the converter writes is documented at its source:

- `src/lib/migrate/to-ns4.ts` — the emitter. `EMITTER_PARAMS` lists every
  Stage 4 parameter the converter can touch, each commented with its
  traceability id (offset-map id or interpret-table name) from the existing
  Stage 4 decoder. The `emitOrgan`/`emitPiano`/`emitSynth`/`emitFx` functions
  carry per-field comments explaining exactly how each source value becomes a
  Stage 4 edit (direct lookup, nearest-match, or advisor-resolved).
- `src/lib/migrate/from-ns2.ts` / `from-ns3.ts` — the lifters, documenting
  where each `CommonProgram` field's value comes from in the existing Stage
  2/3 decoders.
- `src/lib/migrate/invert.ts` — the shared inversion helpers (enum lookup,
  nearest-by-interpreted-value) used to turn a human value back into a raw
  Stage 4 field.
- `src/lib/migrate/advisor.ts` / `llm-advisor.ts` — the AI seam. Ships a
  zero-config naive advisor (name-token matching); `createLlmAdvisor(generate)`
  is an injectable prompt/parse layer for an AI-backed advisor, with no
  provider or API key wired into this repo — the real `generate` call is an
  `opennord-backend` capability (see `docs/LEGAL.md` on keeping server-side
  services out of this client repo).
- Full design rationale: `docs/superpowers/specs/2026-07-04-cross-gen-migration-design.md`.
