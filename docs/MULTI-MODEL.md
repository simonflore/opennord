# Multi-model support — design proposal

**Status:** **Tier 1 shipped** (PR #22 — Stage 2/3 recognition + structure view)
and **M0 shipped** (the `clavia/` container + model-codec registry seam). Tier 2
(NS2/3 parameter-body decode) is the open work this proposal now scopes.

> **What already landed (PR #22, "Tier 1").** `src/lib/ns4/nord-file.ts` —
> `identifyNordFile()` recognizes the whole Stage 2/3/4 CBIN family by tag and
> decodes the header where it's reliable: **Stage 3 shares the Stage 4 NSM-era
> header**, so slot/category/version decode with our existing `readCbinHeader`
> (validated against a real `.ns3f`: *ABBA — Stage 3 · Performance · Grand ·
> v3.04 · F:34*). Stage 2's legacy header (format-type 0) is recognized but its
> fields aren't decoded yet. `NordFileCard` shows that structure instead of a
> dead-end, and the import pickers accept `.ns2p/.ns3p/.ns3f`. This realized
> **M1 below** in a lighter form than originally drawn (see "Reconciliation").

OpenNord is a Stage 4 companion. A recurring question is whether it should also
read **other Nord instruments** — chiefly the **Stage 2 / 2EX / 3** family — given
that substantial community research already documents those formats. This note is
the concrete plan for doing that: what's reusable, what the real cost is, and a
phased path that keeps the Stage 4 the flagship.

## TL;DR

- **Recognition is done.** Stage 2/3/4 files are identified, headers decoded
  where reliable, and shown via `NordFileCard` (Tier 1 / #22). The remaining work
  is **Tier 2: decoding the NS2/3 parameter *body*** into a viewable program.
- **Reading other instruments' *program files* is bounded, hardware-free work.**
  Our CBIN container layer is already model-agnostic; the cost is **one parameter
  map + model shape + fixtures per model**, derived from existing public research.
- **Device *transfer* for other instruments is out of scope** — it's separate
  reverse-engineering that needs the hardware in hand and shares nothing with the
  Stage 4 USB protocol. This proposal explicitly excludes it.
- **The seam is now in place (M0):** `clavia/` container + `formats.ts`
  `parseClaviaFile()` model dispatch. Adding Stage 3 = appending one codec.
- Recommended next slice: **read-only Stage 3 program *body* decode** (Tier 2),
  with [ns3-program-viewer][n3v] as the test oracle (the same role ns4decode
  plays for the Stage 4).

## Prior art we'd build on

| Source | Covers | License | Role here |
|---|---|---|---|
| **[ns4decode][n4d]** | Stage **4** `.ns4p` + presets | MIT (no public source) | Our existing NS4 engine + oracle |
| **[nord-documentation][ndoc]** (Chris55) | Stage **2 / 2EX / 3** program layout | docs | **Facts** to re-derive an NS2/3 map from |
| **[ns3-program-viewer][n3v]** (Chris55) | Stage **2 / 2EX / 3** programs + bundles | **GPLv3** | Reference impl + **oracle** for NS2/3 |

`ns3-program-viewer` parses `.ns2p/.ns2s`, `.ns3f/.ns3y`, and the
`.ns2b/.ns2exb/.ns2pb/.ns2synthpb`, `.ns3b/.ns3fb/.ns3synthpb/.ns3sbundle`
bundles — but **not** the Stage 4, Electro, or Piano. So it is *complementary* to
our NS4 work, not overlapping: its value is as a Rosetta stone for the Clavia
family layout and as a ready-made oracle.

> **Licensing discipline (non-negotiable).** `ns3-program-viewer` is **GPLv3**;
> OpenNord is AGPL-3.0-or-later (compatible). Our standing rule — same as the
> ns4decode (MIT) port — is **re-derive from the documented facts of the layout,
> don't copy source.** Any NS2/3 map must be traceable to `nord-documentation`
> (or our own diffing) field by field, and `ATTRIBUTION.md` /
> `THIRD_PARTY_LICENSES.md` updated. See `docs/LEGAL.md`.

## What's already model-agnostic (reusable for free)

The **CBIN envelope is universal across every Clavia file** (Stage 2/3/4,
Electro, Piano, samples). We verified the Stage 4 header *against* Chris55's NS2/3
layout precisely because they're the same envelope (`docs/FORMAT.md`). These
modules work, or nearly work, on any Clavia file today:

| Module | Today | For other models |
|---|---|---|
| `bits.ts` — CBIN magic + file-type tag detection | NS4-labelled, format-generic | Reusable as-is |
| `checksum.ts` — CRC-32 over `bytes[0x2C:]` | "universal Clavia CBIN checksum" (`docs/FORMAT.md`) | Reusable as-is |
| `bundle.ts` — ZIP bundle reader (`fflate`) | Filters by extension, names from basenames | Reusable; add NS2/3 extensions |
| `name.ts` — name from filename | NS2/3/4 all store name in filename, not file | Reusable as-is |
| `slot.ts`, bank/location decode | From the shared header bytes | Reusable (verify NS2/3 bit widths) |

So roughly the **container layer is ~80% reusable**. The work is entirely in the
**body decode** below it.

## What's Stage-4-coupled (the actual work)

The body decode is 100% NS4-specific and lives in the generated tables:

- `offset-map.generated.ts` — the 406-param bit-location map (from ns4decode bitmaps).
- `values.generated.ts`, `morphs.generated.ts`, `deps.generated.ts`,
  `synth-analog.generated.ts` — the interpretation tables.
- `parse.ts` hardcodes `buildParamMap()` (NS4) and an NS4-shaped walk.
- `types.ts` — `NS4Program` is shaped to the Stage 4: **3 layers A/B/C**, the
  `Morphable<T>` (wheel/AT/pedal) system, NS4 sample refs.

NS2/3 differ structurally (slot/layer counts, morph sources, parameter set, bit
packing), so this is a **parallel map per model**, not a tweak.

## The abstraction: a `model` registry — ✅ BUILT (M0)

> **What shipped (M0).** The `clavia/` container + codec registry below is now
> **in the tree**, ahead of a second body decoder, to give Tier 2 a clean seam to
> plug into:
> - **`src/lib/clavia/`** — the shared, model-agnostic container, lifted out of
>   `ns4/`: `cbin.ts` (CBIN magic/tag/header, split from `bits.ts`), `checksum.ts`,
>   `name.ts`, `slot.ts`, `categories.ts`, the `nord-file.ts` identifier, and
>   `model.ts` (the generic `ModelCodec` interface). The Stage-4 *body* codec (bit
>   fields) stays in `ns4/bits.ts`. Dependency direction is **model → clavia**.
> - **`src/lib/ns4/codec.ts`** — wraps `parseNs4Program` as the `ns4` codec.
> - **`src/lib/formats.ts`** — the composition root: holds the codec list and
>   `parseClaviaFile()`, which reads the header once and routes to the claiming
>   codec (falling back to the recognized-but-unparsed shell). All file-ingestion
>   points decode through it. **Adding the NS3 codec = appending one entry here.**
>
> Done as two byte-identical commits (extraction, then registry); NS4 output is
> unchanged, proven by the existing fixtures + new `formats.test.ts`. The sketch
> below is what landed.

The dispatch is keyed on the file-type tag (detected in
`bits.ts`) + CBIN version. The container layer stays shared; each model plugs in
its own map + interpreter + model-builder.

```ts
// src/lib/clavia/model.ts  (new, container-level)
export type ClaviaModel = 'ns4' | 'ns3' | 'ns2' /* | 'electro' | 'piano' */;

export interface ModelCodec<Program> {
  /** Tags this codec claims, e.g. ['ns4p','ns4l'] or ['ns3f','ns2p']. */
  readonly tags: readonly string[];
  /** Optional CBIN version gate (lo,hi inclusive), like NSM's CFileSpec. */
  readonly versionRange?: readonly [number, number];
  /** The body decoder: raw bytes (post-header) → that model's program object. */
  decode(bytes: Uint8Array): Program;
}

export function resolveCodec(bytes: Uint8Array): ModelCodec<unknown> | undefined;
```

- `parseClaviaFile(bytes)` reads the shared CBIN header, then routes to the codec
  whose `tags`/`versionRange` match — mirroring how **NSM's `CFileSpec` partition
  gate routes strictly by `{extension, type, versionLo..Hi}`** (`docs/NSP-FORMAT.md`).
- The **existing NS4 path becomes `ns4` codec** with **zero behavior change** —
  `parse.ts` is wrapped, not rewritten. This is the safety property: the refactor
  is provably inert against the NS4 fixtures before any NS3 code lands.
- Today's `Ns4FileKind` union generalizes to `{ model, kind }`.

Directory shape (as built in M0; `ns3/` is the Tier 2 addition):

```
src/lib/clavia/        # shared: cbin header, checksum, name, slot, categories, identifier, model registry
src/lib/formats.ts     # composition root: codec list + parseClaviaFile()
src/lib/ns4/           # NS4 codec (bits body codec, parse, codec.ts adapter) — unchanged behavior
src/lib/ns3/           # NEW (Tier 2): ns3 map + interpreter + model builder + fixtures
```

(The constraint held: **NS4 output is byte-identical before/after** — proven by
the existing fixtures + `formats.test.ts`. `bundle.ts` stayed in `ns4/` as the
NS4 bundle reader; generalising it to decode any model via `parseClaviaFile` is a
small Tier 2 follow-up.)

## Stage 3 reading — milestones

Smallest useful unit first; each milestone independently shippable and testable.

0. **M0 — Container extraction + registry seam. ✅ SHIPPED.** `clavia/` shared
   layer + `ModelCodec` + `formats.ts:parseClaviaFile()`; NS4 wrapped as the `ns4`
   codec; ingestion points routed through the dispatcher. Byte-identical (see
   "The abstraction" above).
1. **M1 — NS3 recognition. ✅ SHIPPED (Tier 1 / #22).** `identifyNordFile()`
   recognizes `.ns2p/.ns3p/.ns3f` (+ Stage 4), decodes the NSM-era header
   (slot/category/version) for Stage 3/4, recognizes Stage 2's legacy header
   without decoding it, and `NordFileCard` shows the structure. Import pickers
   accept the new extensions. *(Bundle support
   (`.ns3fb`, …) for the new extensions is the one M1 gap still open.)*
2. **M2 — NS3 offset map (the core cost). ← Tier 2 starts here.** Build
   `ns3/offset-map.ts` from
   `nord-documentation` — field by field, each traceable to a doc section (or our
   own one-knob diff), **re-derived, not copied** from the GPLv3 source. Validate
   raw reads against `ns3-program-viewer` output as the **oracle** (the NS3
   analogue of `ns4decode --rawdecimal`).
3. **M3 — NS3 model + interpretation.** An `Ns3Program` shape (2 slots × 2 layers
   for NS3; its own morph sources) + the interpretation tables (drawbars, piano
   models, FX). Pin with NS3 fixtures (real file + expected CSV), **0-mismatch vs
   the oracle**, exactly like the NS4 bar.
4. **M4 — UI.** Render an `Ns3Program` in the full parameter view — graduating
   from today's `NordFileCard` structure view (header only) to engines/FX/morphs.
   Most UI is model-shaped already; needs graceful handling of fields a given
   model lacks.

Then **Stage 2 / 2EX** need their own map. The Stage 2 firmware writes a flat body, without the Stage 3's registry blocks, so it isn't a delta off NS3 (`docs/STAGE2-3-FIRMWARE.md` §3). The Stage 3 firmware's own parameter registry gave M2 its offset map: a block chain of length-prefixed sections that reproduces every offset the earlier hand-built decoder read (same doc). The Stage 3 now reads through that map, see "Firmware-layout readers" below.

## File-type matrix (target)

| Ext | Model | Kind | Plan |
|---|---|---|---|
| `.ns4p/.ns4l` | ns4 | program | **Done** (becomes the `ns4` codec) |
| `.ns4o/.ns4n/.ns4y` | ns4 | preset | Existing sibling handling |
| `.nsmp4` | ns4 | sample | Header-only today (`sample.ts`); audio out of scope |
| `.npno` | piano | piano lib | Header/metadata in `nsp.ts`; **audio decoded** (`nsp-audio.ts`, reference `scripts/npno-decode.py`; codec from the Stage 4 piano DSP, `docs/NSP-FORMAT.md`) — local audition in the piano inspector |
| `.ns3f` | ns3 | program | **Read-only, firmware layout** (`lib/ns3`) — Stage 3 OS 2.64 registry, 175 parameters + morph deltas; the panel view is built on it |
| `.ns3l/.ns3y` | ns3 | live / synth preset | Recognized; `.ns3l` has the `.ns3f` body and `.ns3y` is one Synth block of it, neither routed to the reader yet |
| `.ns2p/.ns2s` | ns2 | program | Recognized (header undecoded); decode = delta off NS3 |
| `.ngp/.ngl` | ng (Grand) | program | **Read-only, firmware layout** (`lib/ng`) — Piano 4 layout + `Com_kSplPos`; not yet checked on a real file |
| `.np6p/.np6l` | np6 | program | **Read-only, firmware layout** (`lib/np6`) — Grand 2 layout + 3 deltas; not yet checked on a real file |
| `.np4p/.np4l` | np4 | program | **Read-only, firmware layout** (`lib/np4`) — block lengths match the corpus |
| `.np5p/.np5l` | np5 | program | **Read-only, firmware layout** (`lib/np5`) — block lengths match the corpus |
| `.ng2p/.ng2l` | ng2 | program | **Read-only, firmware layout** (`lib/ng2`) — block lengths match the corpus |
| `.ne7p/.ne7l` | ne7 | program | **Read-only, firmware layout, provisional** (`lib/ne7`) — block order not yet confirmed on a real file |
| `.no3p/.no3l` | no3 | program | **Read-only, firmware layout, provisional** (`lib/no3`) — block order not yet confirmed on a real file |
| `.nepg` | ne3 | program | **Read-only, firmware descriptor layout, provisional** (`lib/ne3`) — Electro 3 and 3 HP share the record; alignment not yet confirmed on a real file |
| `.nc2p` | nc2 | program | **Read-only, firmware descriptor layout, provisional** (`lib/nc2`) — C2D layout (C2 files assumed the same); alignment not yet confirmed on a real file |
| `.nwp` | nw1 | program | **Read-only, firmware descriptor layout** (`lib/nw1`) — replaces the corpus byte reader; alignment checked by the corpus range test when the fixtures are present |
| `.ns3b/.ns2b/.ns3fb/…` | ns3/ns2 | bundle | Existing ZIP reader + extensions (M1 gap) |

## Firmware-layout readers (Stage 3, Grand, Grand 2, Piano 4/5/6, Electro 6/7, Organ 3, Wave 2)

These models have no third-party oracle, but their own firmware's parameter
registry gives the program layout directly (static analysis, knowledge only —
`docs/LEGAL.md`). The Piano 4, Piano 5 and Grand 2 had corpus-RE'd decoders
first; they now read through the firmware layouts too, which corrected several
of their offsets (see each model's `types.ts`). They read through the same
`ModelCodec` seam as everything else:

```
scripts/gen-fw-program-maps.py   offset CSV (from the firmware registry) → <model>/layout.generated.ts
src/lib/clavia/block-chain.ts    shared reader: u32 version + length-prefixed block chain → values
src/lib/<model>/decode.ts        decodeFwProgram(bytes, LAYOUT) → { format, values, layoutMatched, warnings, … }
src/lib/<model>/present.ts       values → DecodedProgram (musician labels from the firmware's own tables)
```

- **Framing check, never a throw.** The body must be a u32 BE format version
  followed by length-prefixed blocks that end exactly at EOF, with the block count
  the firmware layout declares. Anything else (truncated, trailing bytes, a
  partial save that omits a folder, a newer layout) returns the header-only
  result with a warning, so the Library still lists the file. A block whose size
  differs from the layout is read in place; fields that no longer fit are skipped
  with a warning. Values outside the firmware's range are flagged.
- **Each field cites its source** in the generated layout, e.g.
  `Piano 6 OS 1.20 registry FUN_c0112544 · id 125`. Only high/medium-confidence
  fields are generated; the firmware's obsolete/editor-state parameters are left
  out. The Electro 7's "encoding kind 3" knobs are followed by two 1-bit assign
  flags, generated as `<field>.pedalAssign` / `<field>.wheelAssign`.
- **Signed values.** Every registry model after the Stage 3 — Piano 4 / 5 / 6,
  Grand, Grand 2, Electro 6, Wave 2, Electro 7, Organ 3 — stores negative-min
  fields as two's complement in their width: each registry builder sets the
  signed mode to 0 (high; Piano 6 medium, inferred from the shared code and the
  Grand 2 corpus). Only the Stage 3 stores `value − min`. Morph deltas are never
  two's complement. The generated layout carries the encoding per field.

| Model | Tag | Firmware source | Body | Confidence |
|---|---|---|---|---|
| Grand | `ngp` | OS 1.68 registry `FUN_c004f960`; archive `FUN_c00520cc` (1.00–1.01) | 90 B, 4 blocks | high — Piano 4 layout bit for bit + `Com_kSplPos` at bit 59 |
| Grand 2 | `ng2p` | OS 1.22 registry `FUN_c01125f8`; archive `FUN_c010dac0` | 185 B, 11 blocks | high — reproduces the corpus block lengths; corpus files are 1.02 |
| Piano 4 | `np4p` | OS 2.66 registry `FUN_c004c648`; archive `FUN_c004ed00` (1.00–1.01) | 90 B, 4 blocks | high — reproduces the corpus block lengths and the bundle piano references |
| Piano 5 | `np5p` | OS 1.34 registry `FUN_c00f8188`; archive `FUN_c00f6ccc` (1.00–1.01, medium) | 237 B, 6 blocks | high — global Effects block; reproduces the corpus block lengths |
| Piano 6 | `np6p` | OS 1.20 registry `FUN_c0112544`; archive `FUN_c010db30` | 185 B, 11 blocks | high (two's complement: medium) — Grand 2 layout + `Com_kFxEnable`, `EffectsSectionMode`, split AmpEnv decay/release |
| Electro 7 | `ne7p` | OS 1.30 registry `FUN_c009c394`; archive `FUN_c00a8148` / tree `FUN_c00aa7c8` (1.00–1.10) | 353 B, 13 blocks | **provisional** — block order medium; buffer sizes match the firmware's own totals |
| Organ 3 | `no3p` | OS 1.00 registry `FUN_c00c0120`; archive `FUN_c00b9888` (2.00) | 204 B, 8 blocks | **provisional** — block order assumed from insertion order (medium) |
| Electro 6 | `ne6p` | OS 2.66 registry `FUN_c0054b5c`; Multi format `FUN_c0057f8c` (2.00–2.04) | 211 B, 14 blocks | high — reproduces every anchor of the earlier corpus reader; two's complement (signed mode 0, `FUN_c009aad8`) |
| Wave 2 | `nw2p` | OS 1.24 registry `FUN_c01106b8`; Multi format `FUN_c010bfe4` (3.00–3.01), slot sub-chain `FUN_c010bde0` | 1044 B, 41 blocks | high (slots high/medium) — base values only: the morph-delta encoding of buffer 1 is not reconciled, so deltas are not read |

The Electro 7 and Organ 3 programs carry a note ("firmware-derived, block order
not yet confirmed on a real file") on every decode, and their coverage byte maps
are `candidate`, not `confirmed`. The Grand's three-letter tag is padded in the
header; `fileTypeTag` drops trailing NUL/space so it compares as `ngp`.

**Stage 3.** The Stage 3 (`ns3f`) reads the same way: `stage-3` in the generator
(the ns3 CSV dialect: a `section` column, file bit offsets, and one `[Slot B]` row
for slot A's blocks repeated 263 bytes later), `ns3/layout.generated.ts`, and
`decodeFwProgram` in `ns3/decode.ts`.

| Model | Tag | Firmware source | Body | Confidence |
|---|---|---|---|---|
| Stage 3 | `ns3f` | OS 2.64 registry `FUN_c0075058`; Multi format `FUN_c007a51c`, serialiser `FUN_c00e0108` (3.00–3.04) | 548 B, 19 blocks | high — reproduces every offset the earlier decoder read from real files |

It differs from the readers above in four ways:

- **Morph deltas.** It is the one block-chain layout that carries them, as `<field>.morphWheel`,
  `.morphAfterTouch` and `.morphCtrlPedal`. Each delta is one bit wider than its
  parameter and stored as `delta + (max − min)`; the parameter count leaves them out.
- **Typed shape.** `decodeNs3` builds the typed `Ns3Panel` shape that the rich view,
  the presenter and the migration use from the values.
- **Legacy header.** A legacy (formatType 0) header is 0x14 bytes shorter, so the
  body is read from 0x18.
- **Versions.** A 2.0x body has other slot-block sizes (the firmware converts it on
  load), so it opens header-only. Parameters added in 3.03 and 3.04 get their
  defaults in older files, as the firmware does.

**Follow-ups.** The block-chain reader lives in `clavia/block-chain.ts`; it now
runs every registry-family reader (Stage 3, Grand, Grand 2, Piano 4/5/6,
Electro 6/7, Organ 3, Wave 2), and `clavia/legacy-record.ts` the Lead 4 / Lead A1
/ Electro 3 / Electro 4 / C2D / Wave records. A real `.ngp`, `.np6p`, `.ne7p` or `.no3p` file is the next
check for each (expected sizes 134, 229, 397 and 248 bytes); for the others, the
gitignored corpus tests (`describe.skipIf` on `fixtures/<model>`) pin the
firmware reading against the values the old decoders had confirmed. A real
`.ns3f` should open with `00 00 01 30 11` at 0x2C (version 3.04, then the
17-byte MultiCommon block). Routing `.ns3l` and `.ns3y` to the Stage 3 reader is
still open.

**Legacy records (Electro 3 / 3 HP, Electro 4, C2D, Wave, Lead 4, Lead A1).**
These descriptor-container files are not block chains. One rule places the
record: it starts at file 0x18 after a legacy (formatType 0) header (0x2C after
an NSM-era one), the record version first, then one MSB-first bitstream of
descriptor parameters stored raw, then any padding and, in a legacy file, the
2-byte CRC trailer. Behind a u16 version the data starts at **file 0x1A**
(`.nepg` 26 + 108 + 2, `.ne4p` 26 + 108 + 2, `.nc2p` 26 + 345 + 2, `.nl4s`
26 + 315 + 2, `.nlas` 26 + 95 + 2); the Wave's version is a u8, so its data
starts at **0x19** (`.nwp` 25 + 321 + 2 pad + 2). NSM copies the version to the
CBIN version field at 0x14. `clavia/legacy-record.ts` reads them against
`LegacyLayout`s generated by the same script (`lib/ne3`, `lib/ne4`, `lib/nc2`,
`lib/nw1`, `lib/nl4`, `lib/nla`); a layout declares its version width
(`versionBytes`) and padding (`padBytes`), and `readLegacyFile` adds the size,
record-version and range checks. Inline morph deltas (Lead A1, Wave) carry
`deltaOf`, the Lead 4's sparse morph lists `morphLists`, the C2D's repeated
containers `copyOf` (the second copy overwrites the first, as in the firmware),
and `sets` names the parameter sets a record stores more than once (presets,
manuals, slots) so the coverage count takes each parameter once.

| Model | Tag | Firmware source | Data | Parameters | Confidence |
|---|---|---|---|---|---|
| Electro 3 | `nepg` | OS 3.14 containers; v100 upgrade `FUN_30017F9A` | 108 B, u16 v101 | 82 | **provisional** — alignment medium |
| Electro 3 HP | `nepg` | OS 3.16 containers (E3 + 5 in its reserved space) | 108 B, u16 v101 | 87 | **provisional** — alignment medium |
| C2D | `nc2p` | OS 1.12 container list `FUN_300200AE` (115 instances) | 345 B, u16 v100 | 91 | **provisional** — block names medium–low, alignment medium |
| Wave | `nwp` | OS 2.14 write `FUN_300056A4` / read `FUN_30005906` | 321 + 2 B, u8 v8 | 74 (+ morph deltas) | alignment medium until the corpus range test |

The Electro 3, C2D and Wave readers carry a provisional note on every decode, and
their coverage byte maps are `candidate`. The Electro 3 and Electro 3 HP write
the same record under the same tag: OpenNord reads both with the HP layout and
calls a file an HP only when one of the five HP-only parameters is non-zero.
The Lead A1 alignment is medium until a corpus check.

## Out of scope: device transfer for other instruments

The Stage 4 USB work (`docs/PROTOCOL-RE.md`) is a **vendor USB bulk protocol**,
RE'd and validated on Stage 4 hardware. The *transport* is shared line-wide — the
same vendor-USB FileTransfer family is hardware-validated on the NS2
(`ATTRIBUTION.md`, issue #31; `docs/NORD-PRODUCT-LINE.md`), so transfer is **not**
a separate MIDI/SysEx path the way the early framing here once guessed (the NS4
notably does *not* service SysEx — `docs/SYSEX-SPIKE.md`). What's missing for the
other models is validation, not a different protocol:

- We have **per-model transfer details unverified and little non-NS4 hardware** on
  hand; each generation needs its FileTransfer version + addressing confirmed
  against a real instrument.
- That is a hardware-gated validation effort — high cost, low leverage, and
  orthogonal to file reading.

**Therefore: file reading only. No device support for non-NS4 models in this
proposal.** Reading is hardware-free and stands on existing public research;
transfer is not.

## Effort & risk

| | Effort | Risk |
|---|---|---|
| M0 `clavia/` extraction + registry seam | Low | **✅ Shipped** — fixtures + `formats.test.ts` prove NS4 unchanged |
| M1 recognition (`identifyNordFile`) | Low | **✅ Shipped (Tier 1 / #22)** |
| M1 gap — bundle (`.ns3fb`, …) support | Low | Low |
| M2 NS3 offset map | **Medium–High** | Medium — manual port; mitigated by the oracle |
| M3 model + interpretation | Medium | Medium — NS3 model shape differs from NS4 |
| M4 UI | Low–Medium | Low |
| Device transfer (excluded) | High + hardware | High — separate RE |

**Risks & mitigations**
- *GPLv3 contamination.* Re-derive from `nord-documentation`; oracle-test against
  the viewer's output, never lift its code. Per-field provenance in comments.
- *NS4 regression from the M0 refactor.* Gated on byte-identical NS4 fixture
  output (held: 349 tests pass, incl. a `formats.test.ts` equivalence check).
- *Scope creep.* Each model stays a self-contained decoder; we can ship NS3 and
  stop, or never start, without touching the NS4 path.
- *Fixtures.* Needs real NS2/3 files. Community-sourced (programs only, never
  factory sample audio — `docs/LEGAL.md`); the viewer supplies expected output.

## Tier B — structural/differential decode (path of record for undecoded models)

When a model has no third-party oracle, no firmware RE, and no field-by-field offset
map — the "fully undecoded" case — the only viable structural information is
**engine-active** (which sections are on/off in a given patch). This is enough for
the key browse/search use case ("this is an organ patch", "this is a piano+synth
split") without knowing anything else about the format.

### Decision

For a model with no decode oracle, **Tier B = structural/differential decode of
"what's in the patch" (engines active), not full per-parameter decode.**  Full
parameter decode (Tier 2) requires an oracle; Tier B requires only a patch corpus
and a small labeled set.

### Method

1. Collect ≥100 patches of the target model.
2. Parse CBIN header (model-agnostic — `readCbinHeader()` works on every Clavia
   file).
3. Build a **byte-variance map**: for each byte position, count distinct values
   across the corpus. Constant bytes (34% on Stage 4) are structural boilerplate;
   low-variance bytes (2–8 distinct values) are candidate enum fields; high-variance
   bytes are continuous params.
4. **Weak-label bootstrap — manual, not automatic.** Manually label ~20–50 patches
   per engine type by opening them on hardware or in Nord Sound Manager and
   confirming which sections are active. (~1 hour per engine type.) Do not rely on
   patch name keywords alone — see "What doesn't work" below.
5. Run a **bit-correlation scan**: for each byte×bit position, compute accuracy of
   that bit against the labeled set. The real enable bits emerge as clear accuracy
   peaks. On Stage 4, three bits together gave 98.9% macro-avg F1 on 357 patches.
6. Classify the full corpus with those bits — no further manual work required.

### Measured results (Stage 4 — `scripts/structural-probe.ts`, 357 patches)

| Strategy | Label source | Macro avg F1 | Notes |
|---|---|---|---|
| A — category only | CBIN header category | 38.1% | 50% of patches filed as "None" |
| B — category + supervised bit scan | ns4 ground truth (parseNs4Program) | **98.9%** | Enable bits: byte 94 (organ), 229 (piano), 64 (synth) |
| C — name-weak-label bit scan | Patch filename keywords only | **4.6%** | See below |

Strategy B is the path of record. Strategy C is **not viable** — see below.

### What doesn't work: patch name keywords

An obvious shortcut is to derive weak labels from patch filenames: patches named
"B3 Growl" are probably organ patches. Testing this on 357 Stage 4 patches showed:

- **Coverage is catastrophically low:** organ keywords hit 1.7% of patches, piano
  3.4%, synth 21.8%. Nord Stage 4 patches are named after sound character ("Morning
  Light", "Cosmic Dream"), not engine composition.
- **Bit discovery fails at that sparsity:** with 6 organ-positive examples, the
  scanner latches onto incidental bytes — it finds byte 49 (not 94) for organ,
  byte 62 (not 229) for piano, byte 614 (not 64) for synth. These do not
  generalize. Macro-avg F1 against ns4 ground truth: **4.6%** vs 98.9% supervised.
- **Keyword precision is high** (100% / 92% / 99%) — the few patches that do name
  their engines actually have those engines. But precision alone doesn't help when
  coverage is < 5%.

Name keywords can **pre-populate** the manual labeling set (include all keyword hits
in the initial batch), but they cannot replace it. The positive set must reach ~20–30
per engine for the scan to converge on the correct bytes.

### What Tier B cannot do

- Engine *type* (B3 vs VOX vs FARF, Grand vs Electric) — needs labeled examples per
  type or category disambiguation, and category is "None" in ~50% of real corpora.
- Continuous parameters (volume, pitch, drawbars, envelope) — opaque without a
  format map.
- Morph assignments, sample IDs, FX routing.

### Requirements to activate on a new model

- ≥100 patches of a single model in the CBIN family.
- ~20–50 manually labeled patches per engine type (~1 hour per engine).
- No firmware RE, no third-party oracle, no hardware USB required.

### Firmware-as-oracle (parked)

A prior spike explored extracting decode logic from the Stage 4 firmware binary
(`os.cab`). The firmware is a Zevs CBinFile (3 sections: SRAM / CODE / ARM0).
**Correction (Stage 4 OS v1.66, 2026-10):** the CODE section is *compressed* — file
0xFF54, stored 0x358D45 bytes, header unpacked size 0x53EA70, load 0xC0000000;
entropy 7.57 bits/byte and zlib can't shrink it (ratio 0.90), whereas SRAM is
plain ARM (1.10 bits/byte). Earlier "uncompressed mixed ARM+Thumb" and the zero
string xrefs are consistent with analysing the packed bytes; any firmware pass
must decompress CODE first. **Format: LZO1X** (stream starts at the section offset,
ends on the standard `11 00 00` marker); `scripts/fw-unpack.py` unpacks every section
and verifies Clavia's checksums (`~sum(bytes)`). Verified on Stage 4 OS v1.66 and
Piano 5 OS v1.34 — see `docs/NSP-FORMAT.md` (2026-10-10) for what the unpacked image
shows. The `.npno` (piano) parser is
findable in principle via proper mixed-mode disassembly, but blind Thumb seeding
makes this a high-effort path. **Parked** — the Stage 4 is already fully decoded
via the ns4decode oracle; firmware RE adds nothing for models that already have a
software oracle. For a truly undecoded model with no oracle at all, the manual
bootstrap cost of ~3 hours total (3 engines) is lower than firmware RE. See
`memory/stage4-firmware-re.md`.

## Recommendation

Recognition (Tier 1) and the model-dispatch seam (M0) are **already in** — Stage
2/3 files open to a structure card instead of a dead-end, and the registry is
ready for a second codec. The open question is whether to fund **Tier 2** (the
NS2/3 body decode, M2–M4). Worth doing **if** broadening the community library to
the large NS2/3 owner base is a product goal — the format knowledge already exists
(Chris55), so the cost is the offset-map port + fixtures, not new reverse-
engineering. Sequencing: **start M2 with a real `.ns3f` + the viewer as oracle**;
close the small M1 bundle gap alongside. Keep the Stage 4 the flagship; device
transfer stays NS4-only.

[n4d]: https://ns4decode.netlify.app/
[ndoc]: https://chris55.github.io/nord-documentation/
[n3v]: https://github.com/Chris55/ns3-program-viewer
