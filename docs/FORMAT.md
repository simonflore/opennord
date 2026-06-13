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

## The CBIN header (bytes 0x00–0x2B) — verified

Every Clavia file (Stage 2/3/4, Electro, Piano, …) shares one `CBIN` ("Clavia
Binary") envelope. The Stage 4 header layout below is **verified against three
real `.ns4p` files** and cross-checked against the documented Stage 2/3 layout
([chris55.github.io/nord-documentation](https://chris55.github.io/nord-documentation/),
and the [ns3-program-viewer](https://github.com/Chris55/ns3-program-viewer)
source — both treat the header identically).

| Offset | Field | Encoding | Stage 4 (observed) | Source |
|---|---|---|---|---|
| 0x00 | magic `CBIN` | ASCII | `CBIN` | verified |
| 0x04 | header format type (0=legacy, 1=new) | u8 | `1` (always — NSM-era) | NS3 docs + verified |
| 0x08 | file-type tag | 4×ASCII | `ns4p` (`ns4l` = bundle-extracted) | verified |
| 0x0C | bank | u8 | 6 / 6 / 7 | NS3 docs + verified |
| 0x0E | location in bank | u8 | 49 / 47 / 56 | NS3 docs + verified |
| 0x10 | category | u8 | 6 (Organ) / 17 / 17 | NS3 docs + verified |
| 0x14 | program version | u16 LE, ÷100 | `313` → **v3.13** | NS3 docs + verified |
| 0x18 | **CRC-32 checksum** | u32 LE | matches `crc32(bytes[0x2C:])` | **cracked — see CHECKSUM.md** |
| 0x1C–0x2B | reserved | — | all zero on Stage 4 | verified |
| 0x2C+ | parameter body (406 params) | bit-packed | — | offset-map.generated.ts |

**Name is *not* in the binary.** Like Stage 2/3, the program name lives only in
the **filename** — there is no ASCII name field in the file. OpenNord derives the
name from the filename on import (`name.ts`), and the bank/location bytes identify
the keyboard slot.

**One checksum, not two.** NS3 carries CRC1 (0x18) *and* CRC2 (0x78). Probed
against all three real Stage 4 files: Stage 4 has **only CRC1** at 0x18 (0x1C–0x2B
are zero, no second CRC anywhere). So the write path only patches one checksum.

> Per-parameter offsets live in `offset-map.generated.ts` (the `BBB-b` byte/bit
> notation `bits.ts` reads), derived from ns4decode. The table above is just the
> fixed header that sits in front of that bit-packed body.

## Bundles & backups are ZIP archives

A Nord **backup/bundle is a plain ZIP file** — not a custom container. The
different extensions are just renamed zips by content type:

| Extension | Contains | Analog (Stage 2/3) |
|---|---|---|
| `.ns4` *(backup)* | full instrument backup | `.ns3b` |
| program bundle | many `.ns4p`/`.ns4l` programs | `.ns3fb` |
| synth/sample bundles | presets / sample sets | `.ns3synthpb`, `.ns3sbundle` |

Inside, each entry is an ordinary program file; the **folder path encodes the
bank/location**, and bundle-extracted programs carry the `…l` type tag (`ns4l`)
but decode identically to a standalone program. OpenNord reads a bundle by
unzipping and decoding each `.ns4p`/`.ns4l` entry, and writes one by zipping
individual programs (`bundle.ts`, using `fflate`). This is also how sharing a
*collection* works: zip the user's programs — never sample audio (`docs/LEGAL.md`).

> Stage 4's exact backup extension and internal folder convention are not yet
> confirmed from a real Stage 4 backup; the reader is tolerant (filters by
> extension, derives names from basenames) and the writer uses a flat layout
> until a real bundle pins the convention down.

## Nord Sample files (`.nsmp4`) — audio, not programs

A `.nsmp4` is a **Nord Sample** — the actual audio content a program references
by id. Verified against one real file (`Indian Harmonium 1 PS 4.1.nsmp4`, ~1.5 MB):

- **Same CBIN envelope**, type tag `nsmp`, format type 1, version at 0x14
  (`410` → v4.10), and the **same CRC-32 at 0x18** (`crc32(bytes[0x2C:])`) —
  confirming our checksum is the universal Clavia CBIN checksum, not program-only.
- The bank/location bytes (0x0C/0x0E) are `0xFFFFFFFF` — samples aren't slotted.
- After the 44-byte header the body is **chunk-based**: an `NSMP` container → a
  `hdr` chunk holding the human name (`"Indian Harmonium 1"`) → then the audio.
- The payload (`0x100`→end) is ~1.5 MB at ~7.85 bits/byte entropy — i.e. a
  **compressed audio** blob. OpenNord does not decode it.

**What OpenNord does with it:** `src/lib/ns4/sample.ts` reads *only* the header
(name, version, checksum validity) so we can recognize/inventory samples and
resolve a program's sample references. The audio payload is never read, stored,
or shared. `parseNs4Program` classifies `nsmp` as `kind: 'sample'` and refuses to
program-decode it.

### Two kinds of sample — different legal status

A `.nsmp4` may be either **factory/library** content (Clavia's IP — never share)
or **user-created** (recorded by the user on the Nord Sample Editor — the user's
own IP, shareable like a program). See `docs/LEGAL.md`. **Open problem:**
reliably telling the two apart from the file alone. Candidate signals to
investigate with more samples:

- A vendor/source marker in the header (the `"PS"` in the filename, the
  `00 02 00 05` field near the `NSMP` chunk dir, etc.).
- Cross-referencing the sample id / name against the known factory-library
  tables (the community ID→name maps, cf. ns3-program-viewer's library data).

Until this is solved, OpenNord treats sample *audio* as not-shareable by default.

### Sample id ↔ file linkage (to verify)

Programs reference samples by a 32-bit id (`Ns4SampleRef.id`). **Hypothesis:**
that id may be the sample file's own CRC-32 (the value at 0x18) — which would
make "does the user have the sample this program needs?" a direct id match. Not
yet confirmed: it needs a program + the exact `.nsmp4` it references. A Stage 4
owner can close this loop by sharing a `.nsmp4` together with a program that
uses it.

## Contributing a capture (no coding needed)

The most useful thing a Stage 4 owner can do: export programs you understand, especially **pairs that differ by exactly one setting**, and attach them to an issue. Diffing near-identical files is how offsets get found. Only share programs you're happy to make public (`docs/LEGAL.md`).
