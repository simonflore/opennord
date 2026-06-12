# Roadmap

Two phases. Phase 1 is buildable today from *known* knowledge. Phase 2 is the dream's hard core and depends on reverse engineering that doesn't fully exist yet for the Stage 4.

## Phase 1 — Read & share (no hardware RE required)

Everything here uses the file format, which is already partially documented/decoded.

- [x] **Offset map — DONE.** The full bit-location map for all four engines (406 params) is ingested from ns4decode's bitmaps (`offset-map.generated.ts`) and validated against the real fixture (80.6% byte coverage; bank/checksum/synth-layers correct). The Decode Inspector reads it now.
- [~] **Interpretation layer — discrete enums DONE.** 86 parameters (piano/filter/LFO type, modes, on/off, bank, …) now show human values via ported `ns4names.py` enum tables (`interpret.generated.ts`), each validated against the fixture's CSV. Remaining: **formula/dependent** interpreters (dB, Hz, BPM, envelope times, synth category/wave, drawbars, timbre) — these need ns4decode's `interpret*()` functions ported, not just tables.
- [ ] **Map raw → `NS4Program`** model (name/category, then section by section) for the structured Program Decode view.
- [ ] **Visualize a program** — show piano/sample, organ, synth, effects in a readable card.
- [ ] **AI search** over a set of parsed programs ("punchy clav", "ambient pad").
- [ ] **AI explain** — "what does this patch do, and how would I tweak it?"
- [ ] **Community library** (backend) — upload, browse, search, rate, fork user programs. *Programs only, never samples (`docs/LEGAL.md`).*
- [ ] **AI generate** — "warm Rhodes with slow tremolo" → a `.ns4p` you can download.

A useful product exists at the end of Phase 1 *even if the keyboard is never touched.*

## Phase 2 — Talk to the Nord (the frontier)

This is the unproven part. Sequence it behind a validating spike so you fail fast if it's not feasible.

- [ ] **SysEx spike** (`docs/SYSEX-SPIKE.md`) — can an iPhone/computer *receive* a program dump from a Stage 4 over USB MIDI, and *send* one back? This single experiment decides whether Phase 2 is a weekend or a wall.
- [ ] **Pull current program** off the keyboard into the app.
- [ ] **Push a patch** to the keyboard (audition a shared patch on *your* Nord).
- [ ] **Live tweak** — real-time CC/NRPN control (the ns4mcp parameter map already exists; this is the easy, proven part of device comms).

## What's proven vs. unproven

| Capability | State |
|---|---|
| Parse `.ns4p` (partial) | **Proven** (ns4decode) — re-derive openly |
| Visualize / share / AI over parsed data | Buildable now |
| Real-time CC/NRPN control | **Proven** (ns4mcp / standard MIDI) |
| SysEx **program dump** transfer to/from Stage 4 | **Unproven** — the spike decides |

Do Phase 1 first. It's valuable on its own and it's the credibility you bring to the forum when asking for help with Phase 2.
