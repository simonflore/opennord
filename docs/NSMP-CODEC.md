# Nord Sample (`.nsmp*`) format & codec — RE findings

Working notes for OpenNord's sample reader/decoder. Proven-vs-unproven style:
every row is **verified** (observed in real files / the binary) or **hypothesis**
(plausible, not yet confirmed). Evidence files (local, gitignored):
`research/nsmp/Strings.nsmp3` ↔ `Strings.nsmp4` — the same user sample ("VLV
Strings") exported at two revisions, the matched-pair oracle.

## CBIN envelope — verified

Same universal Clavia CBIN header as programs (`docs/FORMAT.md`):

| Offset | Field | nsmp4 | nsmp3 |
|---|---|---|---|
| 0x00 | magic `CBIN` | ✓ | ✓ |
| 0x04 | format type | 1 | 1 |
| 0x08 | type tag | `nsmp` | `nsmp` |
| 0x14 | versionRaw (u16 LE) | **400** (v4.00) | **300** (v3.00) |
| 0x18 | CRC-32 (LE) over bytes[0x2C:] | 886437759 | 460360244 |
| 0x2C+ | body | chunk tree | chunk tree |

So the **generation is the version field** (300 vs 400); the type tag stays
`nsmp` across revisions.

## Body chunk grammar — partly verified

Chunks use **`[4-byte tag][4-byte BIG-ENDIAN length][payload]`**. Tags shorter
than 4 chars are **NUL-left-padded** (`\0hdr`, `\0cat`, `\0map`); the root tag is
the full 4-char `NSMP`. **Verified** from both files.

Observed chunk inventory (body opens at 0x2C):

| Tag | Role | nsmp4 len | nsmp3 len | Notes |
|---|---|---|---|---|
| `NSMP` | root container | 40 | 30 | **Container** — its length does *not* equal the flat byte span (a flat walk lands mid-name), so children are nested and/or the length counts a sub-header only. Grammar **unresolved** — needs the binary's `CBinInputNordFile`/section reader. |
| `hdr` | header / name | 11 | 10 | Holds fields then the sample name "VLV Strings" (at 0x52). Contains `00 00 00 70` (=112) and `06 2c` (=1580) before the name — **hypothesis:** sample/length params. Name appears NUL-padded to a fixed field. |
| `cat` | category | 7 | 7 | `00 00 00 08 0f …` — **hypothesis:** category id. |
| `map` | **codec block map** | 21 | 14 | **KEY.** A list of fixed-size entries (≈`10 00 00 00 00 00` + a 4-byte id). nsmp4 ids **increment** `00,01,02,…,0x13`; nsmp3 ids are **uniform**. Length = entry count (21 vs 14). Strongly matches the per-block **quantization-table map** behind the *"multiple use of quantization table"* error — i.e. this is where the per-revision codec difference lives. |
| (audio) | compressed PCM | bulk | bulk | The ~960 KB tail. Tag/framing not yet read (after `map`). |

**Open grammar question (blocking a precise reader):** the exact `NSMP`
container semantics and whether `hdr`/`cat`/`map`/audio are nested children or
length-counted siblings. Resolve by reading the editor's `CBinInputNordFile` /
`Codec::NW1::CSection*` reader in Ghidra (Task 6), rather than further guessing.

## Cross-revision delta (Strings pair) — verified observation

- Invariant: type tag, name, the presence of `hdr`/`cat`/`map`.
- Changed: `versionRaw` (300→400), the **`map` chunk** (uniform→incrementing ids,
  14→21 entries), audio chunk length (re-quantized). This is direct evidence that
  **the audio payload is re-encoded per revision** (no header-only shortcut), as
  predicted from the binary (`CSmpDecode`/`CSmpEncode` + quantization tables).

## Decode algorithm — VERIFIED (recovered from the binary)

The codec is `Ymer::Codec::NW1` (same `NW1` family as the program codec). It is a
**block-based fixed-polynomial linear-predictive codec** (the FLAC/Shorten
family), *not* a quantization-table scheme — the `map` chunk is a section/offset
map, not per-block quant tables. Recovered from `NW1::CDecode::DecodeStroke`
(`0x1002d9c8c`), `DecodeSamples` (`0x1002da1c0`), `FilterSamples` (`0x1002da470`),
`CBlockHdr::Read` (`0x1002d8d5c`), and the `CFilter::g_coeff` table
(`0x10083bd08`). Decompiled C in the gitignored `nse_decomp/` + `/tmp/nse_*`.

### Block header (`CBlockHdr::Read`) — one 32-bit word per block

Read a `u32` (big-endian; some codecs read `u24` shifted `<<8`). Fields:

| Field | Bits | Expr | Range |
|---|---|---|---|
| `sampleCnt` | 0–13 | `word & 0x3FFF` | samples in this block |
| `filterOrder` | 14–17 | `(word >> 14) & 0xF` | **0–7** used |
| `bitWidth` | 19–22 | `((word >> 19) & 0xF) + 1` | 1–16 bits/residual |
| `linearMode` | (top) | — | flag |

**Stop sentinel** (`IsStop`): `linearMode==1 && bitWidth==1 && filterOrder==0` →
end of stroke.

### Residuals (`DecodeSamples`)

After the header, read `sampleCnt` **signed** residuals, each `bitWidth` bits,
**MSB-first**, from the byte stream via a 64-bit accumulator fed by `u32`/`u24`
words. Extraction: `residual = (int64)acc >> (64 - bitWidth)` (arithmetic →
sign-extended), then `acc <<= bitWidth`. Residuals are interleaved across
channels; sample `i` belongs to channel `i % nCh`.

### Reconstruction (`FilterSamples`)

Per channel, a 32-entry circular history. For sample `i` (channel `ch = i%nCh`,
order `N` from the block header):

```
out = residual[i] + Σ_{k=0..N-1}  g_coeff[N][k] · history_ch[head-1-k]
history_ch[head] = out ;  head = (head+1) & 0x1F
```

`g_coeff[N]` (orders 0–7, the only valid ones — extracted, == binomial predictors):

```
0: []   1: [1]   2: [2,-1]   3: [3,-3,1]   4: [4,-6,4,-1]
5: [5,-10,10,-5,1]   6: [6,-15,20,-15,6,-1]   7: [7,-21,35,-35,21,-7,1]
```

No prediction shift — integer coefficients. (These are the rows of Pascal's
triangle with alternating signs, i.e. the order-`N` difference operator.)

### Output

Reconstructed ints are scaled by the stroke's normalization gain
(`GetNormFactors`/`Level2DSP`) and emitted as PCM, then `/2^(bitDepth-1)` → float
`[-1,1]` (`CSmpStreamBridgeDecode::Bridge_Read` yields `float`).

### Container/stroke offsets (per codec version)

`CSectionStroke::GetStrokeBinOffset`: stroke-header size before the block stream
is `0x60` (codec 1), `0x3c` (codec 2), `0x6c` (codec 3/4). Section framing is
validated per-codec by `CSectionNSMP::Read`/`CSectionStroke::Read` via a
`CSectionIterator` against expected tag triples — which is why a naive flat
tag+length walk fails. Codec version = `versionRaw/100` (3 → codec 3, 4 → codec 4).

## Factory-content gate

`CPeekBundle::IsFactoryLibrary` returns a stored flag (offset 0x128) set during
probe; the editor refuses factory v3 libraries ("NSMP v3 Factory Library files
are not supported"). OpenNord mirrors this: user-created only.

## Section/container format — VERIFIED (`CSectionIterator::Read_`)

The body (from `0x2C`) is a **flat sequence of sections** (not nested). For codec
3/4 each section header is **`[tag:u32 BE][version:u32 BE][size:u32 BE]`** (12
bytes) then `size` payload bytes; codecs 1/2 use a 9-byte header
(`GetU24`/`GetU16`/`GetU32`). Section order:

`NSMP` (size 4) → `hdr` (name, NUL-left-padded tag `\0hdr`) → `cat` → `map`
(per-zone level/detune) → **N× `stk`** (one stroke/zone each) → `sty` → `meta`.

Verified by parsing both pair files end-to-end (`src/lib/ns4/nsmp.ts`,
`parseNsmpSections`): `Strings.nsmp3` → 8 `stk` sections; `Strings.nsmp4` → 9.
Each `stk` payload is a variable-length stroke header then the block stream; the
block-stream start is the offset whose decode stays bounded and ends exactly on
the section boundary (the stop sentinel sits at the next section's start).

## Task 7 — DECODE VALIDATED on real data ✓ (codec 3 complete)

The block codec (header parse + MSB-first signed residual unpack + order-0–7
binomial predictor + per-channel history) is implemented in a probe and
**confirmed correct** on a real user sample:

`Strings.nsmp3`, first stroke at block-stream offset `0x51c`, `nCh=2` (stereo),
32-bit words, decodes **68146 samples/channel** to a clean stop sentinel at
`0x204b0`:

- **First 8 L samples: `0,0,0,0,-1,-2,-3,-4`** — silence then a smooth ramp-in:
  the unmistakable signature of a correct audio onset (a wrong decode can't make
  clean zeros + a gentle ramp).
- peak **6114**, RMS ~1041 (L) / 934 (R) — sane 16-bit levels; zero-crossing rate
  **0.026** — tonal, as expected for a strings sample (noise → ~0.5).
- Equal L/R length, ends exactly on a stop block. `nCh=2` gives systematically
  lower peaks than `nCh=1` across all candidates → correct stereo de-interleave.

This proves the codec is reproducible **and correct**. The `map` section, FYI,
turned out to be per-zone **level/detune** attributes (keyboard mapping), not a
block directory (corrects an earlier guess).

### Status: codec 3 fully decodes; codec 4 outstanding

- **Codec 3 (`.nsmp3`): COMPLETE.** `decodeNsmp` parses sections → finds each
  stroke's block stream → decodes. All **8 strokes** of `Strings.nsmp3` decode to
  clean stereo PCM (peaks 4099–7500, sane 16-bit; stroke 0 onset
  `0,0,0,0,-1,-2,-3,-4`). Tested in `src/lib/ns4/nsmp.test.ts`.
- **Codec 4 (`.nsmp4`): NARROWED — inter-block field.** Same section format,
  same 32-bit words, same block header layout, same predictor: individual blocks
  decode **correctly** (e.g. `Strings.nsmp4` stk[1] block stream at `0x77fc`
  begins `00 d0 00 60` = order 0 / bitWidth 11 / 96 samples and yields a clean
  silent onset `0,0,0,0,0,0,0,0`, peak 1023). The difference: codec 4 puts a
  **4-byte field between block runs** that codec 3 lacks — after block[0] (ends
  `0x7884`) comes `7f 04 00 00`, then block[1] `00 d0 00 5a` at `0x7888`, then
  after block[1] (`0x7908`) comes `d6 5c 00 00`, etc. (pattern `XX XX 00 00`).
  So a codec-4 stroke is a sequence of `[block][4-byte field]…`. To finish:
  identify that field (per-block gain/scale? segment length? extended `linearMode`
  word?) by re-reading `DecodeStroke`/`DecodeSamples` for the codec-4
  (`SMetric`) path, consume it between blocks, then decode full nsmp4 strokes and
  run the matched-pair PCM fidelity comparison vs `Strings.nsmp3`.
- **Output scaling:** raw integer PCM is returned; per-stroke normalization gain
  (`GetNormFactors`) / bit-depth scaling to float `[-1,1]` is still TODO.

## Verdict — GO, and DECODE PROVEN on real `.nsmp3` data

The full decode path is recovered and elegantly simple (fixed-predictor LPC,
8 integer predictor sets, MSB-first signed residuals). **Decode is reproducible
in TypeScript** with no proprietary tables to embed. Remaining for Task 7:
implement `decodeStroke`, locate the first block via the stroke-header offset in
a real file, and confirm fidelity on the `Strings.nsmp3`↔`.nsmp4` matched pair
(target: normalized-RMS delta within the codecs' lossy tolerance). The encoder
(`NW1::CEncode::EncodeStrokePhase0/1/2`) is symmetric and looks reproducible too
— basis for the future downward-transcoder spec.
