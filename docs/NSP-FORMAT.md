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

**Audio codec: shared `NW1` — CONFIRMED (2026-06-14, via decompiler).** The
piano decode path is the *same generic* `Ymer::Codec::NW1` code as `.nsmp`:
`CBlockHdr::Read` (`1002d8d5c`), `CDecode::DecodeStroke` (`1002d9c8c`),
`CDecode::DecodeSamples` (`1002da1c0`), `FilterSamples`, and `CSectionStroke::Read`
(`1002f97f4`) are all engine-wide, not piano-specific. Same fixed-polynomial
predictor, same block-header bit layout (`sampleCnt[0:13]`, `filterOrder[14:17]`,
`bitWidth[19:22]+1`), same MSB-first residual unpacker. The only parameter is the
**word size** carried in `SMetric` (`+0x34`/`+0x40`): `0x20` ⇒ `GetU32`,
`0x18` ⇒ `GetU24` (the legacy path). So piano audio = our existing decoder; no
new codec.

**But the CNSP container is NOT the `.nsmp` section tree, and the audio is NOT
directly block-aligned in the file.** Verified against the factory file
(`piano_library_436.nsmp`, 218 MB, structure-only):

- **No NW1 section tags** anywhere in the file (`NSMP`/`hdr`/`map`/`stk`/`sty`/
  `meta` all absent; only `CNSP`@0x2C). The piano body is a flat CNSP layout, not
  the tagged `[tag][ver][size]` tree `.nsmp` uses.
- **No contiguous block stream.** A strong detector (any run of ≥40 valid blocks
  ending in a stop sentinel — chance ≈ 10⁻¹²) over the first 4 MB found **zero**
  hits in *both* byte orders (u32be and u32le); u24 likewise. Max runs (~16–19
  blocks) are pure coincidence. So you cannot just point `decodeStroke` at a file
  offset — the strokes are reached only through the container's own stroke
  directory, and the residual bytes are almost certainly **`CChunk`-framed**
  (the `NW1::CEncode::WriteChunk` / `CChunkBuffer` path), i.e. split into chunks
  with interspersed framing that breaks file-level contiguity.

So piano support = **our NW1 decoder (done) + a CNSP stroke-directory parser +
the `CChunk` de-framing**. Bigger than a drop-in; far smaller than a new codec.

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

## Container layout observed in the factory file (structure only)

After the CNSP header + metadata + name (`0x2C`–`~0xB5`):

| File offset | Content |
|---|---|
| `0xB6` | **128-entry per-note key map** (`0x16`→`0x6B` monotonic, `0xFF` = unused) |
| `~0x140`+ | per-note parameter arrays (level/detune-style, one byte/note, several arrays) |
| `~0x400`–`~0x2D580` | **per-sample records + a downsampled overview/peak waveform** — repeating `00 7f XX XX` peak entries (the editor's draw thumbnail) interleaved with fixed-size records carrying counts/offsets (recurring markers e.g. `…2429 NN`, `…3e34 NN` where `NN` increments). **This is the stroke directory** — not yet decoded. |
| `~0x2D600`+ | compressed audio body (chunk-framed; see above) |

## Status & next steps

- ✅ Identified the piano reader (`CNSPFileInputStream`) + CNSP header/metadata/
  key-map layout; `readNsp()` reads name/version/checksum.
- ✅ **Confirmed the audio codec is the shared `NW1`** (decompiler, not hypothesis).
- ✅ **Established the audio is container-gated, not block-aligned** (strong
  detector found no contiguous NW1 stream in 4 MB, either byte order).
### ⛔ Blocker found (2026-06-14): no desktop app decodes `.npno` audio

Cross-checked **both** Mac apps (Nord Sample Editor v4.32 *and* Nord Sound Manager
v9.16, arm64). In each, `CNSPFileInputStream` exposes **only** metadata methods
(`ctor`, `VerifyChecksum`, `PopulateMetaData`, `S_GetMainType`, `S_GetVersion`,
`GetStreamType`, `S_IsNSP`) — **no stroke/audio reader and no `Read` override**.
The NW1 decode entry (`ProbeCodec`→`NW1::ProbeFormat`→`PeekFormat`) keys on an
ASCII `"NSMP"` magic (`0x4e534d50`, ver `0x1e`/`0x28`) that a `.npno` file never
contains. Confirmed empirically on two files (218 MB Astoria Grand + 8.8 MB EP8
Nefertiti): no `NSMP` tag, and a ≥40-block-to-stop NW1 detector finds **zero**
real streams in any width/byte-order over the whole file.

⇒ The desktop tools treat `.npno` as a **catalog item** (name/size/checksum for
display + transfer); the actual CNSP audio decoder is in the **keyboard
firmware**. We cannot recover the `.npno` audio framing from these binaries.
Unblocking it needs a firmware image or the community member's piano RE notes.

### ✅ What NSM *does* give us — the partition gate

Nord Sound Manager has the **partition** layer the editor lacked. Decompiled
(NSM v9.16 arm64) — the acceptance model is fully resolved:

A partition holds an **allow-list of `CFileSpec`** = `{extension, CFileType,
versionLo, versionHi}`. A file is accepted only if its extension+type matches an
entry **and** its version falls in `[lo, hi]`. `IsTranscodeSupported(ext)` just
scans that list for the extension. So routing is **strictly by file type**:

| Stage 4 partition | Accepts (`CFileSpec` list) |
|---|---|
| **`SPartitionPianoV6`** (piano) | `s_kNPNO` (`.npno`) ver **500–599** and **600–699** — *only* piano files |
| **`SPartitionSampLibV4`** (sample lib) | `s_kNSMP` (`.nsmp`) ver **300–399** and **400–499** — *only* samples |

The piano partition does **not** list `s_kNSMP`; the sample partition does not
list `s_kNPNO`. There is no shared/"misc" bucket that takes both.
`SPartitionSampLibV4_NotV3Factory::IsFileSupportedEx` adds the extra gate that
rejects v3 **factory** libraries (`CPeekBundle::IsFactoryLibrary` →
*"NSMP v3 Factory Library files are not supported"*), mirroring our own legal
stance.

⇒ **Community question answered:** a sample-library sound (a `.nsmp`) **cannot**
be loaded into the piano partition — NSM/the keyboard routes by file type, and the
piano partition accepts only `.npno` v5xx/v6xx. The *only* way a Mellotron lands in
the piano partition is to author a genuine `.npno` — which still needs the CNSP
audio framing that lives in firmware (blocker above). So the idea is gated twice:
the partition type-check, and the unavailable `.npno` audio encoder.

(NSM binary: `/Applications/Nord Sound Manager v9.16.app/...`; arm64 slice imported
to `/tmp/nsm_proj`; decomps in `/tmp/nsm_part`, `/tmp/nsm_part2`.)
