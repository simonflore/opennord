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

### Generation ↔ codec numbering (mind the numbers)

**Naming validated against Nord — web + binary (2026-06-30).** `TargetCodec`
follows Nord's own product numbers (2/3/4). Confirmed straight from the NSE binary
(`nse/nse-arm64`):

- ✅ **`NW1::PeekFormat` (`@1002d81a4`) reads BOTH legacy versions** — it compares
  the version against `#0x8` and `#0xb` (= 8 and 11) and `csel`s each to a distinct
  `Zevs::NordSmp::EFormat`. So v8 (codec 1) and v11 (codec 2) are *both* valid
  `.nsmp` read formats — directly confirming our codec map. (NSMP path compares
  `#0x1e`/`#0x28` → 3/4.)
- ✅ **Nord's internal format table literally numbers them v2/v3/v4.** Debug strings
  at `0x9164a0`: `"… v2 A (nsmp)"`, `"… v2 B (nsmp)"`, `"v3 A (nsmp3)"`,
  `"v3 B (nsmp3)"`, `"v4 (nsmp4)"`. So `.nsmp` = "v2", `.nsmp3` = "v3", `.nsmp4` =
  "v4" — `TargetCodec=2/3/4` is Nord's own scheme.
- ✅ **The "A/B" axis is the NSMP *revision*** — a per-format sub-version the editor
  exposes as a "Revision" spin control (XRC `ID_SPINCTRL_NSMP_REVISION`, tooltip
  "Set Current Revision for NSMP"; code `m_revision`,
  `SCommonAttributes::SetRevision`, `CEncodeName::NSMP_GetRevision`,
  `CTabInstrument::OnProjectRevisionChanged`). So the table is (format × revision):
  `.nsmp`/v2 and `.nsmp3`/v3 each have **two** revisions (A,B); `.nsmp4`/v4 has one.
  For v2/`.nsmp` the two revisions line up with the two NWS versions `PeekFormat`
  reads — **revision A = v8 (codec 1), revision B = v11 (codec 2)** (consistent,
  not byte-proven). This is *not* a keyboard-model axis (not Stage 2 vs Stage 2 EX),
  though newer revisions likely exist *because* newer boards needed them.
- ✅ **The two `.nsmp` (v2) table entries are prefixed `"NOT DONE -"`; the v3/v4
  entries are not.** Read with the standing RE note that *"the current editor
  cannot write OG at all,"* this indicates **this NSE build does not generate
  `.nsmp` output at all** — only `.nsmp3`/`.nsmp4`. (Interpretation of a debug
  string; the table→export-function link couldn't be pinned by static disasm.)
- ✅ **Both revisions now in the corpus.** Revision A = **`NWS` v8 / CBIN ver 8**
  (Sample Library 1.x). Revision B = **`NWS` v11 / CBIN ver 200** (Sample Library
  **2.0** — the `… 2.0.nsmp` files). *(Earlier note said v11 was unobserved; that was
  before the Library-2.0 fixtures arrived — corrected 2026-06-30.)*

| Nord name | Container | CBIN ver (0x14) | `NWS` body ver (0x1c) | `PeekFormat` codec | `readNsmp().codec` | `TargetCodec` |
|---|---|---|---|---|---|---|
| NSMP 2 rev A (Lib 1.x) | `.nsmp` (`NWS`) | 8 | 8 | **1** | 0 † | 2 |
| NSMP 2 rev B (Lib 2.0) | `.nsmp` (`NWS`) | **200** | **11** | **2** | **2** | 2 |
| NSMP 3 | `.nsmp3` (`NSMP`) | 300 | — | 3 | 3 | 3 |
| NSMP 4 | `.nsmp4` (`NSMP`) | 400 | — | 4 | 4 | 4 |

† rev A: `floor(8/100)=0` so `readNsmp().codec` is 0 (the `legacy` flag is the real
signal). rev B: `floor(200/100)=2`, which happens to equal the true codec. `PeekFormat`
keys off the **`NWS` body version** (8/11) at 0x1c; our `identifyNsmp` keys off the
**CBIN version** (8/200) at 0x14 — both land on the right codec.

**What we read for rev B (v11 / Library 2.0)** — measured on 5 fixtures
(`12 String Guitar`, `ARP Quadra Str`, `Cathedral Organ 3`, `BassGit`, `Vibes`):
- ✅ **Audio decodes** — all strokes → bounded, plausible PCM (same NW1 block codec;
  the stream-scanner finds the start past rev-B's `0x3c` header offset).
- ✅ **Name + category read** — rev B adds a 111-byte `hdr` (with name) and a `cat`
  section. *(Correction: "`.nsmp` has no embedded name" is true only for rev A/v8;
  rev B carries names — matching Nord's ".nsmp2 introduced categories".)*
#### CBIN format-type envelope variants + `map` version table (2026-06-30)

The CBIN **format-type byte (0x04)** sets the envelope length, *independent* of the
container kind: **format 1** carries a CRC-32 block → body root at **0x2c**; **format
0** has none → body root at **0x18**. So a `.nsmp3` exists as both format-1
(`NSMP`@0x2c) and **format-0 (`NSMP`@0x18**, some Library-3.0 exports). `nsmpLayout`
now detects `NSMP` at either offset (it previously only knew 0x2c, so format-0
`.nsmp3` decoded to **zero strokes** — fixed). The `map` zone-record layout varies by
**`map` section version**, not just codec:

| `map` ver | used by | record | gid @ | keyHigh @ | reader |
|---|---|---|---|---|---|
| 9 | `.nsmp` v8 (rev A) | 12 B | +0 | u32 @+4 | `parseLegacyZoneRecords` |
| 10 | `.nsmp` v11 (rev B / Lib 2.0) | 15 B | +0 | +7 | `parseCodec2ZoneRecords` |
| 12 | `.nsmp3` format-0 (Lib 3.0) | 11 B | +4 | +8 | `parseCodec3V12ZoneRecords` |
| 13/14 | `.nsmp3` format-1 | 16 B | u32 @+8 | +1 | `readZoneRecord` (ZONE_LAYOUT) |
| 21 | `.nsmp4` | 16 B | u32 @+8 | +1 | `parseCodec4ZoneRecords` |

v10/v12 are the "stroke-reference" family (`parseStrokeRefZoneRecords`): the record
names a stroke by global id + a split point; `keyLow` tiles top-down and `rootKey`
comes from the `stk` header. All validated against their corpora (gids match strokes,
zones tile, roots musical).

**Codec-4 (v21) zone-table robustness (2026-06-30).** The v21 zone table sits after a
**variable-size** `SampleUnison`/random-stroke header and a **variable trailer** —
their lengths track that config (the unison/random settings), *not* the instrument
type; 32 B / 26 B headers and 6 B / 2 B trailers are both observed (Cathedral Organ is
just where it first showed up). Per-note rows aren't always unity either.
`parseCodec4ZoneRecords` now (a) accepts any small trailer on the fixed-offset path and
validates the first record, and (b) falls back to a maximal valid-record run keyed by
the **stroke global-id set** with `keyLow ≤ 127` (that key check rejects an
off-by-6-bytes phantom run that otherwise produced 30 garbage zones). Cathedral Organ
previously returned **0 zones**; now 30. Records keep their *explicit* `keyLow`/velocity
(ZONE_LAYOUT_C4) — they needn't tile like v10/v12.

- ✅ **Zones read** (RE'd 2026-06-30, `parseCodec2ZoneRecords`). rev B's `map` is
  **version 10** — a 15-byte record table (`globalID@0`, `0x10@1`, detune s24`@4`,
  `keyHigh@7`, `0x0001@8`); `keyLow` tiles top-down (next zone's `keyHigh+1`, bottom
  → 0); `rootKey` from the `stk` header via global id. Validated on all 5 fixtures:
  global ids match real strokes, zones tile the keyboard with no gaps/overlaps, roots
  are musical (`nsmp-codec2.test.ts`). *Known minor limitation:* each file has one
  unmapped spare stroke (likely a velocity/round-robin alternate) — coverage is still
  complete; per-zone velocity layers aren't modeled yet.

- **`TargetCodec` uses Nord's product numbers (2/3/4)** — `2` = "NSMP 2" (`.nsmp`),
  matching both the editor's strings and the user-facing menu.
- **We now WRITE the v11 / codec-2 (Library 2.0) variant of `.nsmp` by default**
  (`writeCodec2Nsmp`, 2026-06-30) — it preserves the sample **name** and **zone map**
  that the older v8 (rev A) drops. Requires updated (Library-2.0-capable) firmware,
  which we assume. The v8 writer (`writeOgNsmp`) is retained but no longer the default.
  See "Writing codec 2" below.

### Do we need to support the A/B revision? — NO (decision 2026-06-30)

Researched against Nord's own Sound Manager changelog
([NSM update history](https://www.nordkeyboards.com/update-history/nord-sound-manager-update-history/)).
The revision (A/B = v8/v11) is a format sub-version that tracked **keyboard OS**
capability ("OS 2.02 introduced nsmp2 / Sample Library compatibility"). Two axes,
only one matters to us:

- **Revision — READING: both supported.** rev A (v8) and rev B (v11 / Library 2.0)
  both read fully — audio + zones, plus name for rev B (the v10 `map` was RE'd,
  `parseCodec2ZoneRecords`). The shared `Ymer::NW1` codec `PeekFormat`-reads both.
- **Revision — WRITING: v11 is now the default** (was v8). Decision updated
  2026-06-30: write the newer rev-B variant so down-converts keep the name + zone
  map; the firmware-compat cost is accepted (assume updated keyboards). v8 narrows
  to nothing v11 loses *except* old-firmware reach, which we've ruled out of scope.
- **Generation (2/3/4): does NOT auto-resolve** (a Stage 2 can't read `.nsmp3`) —
  already handled by `convertNsmp`, mirroring NSM's "on-the-fly `.nsmp`→`.nsmp3`
  conversion" (v7.22).
- **The only thing worth building (later):** generation-gating at *transfer* time —
  NSM "checks prior to download whether the OS supports the files" (v6.80). When we
  add device sample transfer-back, detect the target board's generation and
  convert/warn. That's a transfer-layer feature, not a codec/revision one.
- **`readNsmp().codec` = `floor(versionRaw/100)`** → correct for 3/4 but **0 for
  both legacy versions** (v8 *and* v11). The real signal for `.nsmp` is the
  `legacy` flag; `codec` is left as the extension digit (it feeds `.nsmp${codec}`,
  which must stay `.nsmp` for legacy — never `.nsmp0`/`.nsmp1`).
- **v11 / codec 2 is UNREAD.** No `NWS` v11 file has ever been observed, so the
  codec-2 stroke framing (`GetStrokeBinOffset = 0x3c`, vs codec-1's `0x60`) is
  untested. `readNsmp` emits an "unverified generation" warning for any legacy
  `versionRaw !== 8` so such a file isn't silently decoded with the v8 layout.

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

Reverse-engineered against the decompiled **`NW1::CSectionMap::Read`**
(`@1002ed4e4`, the one shared codec-3/4 read path) and cross-validated
byte-for-byte against `.nsmpproj` ground truth (`m_rootKey`/`m_topNote`/
`m_btmNote`/`m_globalID`) + real-file dumps (`Strings.nsmp3` 8 zones, `Other.nsmp4`
4 zones). Implemented in `readNsmpZones` / `parseCodec4ZoneRecords`.

The `map` payload reads (per `CSectionMap::Read`):
`[global level/detune][128 × per-note level/detune][pre-record block][zone count][N × 16B records][pad]`.

- **global** = `u24 level` (→ `DSP2Level`, dB) + `s24 detune` (→ `DSP2Detune`, cents).
- **per-note** (128 rows): each = `u24 level`(→`DSP2Level`) + `s24 detune`(→`DSP2Detune`).
  **Codec 4 adds 4 trailing bytes per note** (10-byte rows) — read into four
  *distinct* per-note arrays (`@+0x610/+0x614/+0xa10/+0xa14`), **not** a "note
  tag" (they merely read `n,n,n,n` in the all-default corpus). Codec 3 = 6-byte rows.
- **pre-record block:** codec 3 = nothing; **codec 4 = a ~32-byte `SampleUnison` +
  random-stroke block** (`SetSampleUnison*` mode/detune-spreads/pan/voice-counts/
  gains, `SetRandomStrokeMode`, `SetBlockRandomSustPed`) ending in the zone count.
- **zone count** = 1 byte, immediately before the records (codec 3 reads it right
  after the per-note block; codec 4's count is the last byte of the unison block).

Each zone is a **16-byte single-stroke record, root-aligned and identical for
codec 3 & 4** (earlier notes claimed the two were "framed one byte apart" — that
was the codec-3 reader being **off by one**, mis-skipping the count byte so it read
the count/neighbour `velMax` as a phantom `velTop`):

| off | field | meaning |
|---|---|---|
| +0  | `rootKey` | key the sample is pitched for (`SZoneParams` ctor) |
| +1  | `keyHigh` | **split point** — zone's top key (`NoteExtend_Hi`) |
| +2  | `keyLow`  | zone's bottom key (`NoteExtend_Lo`) |
| +3  | `zoneMode` | per-zone playback mode (`SetZoneMode`) |
| +4  | `zonePlayback` | `SetZonePlayback` (mapVer ≥ 0xd) |
| +5  | `zoneIsOneShot` | `SetZoneIsOneShot` (mapVer ≥ 0xe) |
| +6  | `u16 strokeCount` | = 1 (multi-stroke zones unmodeled) |
| +8  | `u32 globalID` | stroke this zone plays — matches **`stk` header +3** |
| +12 | `u16 strength` | `SetStrength` = 1 in all known content |
| +14 | `velMin` | bottom velocity of the layer (`SetVelocityMin`, mapVer ≥ 0xe) |
| +15 | `velMax` | top velocity of the layer (`SetVelocityMax`) |

Zones reference strokes by **`globalID`, not position**. The codec-4 records sit
at `6 + 128*10 + 32`; the reader self-checks `recStart + count*16 + 6 == mapEnd`.
Codec-3 records sit at `6 + 128*6 + 1` (after the count byte), with a 1-byte pad
trailing. **OG/legacy** uses a different 12-byte record (`parseLegacyZoneRecords`).
The **writer** (`nsmp-write.ts`) emits this exact record (one `zoneEntry`, root-
aligned) for both generations, with the codec-3 count byte + pad.

Editing patches these fields (`rootKey`/`keyHigh`/`keyLow`/`velMin`/`velMax`) back
**in place** (`patchEditedNsmp`) and re-checksums — audio and every byte we don't
model are preserved exactly.

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

## OG `.nsmp` (codec 1, `NWS` v8) — stroke-header RE (for downconversion, issue #17)

Goal: write a Stage-2-loadable OG `.nsmp`. The envelope, section framing, and
`map` zone table are fully known (above); the open piece was the **`stk` stroke
header**. RE'd from the editor binary's `CSectionStroke::Read` (`@1002f97f4`) and
`::Write` (`@1002f809c`), cross-validated by differential analysis of **17 real
strokes** (`BrassAlesis 2.nsmp` ×8 + `TAKE ON ME.nsmp` ×9).

**Codec number.** `NW1::PeekFormat` (`@1002d81a4`) maps the container to a codec
int: `NSMP` v30→**3**, v40→**4**; `NWS` v8→**1**, v11→**2**. So the original
`.nsmp` (Stage 2 era) is **codec 1** — the oldest `CSectionStroke` path (extra
trailing fields; `GetStrokeBinOffset` = `0x60`).

**Header shape.** `[fixed fields][trailing zero-pad to alignment][block stream]`.
The variable header length we measured (252/228/411 B) is purely the trailing
`iVar21 * channels` zero-pad that aligns the block-stream start (the `for` loop at
the end of `::Write`); our decoder already finds the stream by scanning, so the
pad is cosmetic for *reading* but must be reproduced for hardware.

**Fixed-field layout** (byte offsets from the `stk` payload start; codec-1 path of
`::Write`), verified across all 17 strokes:

| Off | Sz | Field | Notes / evidence |
|---|---|---|---|
| 0x00 | u32 BE | **globalID** | matches `map` zone `globalID` + decoder's `stk+3`. e.g. 37,36,…30 |
| 0x04 | u8 | 0 | always 0 |
| 0x05 | u8 | key/tune byte | per-stroke, decreasing (79,72,67,…); semantics **TBD** (root/topkey-ish) |
| 0x06 | u16 BE | `0x88ba` | **constant** across both files — pitch/rate base (`exp2(cents/1200)·base`, cents=0) |
| 0x08 | u8 | **channelCount** | `0x02` in every real (all-stereo) stroke; same +0x08 position the codec-3/4 decoder reads as the channel count (`GetChannelCnt`). The OG writer now emits the actual count (1 = mono, 2 = stereo) so a converted **mono** sample round-trips as mono — earlier it hardcoded `0x02`, decoding mono → stereo. |
| 0x09 | u24 BE | **normGain** | `local_74·Level2DSP(level)` >> (39/31/23); varies per stroke |
| 0x0c | u8 | `0x0a`/`0x0b` | `kPlayerBits + dspNorm − (…)`; ~constant (0x0a, occ. 0x0b) |
| 0x0d | u24 BE | **peak** | `abs(SSmpAttributes[0x10])` — the stroke's 14-bit peak (norm input) |
| 0x10 | u8×2 | 0 0 | |
| 0x12 | u32 BE | **region U1** = base+start | absolute (cumulative across strokes) |
| 0x16 | u24 BE | decay | `0x800000`→`80 00 00` = no decay/one-shot |
| 0x19 | u8×2 | 0 0 | |
| 0x1b | u32 BE | **region U2** = base+loopIn | |
| 0x1f | — | `80 00 00 00 00` | marker |
| 0x24 | u32 BE | **region U3** = base+loopOut | |
| 0x28 | u24 BE | decay | `80 00 00` |
| 0x2b | u8×2 | 0 0 | |
| 0x2d | u32 BE | **region U4** = base+end | `U3==U4` ⇔ one-shot (no loop tail) — seen on TAKE-ON-ME stk1/2/3/8 |
| 0x31 | u8×2 | 0 0 | |
| 0x33 | u8×36 | 0 | codec-1 `12×(u24 0)` block |
| … | | keyHigh `<kh> 00 01`, then pad | `kh` = zone split (103,75,… / 108,90,…) sits just before the pad |

The four **region pointers** are `base + SSmpAttributes[0..3]`, where `base =
(streamBytePos + 0x60)/channels` rounded up to a `kNomTgt` alignment, and
`[0..3]` = (start, loop-in, loop-out, end) in per-channel samples. They are
**cumulative** (each stroke's base advances by the prior strokes), which is why
U1 grows monotonically across the section.

**Still open before a byte-exact writer** (both bounded, RE targets named):
1. **Region-pointer derivation for arbitrary input** — port `EncodeStrokePhase0`
   (`@1002dbc38`): how (start, loop-in, loop-out, end) are chosen for a one-shot
   (no source loop) vs a looped sample, and the exact `kNomTgt` alignment for
   `base`. For a one-shot downconvert this is likely `[0,0,len,len]`; needs
   confirmation against a Phase0 trace.
2. **normGain / peak / 0x0c bytes** — port `GetNormFactors` (`@1002f7fc8`) +
   `GetDSPNormalize`/`Level2DSP`/`Get0dB` so 0x09/0x0c/0x0d reproduce. Or write
   the no-normalize config (`SAuxStrokeInfo::s_isGlobalNormalize = 0` ⇒ unity).

**Validation bar:** reproduce all 17 real headers byte-for-byte from decoded
params before shipping `convertNsmp(x, 2)`. Until then, OG output stays behind a
"not hardware-validated" warning (same posture as the codec 3/4 writer).

### Region pointers — domain is internal, not decoded-PCM (RE update)

`EncodeStrokePhase0` (`@1002dbc38`) builds the four region values from the source
`CSmpStream`'s `GetSecondStart`/`GetLoopBegin`/`GetEnd`/`GetChannelCnt`, with a
`channels×5` guard between regions and a `kNomTgt`-derived alignment (the
`uVar2`/`iVar21` rounding). `param_1[0x14]==0` (no loop) sets loop-out = end, so
`U3==U4` — confirmed on every one-shot stroke (TAKE-ON-ME stk1/2/3/8).

**Ruled out by measurement (17 strokes), do not retry:**
- `base = (sectionByte + 0x60)/channels`: `U1 − base` is large-negative and grows
  per stroke — wrong.
- `U4 − U1 == decoded sample length`: false. BrassAlesis stk0 `U4−U1=174483`
  vs `samp=169604`; TAKE-ON-ME stk0 `U4−U1=117651` vs `samp=165030`, and its
  end-pointer `U4=118110 < samp` — i.e. the pointers count a **different, internal
  sample unit** than our block-stream decode (codec decimation / `kNomTgt`
  domain), so they can't be derived from our PCM length alone.

**Conclusion:** byte-exact OG region pointers need a faithful port of
`EncodeStroke`→`Phase0` plus the `CSmpStream` position/loop model (and the
`CHistory[0x5c..0x68]`→`SSmpAttributes[0..3]`→`Write U1..U4` plumbing), operating
in the encoder's internal sample domain. That is a real multi-function port, not
a one-liner — scoped as the remaining work for `convertNsmp(x, 2)`.

**Fastest validation path (uses the user's Stage 2):** rebuild an OG file from a
*single real stroke* — re-encode its own decoded PCM and reuse the original `stk`
header verbatim (same audio ⇒ same length ⇒ same regions). If that loads on a
Stage 2, it proves the envelope + `map` + section assembly, isolating the only
open problem to region-recompute-for-new-length. Then calibrate the region/align
constants against hardware (2–3 iterations) rather than a blind port.

## Loop / sustain playback model — VERIFIED (NSE binary, 2026-06-28)

How a held key sustains. Reverse-engineered from the decompiled NSE
(`nse_decomp/` + `nse/nse-arm64`), cross-checked against `.nsmpproj` editor
ground truth and a corpus survey (TBM, VLV).

- **Loop-on/off flag = `loop-out ≠ end` (U3 ≠ U4).** This is the encoder's own
  one-shot/loop decision, not a guess: `NW1::CSectionStroke::Read` sets the
  `SStrokeAttributes+0x14` bool as `(wordA != wordB)` of two header position
  words, and `EncodeStrokePhase0` (`if attr[0x14]==0`) *forces* loop-out = end on
  one-shots. Validated on **OG** (TAKE ON ME = 4/9 looped, the known pattern) and
  **codec-4** (VLV Strings + Mellotron = all one-shot, `U3==U4` everywhere). The
  editor's *capital* `LoopEnabled` proj field is loop-tool UI state and does **not**
  equal the exported loop — trust the file's `U3≠U4`, not the proj's `LoopEnabled`.
  Corpus reality: most sustained instruments **do** loop (flute/DX7/pad/motif =
  100% looped); one-shots are the minority.
- **Sustain algorithm = hard-jump modulo loop**
  `pos = loopBegin + ((pos − loopBegin) mod loopLength)`
  (`NAudio::CAStroke::GetModuloPos`/`RenderLoopRange`), with an optional
  **exponential loop-decay** gain `pow(decayBase, samplesPastLoopBegin)`
  (`RenderLoop`/`GetLoopDecay`). No detune/pitch ramp in the read path.
- **Crossfade is hardware-DSP-only.** The NSE desktop *preview* hard-jumps the
  loop (audible click); the `loopXFade*` params exist in the model but are applied
  only on the instrument's DSP, not in the preview. Our Web-Audio sampler
  approximates the DSP by baking an **equal-power crossfade** into the loop seam
  (`sampleEngine.ts` `crossfadeLoop`/`loopXfadeLen`) so a sustained note doesn't
  click — closer to hardware than the editor's own preview.
- Field map (codec / playback structs), cited: `SSmpAttributes` = level@0,
  chan@4, bitdepth@8, secondStart@0xc, **loopBegin@0x10**, **end/length@0x14**
  (all ×channelCnt); playback `CAStroke` cache = begin@0xa0, end@0xa4,
  **loopBegin@0xac**, **loopLength@0xb0**, loopEnable byte@0xc1, decayEnable@0xc2,
  decayBase(double)@0xc8.

### DECISIVE BLOCKER — byte-exact OG header needs a byte-exact *encoder*

Ground-truth proof (editor-made `.nsmp4` + `.nsmpproj`, all single one-shot
strokes, **identical** proj loop/length: `end=24000, secondStart=3000,
loopEnabled=0`):

| file | region end pointer | block-stream bytes |
|---|---|---|
| `sine_24`    | **4544** | ~16484 |
| `ramp_24`    | **3808** | ~13604 |
| `impulse_24` | **2816** |  ~9640 |

Same length, same loop config → **different** region pointers. The only variable
is the audio content. Therefore the region pointers index the editor's
**content-adaptive compressed block layout** (`EncodeStrokePhase1` picks block
boundaries at loop points / by content), *not* the sample length or proj loop
points — and they're not a clean function of compressed byte size either
(bytes/unit ≈ 3.63 / 3.57 / 3.42, non-constant).

**Consequence:** reproducing an OG `stk` header byte-for-byte requires producing
the **same compressed stream the editor produces**, i.e. cloning `NW1::CEncode`
Phase0/1/2 (the optimal loop-point block splitter) bit-for-bit. OpenNord's
encoder (`nsmp-encode.ts`) is deliberately a *simple* fixed-block encoder, so its
stream — and thus the region pointers computed over it — will differ from the
editor's. A keyboard validates these pointers against the actual stream, so an
"approximately right" header is not safe.

**Verdict for #17:** OG *write* is gated on either (a) a full bit-exact port of
`NW1::CEncode` Phase0/1/2 (large; and still unverifiable here without a Stage 2),
or (b) a Stage 2 to calibrate/validate approximate output against. With neither
available, OG downconversion stays **documented but unbuilt**. The OG *read* path
(decode + zones) already works and is unaffected. Everything needed to resume is
captured above (field map, Phase0 semantics, ruled-out hypotheses, RE addresses).

### OG write IS reachable offline — encoder-port roadmap (correction)

Earlier "decisive blocker" was too pessimistic about *validation*: we don't need a
Stage 2 to validate the **port**. If a bit-exact port of the editor's encoder
reproduces the ground-truth `.nsmp4` files (`sine/ramp/impulse_24`) **byte-for-byte**
from their decoded PCM, the OG (codec-1) writer built on that same encoder is correct
**by construction** — the exact bytes the editor would emit. Validation = re-encode a
decoded ground-truth stream and `cmp` against the original. No hardware needed.

The editor's encoder (`NW1::CEncode`) is **fully present in the binary** and now
decompiled. Pipeline (from `EncodeStroke`@`1002db528` driver):
`Phase0` (regions) → loop[`Phase1` split+select → `CHistory::Expand` overflow check →
reduce target bit-depth & retry, else `Phase2` write] . `Phase1` uses **fixed-size
blocks** (size = `SMetric[8] × channels`) with **breaks at the 4 region boundaries**;
`CChunk` picks order+bitwidth per block; the region pointers are byte positions over
the *resulting* stream (which is why content changes them — `sine≠ramp≠impulse`).

**Functions to port (addresses, x86_64 `nse/Nord Sample Editor`):**
- `CChunk::CChunk` `@1002ddd3c` — per-block order/bitwidth selection (the core)
- `CHistory::Expand` `@1002dc574`, `ExpandOne` `@1002dd608`, `AnalyzeSegment` `@1002dd0fc`, `PushBlock` `@1002dc9b0`
- Phase2 writers: `WriteHdr` `@1002dcbcc`, `WriteChunk` `@1002dcc60`, `WriteStopHdr` `@1002dceb8`, `CBlockHdr::Write` `@1002d8de0` ✓have
- Norm DSP: `Level2DSP` `@1002de888`, `DSP2Level` `@1002de8b8`, `Get0dB` `@1002de77c`, `Decay2DSP` `@1002de790`, `GetDSPNormalize` `@1002de8e4`
- `SMetric::SMetric`/`Validate` `@1002d7ee8`/`@1002d7f18` — the kNomTgt/kMaxTgt/block-size **constants**
- `CScopedSectionWriter` `@1002e9514`, `CEncode::EncodeBegin` `@1002daff4` (global peak/normalize), `GetGlobalPeak14` `@1002daf70`, `CreateIntermediate` `@1002dadf0`
- Have already: `Phase0/1/2`, `CSectionStroke::Read/Write`, `CBlockHdr::Read/Write`.

**Build order:** SMetric constants → DSP helpers → `CChunk` (validate per-block vs a
real block) → `Phase1`/`Expand` (validate block boundaries) → `Phase2` (validate
stream bytes) → header `Write` (validate region pointers) → container → reproduce
`sine/ramp/impulse_24.nsmp4` byte-exact → switch codec to 1 for OG. Then ship
`convertNsmp(x, 2)` feeding decoded source PCM through the validated encoder.

### Decompile tooling note (resume cleanly)

The editor binary `nse/Nord Sample Editor` is **universal (x86_64 + arm64)**. A fresh
Ghidra import picks the **x86_64** slice and **mis-aligns the codec functions** (they're
only reached via indirect/virtual calls, so auto-analysis decodes them with wrong
instruction boundaries → decompiles full of `unaff_RBP`/`wxMenu…` garbage). The
original clean 142-function set predates this and came from a better-analysed project.

**Reliable path:** use the **arm64 slice** — `otool -tV "nse/Nord Sample Editor"`
disassembles cleanly at the exact symbol addresses (e.g. `0x1002ddd3c` → a real
`stp x26,x25,[sp,#-0x50]!` prologue), and the thin `nse/nse-arm64` shares the **same
addresses**. Re-decompile by importing `nse-arm64` into Ghidra (it auto-selects AArch64
and analyses cleanly) and running `opennord-re/DumpAddr.java` with the address list from
the roadmap above. (A run is queued to `nse_decomp/arm64/`.)

### Encoder algorithm — RECOVERED (clean arm64 decompiles)

Decompiled clean from the **arm64 slice** (`nse_decomp/arm64/`). The encoder is now
fully specified for a TS port. Build order + spec:

**DSP helpers** (exact):
- `Level2DSP(dB)` = `round(10^(dB/20) · 2^20)`  (2^20 = 1048576)
- `DSP2Level(x)`  = `20 · log10(x · 2^-20)`
- `Get0dB(bits)`  = `2^(bits-1)`
- `GetDSPNormalize(x) -> {mant, exp}`: frexp-style — scale `x` into `[0.5,1)`,
  `mant = trunc(scaled · 2^23)`, `exp` = the power-of-2 shift (±).
- `Decay2DSP(d, rate)` = `d>0 ? -round(0.99^(1/(d·rate)) · 2^23) : -2^23`.
- Bit-depth constants (`SMetric` statics): `kNomTgt=14, kMaxTgt=16, kMaxSrc=24,
  kPlayer=24, kMinTgt=?` (read from `SMetric` globals when porting).

**`CChunk` — per-block order + bit-width selection** (`CChunk::CChunk`):
- Inputs: interleaved `samples[cnt]`, `channels`, and a persistent per-(channel,order)
  history `hist` (carries across blocks).
- Computes **5 residual rows = successive differences order 0..4** (order-N = N-th
  finite difference = the order-N binomial predictor we already decode with).
  Per channel: `r0=s`, `r1=s-hist0`, `r2=r1-hist1`, … updating `hist` each sample.
- For each order, track the **max signed bit-width** over the block, where a value's
  signed width = `1 + ceil(log2)` (val 0→1, 1→2, 2..3→3, −4→3, …; matches our
  `signedBitWidth`).
- **Pick the order (0..4) with the smallest max-width; ties → lowest order.** Only
  orders 0–4 are considered (not 0–7) — important for byte-exact match.

**Phase1/2** (next to transcribe from `arm64/1002dbe7c`/`…dc654`, `WriteChunk`
`…dcc60`, `WriteHdr` `…dcbcc`, `WriteStopHdr` `…dceb8`): fixed-size blocks
(`SMetric[8]·channels`) with breaks at the 4 region boundaries; per block run
`CChunk`, `CHistory::Expand` (overflow retry → drop target bit depth), then write
`CBlockHdr` (layout per `CBlockHdr::Write`) + residuals via `WriteChunk`.

**Validation:** decode a ground-truth `.nsmp4`, re-encode the integer PCM with this
port, `cmp` the block stream + header bytes. Start with `impulse_24.nsmp4` (fewest
blocks), then `ramp`, `sine`. Byte-exact ⇒ correct; then flip codec → 1 for OG.

### Encoder PORTED + VALIDATED byte-exact ✓ (`nw1-encode.ts`, 2026-06-19)

`src/lib/ns4/nw1-encode.ts` (`encodeStrokeNW1` / `planBlocks`) reproduces the
editor's codec-4 **block stream byte-for-byte** for all three ground-truth files
(`impulse/ramp/sine_24.nsmp4`) — see `nw1-encode.test.ts` (`firstDiff === -1`,
lengths equal). The port is `Phase1` segmentation → `CChunk` order/width →
`Phase2` writer, recovered from `nse_decomp/arm64/` (`1002dbe7c`/`…dc654`/`…ddd3c`
/`…dcc60`/`…d8de0`). Confirmed mechanics (do not re-derive):

- **No DSP / no normalization in the stream.** Residuals are raw integers; decoded
  peak == source amplitude exactly (sine peak 3000). `Level2DSP`/`GetDSPNormalize`
  etc. matter only for the **OG stroke-header** fields (normGain/peak), not the
  block codec.
- **`CChunk` selection:** successive differences orders **0–4** only, signed
  bit-width floored at **2** (the editor inits the width tracker to 2), min width,
  ties → lowest order. Per-channel history (ring of originals) carries across
  blocks. Matched GT selection on every block except the forced ones below.
- **Segmentation (`Phase1`):** the stroke splits into segments at the region
  boundaries (one-shot = 2 segments: `[0, secondStart)`, `[secondStart, end)`).
  Each segment opens with a **forced order-0, `linMode=1`** block of size
  `blockSize + (segLen mod blockSize)` (= `64 + rem`); the rest are fixed
  `blockSize`-sample (64 = `SMetric[8]·ch`, `SMetric[8]=32`) chunks.
- **Run merging:** consecutive non-forced full chunks merge into one block iff the
  chunk fits at the run's order within the run's bw **and** its own best width ≥
  the run's bw (`widthAtRunOrder ≤ run.bw ≤ chunkBestWidth`); otherwise flush and
  the chunk's own best `(order, width)` starts the next run. (This — not "identical
  `(order,bw)`" — is the exact `Phase1` rule; the looser-but-wrong version
  over-split `sine`.)
- **Block header word** (`CBlockHdr::Write`): `(linMode<<23) | ((bw-1)<<19) |
  (flag2<<18) | (order<<14) | sampleCnt`. `flag2` unused on the one-shot path.
- **Stop block:** `linMode=1, bw=1, order=0, sampleCnt = blockSize` (= 64), a
  single 4-byte header word, no payload.
- **Residual packing:** byte-identical to the decoder/`WriteChunk` — codec-4
  per-channel word-interleaving (proven independently: 0 byte mismatches across all
  317 GT data blocks when driven by GT boundaries).

The only value measured from (not derived for) the GT is `secondStart` in the
editor's **internal/resampled domain** = **4376** interleaved samples (seg0 =
88 + 67·64), identical across the three files (shared `.nsmpproj`). It is the one
resample-dependent scalar: the source is 24000 samp/ch @ 48 kHz but the stored
stream is 17628 samp/ch (a 1469/2000 resample done by the editor's
`CreateIntermediate` pipeline, which we do **not** port — we encode the already-
resampled PCM that `decodeStroke` returns). Everything else (splitting, merging,
selection, packing, headers) reproduces from first principles.

### OG (codec-1) write — header serializer + DSP PORTED ✓ (2026-06-19)

The block-stream encoder is codec-agnostic: `encodeStrokeNW1({ u24:true })` emits
the OG **sample-interleaved 24-bit** stream. Two more pieces are now ported and
tested:
- **`nw1-dsp.ts`** — `level2DSP`/`dsp2Level`/`get0dB`/`decay2DSP`/`getDSPNormalize`,
  verbatim from `nse_decomp/arm64/1002de{77c,790,888,8b8,8e4}.c`. Unit-tested
  (`nsmp-og.test.ts`).
- **`nsmp-og.ts`** — `writeOgStrokeHeader` / `parseOgStrokeHeader`: the fixed
  54-byte (`0x36`) codec-1 `stk` header (binOffset `0x60`), ported from
  `CSectionStroke::Write` (`@1002f809c`). **Validated byte-for-byte** by
  re-serializing all **17 real OG strokes** (`BrassAlesis 2.nsmp` ×8 +
  `TAKE ON ME.nsmp` ×9): `parse → write → cmp` is exact (`nsmp-og.test.ts`). The
  `00 4f 88 ba 02` shape, the `80 00 00` decay markers, the `80 …` region marker,
  and the `<keyHigh> 00 01` trailer all reproduce. Two decay fields (A@0x16,
  B@0x28) confirmed independent. Confirmed: codec-1 `GetStrokeBinOffset = 0x60`;
  pitch base @0x06 = `round(2^(cents/1200)·0x88ba)` (0x88ba at cents 0).

### The resampler is NOT needed for Nord→OG conversion ✓ (2026-06-19)

Decisive measurement: the editor's own conversions `BrassAlesis 2.nsmp` (OG) →
`.nsmp3` → `.nsmp4` decode to **byte-identical internal PCM** (0 mismatches across
2,756,452 samples; `decodeNsmp` comparison). So **converting between Nord
generations never resamples** — the decoded PCM *is* the shared internal domain.
Resampling happens only on **fresh-WAV import** (24000→17628 samp/ch), a separate
"create from audio" feature, not what #17 ("downconvert any Nord *sample*") needs.

So `convertNsmp(x, 2)` does NOT need the resample pipeline: decode `x` → internal
PCM + segment boundaries (recoverable from the source stream's `lin=1` blocks) +
zone map, then re-encode to OG. The region pointers come from the source's own
regions (internal domain), not from a fresh resample.

### OG stream encoder validated on REAL strokes ✓ (`nw1-encode-og.test.ts`)

`encodeStrokeNW1({ u24:true, blockPerCh: BLOCK_PER_CH_OG /*=24*/ })` with the
source stroke's recovered segments reproduces real OG block streams **byte-for-byte**
for 5 of 9 `TAKE ON ME.nsmp` strokes (stk1–4, 8), and **round-trips losslessly**
(`decode∘encode === pcm`) for every OG stroke tested. Confirmed: **OG block size is
`SMetric[8]=24`/ch (48 interleaved)** — codec-dependent (codec 3/4 use 32) — from
the `sc=48` chunks + `sc=48` stop block; segment openings are `48 + (segLen mod 48)`.

**Known limitation (old-editor Phase1):** the other strokes diverge only in
loop-heavy/decay regions, where the *current* binary's Phase1 merge rule (validated
100% on current codec-4 one-shots + the 5 OG strokes) says "merge" but these older
OG files keep blocks separate. Since the current editor **cannot write OG at all**,
every real OG file predates it and some used a slightly different Phase1 merge — so
byte-exact round-trip of *arbitrary old* OG files isn't guaranteed. The encoder
emits what the current algorithm would (correct by construction) and is always
lossless.

### `convertNsmp(x, 2)` SHIPPED (experimental) ✓ (2026-06-20)

`nsmp-og.ts` now assembles a complete OG `.nsmp` and `convertNsmp(x, 2)` downconverts
any Nord sample to it (the downconvert the official editor refuses):
- `assembleOgNsmp`: CBIN envelope (format 0, `0xff×8`@0x0c, version 8@0x14, body
  @0x18) + 9-byte sections (`NWS→hdr→map→stk×N→sty`, 3-byte tags) + a trailing
  **little-endian CRC-16/CCITT** (poly 0x1021, init 0xFFFF) over the whole file —
  the OG analogue of codec 3/4's envelope CRC-32 (verified on both real OG files).
  **Round-trips a real OG file byte-for-byte** (`nsmp-og.test.ts`).
- `writeOgMap` (legacy zone table), `writeOgStrokePayload` (54-byte header +
  `12×u24` zeros + 24-bit stream), `writeOgNsmp`.
- `decodeStroke` now returns `segments` (the `linMode` loop-point positions), so a
  converted file carries the source's loop/region block structure.

Validated (`nsmp-convert-og.test.ts`): `.nsmp4/.nsmp3/.nsmp` → OG is **lossless**
(audio identical) and structurally valid (parses, zones round-trip).

### Writing codec 2 / Library 2.0 (v11) — now the `.nsmp` default ✓ (2026-06-30)

`nsmp-codec2-write.ts` (`writeCodec2Nsmp`) writes the **newer** `.nsmp` variant, and
`convertNsmp(x, 2)` + `importWavToNsmp({codec:2})` now emit it instead of v8. Why:
v11 preserves the sample **name** + **zone map**; v8 (rev A) drops both. (User
directive: assume keyboards have updated, Library-2.0-capable firmware.)

Container (RE'd from the 5 Library-2.0 fixtures): CBIN envelope **version 200**,
format 0, `0xff×8`@0x0c; body sections (9-byte `[tag][ver u16][size u32]` framing)
**`NWS`(v11) → `hdr`(v9) → `cat`(v5) → `map`(v10) → `stk`(v9)×N → `sty`(v5)**; then the
same trailing **LE CRC-16/CCITT** as OG (`crc16Ccitt`, reproduced exactly). Reuses
`assembleOgNsmp(sections, 200)`.

- **`hdr`** = 12-byte constant prefix `00 00 db 00 01 54 00 00 00 01 00 00` + NUL-padded
  name (111 bytes total).
- **`map`** (v10) = `[6B global unity][128×6B per-note unity]` + the 15-byte zone
  records (`globalID@0, 0x10@1, detune@4, keyHigh@7, 0x0001@8`) — the inverse of
  `parseCodec2ZoneRecords`.
- **`stk`** = 60-byte (`0x3c` binOffset) header — same field layout as the OG/codec-1
  header (gid/key/pitch/ch/normGain/peak + region pointers U1–U4 with `0x80` markers)
  **minus** the v8 keyHigh trailer (keyHigh lives in the map) — then the 24-bit NW1
  stream (`encodeStrokeNW1({u24, blockPerCh: 24})`).

Validated (`nsmp-codec2-write.test.ts`): round-trips **name + zones + audio** through
`readNsmp`/`readNsmpZones`/`decodeNsmp`; `convertNsmp(x,2)` keeps the source name; and
re-encoding a real fixture's decoded audio is **lossless**.

⚠️ **Experimental / not hardware-validated** (same posture as the v8 writer): the
stroke-header region pointers + normalize gain and the `map` per-note block are
best-effort — no editor writes a *generated* file to byte-match against. Audio, name,
zones, container + CRC are exact. **Known limitation (shared with the v8 writer):** a
single stroke shorter than ~8000 samples isn't re-locatable by the reader's
stream-scanner, so very short samples don't round-trip; real multi-thousand-sample
strokes are unaffected.

### Full generation matrix exposed in the UI ✓ (2026-06-23)

`convertNsmp` already wrote all three generations (OG `2`, `.nsmp3` `3`, `.nsmp4`
`4`), but `SampleConvert` only offered `[3, 4]` — so `.nsmp3`/`.nsmp4` → original
`.nsmp` (the downconvert the official editor refuses) was unreachable from the
product. The component now lists **every** generation other than the source
(`GENERATIONS` table; OG mapped via `sourceGeneration`), so any sample converts to
any other generation in either direction. A synthetic **every-gen → every-gen**
matrix test (`nsmp-convert.test.ts`, no gitignored fixtures) guards it.

This surfaced + fixed a **mono→OG channel bug**: the OG stroke-header writer
hardcoded the `+0x08` channel byte to `0x02`, so a mono sample taken through an OG
conversion decoded back as stereo. The writer now emits the real channel count
(`writeOgStrokePayload` passes `z.channels.length`); stereo files stay
byte-identical (still `0x02`), mono now round-trips as mono.

**Experimental caveat (unchanged):** the stroke-header region pointers (U1–U4) and
normalize gain are best-effort — there is no editor-made Nord→OG ground truth to
byte-match against (the editor can't write OG), and the exact loop-pointer domain
needs the source header's loop model. Audio + container + CRC are exact; hardware
acceptance of a *generated* OG file is unverified (no Stage 2). Flagged in the
convert `warnings`.

### Corpus validation widened ✓ (2026-06-30, `nsmp-corpus.test.ts`)

Re-ran the read/encode path over the **full local OG corpus** (5 files — ABBA
Gimme Gimme Flute, DX7IIC Crystal BR, Stereophonic Motif, SynthPad2 CLv4, TAKE ON
ME) plus a 41-stroke codec-4 instrument (VibesNoVibrato Mellotron). Results,
locked into `nsmp-corpus.test.ts` (git-ignored corpus, `hasGt`-guarded):

- **OG `stk` header re-serialization: 75 / 75 strokes byte-exact** (`parse → write
  → cmp`) — up from the earlier 17-stroke / 2-file bar. The fixed 54-byte codec-1
  header writer reproduces every real OG stroke we have.
- **Lossless re-encode round-trip: 116 / 116 strokes** (`decode → encode → decode`
  identical) across all generations present — the encoder is an exact inverse of
  the decoder on real audio.
- **Decode: every `stk` lands bounded PCM** with the right channel count
  (mono DX7 vs stereo ABBA both correct).

This is the strongest hardware-free statement available; the only remaining OG
unknown is a real keyboard accepting a *generated* OG file (needs a Stage 2). The
codec-4 file also re-confirms the word-interleaved decode + lossless round-trip on
a fresh 41-stroke instrument. **Note:** OG files carry **no embedded sample name**
(the 18-byte `hdr` has no name field — confirmed: no ASCII name anywhere in the
file); the keyboard names them by slot/file, so `readNsmp().name` is `undefined`
for OG by design, not a decode miss.

## Resampler + WAV import — FAITHFUL (not byte-exact) ✓ (2026-06-20)

The editor resamples imported audio (e.g. 48000→35256 Hz, ratio 1469/2000) before
encoding, via `NAudio::CResampler::GetNextResampledBuffer` (@1000a5e84) /
`CVectorResample` (@10009b878) — a **float32 polyphase windowed-sinc**.

**Byte-exact is impractical, empirically:** extracted `gFIRCoeffs` (static
@1007e82e4, 15 taps × 512 phases, layout `g[tap*512+phase]`, unity-DC lowpass) and
implemented the conv — **impulse silence reproduces bit-for-bit (98.8%)**, proving
the algorithm + table correct, but transients differ. The editor accumulates in
float32 (arm64 likely fused `fmadd`) and its *encode* path uses a longer,
**runtime-generated** kernel (`s_newFir48`, `.bss` — not statically readable), so
its exact samples can't be reproduced. A faithful resample is correct (right
pitch/amplitude) but differs in phase/onset — fine: a phase shift is inaudible and
the keyboard cares about container/codec correctness, which we emit exactly. (An
earlier note claimed bit-exact was impossible *in JS* specifically — that was
wrong: float32, incl. FMA, is exactly emulatable via float64 + `Math.fround`. It's
just not worth it, and the editor's encode kernel isn't statically extractable.)

**Shipped:**
- `nw1-fir.generated.ts` — extracted `gFIRCoeffs` (base64 float32).
- `nw1-resample.ts` — `resampleNW1` / `resampleToRate` (faithful windowed-sinc).
  Validated: a 220 Hz sine keeps pitch + amplitude across 48k→35256 and 48k→96k
  (`nw1-resample.test.ts`).
- `wav.ts` `parseWav` — 8/16/24/32-bit int + float WAV → integer PCM.
- `importWavToNsmp(wav, {codec,rootKey,keyHigh,targetRate})` (`nsmp-convert.ts`) —
  parse → (optional) resample → encode any generation; round-trips
  (`nsmp-import.test.ts`).

⚠️ Import is EXPERIMENTAL: faithful-not-byte-exact resample, and the Nord's internal
storage-rate / pitch model isn't hardware-verified (35256 Hz observed for rootKey 57
only) — callers set `targetRate` explicitly. Byte-exact resampling would need the
runtime `s_newFir48` kernel (or a WASM core for exact float32/FMA); not worth it.

## Field-presence in `.nsmp` (discovery 2026-06-21)

The `.nsmpproj` (Nord Sample Editor project, plain ASCII at
`~/Documents/NordSampleEditor3Projects/*.nsmpproj`) is the full editor model.
OpenNord edits the `.nsmp` *binary*, so each richer editor field must be located
in the binary before it can be surfaced. `nsmp-coverage.ts`
(`nsmpClaimedRegions` / `nsmpGapRanges`) maps claimed vs unclaimed bytes; run on
the codec-4 corpus file (Mellotron) the only non-audio gaps are small header
regions — every large gap is a `stk` audio payload. **No large structured region
exists for per-zone EQ / imaging / fades / envelope**, so those appear to be
**editor-only** (not stored in the exported `.nsmp`) and are out of scope until
proven otherwise. All 5 local projects are at default — so the gain/detune/velocity
**scales could not be reversed from data**; they were closed instead from the
**NSE source** (`CSectionMap::Read` + the `DSP2*` converters), the same oracle that
cracked the codec. The "scale unknown" / "velocity unknown" rows below are now
**resolved** (2026-06-21).

| field group (`.nsmpproj`) | in `.nsmp`? | evidence |
|---|---|---|
| loop in/out (`m_loopStart`, …) | **present** | `stk` header pointers @0x12/0x1b/0x24/0x2d — decoded + writable |
| key range (`m_btmNote`/`m_topNote`) | **present** | 16B zone record +1/+2 — decoded + writable |
| global gain/detune (`map_info m_gain/m_detune`) | **present + scaled** | `map` first 6B; `DSP2Level`=`20·log10(raw/2²⁰)` dB, `DSP2Detune`=`round(raw·100/256)` cents (binary @1002de8b8/@1002de854) |
| per-note gain/detune (`note_info`) | **present + scaled** | 128-row block; same `DSP2Level`/`DSP2Detune` per row (codec-4 +4 extra bytes are 4 distinct arrays, not a tag) |
| velocity min/max (`map_stroke`) | **present** | zone record `velMin@+14` / `velMax@+15` (`SetVelocityMin`/`Max`, mapVer ≥ 0xe) — both codecs; decoded + writable |
| zone mode / playback / one-shot | **present** | zone record `@+3/+4/+5` (`SetZoneMode`/`SetZonePlayback`/`SetZoneIsOneShot`) — read |
| codec-4 SampleUnison block (mode, detune/pan spreads, voices, gains) | **decoded + surfaced (read-only)** | 31B `[mode u8][topKey u8][detuneMax u16][sameDetuneMin u16][panMax u8][detuneMax2 u16][panMax2 u8][detuneMax3 u16][panMax3 u8][numVoice1/2/3/Same u8×4][gainX3 1/2/3/Same u24×4 → DSP2Level][randomStrokeMode u8][blockRandomSustPed u8]` then the 1B zone count (`readSampleUnison`; `SetSampleUnison*`). Whole corpus is unison-**off** so detune/pan value scales aren't pinned; gains use the dB scale |
| per-zone EQ / imaging / fades / release / instrument envelope | **absent / editor-only?** | no structured non-audio gap large enough; likely baked/dropped on export |

Remaining: editing the SampleUnison block + per-note gain/detune is gated on a
non-default ground-truth patch (no corpus file exercises either); per-zone
EQ/imaging/fades/envelope still look editor-only. The codec-4 writer now emits a
**correct default** unison block (2 voices/tier, unity gains) — it previously
wrote an all-zero header (0 voices, −∞ dB gains).
