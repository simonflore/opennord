# Nord Sound Manager teardown — what the official client actually does

Static analysis of **Nord Sound Manager 9.03 (build 1439)**, the official macOS
client (a copy lives in `nsm/` for reference; **do not redistribute** — this is
interop analysis of a binary, see `docs/LEGAL.md`). §1–5 are recovered from the
binary's Mach-O metadata and C++ RTTI symbol names; §6 adds a raw-asm read of the
format primitives; **§7 adds a full Ghidra decompilation** of the section readers
and the recovered on-disk layout. It resolves several open questions in
`ROADMAP.md`, `SYSEX-SPIKE.md`, and `PROTOCOL-RE.md`.

> **On the decompiled C:** we document the recovered *structures and facts* (the
> legitimate interop result), not Nord's code. The raw decompiler output is kept
> out of the repo as a derivative of their binary; regenerate it locally with the
> recipe in §7 if you need to re-check a field.

How to reproduce the recon:

```bash
BIN="nsm/MacOS/Nord Sound Manager"
file "$BIN"                                  # universal x86_64 + arm64
otool -L "$BIN"                              # linked frameworks (no CoreMIDI!)
plutil -extract CFBundleDocumentTypes json -o - nsm/Info.plist   # file types
lipo "$BIN" -thin x86_64 -output /tmp/nsm && strings -n 5 /tmp/nsm > nsm.strings
grep -E 'N4Ymer' nsm.strings                 # the engine's class names (RTTI)
```

The mangled type names look like `N4Ymer5Codec3NW112CSectionNSMPE` — read them as
length-prefixed segments: `Ymer :: Codec :: NW1 :: CSectionNSMP`.

---

## 1. What it is

- **Version 9.03**, build 1439, min macOS 10.13, universal (x86_64 + arm64), ~31 MB.
- Native Cocoa shell, but the entire app is built on **wxWidgets** (all `wx*`
  classes; UI laid out in XRC loaded from `clavia.xml` / `*.xrc`).
- Links `libcurl` (catalog/downloads), `WebKit`, `Security`, **`IOKit`**.
- Handles the **whole Nord family** — 73 registered document types — including the
  full Stage 4 set this project targets (see §5).

## 2. The engine is a C++ library called `Ymer`

Everything lives under the `Ymer::` namespace, in three clean layers.

### Layer A — File codec (`Ymer::Codec`, `Ymer::FileStream`)

- The on-disk container is **CBIN**: `CBINFileInputStream`, `CBINFileOutputStream`,
  `Codec::CBinStream`, `Codec::Util::CBinInputNordFile` / `CBinOutputNordFile`.
  **This is the "CBIN magic" that `src/lib/ns4/bits.ts` already detects** — now
  traced to its source in the official client.
- Programs are **section-based** — which validates the section-decode approach in
  `parse.ts` / `types.ts`. The section classes are named explicitly in the binary:

  | Section class | Almost certainly |
  |---|---|
  | `CSectionProgram` | the program body |
  | `CSectionPreset` | a preset (synth/piano/organ `.ns4y/n/o`) |
  | `CSectionCommon` | shared/master section |
  | `CSectionMeta` | name / metadata |
  | `CSectionCategory` | program category |
  | `CSectionNSMP` | **sample reference** (NSMP = Nord SaMPle) → your `Ns4SampleRef` |
  | `CSectionMap` | a slot/offset map |
  | `CSectionGBase`, `CSectionBase`, `CSectionStroke` | base classes / control |

- A separate **`.nsp` stream** (`NSPFileInputStream`) and a distinct **sample
  audio codec** (`Codec::CSmpEncode` / `CSmpDecode`, `CSmpStream`,
  `CSmpStreamMemory`, `CSmpStreamBridge`) handle sample audio — kept apart from the
  program codec. This mirrors OpenNord's legal split: **programs reference samples
  by id, audio is a separate stream we never embed.**
- `FileStream::CMetaData::ILazyCRC` — the file **CRC is computed lazily** over the
  stream as it's written. Relevant to `docs/CHECKSUM.md` and `editNs4Program`.
- `NW1` is the current-generation codec namespace (the `CSection*` types hang off
  it); older models likely have sibling codec namespaces.

### Layer B — Device transport: **raw USB via IOKit, not MIDI** ⚠️

This is the headline correction. **NSM does not link CoreMIDI.** Sound transfer to
and from the keyboard is a **vendor USB protocol over IOKit**:

- `Ymer::USB::CUSBMan`, `CStreamDuplex`, `CUSBDeviceDriverList`, `CFactory`,
  `CIOEvent`, `XUSBException` — a hand-rolled USB stack on `IOUSBDevice` + pipes
  (the binary carries the full `kIOUSB*` error table and "Unable to get interface
  endpoints").
- On top of it, a **file-transfer protocol**: `Ymer::Protocol::FileTransfer`
  (`CUpload`, `CDownload`, `CErase`, `CTransfer`, `CRateBase`).
- `Ymer::ProtocolManager` exposes the **device command set** (each a `CFTReq*`):

  `Download`, `DownloadBank`, `Upload`, `UploadBank`, `UploadStream`, `Copy`,
  `Move`, `Swap`, `Delete`, `Erase`, `Format`, `Convert`, `GetDependency`,
  `SetDependency`, `GetFocus`, `SetFocus`, `PartList`, `PartStates`,
  `PartitionState`, `Invalidate*`, `SetFileProps`, and `QryContentVersion`.

  Plus async notifications: `CFTNotifyStarted/Progress/Completed/State/PartitionState`.
- There **is** a MIDI-ish channel — `Ymer::Protocol::MIDIX` (`CMIDIX`, `CMIDIXEvent`)
  and `Protocol::InstrCtrl` (`CStrokeEvent`) — but it's **separate from sound
  transfer**, most likely panel/control + handshake. There is no SysEx bulk-dump
  path for programs.

> **Confirmed on hardware (2026-06).** Live USB recon (`scripts/nordusb.c`) of a
> connected Stage 4: VID `0x0FFC` / PID `0x002E`, firmware 3.40, **interface 0 is
> vendor-specific (`0xFF`)** with bulk OUT `0x03` (commands), bulk IN `0x82`
> (data), interrupt IN `0x81` (notifications) — and NSM holds it **exclusively**
> via two IOKit USB user-clients. Standard USB-MIDI is a *separate* interface (2,
> class 1/3). This is exactly the `Ymer::USB` + `CFTReq*`/`CFTNotify*` model.
> Full descriptors + the Phase-2 plan: `docs/PROTOCOL-RE.md` Step 1.

**Implication:** "talk to the Nord over SysEx" (the Phase-2 framing) is the wrong
model for *program transfer*. It's **Layer 2 in `PROTOCOL-RE.md`** — a vendor bulk
protocol over partitions — that is **confirmed**, not Layer 1. Real-time CC/NRPN
control (the `MIDIX`/InstrCtrl side) is the part that stays MIDI.

### Layer C — Cloud catalog (`libcurl` + S3)

- Factory sound catalog is fetched over HTTPS from
  `https://nord-sound-manager.s3.eu-west-3.amazonaws.com/clavia_sound_libraries.xml`
  (with a per-user `/clavia.xml` and a local `cache_db.xml`).
- This is the canonical source for OpenNord's **"you need these samples → official
  download" roadmap item**: the factory library has a real, fetchable manifest.

## 3. Model of operation

NSM mirrors the keyboard's storage as **partitions** (Program / Piano Library /
Sample Library), each holding **banks** of fixed **locations/slots**. The UI verbs
(Backup, Restore, Organize, Relink, Substitute, Bundle, Clean, Format) map onto the
`CFTReq*` commands above. "Relink/Substitute" act on the **dependency graph**
(`Get/SetDependency`) — i.e. which samples a program references — exactly the
id-based linkage OpenNord models with `Ns4SampleRef`.

## 4. Why this matters for OpenNord

| Project assumption | Verdict from the binary |
|---|---|
| CBIN container magic (`bits.ts`) | ✅ Confirmed — `Codec::CBinStream` / `CBINFileInputStream` |
| Section-based program model (`parse.ts`, `types.ts`) | ✅ Confirmed — exact section class names recovered |
| Samples referenced by id, audio separate (`LEGAL.md`) | ✅ Confirmed — `CSectionNSMP` + separate `CSmp*` codec / `.nsp` |
| Lazy 32-bit file CRC (`CHECKSUM.md`) | ✅ Consistent — `CMetaData::ILazyCRC` |
| Phase-2 "SysEx program dump" | ⚠️ **Corrected** — raw USB/IOKit bulk protocol, not MIDI SysEx |
| Factory sample resolution (`ROADMAP.md`) | ✅ Real catalog URL found (S3 `clavia_sound_libraries.xml`) |

## 5. Stage 4 document types it registers

`ns4p` (Program), `ns4b` (Backup), `ns4y` (Synth Preset), `ns4n` (Piano Preset),
`ns4o` (Organ Preset), `ns4pbundle` / `ns4ybundle` / `ns4nbundle` (bundles),
`nsmp4` (Nord Sample 4). Bundles are macOS **packages** (`LSTypeIsPackage`,
`NSPersistentStoreTypeKey = Binary`).

## 6. Disassembly appendix — the NW1 codec on-disk format

Static disassembly (`objdump -d` on the x86_64 slice; no decompiler) of the
`Ymer::Codec::NW1` reader functions. Addresses are file offsets in the thinned
x86_64 binary and will drift between builds — treat them as breadcrumbs, the
**shapes** are the result. The C++ sources are `NW1Codec.cpp`, `NW1Decode.cpp`,
`NW1Sections.cpp`. A second namespace, **`Zevs::NordSmp`**, holds the low-level
format structs (`SSectionHeader`, `EFormat`, `EZoneMode`).

### Byte order & primitives — **big-endian**

`CBinStream` exposes `GetU8/GetU16/GetU24/GetU32` (+ signed `GetS32`). Confirmed
big-endian: `NW1::PeekFormat` reads a `GetU32()` and compares it to `0x4E534D50`,
which is the ASCII `"NSMP"` in file order (`4E 53 4D 50`). A little-endian read
would compare against `0x504D534E`. So **all multi-byte fields are MSB-first.**
`CBinStream` is a cursor `{ buf, pos@0x8, base@0xc, len@0x10, dirty@0x14, hook@0x18 }`.

### Container vs. inner format

- **Program files** (`ns4p`, `ns4y/n/o`, …) use the **CBIN container** the app's
  own `bits.ts` already reads: ASCII `"CBIN"` at byte 0, a 4-char type tag
  (`"ns4p"`) at bytes 9–12. The CBIN body is the NW1 section stream below.
- `NW1::PeekFormat` separately sniffs **sample-family** files by magic:
  `GetU32 == "NSMP"` (Nord Sample) and `GetU24 == "NWS"` (Nord Wave Sample).
  These select an `EFormat` enum used throughout the section reader.

### Section stream = versioned TLV chunks

`CSectionIterator::Read_(Zevs::NordSmp::SSectionHeader*)` shows the header is
**format-version-adaptive** (it branches on `EFormat` at iterator+0x8):

| `EFormat` | Section header layout (big-endian) |
|---|---|
| **3 or 4** (NS3 / NS4 era) | `{ u32 id, u32 version, u32 size }` — 12 bytes |
| **≤ 2** (legacy models) | `{ u24 id, u16 size }` — 5 bytes |

`CSectionIterator::Next()` is a straight TLV walk: advance `pos += size`, read the
next header, stop at the stream end (`iterator+0x1c`). `CSectionBase::Seek` /
`SeekVersion` / `SeekVersionRange(min,max)` let a reader find a section by id and
accept only a version window — this is how the format tolerates firmware
evolution (older fields stay readable, new versions add fields).

Each section body is read inside a **`CScopedSectionReader`** (RAII, constructed
from the `SMetric` + `CBinStream` + an expected size). Its methods reveal the body
convention: `BytesLeft()` (bounds every read to the declared `size`),
`ReadPadAlign()` (sections are **padded to an alignment boundary**), and
`ReadExtensionVersion()` (trailing **extension fields are version-gated**, so a
v2 file can carry fields a v1 reader skips). `CBlockHdr::Read` wraps groups of
sections in an outer block header.

### The section readers (all `Read(SCodec, SMetric, CBinStream)`)

`CSectionProgram` (the program body), `CSectionPreset` (synth/piano/organ presets),
`CSectionCommon` (shared/master; note `CSectionCommon::S_ReadNameStr`),
`CSectionCategory`, `CSectionMap` (slot/zone map — it even sorts
`SMapAttributes::SZoneParams` after reading), `CSectionMeta`, `CSectionStroke`,
and `CSectionNSMP`.

**`CSectionNSMP::Read` (the sample reference → your `Ns4SampleRef`):** validates
the section version/size against the header, reads a pair of `GetU16` id/count
fields, then a **fixed 32-byte (`0x20`) name** validated as 7-bit ASCII (`cmpl
$0x7f` per character, via `wxString::ToAscii`), with sanity caps at `0x1000`. So a
sample reference is roughly `{ u16 id…, char name[32] }` — an id plus an embedded
display name, never audio. This is exactly the id+name linkage OpenNord models,
and confirms programs are safe to share (no sample audio in the section).

### What this unlocks for `src/lib/ns4/`

> **Note:** §6 is the raw-asm pass; the Ghidra decompile in §7 **corrects two
> guesses below** — the standalone `.ns4p` is *not* a TLV section stream (it's
> CBIN + a flat blob), and the 32-byte name belongs to the common section, not the
> sample ref. See §7 for the verified picture; the points here are kept as the
> reasoning trail.

1. **Validate the offset map structurally.** The `*.generated.ts` offsets are a
   flat bit-map; the *sectioned* file is **CBIN → blocks → versioned TLV sections**
   (the standalone `.ns4p` is flat — see §7). Cross-checking section boundaries
   from `SSectionHeader.size` is how the bundle/backup reader will be validated.
2. **Version awareness.** `SeekVersionRange` implies fields appear/disappear by
   section version — relevant when Stage 4 firmware updates change the format.
3. **Sample names.** A sample's name lives in its `'hdr'`/common section (32-byte
   field), not in `CSectionNSMP` — readable for the "sample-ID → name" item once
   `sample.ts` reads the `.nsmp4` section body.

### Reproduce

```bash
lipo "nsm/MacOS/Nord Sound Manager" -thin x86_64 -output /tmp/nsm_x64
nm /tmp/nsm_x64 | grep ' t ' | grep -E 'NW1.*Read|PeekFormat|SectionIterator' | c++filt
# disassemble one function by its nm address range:
objdump -d --no-show-raw-insn --start-address=0x1001a9430 --stop-address=0x1001a9a80 /tmp/nsm_x64
```

## 7. Decompilation results — the NW1 on-disk layout

Decompiled with **Ghidra 12.1.2 headless** (x86_64 slice). 106 functions in the
`Ymer::Codec::NW1` codec were dumped to C; the structures below are the result.

### File anatomy — two different shapes ⚠️ (corrected)

A crucial distinction, **verified against the real fixture**: the standalone
single-program `.ns4p` is **not** a section stream. It contains *no* section
tags — only `CBIN`, `ns4p`, and a flat bit-packed body. The NW1 TLV section codec
(`hdr`/`par`/`map`/…) decompiled below is the **`.nsmp4` / device-transfer /
internal** representation — *not* the bundle format (bundles & backups are ZIP
archives of flat `.ns4p` files; see `FORMAT.md`).

```
standalone .ns4p   (what OpenNord parses today)
└─ CBIN container        "CBIN", LE header bytes 0x00–0x2B (bank/loc/category/version/CRC32)
   └─ flat param body    @ 0x2C, big-endian bit-packed — ns4decode's offset map decodes this

.nsmp4 / device transfer (CFTReq) / internal   (the NW1 sectioned format)
└─ CBIN / NSMP container
   └─ NW1 section stream     big-endian; a sequence of TLV sections
      ├─ CBlockHdr           groups sections; carries a sample-encoding mode (see below)
      └─ sections…           each: SSectionHeader{tag,version,size} + payload + pad-align
```

This matches `docs/FORMAT.md`'s independent note that a `.nsmp4` body is
"`NSMP` container → `hdr` chunk holding the name → audio" — the `hdr` chunk is
exactly the `CSectionCommon` (`'hdr'`) section below. So the decompiled section
model documents the *sectioned* format; the flat `.ns4p` header is in §
"The CBIN header" of `FORMAT.md`.

### Primitives — **big-endian, definitively**

`CBinStream::GetU32` assembles `b0<<24 | b1<<16 | b2<<8 | b3` (MSB-first). The
stream is a buffered cursor that refills in `0x1000`-byte (4 KB) chunks via a
vtable read hook. `GetU8/U16/U24/U32` + signed `GetS32` are the field readers.

### `SSectionHeader` + the iterator

`CSectionIterator` walks the section stream. Header shape depends on the codec
`EFormat` (held at iterator+0x8):

| `EFormat` | Header read by `CSectionIterator::Read_` / `Next` |
|---|---|
| **3 or 4** (NS3 / NS4) | `GetU32 tag`, `GetU32 version`, `GetU32 size` — 12 bytes |
| **1 or 2** (legacy) | `GetU24 tag`, `GetU16 version`, `GetU32 size` |

`Seek(tag)` linearly calls `Next()` until `tag` matches. Accessors confirm the
cached fields: `GetTag()`=+0xc, `GetVersion()`=+0x10, `GetSize()`=+0x14. (There's
even a `FixOldMapBug()` called after each advance — a compatibility shim for a
historical map-section bug.)

### `EFormat` enum (from `PeekFormat`)

Sniffs a magic + a version word and returns the format ordinal:

| magic | version word | `EFormat` |
|---|---|---|
| `"NSMP"` (u32) | `0x28` (40) | **4 — Nord Stage 4 era** |
| `"NSMP"` (u32) | `0x1e` (30) | **3 — NS3 era** |
| `"NWS"` (u24) | `0x0b` (11) | 2 (legacy wave) |
| `"NWS"` (u24) | `0x08` (8) | 1 (legacy wave) |
| else | — | 0 (unknown) |

### Section tags & versions (recovered from the static initializer)

The `kSec*` tag structs live in BSS — they're built at startup by
`__GLOBAL__sub_I_NW1Sections.cpp` via `SSectionHeader(tag, version[, sub])`.
Disassembling that initializer yields the FourCC tags and the per-format versions
(NS4 era = the `_f3`/`_f4` rows; only the current-gen ones shown):

| Section | tag (FourCC) | NS3 (`_f3`) ver | NS4 (`_f4`) ver |
|---|---|---|---|
| Program params | `'par'` (`00 70 61 72`) | 9 (single `_f1`) | — |
| Common / header | `'hdr'` (`00 68 64 72`) | 10 | 11 |
| Map (zones) | `'map'` (`00 6d 61 70`) | 12 | 15 (+`_f41…46` 16–21) |
| Preset (style) | `'sty'` (`00 73 74 79`) | 7 | 8 (+ betas 9–17) |
| Category | `'cat'` (`00 63 61 74`) | 7 | — |
| Stroke | `'stk'` (`00 73 74 6b`) | 10 | 11 (`_f31`) |
| Meta | `'meta'` (`6d 65 74 61`) | 1 | — |
| File magic | `'NSMP'` / `'NWS'` | 30 | 40 |

Tags are 3 ASCII chars stored as a big-endian u32 with a leading `0x00` (`'meta'`
and the file magics are the only true 4-char tags). The proliferation of `map`
versions (12→21) shows the zone/keyboard-map section is where the format churns
most across firmware.

### Section payload bounding & alignment

- A section body is read inside `CScopedSectionReader`, which captures the start
  position and bounds every read to the header's `size` (`BytesLeft()`).
- `ReadPadAlign()` pads to `pos % SMetric.align == 0` (reads `align − rem` bytes).
  The `align` value is a runtime field on `SMetric` (set per-format, not a literal
  in the readers) — small (2/4); not yet pinned to an exact constant.
- `ReadExtensionVersion()` reads a trailing `u32` **only if >4 bytes remain** in
  the section — so newer firmware appends version-gated fields a older reader skips.

### Section readers — all `Read(SCodec, SMetric, CBinStream)`

Every reader: build a `CSectionIterator`, pick the section's expected tag/version
from a **per-format constant table** (`kSec*_f1 … _f3`, indexed by `EFormat-1`;
NS3/NS4 use the `_f3` constants), `Seek` it, validate `{version, subversion}`
(returns 2/3/4 on mismatch/not-found), then read the body. Legacy formats (1/2)
route through `CDecodeLegacy`.

**`CSectionProgram::Read` — the program body (the prize):**

```
seek sub-section tag = kSecProgram_f1, check version/subversion
byte[33]   fixed attribute header        (copied raw into SProgramAttributes)
u24        type                          → SetType
u24        date                          → SetDate
u24        sourcePartition  ┐ SetSourceLocation(partition, location)
u24        sourceLocation   ┘
u24        category                      → SetCategory
u24        binaryVersion                 → SetBinaryVersion
u24        binaryLength                  (rejected if > 0x100000 = 1 MiB)
byte[binaryLength]  PARAMETER BLOB       → SetBinary   ← what ns4decode decodes
pad to (SMetric.align) boundary
```

So in the **sectioned** format the parameter blob is a length-prefixed payload
inside the `'par'` section, preceded by a 33-byte attribute header and the 6×u24
metadata, then trailing pad. **In the standalone `.ns4p` none of that framing is
present** — the body at `0x2C` is the bare bit-packed blob (no `'par'` tag, no
length prefix). So this layout describes how a program rides inside a bundle /
backup / device transfer, where the metadata (type/category/date/source-location/
version) travels in the section; the standalone file carries the same logical
metadata in its fixed CBIN header instead (`FORMAT.md`).

**Other sections:**
- `CSectionCommon::S_ReadNameStr` — names are a **fixed 32-byte field** (+1 trailing
  byte), 7-bit ASCII. This is the program/preset name.
- `CSectionMeta::Read` — `{ u16, u32, u32 }` (flags + two 32-bit words, likely
  created/modified timestamps).
- `CSectionNSMP::Read` — validates tag/version/size and reads a `u16` checked
  against the `SMetric` (a sample-count/id guard). (Correction to §6: the 32-byte
  ASCII name seen in raw asm is `S_ReadNameStr`, the common name — not the sample
  ref.)
- `CSectionPreset::Read` — same shape as Program; uses format-versioned attribute
  structs (`SPreset5` / `SPreset7`) for `ns4y/n/o` presets.
- `CSectionMap::Read` — reads a zone/slot map and sorts `SMapAttributes::SZoneParams`
  (relevant to the KB-zone items in the interpretation hard tail).
- `CBlockHdr` — an outer block header exposing `GetBitWidth / GetFilterOrder /
  GetLinearMode / GetSampleCnt / IsStop`: a **DPCM / linear-predictive encoding**
  descriptor. This is how *sample audio* is packed (`CSmp*` codec); program param
  blobs are stored raw (the Program reader copies bytes verbatim), so this matters
  for `.nsmp4`, not `.ns4p`.

### What this changes for `src/lib/ns4/`

1. **Standalone-file metadata is now surfaced.** The flat `.ns4p` keeps its
   metadata in the fixed CBIN header (`FORMAT.md`), not in a `'par'` section.
   `parse.ts` now reads bank / location / category / program version from there
   into `NS4Program` (`bits.ts:readCbinHeader`, `categories.ts`) — done as part of
   this work. (The 33-byte attribute header + 6×u24 fields above are the
   *sectioned*-format equivalents, for the future bundle/backup reader.)
2. **The sectioned codec is the `.nsmp4` / transfer reader.** When OpenNord grows
   a real `.nsmp4` body reader or Phase-2 device transfer, this TLV walk (tags +
   versions above) is the spec — not the flat `.ns4p` path. (Bundles/backups are
   ZIPs of flat `.ns4p` files, a separate concern — `FORMAT.md`.)
3. **Version-keying.** Sections validate a `{version, subversion}`; `EFormat 4` ==
   Stage 4 (file magic version `0x28`). When firmware bumps the format, that's the
   field that moves; the standalone file mirrors it at CBIN `0x14` (e.g. `3.13`).
4. **Sample names.** `CSectionNSMP` / the `'hdr'` chunk in a `.nsmp4` carry the
   sample name inline (32-byte field) — readable for the "sample-ID → name"
   hard-tail item when `sample.ts` grows to read the section body.

### Reproduce

```bash
HEADLESS=/opt/homebrew/Cellar/ghidra/<ver>/libexec/support/analyzeHeadless
lipo "nsm/MacOS/Nord Sound Manager" -thin x86_64 -output /tmp/nsm_x64
# one-time import + auto-analysis (slow):
"$HEADLESS" /tmp/proj nsm -import /tmp/nsm_x64 -overwrite
# re-run the dumper against the cached project (fast); script in scripts/:
NSM_OUT=/tmp/nsm_decomp "$HEADLESS" /tmp/proj nsm -process nsm_x64 -noanalysis \
  -scriptPath scripts -postScript DumpSections.java
```

Note: Ghidra 12 dropped Jython — post-scripts must be **Java** (`.java`) unless you
launch via PyGhidra.

### Still open

The 33-byte attribute header and the exact `SMetric.align` value aren't named yet,
and the `kSec*` tag constants are data symbols (e.g. `kSecProgram_f1`) whose
4-char values weren't dereferenced in this pass. Mapping each *bit* of the param
blob to a named parameter is still ns4decode's domain — the decompile explains the
*envelope*, ns4decode explains the *contents*; together they're the full picture.
