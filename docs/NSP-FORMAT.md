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

## Re-assessment with the full NW1 toolset (2026-06-30)

Revisited after completing the NW1 read+write port (decoder, `WriteChunk`,
`CBlockHdr`, codec-1/2/3/4 stroke headers, the v10/v12/v14 zone maps). Tested
against a **user-ish factory** Clavinet (`Clavinet D6 6.1.npno`, 5.9 MB, v610,
structure-only — gitignored). The codec was never the blocker; the container is.

**Librarian tier is fully recoverable — NEW.** The per-note key map (@`0xB7`, 128
bytes, `0xFF` = unused) decodes cleanly: the byte value **is the sample's root
note**, and consecutive notes sharing a value give that sample's key range. The
Clavinet maps **18 samples** over notes 0–109, tiling every ~5 semitones
(`root25:1-27, root30:28-32, … root107:102-109`). Plus name / version / variant
(`…D6#`). So we can surface a piano's **sample count + multisample key layout**
with zero audio — useful for the Pianos library/UI and as a base for future work.

**Audio is still gated — re-confirmed, now sharper.** With the complete NW1
detector (every width × byte order) the longest contiguous block run is **18**
(noise; a real stroke would be hundreds), and direct `decodeStroke` near the audio
body (mono/stereo × contiguous/word-interleaved × u32/u24) yields only
*physically impossible* false hits (e.g. 25 900 samples claimed from 188 bytes).
So strokes are **not** file-contiguous — reached only via the **CNSP stroke
directory** + chunk framing.

**Narrowed target for a future run:** the directory is small — for this 5.9 MB
Clavinet the entire header+keymap+directory is `0x00–~0x2200` (**~8 KB**); the
high-entropy audio body is everything after `~0x2200`. So the open problem is
decoding that ~8 KB directory into **per-stroke {offset, size}** (18 entries here)
+ the chunk table, then pointing our existing `decodeStroke` at each. Two open
pieces, both probed by cracking that ~8 KB region: (a) the **directory layout**
(per-stroke offset/size, no oracle — desktop binaries lack the CNSP audio reader),
and (b) whether CNSP wraps the residuals in an **extra `CChunkBuffer` framing**
beyond the residual chunking our `decodeStroke` already does (prior RE suspected
yes). Cracking the directory and testing `decodeStroke` at the offsets resolves
both at once: clean decode ⇒ no extra framing (done); failure ⇒ `CChunkBuffer` is
real and needs its own RE (which has no desktop oracle — see the firmware note).
Build order: (1) `readNsp()` structural parser (name/version/variant/key-map →
sample count + ranges) — shippable now; (2) crack the directory records in
`0x137–0x2200`; (3) feed `decodeStroke`.

### Directory-crack attempt (2026-06-30) — codec confirmed, framing still the wall

Tried to locate/decode strokes directly:
- **Overview/thumbnail waveform** lives at `~0x78c+` as 118-byte records with the
  `00 7f XX XX` peak markers (editor draw data) — *not* a stroke offset table.
- **No clean stroke offset table** anywhere (only coincidental increasing-u32 runs).
- **Audio is genuinely NW1 residuals** — the "low-entropy" regions are packed 4-bit
  residuals (`ee 0e 2f df…` nibble patterns = small signed -2..2), so the codec is
  right; entropy just dips where the bit width is small.
- **One clean-looking decode** at `0x7436` (mono u24): 47 244 samples, 0.80 B/sample,
  smooth onset `[-2,-4,-5,-6,-5,-6]`. BUT a full-file stroke-opening sweep yields ~29
  incoherent partial decodes (9.2% file coverage, peaks 97…15M) — no coherent
  18-stroke instrument. The single clean hit may be a **stereo stroke misread as
  mono** (quiet onsets look smooth either way).

**Blocker is unchanged but precise:** the strokes' **location (CNSP directory) and
channel/chunk framing** are un-RE'd, and — critically — **there is no ground-truth
audio to validate a candidate decode against**, so the framing can't be cracked by
trial. (External corroboration, 2026-06-30: a community report says the lossless
codec is the *same* in `.nsmp` and `.npno` and names an original Clavia creator who
knows the scheme — consistent with our "codec = shared NW1; framing is the gap".)

### Ground-truth pairs acquired + onset-correlation tried (2026-06-30)

The community supplied **`.npno`↔`.nsmp*` pairs of the same sounds** — the oracle
that was missing (all gitignored in `fixtures/`):
- **Clavinet** D6 6.1 `.npno` ↔ `Clavinet5 stereo 3.0.nsmp3` (stereo)
- **CP80** Electric Grand 1 5.3 `.npno` ↔ `ElGrand CP80 2.0.nsmp` (**mono**)
- **Wurlitzer** 1 6.3 / 2 6.1 `.npno` ↔ `Wurlitzer_CL mono 3.1.nsmp3` (mono)
- **RainPiano** SvPnoFab Sml 5.3 `.npno` ↔ `RainPiano_CL stereo 2.0.nsmp`
Root grids match across each pair (e.g. CP80 `.nsmp` 35–107 ⊂ `.npno` 0,30,35–107),
so they're the same instruments.

**Onset cross-correlation cracker — FAILED on both mono (CP80) and stereo
(Clavinet).** Scanned each `.npno` for stroke-opening blocks, decoded every framing,
correlated the onset against the decoded `.nsmp` strokes: no hit >0.85/0.9. Two
compounding reasons, both now understood:
1. **Not sample-aligned.** The `.npno` is ~3× larger per sample than the `.nsmp`
   (CP80: ~520 KB vs ~160 KB/sample) ⇒ the Piano library is higher fidelity (stereo
   and/or higher rate). Same recording, different PCM — correlation can't align.
2. **Chunk framing.** If residuals are `CChunkBuffer`-wrapped, `decodeStroke`
   produces garbage at every offset, so there's no candidate to correlate.

**Right next technique (rate-tolerant, doesn't need a working decode first):**
- **Overview-shape match** — the `.npno` carries a downsampled peak/thumbnail
  waveform (`00 7f` records @~0x78c). Compare its *shape* to a decoded `.nsmp`
  stroke's envelope (length-normalized). Confirms same-recording AND gives the
  rate/length ratio, *without* decoding `.npno` audio.
- **Encode-and-search** — once the rate is known: decoded `.nsmp` PCM → resample to
  the `.npno` rate → re-encode with our NW1 encoder → search the `.npno` for those
  residual bytes. A hit locates a stroke and exposes the chunk boundaries. (Caveat:
  needs the `.npno` encoder's block params to match; the onset block is the most
  likely to match regardless.)

Status: oracle pairs in hand; simple correlation insufficient; the above is the
focused multi-session path.

**Highest-leverage unlocks:** (a) a **reference recording** of a known `.npno`
(play it on the Nord, capture audio) → ground truth to brute-force the framing, the
way `.nsmpproj` cracked `.nsmp`; (b) the creator/their other project as the framing
oracle; (c) hardware-in-loop. Blind RE without (a) is unlikely to converge.

**"Is it FLAC?" — no, but a close cousin (recurring community guess).** NW1 is the
same *family* as FLAC/Shorten (block-based fixed-polynomial LPC), which is why people
guess FLAC. But it is **not** FLAC and no FLAC decoder reads it: NW1 uses
**binomial-only fixed predictors** (orders 0–7) and **fixed bit-width residuals**
(N bits/residual, MSB-first signed) — *not* FLAC's quantized-LPC + Rice/Golomb
coding, and a different block header (no `0xFFF8` sync). Confirmed by decompiler
(`Ymer::Codec::NW1`) and by our port decoding `.nsmp` losslessly; the piano residuals
inspected here are fixed-width (4-bit nibble patterns), consistent with NW1, not Rice.
So the FLAC theory and the "shared codec" creator report both just restate that the
codec is solved — the open problem is the container framing, not the codec.

## 2026-06-30 — encode-and-search + block-header sanity: the wall is the block format

Pushed the rate-tolerant path with the ground-truth pairs (CP80 mono `.nsmp`↔`.npno`
the cleanest). Outcome: **the blocker is at the NW1 *block-header* level, not just
chunk wrapping.** Evidence, in order:

1. **Rate-tolerant correlation** (decode `.npno` stroke → resample to the `.nsmp`
   stroke length → NCC): no match >0.6. Then de-interleave (even/odd channels) +
   resample: no match >0.7.
2. **Coherence was a red herring.** Scanning every offset, `decodeStroke` produces
   2065 "tonal" (ZCR<0.15) decodes — but the most-tonal (ZCR 0.000 @0x2080) is a
   **slow integrator drift** (avg |Δ| = 0.4 over a peak of 7893), i.e. the predictor
   running away on near-zero residuals = a *wrong decode*, not audio. Low ZCR caught
   ramps, not music.
3. **The early file is the overview, not audio.** Raw @0x2000 = `ff ec 00 7f / ff ed
   00 7f / …` — the 4-byte peak/thumbnail records. Every earlier decode attempt was
   decoding the thumbnail as NW1 → drift garbage.
4. **Encode-and-search**: re-encoded each `.nsmp` CP80 stroke with our NW1 encoder
   (u24/u32 × block sizes 24/32) and byte-searched the `.npno`. No hit; longest
   common run = 2 bytes (noise). (Only valid at identical rate; resampling isn't
   bit-exact, so this only rules out *same-rate same-encoder*.)
5. **Decisive — block-header sanity scan.** Walking our block-header layout
   (`sampleCnt[0:13]/order[14:17]/bitWidth[19:22]/linMode[23]`) advancing by the
   residual size, the **longest run of sane chained headers anywhere is 18 blocks
   (u32be) / 14 (u24be)** — in *both* the overview region and the audio region. A
   real NW1 stroke is hundreds of sane blocks ending in a stop. **No such run exists
   anywhere.** ⇒ our `.nsmp` block-header bit layout does not parse the `.npno`
   bitstream.

**Verdict (well-evidenced):** the `.npno` packs its NW1 residuals with a *different
block-header/framing* than `.nsmp` (different header bit fields and/or
`CChunkBuffer` wrapping). Our decoder structurally cannot read it, and the
correlation/encode tactics all silently assume our framing applies — which is why
they uniformly fail. The ground-truth pairs confirm same instrument/recording but
cannot bridge a framing we can't parse.

**What remains (all heavy, oracle-dependent — not in-reach trial-and-error):**
- **Differential across `.npno` versions/instruments** (CP80 5.3, RainPiano 5.3,
  Clavinet 6.1, Wurlitzer 6.3 in hand) to RE the container *directory* + any
  rate/channel/block-format fields — metadata RE that does NOT assume our codec.
- **Recover the block-header bit layout** by brute-forcing field positions against a
  known stroke's expected residuals — needs a pinned stroke location + content
  alignment (chicken-and-egg without the directory).
- **Firmware/DSP oracle** (parked: RAM-relocated, no symbols, NW1 decode is DSP-side)
  or a **community piano-RE drop** (the cheap unblock).

Bottom line: the in-reach decode/correlate/encode tactics are exhausted and converge
on this structural wall. Cracking `.npno` audio now needs container-directory RE or
an oracle, not another correlation pass.

## 2026-06-30 — container-directory differential + decompiler oracle check: no desktop oracle

Ran the directory-differential RE across all five `.npno` (CP80 5.3, RainPiano 5.3,
Clavinet 6.1, Wurlitzer 1 6.3, Wurlitzer 2 6.1) and cross-checked the decompiled NSE.
Structural facts established (positive):
- Shared layout: CNSP header → metadata → key map @`0xB7` → **overview thumbnails**
  (`xx xx 00 7f` peak records, start ~`0x7e0`) → **per-sample data** to EOF.
- Entropy is a uniform ~6–8 bits/byte across the *whole* file (no header/audio split):
  the audio is **per-sample records**, not one blob after a directory.
- Header carries per-sample runs of a repeated byte + small attack-waveform snippets,
  a recurring `39 39 …` field, and **4-byte big-endian size-like values** (CP80:
  0x15b09≈89k, 0x3a90b≈240k, 0x4d818≈317k — stroke-length range).

What the per-sample audio region is **NOT** (all tested, all negative):
- not an **offset-table directory** (monotonic-u32 "hits" were the overview's rising
  thumbnail values misread);
- not **length-prefixed chunks** (no `[len][data]` chain tiles to EOF, any framing);
- not the **`.nsmp` ASCII section tree** — walking `[tag][ver][size]` from 0x2c/0x137
  yields only zero-size padding, and **no section tag** (`map`/`stk`/`cat`/`sty`/`NSMP`)
  appears anywhere in the file.

**Decompiler oracle check (decisive):** the desktop NSE has the `.nsmp` section codec
(`CSectionStroke::Read` etc., ASCII-tagged, via `CSectionIterator` — tag/len/size) and
the in-memory project struct (`CProject2Struct::Populate*`, which takes a `CEncodeName`
= the **encode/write** side). For `.npno` it has **only** `CNSPFileInputStream::
PopulateMetaData` (name/version/bank/entry — the librarian tier). There is **no
`.npno` audio read or serialize path in the desktop binary**, and `.npno` does not use
the ASCII-tagged `CSection*` format. ⇒ The `.npno` (CProject2) per-sample container is
**firmware-side only** — the desktop-oracle route the librarian tier relied on does not
extend to the audio container.

**Verdict:** the directory differential is also blocked — not by effort, but by the
absence of any desktop oracle for the `.npno` audio container, now confirmed three
ways (heuristics, section-tree walk, decompiler). Real remaining paths are
hardware-only: (a) **capture audio off the Nord** (play the known `.npno`, record) →
ground truth to brute-force the firmware serialization the way `.nsmpproj` cracked
`.nsmp`; (b) **dump/trace the keyboard** (ARM RAM for the directory; DSP for the codec).
Heuristic + desktop-oracle RE is exhausted.

## 2026-06-30 — brute-force offset search (the "can't we just brute force it?" test)

Confirmed the decoder is correct, then proved blind brute force can't locate strokes.

**Decoder confirmed correct (decompiler oracle).** `NW1::CBlockHdr::Read` matches our
`readBlockHeader` byte-exact: `sampleCnt = word & 0x3FFF`, `filterOrder = (word>>14)&0xF`,
`bitWidth = ((word>>19)&0xF)+1`, word = U32 or U24 (per SMetric). `NW1::CDecode::
DecodeStroke` is a plain **contiguous** block loop (read hdr → if stop break → decode →
repeat); the `CBinStream` 0x1000 reads are buffered file I/O, not format chunking. So if
we land on a real stroke's audio start, our existing `decodeStroke` would run it.

**Brute force, four escalating oracles — all fail.** Swept every offset with our real
`decodeStroke` (u24 + u32):
- *run length*: long decodes exist (up to 107k samples) but most are predictor
  **overflow** (peak ≈ 2³¹) — calibration: real CP80 audio peaks ~5–7k (13-bit).
- *periodicity*: high scorers were saturation oscillation (period = autocorr floor).
- *peak-sanity + no-runaway*: still **70 "sane" hits in 512 KB** (≫ 16 strokes).
- *pitch-ladder* (the real oracle: roots 30→107 must ladder by 1.335×): all 63
  peak-matched candidates report the **identical** `period=8, score=0.663` — no pitch
  content, no ladder. Outputs are content-dependent (0.1% identical across offsets) but
  a uniform **low-amplitude smooth wander**, not music.

**Why brute force can't work here:** the NW1 fixed-polynomial predictor smooths *arbitrary*
residuals (any offset, misaligned or wrong-param) into plausible bounded smooth output.
No intrinsic signal (run length, periodicity, peak, decay, pitch) distinguishes a true
stroke start from the rest — and the rate/fidelity mismatch already broke correlation vs
the `.nsmp` twin. Likely compounded by wrong decode params for `.npno` (SMetric/
normalization differ from `.nsmp`), so even a correct start may not decode right.

**Why more agents don't help:** this is a single numerical needle-in-haystack where the
needle and hay look identical to every available detector — not a breadth problem.
Parallel agents just produce more identical-looking false positives; they can't
manufacture the missing verification signal.

**The one unlock that works:** aligned ground truth from **hardware** — record the Nord
playing a known `.npno`. That makes correlation valid AND lets us brute-force the decode
params (try combos until the decode matches the recording), which then pins stroke
starts. The verification signal must come from outside the file.

## 2026-06-30 — full NSM symbol dump: desktop has NO .npno audio decoder (conclusive)

Followed the "dump NSM too" lead — surveyed the entire `nsm/nsm-arm64` symbol table
(30,663 functions) and read the format-detection path. Three independent confirmations
that the desktop NW1 codec does not decode CNSP/`.npno` audio:

1. **`NW1::PeekFormat`** reads the inner stream's first tag: `"NSMP"`(0x4e534d50)→codec 3/4
   (by version 0x1e/0x28), `"NWS"`(0x4e5753)→codec 1/2 (by version 11/8), **else → 0**. A
   `.npno` inner stream starts with `CNSP`, so PeekFormat/`ProbeFormat` return 0 — the NW1
   section/chunk codec never engages for pianos.
2. **`CNSPFileInputStream`** (the piano file-stream class) exposes only `S_IsNSP`,
   `S_GetMainType`, `S_GetVersion`, `VerifyChecksum`, `PopulateMetaData`, `GetStreamType`
   — metadata + checksum, no audio.
3. **`Zevs::Piano`** namespace is only `GetFormat`/`BCD2Version`/`Version2BCD` (version
   utilities); `CPiano2–6` have only `IsSampleEditor3Supported`; `CPartitionPnoV5/V6` only
   `FormatEntry`. No CNSP audio/stroke/sample reader exists in NSM at all.

Valuable byproducts (not blockers, but worth keeping):
- **Our NW1 decoder is confirmed byte-exact** vs `CBlockHdr::Read` (sampleCnt=word&0x3FFF,
  order=(w>>14)&0xF, bitWidth=((w>>19)&0xF)+1) and `CDecode::DecodeStroke` is a plain
  contiguous block loop. The decoder is *not* the problem.
- **Format detection is now fully pinned** (PeekFormat versions; SCodec = Format/SubFormat/
  Metric/version; the codec-3 subformat flag comes from a follow-on section seek).
- NSM *does* carry `CChunkBuffer`/`CDecode::DecodeChunk` and `CScopedSectionReader`
  (pad-aligned sections) — but for the NSMP/NWS + bundle path, not CNSP.

**Conclusion (both desktop binaries now fully checked — NSE and NSM):** there is no
desktop `.npno` audio decoder. The CNSP audio container is firmware/DSP-only. Every
desktop-oracle and file-only avenue is exhausted; the audio is unreachable without
hardware ground truth (record the Nord) or a device/DSP dump. The librarian tier
(name/version/key map → samples + ranges) remains fully recovered and shippable.

## 2026-07-01 — Sml/Med differential: locates real audio, proves CNSP ≠ NW1

Downloaded White_Grand Sml (72MB) + Med (119MB) from the factory endpoint
(`nordkeyboards.com/wt/api/main/v1/file/from_file_name/<name>/`, gitignored under
`fixtures/variants/`) and ran a longest-common-substring subset diff.

Findings:
- Both variants have the **same 37 samples / same root notes** — Med differs by higher
  fidelity + added middle-range string-resonance, not by extra key zones.
- Only **~14% shared**, in **4 large contiguous identical blocks** (5.3/2.1/1.4/1.1 MB)
  at *different offsets* in each file → these are real, relocatable **audio blobs** with
  exact boundaries. (The rest is re-encoded per variant, so not a clean subset.)
- Decoding a blob with our NW1 decoder yields a **smooth cubic that runs away**
  (`0,0,1,3,6,…,56,52,42,27,7,−18,−48,…` accelerating to −210k by sample 140) — the
  order-3 binomial predictor extrapolating with residuals too small to correct it. No
  stroke-header offset (0x3c/0x60/0x6c/…) fixes it.
- **Decisive byte test:** the blob does **not** chain sane NW1 block headers (2/0/1
  blocks before an invalid order>7 field), while entropy is 7.38 bits/byte (compressed).

Conclusion: the differential *works* (it isolates genuine audio blobs — a clean RE
substrate we never had), but confirms **CNSP audio is a different codec than the desktop
NW1** — consistent with `PeekFormat` structurally rejecting CNSP and both binaries
lacking a CNSP audio path. The smooth onset is a predictor artifact, not an NW1 decode.
Cracking the CNSP codec from raw compressed bytes with no decoder reference is not
tractable file-only; it needs the firmware/DSP algorithm or hardware ground-truth PCM.
The isolated blobs make a good substrate if either becomes available.
