# Nord Piano (`.npno` / `CNSP`) format — RE notes

Structural reverse-engineering of the Nord **Piano** library container, for
interoperability. **Format only — never extract, store, or redistribute the
audio**, and especially not factory libraries (Clavia IP; `docs/LEGAL.md`). This
analysis was done against one factory file for *structure*; real format work and
fixtures must use **user-created** piano samples.

## Relationship to `.nsmp` (Stage sample)

Same `CBIN` envelope, **different container** — a sibling format, not the same:

| | Stage sample `.nsmp3/4` | Piano `.npno` |
|---|---|---|
| Type tag (0x08) | `nsmp` | **`npno`** |
| Body root (0x2C) | `NSMP` | **`CNSP`** |
| Version field (0x14) | 300 / 400 (codec 3/4) | **610** (v6.10, `CPiano`/NPNO v6) |
| Reader class | `NW1::CSection*` | **`CNSPFileInputStream`** |
| Body structure | `[tag][version][size]` sections → `stk` strokes | CNSP header + metadata + **per-note key/velocity map** → many strokes |
| Size | ~1 MB (one sample) | hundreds of MB (multi-velocity, full keyboard) |

**Audio codec: shared (hypothesis, high confidence).** The body is uniformly
high-entropy compressed audio (≈7.0–7.7 bits/byte), consistent with the same
`NW1` block codec we recovered for `.nsmp` (`docs/NSMP-CODEC.md`). To confirm:
locate a stroke's block stream inside `CNSP` and verify the block headers parse
as valid `NW1` — on a **user-created** piano sample, not a factory one.

## CNSP container layout (verified vs the factory file + `CNSPFileInputStream`)

Reader: `Ymer::FileStream::CNSPFileInputStream::PopulateMetaData` (`0x1001db064`,
decompiled). It seeks within the `CNSP` stream (which begins at file `0x2C`):

| CNSP offset | File offset | Field | Notes |
|---|---|---|---|
| 0x00 | 0x2C | `CNSP` tag + header | 22-byte header (`read(&hdr, 0x16)`); magic check `== "CNSP"` |
| 0x16 | 0x42 | metadata block | 103 bytes (`read(&meta, 0x67)`): version (checked vs `0x440`-range gates), **name**, variant, size |
| ~0x8C | ~0xB8 | **per-note key map** | monotonic `0x16…0x6B` (~88 entries = piano keys) → sample/zone index; `0xFF` = unused note |
| (after) | — | zone / velocity params + stroke streams | hundreds of `NW1` strokes, organized by the key map |

Observed in the factory file: name "Astoria Grand", variant "Stw O", size "XL".
(Factory content — referenced only to anchor offsets; not committed, gitignored.)

## Status & next steps

- ✅ Identified the piano reader (`CNSPFileInputStream`) and the CNSP header +
  metadata + key-map layout.
- ⬜ **On a user-created piano sample:** map the per-zone stroke directory, locate
  block streams, and confirm `NW1` decode (reuse `src/lib/ns4/nsmp-codec.ts`).
- ⬜ Port the metadata/key-map parse into a `readNsp()` (sibling of `readNsmp`).

The likely outcome: piano support = **the existing `NW1` decoder + a `CNSP`
container parser**, exactly as predicted — not a separate codec.
