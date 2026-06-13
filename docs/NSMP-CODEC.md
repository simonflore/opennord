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

## Decode algorithm — TODO (Task 6)

To recover from `Ymer::Codec::CSmpDecode` via Ghidra. Expected shape (hypothesis,
from the error string + the `map` chunk): per-block decode where each block picks
a quantization table from the `map`, reconstructs PCM via predictor + scaled
quantized deltas. The `map` entries are the per-block table assignments.

## Verdict — PENDING

Filled after Task 7 (decoder fidelity vs the matched pair). To state: decode
reproduced? at what normalized-RMS delta? which revisions? encoder plausibly
reproducible (for the future transcoder spec)?
