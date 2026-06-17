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

### `map` zone table — verified layout (codec 3 & 4)

Reverse-engineered byte-for-byte against the **Nord Sample Editor `.nsmpproj`**
project files (the human-readable ground truth: `m_rootKey`, `m_topNote`,
`m_btmNote`, `m_globalID`) and cross-checked against each stroke's `stk` header.
Validated on `Other.nsmp4` (4 zones) and the matched `Strings.nsmp3`/`.nsmp4`
pair (8 / 9 zones). Implemented in `readNsmpZones` / `parseCodec4ZoneRecords`.

The `map` payload is `[global level/detune][per-note level/detune block][zone
table]`. The per-note block differs by generation — **codec 3: 128 × 6-byte**
unity rows (`10 00 00 00 00 00`); **codec 4: 128 × 10-byte** rows (the 6-byte
unity + a 4-byte incrementing note tag `00 00 00 00`, `01 01 01 01`, … `7f`×4).
That widening is exactly why the codec-3 6-byte skip mis-parses a `.nsmp4`.

Each zone is a **16-byte record**. The two generations frame it one byte apart:

| field | codec-3 offset | codec-4 offset | meaning |
|---|---|---|---|
| `velTop`   | +0  | +15 | top velocity of the layer (1–127) |
| `rootKey`  | +1  | +0  | key the sample is pitched for |
| `keyHigh`  | +2  | +1  | **split point** — zone's top key |
| `keyLow`   | +3  | +2  | zone's bottom key |
| `globalID` | +12 | +11 | stroke this zone plays — matches **`stk` header +3** |
| trailer    | `00 01 00` @+13 | `00 01 00` @+12 | constant |

Zones reference strokes by **`globalID`, not position** — e.g. `Other.nsmp4`'s
zones (globalIDs 22, 5, 7, 6) map to stroke sections 0, 3, 1, 2. The codec-4
table is located at a fixed offset (`6 + 128*10 + 32`); a 32-byte header precedes
the records and its last byte is the zone count, self-checked by
`recStart + count*16 + 6 == mapEnd`. **OG/legacy** uses a different 12-byte record
(`parseLegacyZoneRecords`).

Editing patches these fields back **in place** (`patchEditedNsmp`) and
re-checksums — audio and every byte we don't model are preserved exactly.

The **writer** (`nsmp-write.ts`) emits this exact layout per generation:
codec-3 `map` = `[6B global][128 × 6B unity][N × 16B C3 records]`; codec-4 `map` =
`[6B global][128 × 10B per-note (unity + 4B note tag)][32B header, last byte =
count][N × 16B C4 records][6B trailer 00 00 00 01 00 00]`. Earlier the codec-4
writer mistakenly emitted the codec-3 `map` shape under a version-21 tag, so
`readNsmpZones` read back **zero zones** — which silently dropped splits/layers on
`.nsmp4` output and made conversion path-dependent (`2→3→4` ≠ `2→4` by a few
bytes). Fixed: the target generation is now a pure function of audio + zones, so
`3→4` equals `3→4→3→4` byte-for-byte (`nsmp-convert.test.ts`).

### Status: codec 3 AND codec 4 fully decode

> **Codec 4 is SOLVED** — see "Codec-4 — SOLVED (per-channel word-interleaving)"
> below. Decode is validated against ground truth (`sine_24.nsmp4` → peak 3000 +
> 220 zero-crossings, exact; `opennord_a440.nsmp4` → 48000 samples; real
> `Strings.nsmp4` → 9 clean stereo strokes ~matching its `.nsmp3` twin) and is
> wired into the Sample Inspector. The bullets below are the original pre-solve
> status, kept for the investigation trail.

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

## Codec-4 — SOLVED (per-channel word-interleaving)

**Resolution (2026-06-14, via the editor ground-truth files):** codec 4 differs
from codec 3 in *one* way — the residual **bitstream layout**. Codec 3 packs all
of a block's residuals as a single sample-interleaved bitstream (sample `k` →
channel `k % nCh`). **Codec 4 packs each channel as a separate 32-bit-word
bitstream, interleaved word-by-word**: word `w` → channel `w % nCh`, each channel
reading `ceil((sampleCnt/nCh)·bitWidth / 32)` words. (This is exactly the
per-channel accumulator flushing in `WriteChunk`, gated by `SMetric[0x34]`.) Plus
codec 4's zero-sample blocks are **segment markers** (skip; the stream runs to the
section end rather than a single stop sentinel).

Proof: the editor-made `sine_24.nsmp4` decodes **pixel-clean** — peak `3000` (the
exact source amplitude, so no normalization loss either) and 220 zero-crossings
(220 Hz); the real `Strings.nsmp4` decodes all 9 strokes to clean stereo (peak
~7K, matching its `.nsmp3` twin's ~6.1K). Implemented in `decodeStroke`
(`wordInterleaved` option) + `decodeNsmp` (auto-selected for `codec === 4`).

Everything below is the investigation trail that led here (kept for reference).

## Codec-4 investigation — narrowed, not closed (autonomous RE)

Extensive testing against `Strings.nsmp4` stk[1] (which is ~the same audio as an
nsmp3 stroke, so a known-good target). Established:

- **Block structure is correct with 32-bit words** — every block's byte count
  lands the next header on a valid `00xxxxxx` word; the stream reaches the section
  boundary exactly. Order histogram is realistic (orders 0–3 dominant), so the
  header bit layout (sc[0:13]/order[14:17]/bw[19:22]+1) is right for codec 4 too.
- **Markers = zero-sample blocks** (`sampleCnt==0`), skipped; they sit at segment
  boundaries (3 in this stroke). No-ops for audio per `DecodeSamples(sc=0)`.
- **The residuals read identically to codec 3** — `twos`/`offset`/`zigzag`/
  `lsb-first` sign-and-bit-order variants all behave the same (peak ~767× int24),
  as do 24-bit words (worse). Codec 3 uses exactly this path and decodes clean.
- **Yet the order-≥2 predictor diverges** (peak ≫ int24). Anything that shortens
  how long the double-integrator runs *masks* it monotonically — channel-contiguous
  split (`WriteChunk` packs per-channel via `SMetric[0x34]==1`): 767→216×; per-block
  history reset: →67×; more sub-streams: 42×→8.6×→2.4×. That monotonicity proves
  the channel/stream layout is a **red herring**; the true cause is a **systematic
  per-residual error** the predictor amplifies, invisible to byte-level RE.

`WriteChunk` (`0x1002dcc60`) keeps **per-channel bit accumulators** flushing whole
words, gated by `SMetric[0x34]`; `SMetric`/`CDecode::CDecode` zero these and they're
set per-codec during section read (not yet located). Bit-depth constants:
kNomTgt=14, kMaxTgt=16, kMaxSrc=24, kPlayer=24.

**Definitive next step:** the queued editor ground truth — encode `ramp_24.wav`
(known residuals) to `.nsmp4`; the systematic error becomes obvious in one file.

### Ground-truth findings (ramp_24.nsmp4, editor-encoded — 2026-06-14)

Decisive results from a known signal (a linear ramp; the editor normalizes it but
it stays linear):

- **Residual reading is CORRECT for codec 4.** Order-1 blocks decode to clean
  `[0,1,0,1,1,-1,…]` ramp-slope residuals (small, as a ramp demands). Sign,
  bit-order, MSB-first, 32-bit words — all confirmed identical to codec 3.
- **The earlier "divergence" was a WRONG START OFFSET.** Block stream begins at
  `payload + ~0x6C` (a `0x40`-ish field block + zero-padding; matches
  `GetStrokeBinOffset`'s `0x6c`). From there, output is **bounded** (peak ~7K).
  My empirically-found Strings.nsmp4 start (`0x77fc`) was off, so it hit order-2
  blocks with wrong history → the runaway. So codec 4 is NOT a residual-format
  change; it's an offset/structure issue.
- **Ramp orders:** only 0 and 1 (4 each), bw {2,3} for the body — textbook for a
  ramp. **12 markers among 8 blocks** (segment boundaries; the leading run is
  header padding read as zero-sample markers).
- **Still open:** even bounded and from the right start, reconstruction is noisy
  (~45% non-monotonic), identical across mono/interleaved/contiguous — so a
  block-connection / order-0-block / segment-marker detail remains. The ramp only
  exercises orders 0–1; **decode the `sine_24.nsmp4`** (order-2 present) next to
  isolate the order-≥2 reconstruction, and pin the per-stroke header size so the
  block-stream start is computed, not scanned.

### sine_24.nsmp4 (order-2 ground truth) — the wall is order-≥2 reconstruction

Decoded the editor's sine (L=R, so channel layout is irrelevant — isolates the
codec). Block stream at `payload+~0x6c` then alternating **order-2/order-3**
blocks (bw 3–4, sc 64–448) — textbook for a smooth sine.

- **Order-2/3 residuals are read correctly** — small, plausible
  (`[-1,0,-2,1,0,0,0,0,…]`, `[1,-1,1,-2,3,-2,…]`). Headers/boundaries parse sane.
- **But order-≥2 reconstruction diverges into a smooth ramp** (peak ≫ int24): the
  `[2,-1]` double-integrator runs away. Sub-stream count is a **confirmed red
  herring** — peak drops monotonically (174→25→5.9→1.6× int24 for 2/4/8/16
  streams) but never goes clean; it only shortens the integrator.
- **Yet codec-3 decodes order-2 fine** — Strings.nsmp3 has 509 order-2 blocks and
  reconstructs cleanly with the *same* `[2,-1]`. So the predictor coefficients are
  right; something about codec-4's order-≥2 *state* differs.

**Unresolved discriminator (next probe):** why codec-3 order-2 reconstructs but
codec-4 order-2 ramps, given identical residual reading + predictor. Leads:
per-segment history **seeding** (the order-0 `bw13` blocks may be segment seeds /
the markers may carry initial state), or a history-continuity rule across markers
that codec-3 doesn't need. Compare a single nsmp3 order-2 block decode against a
sine order-2 block step by step; and read how `DecodeStroke` handles state at the
position-based (loop/segment) checkpoints for codec 4.

## Encoder (`NW1::CEncode`) — algorithm recovered

Recovered from `EncodeStroke` (`0x1002db3f8`/`0x1002db528`),
`EncodeStrokePhase0/1/2` (`0x1002dbc38`/`…be7c`/`…c654`). Three phases:

- **Phase 0** — compute the stroke's region boundaries (start, second-start, loop
  begin, end) in interleaved-sample units; the `channels × 5` constant matches the
  decoder's loop handling. These boundaries become the **segment markers**.
- **Phase 1** — split the stroke into blocks at those boundaries; per block, a
  `CChunk` tries the predictor orders and picks order + bit width. Iterates with
  reduced target bit depth if a block overflows (`CHistory::Expand` retry loop in
  the `EncodeStroke` overload).
- **Phase 2** — write the bitstream: for each block `CBlockHdr::Write` (the
  inverse of `CBlockHdr::Read`) + `WriteChunk` (residuals); then **one explicit
  stop block** `CBlockHdr(linearMode=true, flag2=false, bitWidth=1, order=0,
  sampleCnt=loopPoint)` — matching `IsStop`. `CBlockHdr` carries **two flag bits**
  (linearMode + a second) alongside bw/order/sc; the codec-4 markers are
  zero-sample blocks emitted here carrying those flags at segment boundaries
  (no-ops for audio, metadata for loop points).

**OpenNord's encoder** (`src/lib/ns4/nsmp-encode.ts`) is a *correct, simple*
inverse of `decodeStroke` — fixed-size blocks, per-block order selection
minimizing residual width, MSB-first signed packing, stop block. It is **not** a
byte-for-byte clone of Phase 1's optimal loop-point splitting; that (and the
CNSP/NSMP container writer) is future work. Round-trips exactly
(`decodeStroke(encodeStroke(pcm)) === pcm`) on synthetic + real decoded audio.

## Verdict — GO, and DECODE PROVEN on real `.nsmp3` data

The full decode path is recovered and elegantly simple (fixed-predictor LPC,
8 integer predictor sets, MSB-first signed residuals). **Decode is reproducible
in TypeScript** with no proprietary tables to embed. Remaining for Task 7:
implement `decodeStroke`, locate the first block via the stroke-header offset in
a real file, and confirm fidelity on the `Strings.nsmp3`↔`.nsmp4` matched pair
(target: normalized-RMS delta within the codecs' lossy tolerance). The encoder
(`NW1::CEncode::EncodeStrokePhase0/1/2`) is symmetric and looks reproducible too
— basis for the future downward-transcoder spec.
