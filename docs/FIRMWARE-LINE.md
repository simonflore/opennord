# The Nord line in firmware

**What this is.** A summary of what the instruments' own OS images say about every Nord model beyond the Stage 2/3/4, in the areas OpenNord supports:

- device access over USB (FileTransfer version, session lock, partition order);
- which pianos and samples each model loads;
- which program-format family each model uses.

The Stage 2, 3 and 4 are covered in detail in [`STAGE2-3-FIRMWARE.md`](STAGE2-3-FIRMWARE.md); they appear here only as reference rows.

**Method.** Static analysis only, 2026-10-10/11:

- The images come from Nord's public OS updaters (the latest OS of each model on Nord's site, listed in §1), unpacked as for the Stage models. ARM images load at `0xC0000000` (ARMv7 LE), ColdFire images at `0x30000400`.
- They were analysed in Ghidra, with `objdump` for cross-checks. Nothing ran on hardware, so every claim waits for a hardware check (§7).

**Confidence.** Each claim carries a tag: **high** = seen in code or data, **medium** = inferred, **low** = a guess. Addresses are evidence for re-checking; they are not data.

**Legal.** Per [`LEGAL.md`](LEGAL.md), knowledge only. No firmware bytes, decompiler output or tables are in the repo; the working files (per-parameter offset CSVs, decompiles) stay in a local scratch folder.

**Where it landed in code.** `src/lib/clavia/partitions.ts` (every partition list below, as `staticIndex`; `fileTransferVersion`; `sampleCodec`; the Electro 7 and C1 entries), `src/lib/clavia/validation.ts` (the compatibility notes), and the connect path (`device/negotiate.ts` `initialFileTransferVersion`): a session starts from the model's own FileTransfer version, and the device's negotiation reply still wins. The program layouts of §6 run the file readers (`lib/ne3`, `lib/ne4`, `lib/nc2`, `lib/nw1` on `clavia/legacy-record.ts`; the registry models on `clavia/block-chain.ts`).

## 1. Platforms

| Model | OS read | CPU / load base | Program-format family | FileTransfer |
|---|---|---|---|---|
| Stage 4 *(ref)* | 1.66 | ARMv7, `0xC0000000` | Stage 4 registry | 10 |
| Stage 3 *(ref)* | 2.64 | ARMv7 | Stage 3 registry | 10 |
| Stage 2 *(ref)* | 3.00 | ColdFire, `0x30000400` | Stage 2 era | 8 |
| Electro 3 | 3.14 | ColdFire | descriptor container | **4** |
| Electro 3 HP | 3.16 | ColdFire | descriptor container | **4** |
| Electro 4 | 1.22 | ColdFire | descriptor container | **7** |
| Electro 5 | 2.04 | ColdFire (newer compiler) | descriptor container (newer) | 10 |
| Electro 6 | 2.66 | ARMv7 | Stage 3 registry | 10 |
| **Electro 7** | 1.30 | ARMv7 | Stage 4 registry | 10 |
| Nord Piano (1) | 1.50 | ColdFire | descriptor container | **4** |
| Piano 2 | 1.22 | ColdFire | descriptor container | **6** |
| Piano 3 | 2.04 | ColdFire (newer compiler) | descriptor container (newer) | 10 |
| Piano 4 | 2.66 | ARMv7 | Stage 3 registry | 10 |
| Piano 5 | 1.34 | ARMv7 | Stage 3 registry (hybrid container) | 10 |
| Piano 6 | 1.20 | ARMv7 | Stage 3 framing, Stage 4-style builders | 10 |
| Grand | 1.68 | ARMv7 | Stage 3 registry | 10 |
| Grand 2 | 1.22 | ARMv7 | Stage 3 framing, Stage 4-style builders | 10 |
| Organ 3 | 1.00 | ARMv7 | Stage 4 registry | 10 |
| Wave | 2.14 | ColdFire | descriptor container | **4** |
| Wave 2 | 1.24 | ARMv7 | Stage 3 registry | 10 |
| C2D | 1.12 | ColdFire | descriptor container (set function only) | **4** |
| C2 | 2.00 | ColdFire | descriptor container | **4** |
| Stage Classic | 5.08 | ColdFire | descriptor container (u8 version, morph deltas) | **3** |
| Stage EX | 6.08 | ColdFire | same record as the Stage Classic | **4** |
| **C1** | 1.12 | ColdFire | — | **none** |
| Lead 4 | 1.32 | ARMv7 | Lead descriptor framework | **8** |
| Lead A1 | 1.36 | ARMv7 | Lead descriptor framework | **8** |

Every model's OS image has now been read; the Stage Classic, Stage EX and C2 were the last (2026-10-11), and their registry rows left NSM's baseline.

**Electro 3 is ColdFire, not Thumb (high).** The packed CODE section in its `os.cab` is LZO1X data (0x702D8 bytes, the "470 KB" analysed in `NSP-FORMAT.md`). Unpacked it is 0xF7B60 bytes of ColdFire code (4,163 functions); strings are reached by absolute addresses (e.g. "Native (Piano)" at `0x300F0190`, referenced from `0x3005324A`). The earlier "Thumb wall" came from disassembling compressed bytes.

**OS cross-check (high).** The ColdFire registrations pass OS × 100 to the info protocol: E3 314, E3 HP 316, E4 122, Piano 1 150, Piano 2 122, C2D 112, Wave 214 (Stage 2: 300). E5 and Piano 3 pass a placeholder.

**DSPs (medium).** The pianos carry SHARC 214xx LDR images (Piano 4, Grand, Piano 5: 3; Piano 6, Grand 2: 2 found). The Stage 2 DSP563xx boot routine byte-matches in Electro 5 (`0x3000347A`) and Piano 2 (`0x30002338`). Others not determined; a "SharcTooth" string in the Lead 4 hints at SHARC (low).

## 2. USB: FileTransfer version and the session lock

Every model except the C1 runs the same FileTransfer family as the Stage 2/3/4: same vtable layout, the same opcode set (0–0x3E on the Leads), the same status-code meanings (`PROTOCOL-RE.md`, "Sessions and status codes"). What differs is the **version** and, on the oldest group, the **session lock**.

| Group | Models | Version | Frames accepted | Begin takes a lock (18 when held) |
|---|---|---|---|---|
| v3 | Stage Classic | 3 | exactly 3 | **no** |
| v4 | Electro 3, Electro 3 HP, Nord Piano, C2, C2D, Wave, Stage EX | 4 | 3..4 | **no** |
| v6 | Piano 2 | 6 | 3..6 | yes (Stage 2 code) |
| v7 | Electro 4 | 7 | 3..7 | yes (Stage 2 code) |
| v8 | Stage 2, Lead 4, Lead A1 | 8 | 3..8 | yes |
| v10 | Stage 3/4, Electro 5/6/7, Piano 3/4/5/6, Grand, Grand 2, Organ 3, Wave 2 | 10 | 3..10 | yes |
| none | C1 | — | — | — |

A frame outside a device's accepted range is dropped with no reply. A Stage 4 default frame (version 10) therefore reaches nothing on a v3–v8 model, which is why the registry records each model's version and the connect path starts from it.

**Evidence per model** (FileTransfer constructor → version; frame-range check; begin handler):

| Model | Registration | Version | Frame check | Begin | Conf. |
|---|---|---|---|---|---|
| Electro 3 3.14 | `0x3004FF12` | `0x30088418` → `0x300925A2`(…,4) | `0x30097378` | `0x30089E30` (no lock) | high |
| Electro 3 HP 3.16 | `0x3005043E` | `0x3008B250` → `0x300953DA`(…,4) | `0x3009A1B0` | `0x3008CC68` (no lock) | high |
| Electro 4 1.22 | `0x30057F46` | `0x300A86E6`(…,7) | `0x300B9DAE` | `0x300A8DCE` | high |
| Electro 5 2.04 | `0x3004EF18` | `0x3017040A`(…,1,10) | `0x30159C62` | `0x3016EA10` | high |
| Nord Piano 1.50 | `0x30035ED6` | `0x300755D2` → `0x3009022A`(…,4) | `0x30095000` | `0x30076FEA` (no lock) | high |
| Piano 2 1.22 | `0x30021880` | `0x301041CE` → `0x3011F59A`(…,6) | `0x30124A48` | `0x30104DC2` | high |
| Piano 3 2.04 | `0x30024E5E` | `0x300A12E4`(…,1,10) | `0x3008DF96` | `0x3009F98C` | high |
| C2D 1.12 | `0x3004ED82` | `0x30088A74` → `0x30094060`(…,4) | `0x3009904C` | `0x300893B2` (no lock) | high |
| Wave 2.14 | `0x3004F2B2` | `0x30081B74` → `0x3008A11A`(…,4) | `0x3008EEF0` | `0x3008358C` (no lock) | high |
| Electro 6 2.66 | `FUN_c00180c0` | `FUN_c0101140`(…,1,10) | `c01254e4` | `c00ffaf8` (Stage 3 handler) | high |
| Electro 7 1.30 | `FUN_c0011420` | object `[1]=10` | `FUN_c01ce588` | `c0197754` | high / lock medium |
| Organ 3 1.00 | `FUN_c0002e9c` | object `[1]=10` | `c001ecd4` | `c00506a8` | high / lock medium |
| Wave 2 1.24 | in `FUN_c0161afc` | object `[1]=10` | `c003e0dc` | `c0067554` | high / lock medium |
| Piano 4 2.66 | `FUN_c001755c` | `FUN_c00d790c`(…,0,10) | `c00fbdb0` | `FUN_c00d6270` (= Stage 3) | high |
| Grand 1.68 | `FUN_c0019f28` | `FUN_c00e0b40` → 10 | `c0105040` | `c00df4d4` | high / lock medium |
| Piano 5 1.34 | `FUN_c0122f8c` | 10 / content 0 | `c0036b48` | `c0065c10` | high / lock medium |
| Piano 6 1.20 | `FUN_c016bb68` | 10 / content 0 | `c0041f80` | `FUN_c0075850` (= Stage 4) | high |
| Grand 2 1.22 | `FUN_c016bc30` | 10 / content 0 | `c0041e00` | `c00756ec` | high / lock medium |
| Lead 4 1.32 | `FUN_c000bf58` | `FUN_c01410b8`(1,8) | `c015a530` | `FUN_c013fa74` | high |
| Lead A1 1.36 | `FUN_c0013728` | `FUN_c01682b8`(1,8) | `c0181730` | `FUN_c0166c74` | high |

**The v4 group has no session lock (high).** On Electro 3, Electro 3 HP, Nord Piano, C2D and Wave, begin (vtable slot 11) records the partition and calls its begin function; there is no lock and no 18 path. `NordSession`'s end-after-refused-begin is harmless there, but a status 18 should not be expected.

**Status texts (high for 18 and 21).** 18 reads "Internal error" and 21 "Not supported" wherever a status-text function exists. The v4 group has no text for 38 ("File incomplete"); Electro 4 and Piano 2 have it. Piano 3 has no status strings at all (like the Stage 3); Electro 5 keeps its texts in a table at `0x30228880`.

**Lead 4 history (medium).** NSM splits the Lead 4 into `CLead4_FTv7` (OS 1.00–1.12) and `CLead4_FTv8` (1.13+), so OS 1.12 and older probably speak version 7. No old image was read.

**The C1 has no USB transfer (high).** OS 1.12 has no USB device descriptor, no FileTransfer code (byte-signature search finds none) and no transfer strings. The registry marks it `deviceTransfer: false`.

**The Lead A1 is not SysEx-only (high).** It runs the Lead 4's FileTransfer code, version 8, with the same vendor interface (class `ff`, EP `81` interrupt, `82`/`03` bulk) plus USB-MIDI. A SysEx dump also exists and carries the same raw record (medium; framing not mapped). NSM's `CMini` (PID `0x25`) is the A1 — NSM 9.22 names the class's product "Nord Lead A1" with the `nlab`/`nlap`/`nlas`/`nlat` tags — so the registry sets `staticProductId` 0x25 (not hardware-confirmed).

**USB product ids.** The ARM images fill their descriptor PID at runtime; the source of the value wasn't found. The registry keeps NSM's ids (`staticProductId`), including `0x3B` for the Electro 7 (`CElectro7`).

## 3. Partition lists

The firmware registration order, which is what `CQryPartList` returns. All are `staticIndex` in the registry (no hardware capture yet); the connect probe still looks for the Program partition on the device, and only that partition (or a hardware-confirmed library) becomes writable. Factory ("Native"), SWave, RAMFS and Pipe partitions are registered read-only.

| Model | Order (index: partition [tag]) | Count | Conf. |
|---|---|---|---|
| Electro 3 / 3 HP | 0 Piano (N) · 1 Samp Lib (N) · 2 Piano · 3 Samp Lib · **4 Program [nepg]** (1×128) · 5 Live (E3 1×1, HP 1×4) · 6 System · 7 Organ Presets (3×17) | 8 | high |
| Electro 4 | 0 Piano (N) · 1 Samp Lib (N) · 2 Piano · 3 Samp Lib · **4 Program [ne4p]** (1×128) · 5 Live (1×4) · 6 Settings | 7 | high |
| Electro 5 | 0 Piano (N) · 1 Piano · 2 Samp Lib (N) · 3 Samp Lib · **4 Program [ne5p]** (8×50) · 5 Set List [ne5t] (4×50) · 6 Live (1×3) · 7 Settings | 8 | high |
| Electro 6 | 0 Piano (N) · 1 Piano [npno] · 2 Samp Lib (N) · 3 Samp Lib [nsmp] · **4 Program [ne6p]** (26×16) · 5 Live [ne6l] · 6 Settings [ne6t] | 7 | high |
| Electro 7 | 0 Piano (N) · 1 Piano [npno] (6×20) · 2 Pedal (N) · 3 Piano Pedal [npdl] · 4 Samp Lib (N) · 5 Samp Lib [nsmp] (26×100) · **6 Program [ne7p]** (20×25) · 7 Live [ne7l] (1×5) · 8 Settings [ne7t] · 9 Synth Preset [ne7r] (32×100) | 10 | high |
| Nord Piano | 0 Piano (N) · 1 Pedal (N) · 2 Piano · **3 Program [nppg]** (24×5) · 4 Live (1×5) · 5 System | 6 | high |
| Piano 2 / 3 | 0 Piano (N) · 1 Piano · 2 Piano Pedal · 3 Pedal (N) · 4 Samp Lib (N) · 5 Samp Lib · **6 Program [np2p / np3p]** (P2 2×120, P3 4×50) · 7 Live (1×5) · 8 Settings | 9 | high |
| Piano 4/5/6, Grand, Grand 2 | 0 Piano (N) · 1 Piano [npno] · 2 Pedal (N) · 3 Piano Pedal [npdl] · 4 Samp Lib (N) · 5 Samp Lib [nsmp] · **6 Program** · 7 Live · 8 Settings | 9 | high |
| Organ 3 | **0 Program [no3p]** (8×50) · 1 Live [no3l] (1×3) · 2 Settings [no3t] | 3 | high |
| Wave | 0 Samp Lib · **1 Program [nwp]** · 2 SWave · 3 RAMFS · 4 System | 5 | high |
| Wave 2 | 0 Samp Lib (N) · 1 Samp Lib [nsmp] (26×100) · **2 Program [nw2p]** (16×25; also lists `nlxp`) · 3 Live [nw2l] (1×5) · 4 Settings [nw2s] | 5 | high |
| C2D | 0 Pipe (N) · 1 Pipe · **2 Program [nc2p]** (1×126) · 3 System | 4 | high |
| C2 | 0 Pipe (N) · 1 Pipe · **2 Program [ncpg]** (1×126) · 3 Live (1×2) · 4 System | 5 | high |
| Stage Classic / Stage EX | 0 Native (EX: "Native (FFS)") · 1 Piano · **2 Program [nspg]** · 3 Synth [nss] | 4 | high |
| Lead 4 | 0 Program [nl4s] (4×99) · **1 Performance [nl4p]** (2×50) · 2 Settings [nl4t] | 3 | high |
| Lead A1 | 0 Program [nlas] (8×50) · **1 Performance [nlap]** (4×50) · 2 Settings [nlat] | 3 | high |

Pianos' tags: Piano 4 `np4p`/`np4l`/`np4t`, Grand `ngp`/`ngl`/`ngs`, Piano 5 `np5p`/`np5l`/`np5t`, Piano 6 `np6p`/`np6l`/`np6t`, Grand 2 `ng2p`/`ng2l`/`ng2t`. Programs: 400 slots on Piano 4, Grand and Piano 5; 576 on Piano 6 and Grand 2. Lives: 5, or 6 on Piano 6 and Grand 2.

Bold = the Program partition. Bank × slot counts come from each partition's descriptor; how they map to front-panel banks is medium. Every ARM model also constructs a "State" (`stat`) partition that is never registered on the wire (Electro 6 `c000be5c`, Electro 7 `c0002c50`, Organ 3 `c010ae18`).

**Where NSM's constructor order was wrong** (the registry used it before):

- **No E2P FFS anywhere.** No firmware read so far registers it (Wave 2, Piano 6, Grand 2, Electro 6 included).
- **`…t` is Settings, not a Set List**, on Electro 6 (`ne6t`), Piano 6 (`np6t`) and Grand 2 (`ng2t`). Only the Electro 5 has a Set List partition (`ne5t`); the Stage 3 has Songs (`ns3s`).
- **Electro 6** has no Pedal partitions (the constructors at `c0003a2c`/`c0003aa4` are never called); Program is 4, not 6.
- **Electro 7** registers nothing past 9. NSM's list (8 `ne7s`, 9 Settings, 10–11 Native, 12 `ne7r`, 13 Raw) is wrong: `ne7s` is the standalone synth-preset archive tag (`FUN_c00a8088`, "synth_preset_archive"), not a partition.
- **Organ 3** has no Native or "Pipe" ROMFlash partitions: Program is 0, not 2.
- **Wave 2** has no "Transient" partition; Program 2 agrees.
- **Lead 4 / A1**: the firmware registers Program (single sounds) before Performance; NSM's `CLead4Base` has Performance first.
- **Nord Piano**: Pedal (N) is 1 and Piano 2 (NSM: the other way round); no sample library.
- **Piano 2 / 3**: also user Piano, Piano Pedal and Samp Lib (NSM's lists skipped them); Program 6 agrees.
- **Electro 3**: the plain E3 registers Organ Presets too (NSM gives it only to the HP).
- **Electro 4**: also user Piano (2) and Samp Lib (3); Program 4 agrees.
- **C2D**: no Live partition (NSM lists 5).
- **C2**: program tag `ncpg` (NSM's CC2 tag set `ncb`/`ncpg`/`ncli`/`ncsy`), not the C2D's `nc2p`; 5 partitions with Live; recommended OS 2.00.
- **Stage Classic / EX**: program tag `nspg` on both (the registry had `nsp` for the Classic); no Live and no Settings partitions, a Synth partition `nss` instead.
- **Wave**: no factory sample library and no Live partition; SWave and RAMFS hold unknown content (treated read-only).

The registry keeps OpenNord's convention that the `program` kind marks the partition holding `programTag` files. On the Leads that is the Performance partition (`nl4p`/`nlap`); the single-sound "Program" partition (`nl4s`/`nlas`) carries the `synth-preset` kind.

## 4. Pianos

The CNSP header version decides what a model loads: `0x440` = v4, `0x450` = v5, `0x464` = v6. OpenNord's `buildNpno` writes v6.

| Model | Accepts | Manager / limits | Evidence | Conf. |
|---|---|---|---|---|
| Electro 3 | v4, v5 (header, metadata +0x16, directory +0x61C must each be 0x440 or 0x450); v6 refused | — | gate `FUN_300422F8` | high |
| Electro 3 HP, Electro 4 | v5 only | — | `FUN_3004283E`, `FUN_30049D4E` | high |
| Nord Piano, Piano 2 | v5 only (0x464 unknown → status 4; ≤0x440 "Unsupported") | generation 5, first argument 2 (probably one slot per piano partition, low) | `FUN_3004C442` / `FUN_30048240`; `FUN_300C376A` / `FUN_300C0E2A` | high |
| Electro 5, Piano 3 | v5, v6 | generation 5, 120 slots; voice table 0x4000 entries; strokes ≤ 0x149F | E5 `FUN_3011DB4E`/`FUN_3011E9AC`, manager `FUN_3011D590`; P3 `FUN_3006338E`/`FUN_30063C08`, `FUN_30062F08` | high |
| Stage Classic, Stage EX | 0x423–0x42F, 0x430, 0x440 (v4), 0x450 (v5); v6 refused | — | OS 5.08 / 6.08 piano gate | high |
| C2D | Pipe: embedded CNSP 0x440 only | — | `FUN_3003B5A0` | high |
| Electro 6 | v5, v6 | generation 5, 120 slots | gate `FUN_c00d5828`, manager {4,120,5} at `c00005e8` | high |
| Electro 7 | v5, v6 | generation 5, 120 slots | gate `FUN_c0158fe0`, manager {2,120,5} at `c000c794` | medium–high |
| Piano 4, Piano 6 | v5, v6 | generation 5, 120 slots; voice table 0x6000; strokes ≤ 0x149F (over → status 5 "Piano is too big") | P4 gate `FUN_c00ae1a4` (= Stage 3 `c011a4ec`), limit `FUN_c00aa8e8`; P6 gate `FUN_c0095a64`, limit `FUN_c00a1e5c` | high |
| Grand, Piano 5, Grand 2 | v5, v6 | same constants present | compare pattern at `c00b75fc`, `c0083f6c`/`c0088f04`, `c0095a04`/`c00980e8` (not decompiled) | medium |
| Wave, Wave 2, Organ 3, Leads, C1 | no piano code | — | — | high |

The Piano 6 gate's thresholds (0x423–0x42F → generation < 3, 0x430 < 4, 0x440 < 5, 0x450 < 6, 0x464 < 7) are the Stage 3 ladder. The 32-character name rule and the 30-layers-per-root bound were not re-checked on the pianos (medium: same code family). A program's piano reference on the ARM pianos is Bank (3 bits = piano type), Entry (0–19), Variation (2 bits) and a 32-bit name hash; `Pno_kPos` 0–479 fits (bank·20 + entry)·4 + variation (medium).

## 5. Samples

| Model | Loads | Evidence | Conf. |
|---|---|---|---|
| Electro 3, Electro 3 HP, Electro 4, Piano 2, Wave | `.nsmp` with an NWS body of version 8 or 11 (codec 1/2); Piano 2 and Wave also accept `nwi` entries | E3 `FUN_3004B84A`, HP `FUN_3004BD74`, E4 `FUN_30053768`, P2 `FUN_300D078C`, Wave `FUN_3002B990` | high |
| Electro 5 | `.nsmp` NWS v8/v11 only — refuses `.nsmp3`. Its version table (`0x30227E6D`) maps 8→1, 11→2, 30→3, but the loader accepts generations 1–2 and parses only an NWS root | `FUN_301344A6` / `FUN_301342A8` | high |
| Piano 3 | `.nsmp` NWS v8/v11 only (table `0x301241B4` maps 8 and 11) | `FUN_300715FA` | high |
| Nord Piano, C2D, C1 | no sample code | — | high |
| Stage Classic, Stage EX | no sample library partition | — | high |
| Piano 4, Grand | `.nsmp3` only (generation-3 check) | P4 `c00c3428` + `cmp #3` at `c0036220`; Grand `c00cc66c`, `c003962c` | high |
| Piano 5, Piano 6, Grand 2 | `.nsmp3` and `.nsmp4` (map 8→1, 11→2, 30→3, 40→4 with a generation 3–4 check, as Stage 4 `c01d7a2c`) | P5 `c0109f50`, P6 `c01234ac`, G2 `c0123620` | high |
| Electro 6 | Stage 3 map {8→1, 11→2, 30→3} → `.nsmp3` | `c01bc870`; generation check not located | medium |
| Electro 7, Wave 2 | a {8, 11, 30, 40} map exists; no check using it located. NSM treats Wave 2 as `.nsmp3` | E7 `c04bfd24`, W2 `c01e1040` | low |

So `.nsmp3`/`.nsmp4` files must be converted down (`convertNsmp(x, 2)` or `(x, 1)`) for every ColdFire model, the Electro 5 and Piano 3 included. The registry's `sampleCodec` holds one value per model; where two are accepted it records the newest (Piano 5/6, Grand 2: `codec4`). Electro 7's `codec4` is a guess.

## 6. Program formats

| Family | Models | Framing | Notes |
|---|---|---|---|
| Stage 2-era descriptor container | Stage 2 (and 2 EX; per-parameter morph-source mask variant, `STAGE2-3-FIRMWARE.md` §3), Electro 3, Electro 3 HP, Electro 4, C2D, Wave | 24-byte parameter records {id, default, max, bit width, morphable flag, not-stored flag, control id (probably a MIDI CC, low)}; MSB-first; a morphable value is preceded by one signed delta per morph source, one bit wider than the value | write/read/set byte-matched in E3, E3 HP, E4 (high), set function in C2D (medium); Wave write `FUN_300056A4`, read `FUN_30005906` |
| — newer ColdFire containers | Electro 5, Piano 3 | record pointers with default (+4), max (+8), kind (+0x15); 26-byte parameter records | E5 set function `FUN_300F7B98`; layouts extracted (below) |
| — same family | Piano 2, Nord Piano, C2 | 24-byte descriptors (Piano 2: +0x12 = 1 marks a stored one) | layouts extracted (below) |
| — with morph deltas | Stage Classic, Stage EX | u8 record version, then the bitstream; a morphable value is preceded by 3 deltas one bit wider | signedness of the deltas medium (read as two's complement) |
| Stage 3 registry | Electro 6, Wave 2, Piano 4, Grand, Piano 5, Piano 6, Grand 2 | u32 version, then a chain of blocks, each an 8-bit length + MSB-first fields in registration order, padded to a byte | a negative-minimum field is stored as **two's complement**, not `value − min`: the registry's signed mode is 0 (pianos: registry start `FUN_c007eed8(reg,7,0)`; Electro 6: `FUN_c009aad8`, both builders pass 0; Wave 2: `FUN_c00a6e64`, all three builders pass 0; the Stage 3 passes `(7,1)` to `FUN_c00debc8`) — high, except medium on Piano 6. Morph deltas are never two's complement |
| Stage 4 registry | Electro 7, Organ 3 | table-driven registry; archive tree of buffers | block order from the archive builders (medium); negative-minimum fields two's complement (signed mode 0: Electro 7 global `0xc05da57c`, Organ 3 global `0xc041e800`; high) |
| Lead descriptor framework | Lead 4, Lead A1 | u16 record version, then an MSB-first bitstream from 0x1C-byte descriptors {id, default, max, bits, morph-source mask, flags, MIDI CC}; values raw (minimum 0) | serialiser `FUN_c01208a8` → `FUN_c01156b4` |

**Per model (body = bytes after the version prefix unless noted):**

One rule places the record of every descriptor-container file: it starts at file 0x18 after a legacy (formatType 0) header, or at 0x2C after an NSM-era header, with the record version first and the data right after it. So the data starts at 0x1A behind a u16 version (Stage 2, Electro 3/4, C2D, the Leads) and at 0x19 behind the Wave's u8 one; a legacy file then ends in a 2-byte trailer, an NSM-era file in none. Real `.ns2p` files (489, both headers) bear the rule out (`STAGE2-3-FIRMWARE.md` §3).

- **Electro 3 (medium).** OS 3.14, tag `nepg`. u16 record version 101; a 100 record is upgraded on load by copying piano parameter 16 into 17 (`FUN_30017F9A`). 108 data bytes from 0x1A → 136-byte file. Blocks (descriptors, reserved included): Common 4 · Organ Common 9 · Organ Preset I 39 · Organ Preset II 39 · Piano 20 · Effects Shared 17 · Effects Organ 8 · Effects Piano 8; no morphs. Common 0 picks organ (0) or piano, the organ model is 0 B3 / 1 Farfisa / 2 Vox, the piano type 0 Grand · 1 Upright · 2 EPiano · 3 Wurl · 4 Clav/Hps · 5 sample (`FUN_30009764` maps them to program categories, high). Each preset keeps nine B3 and nine Vox drawbars and nine Farfisa tabs; the piano block keeps one model number per type. The piano and effects blocks start where the Electro 4's do, and the effects parameters match it. Alignment medium (no real file checked).
- **Electro 3 HP (medium).** OS 3.16: the same tag, version, framing and size, with 5 more parameters in what the Electro 3 reserves (piano 18–19, shared effects 15–17). OpenNord reads both with the HP layout; a non-zero HP-only parameter marks an HP file, otherwise the two can't be told apart. The HP names piano types 2/3 EPiano 1 / EPiano 2.
- **C2D (medium).** OS 1.12, tag `nc2p`. u16 record version 100 only; 345 data bytes from 0x1A → 373-byte file. The container list `FUN_300200AE` writes 115 container instances: common, B3 (percussion sets, two manuals of drawbar sets and vibrato switches), Vox, Farfisa, pipe organ (stop sets per manual), three pedal modes, effects, rotary and four effect-switch sets. The list repeats the last B3 / Vox / Farfisa drawbar set and the last pipe stop set of each manual, so those are written twice and the reader keeps the second copy. Container order high; block names medium–low.
- **Electro 4 (medium–high).** Serialiser `FUN_3000C93A`, container builder `FUN_3000CB5C`: 14 blocks, 864 bits = 108 bytes. The bitstream starts at **file 0x1A**, not 0x2C (0x1A + 108 + 2-byte CRC = 136, the `.ne4p` size), so the B3 Preset I drawbars sit at file 0x27–0x2B, inside what `cbin.ts` treats as header.
- **Wave (structure high, file alignment medium).** Global block 12 parameters (156 bits), slot block 63 parameters = 140 bytes written twice (the decoder's +140 stride), common/FX block 14 parameters (172 bits); 3 morph sources (mask 0x61: sources 0, 5, 6), so a morphable value is preceded by three signed 8-bit deltas (26 per slot, one in common). Stored record 324 bytes: a **u8** version (8; 6–7 converted, `FUN_3000090E`), 321 data bytes and 2 pad bytes. By the rule above it starts at 0x18, so the data runs from **0x19** and slot A from 0x2C bit 4: 24 + 324 + 2 = 350, the `.nwp` size. The old corpus reader's byte "selectors" are fragments of real parameters under this alignment (its `oscSelect` = 2 · slot A parameter 0 + the top bit of parameter 1). The corpus range test in `nw1/decode.test.ts` checks it (§7).
- **Electro 6 (high).** Live registry `FUN_c0054b5c` (148 parameters), no morphs. Format `FUN_c0057f8c` accepts 2.00–2.04; 1.00 files load through a legacy path (`FUN_c005ed58`). 14 blocks end at body 211, the observed size. The drawbars at body 143/158 are manual A Preset I/II; manual B's are at 182/197 (whether manual A is the upper manual is medium).
- **Wave 2 (high).** Registry `FUN_c01106b8` (213 parameters); format `FUN_c010bfe4` 3.00–3.01. MultiCommon (payload 63) then four 244-byte slots at body **68 + 244k**. Morph kind 6 stores a base value plus 5 deltas, kind 2 a base plus 1. The "drawbars" the decoder found are a 32-bit gate-pattern word; Wave 2 has no drawbars.
- **Piano 4 / Grand (high).** MultiCommon 11 · Piano 17 · Synth 23 · Effects 31 = 90 bytes; versions 1.00–1.01. Grand = Piano 4 plus one MultiCommon field (`Com_kSplPos`, 4 bits at body bit 59).
- **Piano 5 (medium–high).** MultiCommon 12 · Effects 39 (global) · PianoA 31 · PianoB 31 · SynthA 57 · SynthB 57 = 237 bytes. The decoder's `0x0c65` "format tag" is the version's low byte plus the MultiCommon length.
- **Piano 6 / Grand 2 (high / medium).** 11 blocks, 185 bytes. Piano 6 is the Grand 2 layout with three differences (an extra MultiCom bit, `EffectsSectionMode` in PnoCom/SynCom, separate AmpEnv Decay/Release); it is not close to the Piano 5. The top-level version comes from a RAM global (Grand 2 files are 1.02).
- **Electro 7 (medium).** 251 parameters in 11 buffers (`FUN_c009c394`); archive `FUN_c00a8148`, version fields (1, 0, 10). Tree: Common · Organ folder (Organ, Fx, 2 layers, 3 drawbar sets) · Piano folder (Piano, Fx) · Synth folder (Synth, an embedded synth-preset archive, Fx) → predicted 353-byte body, 397-byte file. A new format: `ne6p` code cannot be reused. Encoding kind 3 adds two 1-bit morph slots after the value: the knob's pedal and wheel assignment (slot order high, which is pedal and which wheel medium). Negative-minimum fields are two's complement: the registry builder clears the signed-mode global `0xc05da57c`, the parameter constructor `FUN_c01236c8` then marks them signed with offset 0 and the reader `FUN_c0124ae4` sign-extends; read as `value − min`, Analog Osc Mix, Analog Semitone and FM Balance fall out of range in 75 factory values (high).
- **Organ 3 (medium).** Registry `FUN_c00c0120` (182 parameters, no morphs); archive `FUN_c00b9888` version 2.00. Predicted 204-byte body, 248-byte file.
- **Lead 4 (high).** In these legacy (formatType 0) files the record starts at **file 0x1A**; the u16 at 0x14 is the record version, 0x16–0x19 unknown. Program data 315 bytes: slot set (78 descriptors, ending in a 44-bit reserved field), a 7-bit morph count and 87 sparse morph entries {parameter, source, signed delta}, then the FX set and its morph list. 9 morph sources. Performance = 7 bytes of common settings + 4 × 315. Record sizes (u16 version + data): Program 317, Performance 1269, Settings 38; versions 8 / 9 / 3.
- **Electro 5 (high; names medium).** 24 containers of 26-byte records: common, piano, sampleSynth, then per organ (B3, Vox, Farfisa, Church) Global, Upper, Lower, Preset I, Preset II, then effects; 952 bits = 119 bytes, no morphs. Record `[u16 version 4][119 bytes]` at file 0x18, so the data starts at **0x1A** and the file is 26 + 119 + 2 = 147 bytes (high); the CBIN version at 0x14 carries the same 4. Version 3 is converted (the converter moves an EQ bit); 1 and 2 are refused. 173 parameters, 167 with firmware labels. The earlier corpus decoder had the drawbar offsets right but the names wrong: body 21 / 28 are B3 Preset I / II, 39 / 45 Vox Preset I / II, 55 Farfisa Preset I, 71 Church Preset I; its "sample section active" bit is the top bit of the B3 vibrato/chorus type and its "sample model id" the Sample Synth sample select plus two 15-bit sample ids (`lib/ne5/types.ts`).
- **Piano 3 (layout high, file medium).** Common 96 · piano 96 · synth 88 · effects 144 bits = 53 bytes, 76 parameters; record version 4; predicted 26 + 53 + 2 = 81-byte file.
- **Piano 2 (layout high, names medium).** Common, piano, synth, effects: 336 bits = 42 bytes, 52 parameters; record version 2 (version 1 is converted: common parameter 4 is remapped); 70-byte file. Names mostly by matching control ids with the Piano 3.
- **Nord Piano (layout high, file position low).** Piano then effects: 156 bits = 20 bytes in a 31-byte flash slot, 29 parameters; no record version and no converter. The file position 0x1A (48-byte file) is a guess.
- **C2 (layout high, names and alignment medium).** 66 containers (common; B3 with three drawbar sets per manual and percussion per upper set; Vox and Farfisa with three presets per manual; pipe with six presets per manual and six couplers; B3 bass, pipe bass, Trek bass; shared and per-organ effects), no repeated containers (unlike the C2D), no morphs: 269 bytes, 385 fields. Record version 100, the only one read. Predicted file: data at 0x1A, 297 bytes.
- **Stage Classic / Stage EX (layout high, file alignment candidate).** Identical descriptors on OS 5.08 and 6.08: a u8 version (10; 0–9 converted up), then 399 data bytes — common (40 parameters), panel A (166) and panel B (166) — exactly 400 bytes (the Program partition's slot size is 400 too). 101 morphable parameters, each preceded by 3 deltas one bit wider (signedness medium). The record sits where the CBIN framing rule every model follows puts it (docs/FORMAT.md "Framing": 0x2C behind an NSM-era header, 0x18 behind a legacy one), so a `.nspg` is 444 / 426 bytes unless the firmware pads it; OpenNord reads it there, as a candidate until a real file confirms it.
- **Lead A1 (medium).** Program data 95 bytes (47 + 18 descriptors) with inline morph deltas, 2 sources. Performance 7 + 4 × 95 bytes leaves 12 bytes unexplained (401 − 2 − 387). Record versions 7 / 7.

The per-parameter offset CSVs are format knowledge, but they stay in the local workspace; what is committed is the generated layout of each reader (`scripts/gen-fw-program-maps.py` → `<model>/layout.generated.ts`), which every model above now has: Electro 3 / 3 HP / 4 / 5 / 6 / 7, Piano 2 / 3 / 4 / 5 / 6, Nord Piano, Grand, Grand 2, Organ 3, C2, C2D, Wave, Wave 2, Lead 4, Lead A1, Stage 2, Stage Classic / EX.

## 7. Open questions for hardware

**USB**

1. `CQryPartList` on each model, to promote `staticIndex` to `index`. Expected counts: Stage Classic / EX 4 (Program 2), C2 5 (Program 2), Electro 3 8, Electro 4 7, Electro 5 8, Electro 6 7 (Program 4), Electro 7 10, Nord Piano 6, Piano 2/3 9, Piano 4/5/6, Grand, Grand 2 9 (Program 6), Organ 3 3 (Program 0), Wave 5, Wave 2 5, C2D 4, Lead 4 / A1 3 (Program 0, Performance 1).
2. The negotiation reply (protocol 0x07) on a v4/v6/v7 model: does it advertise FileTransfer at the version above? Until checked, connect frames with the registry version when the reply names none.
3. A v3/v4 model (Stage Classic, Stage EX, Electro 3, Nord Piano, C2, C2D, Wave): confirm that begin never answers 18, and that the Stage Classic drops any frame not of version 3.
4. What the Wave's SWave and RAMFS partitions hold, and whether they accept writes.
5. USB product ids on hardware: Electro 7 (NSM `0x3B`), Lead A1 (NSM `CMini` `0x25`). Did Lead 4 OS ≤ 1.12 speak version 7?

**Pianos and samples**

6. A v5 test piano on Electro 3 HP, Electro 4, Nord Piano and Piano 2; a v6 one on Electro 5, Piano 3, Electro 6/7 and the ARM pianos (also the 32-character name and 30-layer rules there).
7. Which sample generations the Electro 7 and Wave 2 accept; whether the Electro 6 is `.nsmp3`-only.

**Programs**

8. Real `.ne7p` and `.no3p` files (predicted 397 and 248 bytes), `.np6p` and `.ngp` files: block lengths, which of the Electro 7's two assign bits is pedal and which wheel, and whether layer-dependent saves omit folders (Electro 7). The Piano 6 / Grand 2 top-level program version (a RAM global in the firmware).
9. The legacy record start (version at 0x18, data at 0x1A) on real `.nepg`, `.ne4p`, `.nc2p`, `.nl4s`/`.nlas` files (and whether `ne5p` follows it); real `.ns2p` files follow it, and behind the NSM-era header put the version at 0x2C and the data at 0x2E with no trailer (`STAGE2-3-FIRMWARE.md` §3). The Wave's data at 0x19 (the corpus test in `nw1/decode.test.ts`: under the right alignment no field exceeds its maximum). Whether the record version is stored big-endian (OpenNord reads it so; the ColdFire is big-endian) and whether the Electro 3 / C2D trailer is the CRC-16 of the Lead and Wave files. A C2 program, to check it shares the C2D record.
10. Wave 2's five morph deltas (which source each is); the Lead 4's 9 and the A1's 2 morph sources; the A1 Performance's extra 12 bytes.
11. Real files for the newly extracted ColdFire layouts: a `.nspg` (Stage Classic / EX — read by the framing rule; is the file 444 / 426 bytes, or padded?) and a `.nppg` (Nord Piano, 0x1A guessed); the sizes of `.np3p` (81), `.np2p` (70) and `.ncpg` (297); the Electro 5 piano-type and organ-model orders (inferred). What the Electro 3's five per-instrument effect switches and the C2D's stored drawbar sets are (which set sounds) is not named yet.
