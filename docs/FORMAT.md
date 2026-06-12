# The `.ns4p` format — what we know, and how to add to it

The Nord Stage 4 stores a **program** as a binary `.ns4p` file (presets: `.ns4o`, `.ns4n`, `.ns4y`). A program is the full patch — **referencing factory samples by id, not embedding audio**. That's why sharing a program is safe and small (`docs/LEGAL.md`).

## State of knowledge

The *logical* schema is largely known — [ns4decode](https://ns4decode.netlify.app/) already decodes the great majority of parameters into human-readable values (see its [example output](https://ns4decode.netlify.app/example-output.txt)). What's **not** public is the **byte layout** (offsets/bit-packing). So:

- The **model** (`src/lib/ns4/types.ts`) is shaped directly from ns4decode's output — it's a faithful target.
- The **binary parser** (`src/lib/ns4/parse.ts`) still has to find each field's offset. That's the open RE work (or a collaboration with ns4decode's author).

Cross-check against the Nord Stage 4 manual (MIDI / parameter appendix) and the documented [Stage 2/3 layout](https://chris55.github.io/nord-documentation/), which the Stage 4 rhymes with.

## What a program contains (from ns4decode's output)

- **Up to three layers (A/B/C)** — each a full synth/sample voice. Per-layer `on/off` differs by **Scene I/II**.
- **Per layer:** source (`samples` | `analog`), sample reference, oscillator (type/category/wave + ctrl), pitch, osc envelope, LFO, amp envelope, filter (+ its envelope), arpeggiator (mode/direction/range/rate/pattern length + accent/gate/pan step strings), and a full per-layer FX chain (Mod 1, Mod 2, amp-sim/EQ, compressor, delay, reverb).
- **The morph system:** almost every continuous parameter carries up to three modulation assignments — **wheel**, **aftertouch (A.T.)**, **control pedal** — modeled as `Morphable<T> = { value, wheel?, aftertouch?, pedal? }`.

### Sample references (the key to sharing)

A layer in `samples` mode points at a factory sample by:

| Field | Example | Role |
|---|---|---|
| `id` | `2768936524` | 32-bit stable key — the thing to match on when sharing |
| `slot` / `bankSize` | `2 / 100` | where it's loaded on the instrument |
| `categoryName` | `Strings Solo` | grouping |
| `name` | `Strings Multi FastAtk_ST 4.1` | human label |
| `options` / `bright` | `FAST ATK` / `on` | playback flags |

A shared program therefore carries a "you need these samples" list (`programSampleRefs()` in `types.ts`). OpenNord can warn a recipient which sample IDs they're missing. **Programs only — never the sample audio** (`docs/LEGAL.md`).

## Two parser paths

1. **Binary (`.ns4p`) — the goal.** Decode offsets field by field. Each field: map its location (from a forum post, the manual, your own capture, or diffing two files that differ by one knob), add the read to `parse.ts` with a source comment, add a fixture test, and record the offset in the table below.
2. **CSV bridge — value today.** ns4decode emits CSV (parameter rows × layer columns). A `csv-import.ts` that maps that CSV into `NS4Program` gives OpenNord working visualization/sharing **now**, with zero offset RE — while the binary parser matures. Recommended first import path.

## Finishing the map — two shortcuts from the ns4decode manual

The ns4decode manual (developer section 18) reveals two operations that make completing OpenNord's decoder mechanical instead of hand-ported:

1. **`ns4decode --bitmaps`** dumps the *complete* offset tables for all four engines as text files (`ns4p_bitmap_{master,organ,piano,synth}.txt`), using the exact `XXX-Y` byte-bit notation OpenNord's `bits.ts` already understands. **This is the whole map, for free** — generate these once and ingest them, rather than hand-transcribing `makeMapOrgan()`/`makeMapSynth()`. (Add an `importBitmaps()` that parses these into `Param[]`.)
2. **`ns4decode --rawdecimal`** prints every parameter's *raw* integer value (no interpretation). That's a perfect **oracle**: decode the regression fixture with OpenNord and diff against ns4decode's `--rawdecimal` output to prove the port field-by-field, before tackling the human-readable interpretation layer.

So the plan to finish: (a) `--bitmaps` → full offset map; (b) `--rawdecimal` → validate raw reads; (c) port `ns4names.py`'s interpretation tables for the human-readable values.

## Sample names

Per manual section 16: an `.ns4p` references samples **only by ID** (and slot index). The ID→name map is a *partial, community-maintained* table built into `ns4names.py` (`getPianoModels` / `getSampleNames`), extendable by users — there is **no complete official database**. So OpenNord should: store the ID + slot, resolve names via the ported (partial) table, and show the raw ID when unknown — exactly how ns4decode behaves. Section 15.4: the slot index runs continuously across all categories; the library layout needed to map it to the on-screen index isn't in the file.

## Known byte offsets

> Seed table — fill in as the binary layout is decoded. Only list what's verified.

| Section | Field | Location (offset / bits) | Encoding | Source |
|---|---|---|---|---|
| Header | magic / version | TODO | — | — |
| Program | Name | TODO | ASCII | — |
| Layer | source (samples/analog) | TODO | flag | — |
| Layer | sample id | TODO | u32 | ns4decode output corroborates the field exists |
| Layer | filter freq | TODO | scaled | — |

## Contributing a capture (no coding needed)

The most useful thing a Stage 4 owner can do: export programs you understand, especially **pairs that differ by exactly one setting**, and attach them to an issue. Diffing near-identical files is how offsets get found. Only share programs you're happy to make public (`docs/LEGAL.md`).
