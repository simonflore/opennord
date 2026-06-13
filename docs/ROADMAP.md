# Roadmap

Two phases. Phase 1 is buildable today from *known* knowledge. Phase 2 is the dream's hard core and depends on reverse engineering that doesn't fully exist yet for the Stage 4.

## Phase 1 — Read & share (no hardware RE required)

Everything here uses the file format, which is already partially documented/decoded.

- [x] **Offset map — DONE.** The full bit-location map for all four engines (406 params) is ingested from ns4decode's bitmaps (`offset-map.generated.ts`) and validated against the real fixture (80.6% byte coverage; bank/checksum/synth-layers correct). The Decode Inspector reads it now.
- [~] **Interpretation layer — 296 / 406 params DONE (73%).** Two sources, both validated against the fixture (0 mismatch):
  - **Pure params (202):** exhaustively evaluated from ns4decode's real interpreter (`values.generated.ts`) — volume→dB, pan, pitch, envelope amounts, transpose, all simple enums.
  - **Morphs (94):** "X with wheel/A.T./pedal" resolved two-pass from their base value (`morphs.generated.ts`) — `base(clamp(base+raw−127))`, "none" at raw 127.
  - **Remaining (~110, the hard tail):** synth osc category/wave (type+version dependent), timbre (piano-model dependent), drawbars (organ-model dependent), KB zones, organ vib/chorus, delay-tempo + bipolar osc-env morphs (special formulas), rate-vs-master-clock, and sample-ID→name. Each needs its specific dependency wired.
- [ ] **Map raw → `NS4Program`** model (name/category, then section by section) for the structured Program Decode view.
- [ ] **Visualize a program** — show piano/sample, organ, synth, effects in a readable card.
- [ ] **AI search** over a set of parsed programs ("punchy clav", "ambient pad").
- [ ] **AI explain** — "what does this patch do, and how would I tweak it?"
- [ ] **Community library** (backend) — upload, browse, search, rate, fork user programs. *Programs only, never samples (`docs/LEGAL.md`).*
- [ ] **Sample resolution — "you need these" → official downloads.** A shared program lists the factory samples it references (`programSampleRefs()`). OpenNord shows that list and, for missing ones, **deep-links to Nord's free [Sample Library](https://www.nordkeyboards.com/sounds/sample-library/)** (free, organized by category) so the user downloads the audio from the official source. *(The official client resolves factory content from a fetchable S3 manifest — `clavia_sound_libraries.xml`, see `docs/NSM-TEARDOWN.md` — a candidate canonical id→download source.)* OpenNord **never hosts or transfers sample audio** — it only recognizes a sample (`sample.ts`, header-only), names it, and points to where to get it. Needs: the sample-id→name/category map (the hard-tail item above) and, ideally, confirming the id↔file-CRC linkage so "missing" detection is exact. User-created samples are excluded (they have no official URL — they're the user's own, sharable file).
- [ ] **AI generate** — "warm Rhodes with slow tremolo" → a `.ns4p` you can download.

A useful product exists at the end of Phase 1 *even if the keyboard is never touched.*

## Phase 2 — Talk to the Nord (the frontier)

This is the unproven part. Sequence it behind a validating spike so you fail fast if it's not feasible.

- [ ] **SysEx spike** (`docs/SYSEX-SPIKE.md`) — can an iPhone/computer *receive* a program dump from a Stage 4 over USB MIDI, and *send* one back? This single experiment decides whether Phase 2 is a weekend or a wall. **Update:** teardown of Nord Sound Manager (`docs/NSM-TEARDOWN.md`) shows the official client uses a **raw-USB vendor bulk protocol, not SysEx**, for program transfer — so this likely routes to the Layer-2 USB path in `docs/PROTOCOL-RE.md`. Run the listen-step once to confirm, then plan for USB capture.
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
