# Nord Stage 4 coverage

What "full coverage of the Stage 4" means here: every kind of content the instrument
holds can be **read**, **shown in musician terms**, **backed up and restored**, and
(where it makes sense) **written back** by OpenNord. This page is the evidence-based
audit of where that stands (2026-10-10, branch `claude/stage4-coverage`, stacked on the
NSM 9.22 / `.npno`-audio work). Every cell cites code. "HW" means confirmed on a real
Stage 4 (`docs/PROTOCOL-RE.md`). Otherwise it is file-validated or untested.

Legend: ✅ done · 🟡 partial (see note) · ❌ missing · — doesn't apply.

## The content

The Stage 4 partition list is in `src/lib/clavia/partitions.ts` (`MODELS['stage-4']`), with
indices from `docs/PROTOCOL-RE.md`. NSM 9.22's `CStage4` constructor disagrees on 7–9 (see
*Open hardware questions*).

| # | Partition | File | What it is |
|---|---|---|---|
| 0 / 1 | Piano (factory) / Piano | `.npno` | piano libraries. 0 and 1 are one physical region (`PROTOCOL-RE.md`, *Partition capacity*) |
| 2 / 3 | Pedal (factory) / Pedal | ? | pedal-noise sets. File type never seen |
| 4 / 5 | Sample Library (factory) / Sample Library | `.nsmp4` (+ older `.nsmp`/`.nsmp3`) | sample-synth sounds. 4 and 5 are one region |
| 6 | Program | `.ns4p` | programs, 8 banks × 64 |
| 7 / 8 / 9 | Organ / Piano / Synth Preset | `.ns4o` / `.ns4n` / `.ns4y` | single-engine presets (order disputed) |
| 10 | Live | `.ns4l` | Live programs, same body as a program |
| 11 | Settings | `.ns4t` | the global settings, one ~80-byte file |
| (12) | E2P FFS | — | housekeeping. NSM lists it, the device's partition list (12 entries) doesn't |
| — | Backup | `.ns4b` | ZIP of all of the above + `meta.xml` |

**No songs or set lists on the Stage 4.** NSM 9.22's `CStage4` adds no Song/Set List
partition (`NORD-PRODUCT-LINE.md`, *Partition order*). The Stage 3 has Songs (`ns3s`), and
the Electro 5/6, Piano 6 and Grand 2 have Set Lists. `ns4t` is **Settings**, not a set
list: the hardware read of partition 11 returned an `ns4t` file, and NSM's `CStage4` adds
Settings [ns4t]. The old "`t` = Set List (inferred)" taxonomy row is corrected in
`NORD-PRODUCT-LINE.md`. `ns4g` appears among NSM's strings but in no Stage 4 partition. Its
kind is unknown.

## The matrix

| Content | Recognize | Decode | Show (musician terms) | Back up / restore | Write / push | On hardware |
|---|---|---|---|---|---|---|
| **Program** `.ns4p` | ✅ `clavia/nord-file.ts`, `ns4/codec.ts` | ✅ `ns4/parse.ts` + generated maps. 0-mismatch vs ns4decode on the fixture (`ns4/parse.test.ts`). Gaps below | ✅ `components/program/` (engine cards, FX, morphs, zones, sample refs) | ✅ backup `device/backup.ts` (partition 6). Restore with capacity guard. Offline organizer `device/backup-io.ts`. **New:** "Check backup" `ns4/backup-check.ts` | ✅ `device/transfer.ts:pushFile` via `components/device/usePushFlow.ts`. Delete, move, swap, arrange `device/reorg.ts` + `execute.ts`. Writer `ns4/writer.ts`. Stage 2/3 → 4 conversion `lib/migrate/` | **HW**: enumerate 356, read, write to C:88 |
| **Live** `.ns4l` | ✅ same codec (`ns4/codec.ts` tags) | ✅ as a program | 🟡 in the Library as a program (`folder/classify.ts`). Not labelled as Live, no Live view on the device screen | 🟡 in backup/restore (`device/ns4b.ts` partition 10) | ❌ no UI. `pushFile` could, untested | ❌ partition 10 not exercised |
| **Organ / Piano / Synth preset** `.ns4o/.ns4n/.ns4y` | ✅ `clavia/preset-kind.ts` | ✅ `ns4/preset.ts`: the program engine block relocated to byte 49. Validated against local factory presets (gitignored) | 🟡 `components/preset/PresetInspector.tsx`: headline + per-layer rows. Row names are ns4decode's (e.g. "analog wave/partial (knob 3)"), not panel words | 🟡 backup/restore by extension → partition 7/8/9 (`device/ns4b.ts`). **Order disputed** | ❌ no push UI | 🟡 enumerate + pull via registry indices (`device/presets.ts`). Which kind sits at 7/8/9 is unconfirmed |
| **Settings** `.ns4t` | 🟡 by extension in backups (`device/ns4b.ts`, **new** `backup-check.ts`). `identifyNordFile` returns kind `unknown`. Folder scan ignores it | ❌ no parameter map | ❌ | 🟡 backed up (partition 11) **and restored** | 🟡 restore writes it via `pushFile`. Never confirmed on hardware | 🟡 **HW read** only (`scripts/re-archive/nordsettings.c`) |
| **Piano** `.npno` | ✅ `ns4/nsp.ts` (name, version, key map). **Fixed**: the v5 checksum false alarm | ✅ **audio**: `ns4/nsp-audio.ts`, bit-exact on v5 mono + v6 stereo | ✅ `components/piano/PianoInspector.tsx` + `PianoListen.tsx` (audition), factory deep link | 🟡 not in OpenNord's backup (`USER_PARTITIONS` skips partition 1). Restore skips them with official download links. NSM backups' pianos are indexed, auditionable and now **checked note by note** | ❌ push not built. Offload (delete) via `library/PianosContext.tsx` | 🟡 enumerate + pull (`device/pianos.ts`), capacity (`device/capacity.ts`) |
| **Sample** `.nsmp4` (+ `.nsmp`/`.nsmp3`) | ✅ `clavia/sample-identify.ts`, `ns4/nsmp.ts` | ✅ audio, codecs 1–4 (`ns4/nsmp.ts:decodeNsmp`), zones, loops | ✅ `components/sample/` (key map, playable keyboard, MIDI rompler, edit, convert, WAV import) | 🟡 not in OpenNord's backup (partition 5 skipped). Restore skips **all** samples as "factory", user samples included. NSM backups' samples are indexed and **now checked** (structure + checksum, not audio) | 🟡 writes **files** (`nsmp-write.ts`, `nsmp-convert.ts`). No device push. Offload via `library/SamplesContext.tsx` | 🟡 enumerate + pull (`device/samples.ts`), capacity, unused-sample finder (`device/dependencies.ts`) |
| **Pedal** (partitions 2/3) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ never enumerated |
| **Backup** `.ns4b` | ✅ `clavia/backup/backup-index.ts` (meta.xml `product_id=46`) | ✅ streamed ZIP (`clavia/backup/zip-directory.ts`, ZIP64) | ✅ Library buckets, organizer (`components/device/BackupOrganizer.tsx`). **New:** "Check backup" (`components/device/BackupCheck.tsx`) | — | ✅ re-export (`device/backup-io.ts:streamBackupTo`), device backup (`device/backup.ts`) | 🟡 index smoke-tested on one real NSM backup (maintainer's machine). Restore orchestration untested end to end |
| **Sample dependencies** (which samples a program needs) | ✅ `device/dependencies.ts` (`CQryFileGetDependency`) | ✅ | ✅ "you need these" + official downloads (`device/factory.ts`) | — | — | **HW** |
| **Live control** (CC/NRPN) | — | — | ✅ `lib/midi/` | — | ✅ | proven (standard MIDI) |

## Program decode gaps (measured)

Measured on the three committed fixtures (`src/lib/ns4/__fixtures__/*.ns4p`, 868 bytes each)
with `buildParamMap()` + `coverage.ts`:

- **406 parameters**, claiming **700 of 868 bytes (80.6%)**. The CBIN header is 44 bytes, 11
  of them claimed (tag, bank, slot, category, version, checksum). The body is **689 of 824
  bytes (83.6%)**, leaving **135 unclaimed body bytes** in 45 ranges.
- The largest unclaimed run is **bytes 55–82**, an optional packed 4-byte-record region.
  The others are mostly 1–4-byte tails between bit-packed fields: 85–86, 88–93, 106, per-layer
  pairs at 138/141/145/169/172, 226–228, 238–241, 251–253, 263–265, the synth-layer tails
  401–406, 454–457, 505–508, 556–559, 604–607, 652–655, 700–703, … 866–867.
  `ns4/extra-params.ts` records the corpus retry (357 programs): 55–82, 106, 401, 418/469/520
  (synth Extern, active in 0/357) and 300/355 are **blocked on a hardware differential**.
  Export a program, move one control, re-export, then `diffBytes`.
- **Parameters that render as plain numbers: 21–22 per fixture**, matching the roadmap's
  "~21". Every one is **correct as a number** (ns4decode's CSVs show the same integers):
  checksum, octave shift (organ/piano/synth, at 0), drawbars 1–9, unison level (piano,
  synth), dyn comp, extern program / CC VAL1 / VAL2 (+ morphs), amp env velocity, filter
  drive, and the FM partial number on knob 3. **No parameter is wrongly left raw on these
  fixtures.** The remaining program work is the unclaimed bytes, not interpretation.
- Program category (CBIN 0x10): ids 47+ are unnamed in the firmware table and surface as raw
  ids (`clavia/categories.ts`).

## What this branch closed

1. **"Check backup"** (`src/lib/ns4/backup-check.ts`, UI `components/device/BackupCheck.tsx`
   in the backup organizer). This is the first use of the new piano decoder on backups. One
   pass over a `.ns4b`, one entry at a time through ranged reads, nothing written:
   - **The archive.** Every entry is re-hashed against the CRC-32 the ZIP central directory
     recorded (PKWARE APPNOTE 4.4.7; `ZipEntry.crc32` is now read in `zip-directory.ts`).
     This catches damage to the backup file for every content type.
   - **The file's own check value**, only where it is proven: programs (`docs/CHECKSUM.md`),
     v6 pianos, format-1 samples. Live, preset and settings CRCs are **not** checked because
     they are unconfirmed on NSM-written files, so a mismatch wouldn't prove damage.
   - **The content reads.** Programs and Live go through `parseNs4Program`, presets through
     `parseNs4Preset`, settings are recognized by tag. Pianos: header, note directory, then
     **every recorded note decoded to its directory length** (`nsp-audio.ts`). Samples get
     the section tree and stroke count, but **not audio**, because the NW1 sample decoder
     runs at ~2.5 MB/s (a 1 GB library would take ~7 min). Pianos decode at ~8 MB/s.
   - Musician-facing results: "Everything in this backup checks out.", "356 programs ·
     3 presets · …", "Every note of all 12 pianos plays back.", or a per-file list ("Broken
     Lead — Damaged — your Nord may refuse to load this program."). Includes progress and Stop.
   - It runs in a Web Worker (`backup-check-host.ts`), so a check of many pianos (minutes)
     never freezes the page. Without Workers (or when the worker fails to load) it runs inline and yields every ~50 ms of work,
     CRCs included (in 1 MB slices). The button reads "Check the opened backup": it checks the
     file as opened, not the reorganized copy the organizer downloads.
   - Verified: unit tests on synthetic backups (every content type, archive damage, program
     CRC damage, a broken v5 piano note caught by decoding alone, cancel, wording) plus a
     component test. Locally against the three real factory pianos in `$NPNO_DIR`, built into
     an in-memory backup: all notes of v5.30 CP80, v5.30 Wurlitzer and v6.10 Clavinet decode.
     **Still needed:** run `NS4B_FILE=<real NSM backup> npx vitest run
     src/lib/ns4/backup-check.test.ts` on a real NSM backup to confirm zero false alarms on
     NSM-written programs, presets and samples.
2. **v5 piano "checksum mismatch" false alarm** (`src/lib/ns4/nsp.ts`). v5 `.npno` files use the
   format-0 header and have no CBIN CRC: `CNSP` sits at 0x18. `readNsp` verified one anyway and
   warned on every intact v5 piano. It now checks only when the field exists
   (`NspFile.hasChecksum`), the same rule `nsmpHasChecksumField` applies to samples. Verified
   on the real v5.30 CP80 and Wurlitzer and the v6.10 Clavinet (`$NPNO_DIR` test). The synthetic
   test piano builder now writes the v6 format-1 header and CRC like the real files.
   Documented in `NSP-FORMAT.md`.

## Gaps that remain, and exactly what each needs

| Gap | Why it's open | What closes it |
|---|---|---|
| **Settings decode** (`.ns4t`) | No parameter map. The blob is bit-packed like a program body (`PROTOCOL-RE.md`) | Hardware differentials: read Settings, change **one** global setting on the panel, read again, diff (`coverage.ts:diffBytes`). Repeat per setting. Owner-made settings files are the owner's own data, so they're fine to commit as fixtures |
| **Preset partition order 7/8/9** | NSM vs `PROTOCOL-RE.md` (below). Backup folders, restore targets and preset browsing depend on it | One read-only connect to a Stage 4 with at least one preset in each preset partition. `confirmProgramPartition` (`device/connect-probe.ts`) already records the full partition→file-type map in diagnostics (`device.partition-probe`) |
| **Restore of an NSM backup's presets** | `device/ns4b.ts` maps `.ns4o`→7, `.ns4n`→8, `.ns4y`→9. If NSM's order is right, restore writes presets into the wrong partition | The probe above, or make restore route by the file-type evidence the probe sees |
| **Settings / Live / preset restore on hardware** | `restore()` writes partitions 10/11/7–9 with the program write sequence. Only partition 6 writes were confirmed | A restore to a spare Stage 4 (or a backed-up one) of a backup holding one Live program, one preset per kind and Settings, then re-read and compare bytes |
| **CBIN checksum on Live / preset / settings files** | Not confirmed on NSM-written files (OpenNord's own pulls patch it) | A real NSM backup: `NS4B_FILE` test above, plus `verifyNs4Checksum` over its `.ns4l/.ns4o/.ns4n/.ns4y/.ns4t` entries |
| **Preset value regression fixture** | Committed preset tests use zeroed bodies. Value correctness was checked only against gitignored factory presets | A **user-made** preset of each kind (organ/piano/synth) exported by a Stage 4 owner, plus a description of its panel settings. User presets are shareable (`LEGAL.md`) |
| **Program body: 135 unclaimed bytes** (55–82 etc.) | Corpus statistics are exhausted (`extra-params.ts`) | Hardware differentials, one control at a time, for the controls the manual lists without a mapped field |
| **Pedal partitions** (2/3) | File type never observed. No code enumerates them | The same read-only probe (file types at 2/3), then one pedal file |
| **Sample / piano push to the device** | Large writes need erase-block handling (`CReqEraseBlock`, `PROTOCOL-RE.md`). Untested | Hardware session: write a small user sample to a backed-up Stage 4, re-read and compare, then a piano |
| **User samples in OpenNord's own backup / restore** | `USER_PARTITIONS` excludes partition 5. Restore skips every sample and labels them "factory" | Follows from sample push. Telling user from factory can use the hdr factory flag (`ns4/nsmp.ts:hdrFactoryFlag`) |
| **Offload rollback for samples/pianos** | `execute.ts` rolls back by pushing the pulled file back, which is an untested large write | Same as sample push |
| **Sample audio in "Check backup"** | Decoder throughput (~2.5 MB/s) | A faster NW1 decode path (the BigInt bit reader in `nsmp-codec.ts` is the cost) or a worker. Opt-in deep check |
| **Live labelling** | `.ns4l` shows as a program, without saying it's the Live set | UI only (no RE needed): tag Live entries in the Library and show partition 10 on the device screen |
| **Preset row names** | ns4decode parameter names surface in the preset rows | UI only: reuse the program view's engine cards for a preset's single engine |
| **`ns4g`** | Seen in NSM strings, kind unknown, not a Stage 4 partition | An `ns4g` file or the NSM code that writes one |
| **Sample id ↔ file link** | Hypothesis: a program's 32-bit sample id is the sample file's CRC (`FORMAT.md`) | A program plus the exact `.nsmp4` it references |

## Open hardware questions (listed, not resolved)

- **Stage 4 preset partition order.** NSM 9.22 `CStage4::CStage4` adds **7 Synth Preset
  [ns4y] · 8 Organ Preset [ns4o] · 9 Piano Preset [ns4n]**. `PROTOCOL-RE.md` lists
  **7 Organ · 8 Piano · 9 Synth** and says a live `CQryPartList` matched its order. The
  registry, `device/ns4b.ts` and `device/presets.ts` follow `PROTOCOL-RE.md`. Program (6)
  agrees in both.
- **Partition count.** NSM's `CStage4` adds a 13th partition (12, E2P FFS). The hardware
  `CQryPartList` reply carried 12. Possibly a host-side partition the device doesn't report.
- **Firmware version.** `PROTOCOL-RE.md` records the validating Stage 4 as "firmware 3.40",
  but NSM's Stage 4 floor is OS 0.90 (recommended 1.00) and Nord's public Stage 4 OS is v1.66.
  3.40 is probably a different counter. Also, `device/ns4b.ts:buildMetaXml` writes a fixed
  `product_version="154"`, not the connected device's.
- **`CRpyPartState` free/used order.** Reasoned from documented capacities, not re-read live
  (`PROTOCOL-RE.md`).
- **Settings write.** Reading partition 11 is HW-validated. Writing it (which restore does) is not.
- **v5 `.npno` integrity.** No CBIN CRC (see above). Whether the 6 bytes after the v5 `CNSP`
  tag are a checksum is unknown.
