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
| **Program** `.ns4p` | ✅ `clavia/nord-file.ts`, `ns4/codec.ts` | ✅ `ns4/parse.ts` + generated maps. 0-mismatch vs ns4decode on the fixture (`ns4/parse.test.ts`). Every body byte is accounted for (below): 90% hold parameters, the rest are block lengths, the format version and reserved bits | ✅ `components/program/` (engine cards, FX, morphs, zones, sample refs) | ✅ backup `device/backup.ts` (partition 6). Restore with capacity guard. Offline organizer `device/backup-io.ts`. **New:** "Check backup" `ns4/backup-check.ts` | ✅ `device/transfer.ts:pushFile` via `components/device/usePushFlow.ts`. Delete, move, swap, arrange `device/reorg.ts` + `execute.ts`. Writer `ns4/writer.ts`. Stage 2/3 → 4 conversion `lib/migrate/` | **HW**: enumerate 356, read, write to C:88 |
| **Live** `.ns4l` | ✅ same codec (`ns4/codec.ts` tags) | ✅ as a program | 🟡 in the Library as a program (`folder/classify.ts`). Not labelled as Live, no Live view on the device screen | 🟡 in backup/restore (`device/ns4b.ts` partition 10) | ❌ no UI. `pushFile` could, untested | ❌ partition 10 not exercised |
| **Organ / Piano / Synth preset** `.ns4o/.ns4n/.ns4y` | ✅ `clavia/preset-kind.ts` | ✅ `ns4/preset.ts`: the program engine block relocated to byte 49. Validated against local factory presets (gitignored) | 🟡 `components/preset/PresetInspector.tsx`: headline + per-layer rows. Row names are ns4decode's (e.g. "analog wave/partial (knob 3)"), not panel words | 🟡 backup/restore by extension → partition 7/8/9 (`device/ns4b.ts`). **Order disputed** | ❌ no push UI | 🟡 enumerate + pull via registry indices (`device/presets.ts`). Which kind sits at 7/8/9 is unconfirmed |
| **Settings** `.ns4t` | 🟡 by extension in backups (`device/ns4b.ts`, **new** `backup-check.ts`). `identifyNordFile` returns kind `unknown`. Folder scan ignores it | ❌ no parameter map | ❌ | 🟡 backed up (partition 11) **and restored** | 🟡 restore writes it via `pushFile`. Never confirmed on hardware | 🟡 **HW read** only (`scripts/re-archive/nordsettings.c`) |
| **Piano** `.npno` | ✅ `ns4/nsp.ts` (name, version, key map). **Fixed**: the v5 checksum false alarm | ✅ **audio**: `ns4/nsp-audio.ts`, bit-exact on v5 mono + v6 stereo | ✅ `components/piano/PianoInspector.tsx` + `PianoListen.tsx` (audition), factory deep link | 🟡 not in OpenNord's backup (`USER_PARTITIONS` skips partition 1). Restore skips them with official download links. NSM backups' pianos are indexed, auditionable and now **checked note by note** | ❌ push not built. Offload (delete) via `library/PianosContext.tsx` | 🟡 enumerate + pull (`device/pianos.ts`), capacity (`device/capacity.ts`) |
| **Sample** `.nsmp4` (+ `.nsmp`/`.nsmp3`) | ✅ `clavia/sample-identify.ts`, `ns4/nsmp.ts` | ✅ audio, codecs 1–4 (`ns4/nsmp.ts:decodeNsmp`), zones, loops | ✅ `components/sample/` (key map, playable keyboard, MIDI rompler, edit, convert, WAV import) | 🟡 not in OpenNord's backup (partition 5 skipped). Restore skips **all** samples as "factory", user samples included. NSM backups' samples are indexed and **now checked** (structure + checksum, not audio) | 🟡 writes **files** (`nsmp-write.ts`, `nsmp-convert.ts`). No device push. Offload via `library/SamplesContext.tsx` | 🟡 enumerate + pull (`device/samples.ts`), capacity, unused-sample finder (`device/dependencies.ts`) |
| **Pedal** (partitions 2/3) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ never enumerated |
| **Backup** `.ns4b` | ✅ `clavia/backup/backup-index.ts` (meta.xml `product_id=46`) | ✅ streamed ZIP (`clavia/backup/zip-directory.ts`, ZIP64) | ✅ Library buckets, organizer (`components/device/BackupOrganizer.tsx`). **New:** "Check backup" (`components/device/BackupCheck.tsx`) | — | ✅ re-export (`device/backup-io.ts:streamBackupTo`), device backup (`device/backup.ts`) | 🟡 index smoke-tested on one real NSM backup (maintainer's machine). Restore orchestration untested end to end |
| **Sample dependencies** (which samples a program needs) | ✅ `device/dependencies.ts` (`CQryFileGetDependency`) | ✅ | ✅ "you need these" + official downloads (`device/factory.ts`) | — | — | **HW** |
| **Live control** (CC/NRPN) | — | — | ✅ `lib/midi/` | — | ✅ | proven (standard MIDI) |

## Program body: fully accounted for (2026-10-12)

The body is now laid out from the firmware's own parameter registry (Stage 4 OS 1.66,
`FUN_c01a44c4`: 422 parameters in 21 buffers, 11 of them program buffers), generated into
`src/lib/ns4/layout.generated.ts` by `scripts/gen-fw-program-maps.py stage-4`. The body is
the same block chain as the other ARM models: a u32 format version (3.13 as written by
OS 1.66; 3.07–3.13 in real files), then 24 blocks, each a length byte and MSB-first fields
in registration order plus reserved bits.

| Blocks | Buffer | Payload bytes |
|---|---|---|
| Common | `Buffer_kMultiCom` | 44 |
| Organ | `Buffer_kOrgCom` | 17 |
| Organ A, B: layer · drawbars · vib/perc | `Buffer_kOrg` · `Buffer_kOrgDrawbar` · `Buffer_kOrgVibPerc` | 3 · 23 · 2 |
| Organ effects | `Buffer_kFx` | 54 |
| Piano | `Buffer_kPnoCom` | 12 |
| Piano A, B | `Buffer_kPno` | 11 |
| Piano A, B effects | `Buffer_kFx` | 54 |
| Synth | `Buffer_kSynCom` | 30 |
| Synth A, B, C (with the layer's Extern parameters) | `Buffer_kSynLay` | 50 |
| Synth A, B, C sound | `Buffer_kSynSnd` | 47 |
| Synth A, B, C effects | `Buffer_kFx` | 54 |

Of the 824 body bytes: **745 hold parameters**, 24 are block lengths, 4 the format version
and 51 hold only reserved bits. No byte is unidentified.

**Checked on 365 real files** (357 programs + 8 Live, local corpus): every block length
matches, every reserved and padding bit is zero, and every value is inside its firmware
range. Negative-minimum fields are two's complement (13 of them fall out of range read as
`value − min`); a morphable parameter is followed by its Wheel, After Touch and Ctrl Pedal
deltas, each one bit wider and stored as `delta + (max − min)`. Against the ns4decode-derived
map (`offset-map.generated.ts`): 807 of its 877 body fields sit at the same bit with the same
width, and the other 70 are parts of one firmware parameter (`src/lib/ns4/layout.test.ts`).

What the older map left unclaimed, now named:

- **File bytes 55–82** (the "optional 4-byte records"): the program's preset links —
  organ / piano / synth preset position (10 bits each) and a 32-bit name hash per preset
  (organ, piano A/B, synth A/B/C), then the layer counts.
- **52–54, 84–87:** master clock rate and keyboard sync, aux keyboard, audio routing per
  layer, pedal tap / layer-scene enables.
- **105–109:** rotary rotor and horn angle, stop preset, mic distance, the rotary speed morphs.
- **417–423 (and per synth layer):** Extern — velocity curve, wheel / aftertouch / pedal
  enables, both CC numbers, bank LSB/MSB, send on load.
- **400–401:** multi-layer filter and LFO, synth aux keyboard control.
- The "saturated tails" at 300/355: the delay tempo is one 14-bit parameter with three
  15-bit morph deltas.

**The program view reads from both** (`src/lib/ns4/maps.ts:buildParamMap`). The
ns4decode-derived map stays the base, because every value table is keyed on its ids; the
firmware layout corrects and extends it (`src/lib/ns4/firmware-params.ts`):

1. **Corrected: the delay tempo's morphs.** The port read 8 bits at +14, +22 and +30 from
   the tempo. The firmware stores three 15-bit deltas at +14, +29 and +44, so the After Touch
   and Ctrl Pedal rows read across delta boundaries and showed "20 ms (750 x4 bpm)" on every
   program without such a morph. All three rows now read their whole delta (`Param.morphOf`):
   "none" only when the delta is zero, else the tempo at the full-precision target.
   ns4decode's reference CSVs in `__fixtures__/expected/` still carry the old values on
   those rows.
2. **Added: 62 parameters the port never claimed.** 31 are settings a player has, shown
   under "All parameters" (437 in all): master clock tempo and keyboard sync, aux keyboard
   (on/off, curve, and the layers it plays per engine), pedal tap tempo and layer scene, the
   per-program output bus of every layer and the rotary, rotary type, polyphonic percussion, multi-layer
   filter and LFO, and each synth layer's Extern settings. The other 31 are marked
   `internal`: identified and listed in the decode inspector, but kept out of the product
   rows because they are editor state (panel focus, effects section mode), links the
   instrument resolves (preset positions, name hashes, layer counts), or saved state and an
   unused flag (the rotary rotor and horn angles, `Edt_Syn_kLibName`; see below). Which is which is one table,
   `SETTINGS` in `firmware-params.ts`.

   **Value labels are the firmware's own**, read from OS 1.66. The menu builders
   (`FUN_c0154278`: system and sound menus; `FUN_c01956c8`: organ menu) construct each item
   with its label, its parameter id and an array of value strings (`FUN_c00dde4c`), which
   ties a value to its text without guessing. The Extern pages draw their own text.

   | Parameter (id) | Menu label | Values |
   |---|---|---|
   | `Edt_Com_kMasterClockKbdSync` (151) | KBS | Off · Soft · Hard |
   | `Edt_Com_kAuxKbdVelCurve` (229) | Keyboard Curve | Soft · Medium · Hard |
   | `Edt_OrgCom_kAuxKbdControl` (357), `Edt_PnoCom_kAuxKbdControl` (337) | Aux Keyboard Layers | -- · A- · -B · AB |
   | `Edt_SynCom_kAuxKbdControl` (249) | Aux Keyboard Layers | --- · A-- · -B- · --C · AB- · A-C · -BC · ABC |
   | `Edt_Com_kAudioRoutingBusOrg` / `PnoA` / `SynA` (88, 90, 92) | (output routing) | Main · Sub I · Sub II · Sub III |
   | `Edt_Com_kAudioRoutingBusPnoB` / `SynB` / `SynC` (91, 93, 94) | (output routing) | Main · Sub I · Sub II · Sub III · same as piano A / synth A / synth B |
   | `Edt_Com_kAudioRoutingBusLeslie` (89) | (output routing) | Main · Sub I · Sub II · Sub III · same as organ · Auto |
   | `Edt_OrgCom_kLeslieMicDistance_revB` (224) | Rotary Type | Ambient · Close |
   | `Edt_OrgCom_kPolyPercEnable_revB` (225) | Polyphonic Percussion | on / off |
   | `Edt_Ext_kVelCurve` (384) | Keyboard Velocity | Soft · Medium · Hard (`FUN_c0123df8`) |
   | `Edt_Ext_kBCValue_MSB` / `_LSB` (389, 388) | Program Change MSB / LSB | "--" for 0, else the value minus one (`FUN_c0123f24`) |

   Two of those values are font glyphs, read from the 13-pixel menu font's bitmaps (font
   header `0xc029e0ac`, one u32 per pixel column): 0xB0–0xB2 draw the Roman numerals I, II
   and III, and 0x85 draws a left-pointing arrow. What the arrow means is in the routing
   code (the function at `0xc010b124`, which Ghidra's analysis had not marked as a
   function): it resolves the seven outputs in the order organ, rotary, piano A, piano B,
   synth A, synth B, synth C, and for the arrow value it keeps the output it resolved for
   the previous one. So the rotary follows the organ, piano B follows piano A, synth B
   follows synth A, and synth C follows synth B. The same holds for the global
   (`Edt_Sys_kAudioRoutingDst…`) settings, where the arrow is value 7. The per-program
   values apply when Output Routing Mode (`Edt_Sys_kAudioRoutingMode`, 76) is Per Program.
   **Traced and left internal on purpose:**
   - *Rotary rotor and horn angle* (`Edt_OrgCom_kLeslieRotorAngle` / `HornAngle`, 221 / 222)
     are saved state, not settings. When a program is stored, the firmware copies the
     running rotary's rotor and horn position into them (the function at `0xc010127c`). On
     load it hands them back to the rotary only while the rotary is stopped
     (`0xc010e214` → `FUN_c02098a4`, which shifts the 7-bit value into a 32-bit phase, so
     128 steps make one turn). The stop position a player chooses is a different parameter
     (`Edt_OrgCom_kLeslieStopPreset`), already in the port as "rotary spkr stop position";
     the firmware's own labels for it (Free, Front Center, Front Left, Front Right, Back
     Left, Back Right, Back Center, from the ROTOR STOP ANGLE page) match the port's table.
   - *`Edt_Syn_kLibName`* (251) is registered and stored, but no instruction in OS 1.66
     loads its id outside the registry, and it is 0 in all 365 real files. Unused.

3. **Format versions.** A parameter a later version introduced reads as reserved zeros in
   an older file, so it is left out there (`Param.since`). The corpus gives two: Aux
   keyboard is never set through 3.09 (0 of 210 files) and set in 47 of 155 at 3.13; Layer
   Scene on the pedal is never set through 3.08. Parameters of the port are not gated.
4. **Left as it is: "organ vib/chorus type".** One 7-bit value in the port, three parameters
   in the firmware (B3 3 bits, Vox 2, Farfisa 2). The port's table spells out all three, so
   the value shown is right.

Not yet done from the layout: the 70 port fields that are a narrower window on a firmware
parameter (synth pan reads 6 of 7 bits, sample id 12 of 16) keep the port's width, and the
single-engine preset reader (`ns4/preset.ts`) does not take the added parameters.

The layout drops the parameters the firmware marks `_obsolete` (the generator's rule), so
their bits show as reserved on the byte map although older files still carry values there.

Other program facts, unchanged: 21–22 parameters per fixture render as plain numbers and are
correct as numbers; program category ids 47+ are unnamed in the firmware table
(`clavia/categories.ts`).

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
