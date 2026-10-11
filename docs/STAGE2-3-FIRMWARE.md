# Stage 2 and Stage 3 firmware compared with the Stage 4

**What this is.** These notes compare the Nord Stage 2 (OS 3.00) and Stage 3 (OS 2.64) firmware with the Stage 4 (OS 1.66), in the areas OpenNord supports:

- device access over USB;
- program files;
- pianos and samples;
- the sound engines.

**Method.** Static analysis only, done 2026-10-10:

- The images come from Nord's public OS updaters, unpacked with `scripts/fw-unpack.py`. All section checksums verify.
- They were analysed in Ghidra.
- Nothing ran on hardware, so every claim here waits for a hardware check.

**Confidence.** Each claim carries a tag: **high** means seen in code or data, **medium** means inferred, **low** means a guess. Addresses are evidence for re-checking; they are not data.

**Legal.** Per `docs/LEGAL.md`, these notes hold knowledge only. No firmware bytes, decompiler output or tables are in the repo; the working files stay in a local scratch folder.

## 1. Platforms

| | Stage 4 (OS 1.66) | Stage 3 (OS 2.64) | Stage 2 (OS 3.00) |
|---|---|---|---|
| Host CPU | ARMv7, CODE at `0xC0000000` | ARMv7, CODE at `0xC0000000` | **ColdFire (68k), big-endian**, CODE at `0x30000400` |
| CODE packing | LZO1X | LZO1X | LZO1X |
| DSPs | 3 dual-core SHARC+ and 2 SHARC 214xx | **5 single-core SHARC 214xx**; same LDR boot format as the Stage 4's DSP 3/4 | **6 DSP563xx-family**, 24-bit words, P/X/Y memory loads |
| DSP boot | `0xC0241C58` | `0xC000F19C` | `0x3001D7D0` |
| DSP sample rate | 43,402.34 Hz | same | same (medium) |

**Stage 2 CPU, high.** The Stage 2 image opens with ColdFire instructions (`link a6`, `movea.l`), and Ghidra's `68000:BE:32:Coldfire` language analyses it cleanly.

**Correction to `NSP-FORMAT.md`, high.** The 2026-07-01 Electro 3 image loads at the same base. The "Thumb wall" recorded there was LZO1X-packed ColdFire code: unpacked, Electro 3 OS 3.14 analyses cleanly as ColdFire (`FIRMWARE-LINE.md`, §1). The rest of the line is summarised there.

## 2. USB: sessions, status codes, partitions

All three models run the same transfer code. The session lock and the status codes are documented in `PROTOCOL-RE.md`, "Sessions and status codes".

**The lock (high).** A session start that the Nord refuses still holds the device's session lock. Until a session end arrives, every later start answers **18**. That is the "status 18" a Stage 3 Compact reported. OpenNord now ends refused sessions (PR #38).

**Partition order (high).** The partition order is the order in which the firmware registers each partition with the transfer code. That is the `CQryPartList` order:

- Stage 4: `0xC023A5B8`.
- Stage 3: `0xC001ACE0`.
- Stage 2: `0x3007046C`.

The order matches the hardware captures for Stage 4 and Stage 2. NSM's product-constructor order does **not** always match it.

| # | Stage 4 | Stage 3 | Stage 2 |
|---|---|---|---|
| 0 | Piano (Native) | Piano (Native) | Piano (Native) |
| 1 | Piano | Piano | Piano |
| 2 | Pedal (Native) | Pedal (Native) | Piano Pedal |
| 3 | Piano Pedal | Piano Pedal | Pedal (Native) |
| 4 | Samp Lib (Native) | Samp Lib (Native) | Samp Lib (Native) |
| 5 | Samp Lib | Samp Lib | Samp Lib |
| 6 | Program `ns4p` | **SWave** | Program `ns2p` |
| 7 | Organ Preset `ns4o` | **Program `ns3f`** | Synth `ns2s` |
| 8 | Piano Preset `ns4n` | Synth `ns3y` | Live `ns2l` |
| 9 | Synth Preset `ns4y` | Song `ns3s` | Settings `ns2y` |
| 10 | Live `ns4l` | Live `ns3l` | — |
| 11 | Settings `ns4t` | Settings `ns3t` | — |

Notes on the table:

- **Stage 3 Synth and Song.** Synth is 8 and Song is 9. NSM's constructor lists them the other way round.
- **Stage 3 count.** The Stage 3 reports 12 partitions. Its "E2P FFS" is not on the wire.
- **Stage 2 user pedal.** On OS 3.00 the user pedal partition is always registered. The rule that some Stage 2 OS versions don't register it comes from NSM; there was no pre-3.00 image to check.
- **Native partitions** refuse writes with status 21.
- **SWave** opens like any other partition. The firmware would probably accept writes to it (medium), but OpenNord treats it as read-only.

**Protocol versions (high).**

| | FileTransfer version | Accepted frames |
|---|---|---|
| Stage 4 | 10 | versions 3–10 |
| Stage 3 | 10 | versions 3–10 |
| Stage 2 | 8 | versions 3–8 |

## 3. Program files

### Stage 3 (and Stage 4)

**Container (high).** The program body is written from a parameter registry (Stage 3 `0xC0075058`; serialiser `0xC00E0108`):

- a big-endian u32 format version, `major·100 + minor`;
- then a chain of blocks. Each block is an 8-bit byte count, then its parameters packed MSB-first in registration order, then reserved bits, padded to a byte.

**Values.**

- **Stored values:** each parameter is stored as `value − min`. A value out of range reads back as the parameter's default.
- **Morphs:** each morphable parameter is followed by three deltas: Wheel, After Touch and Ctrl Pedal. Each delta is one bit wider than its parameter and is stored as `delta + (max − min)`.

**Block order (high).** MultiCommon comes first. Then each slot (A, then B) holds, in order:

1. Piano
2. SynthCommon
3. Synth
4. Organ
5. Organ Preset I
6. Organ Preset II
7. Extern
8. Effects
9. Mixer

**MultiCommon contents (high).** It holds the program-wide settings:

- rotary speed and drive;
- organ vibrato/chorus type;
- piano layer detune;
- split;
- transpose;
- master clock.

**Version gate (high).**

- **Programs and Lives:** 3.00–3.04 natively; 2.01–2.03 through a converter.
- **Synth presets:** 3.00 natively; 2.00–2.01 through a converter.
- **Within 3.x:** new parameters take bits from the reserved space, so the block lengths don't change.

**Other files (high).**

- `.ns3l` (Live) has the same body format as `.ns3f`.
- `.ns3y` (synth preset) is a version word plus one Synth block.

**Checked against our decoder (high).** Computed from the firmware's descriptors alone, this layout reproduces every offset in `src/lib/ns3/decode.ts`, including the 263-byte panel stride.

**Gaps it shows:**

- about 200 parameters we don't decode yet;
- two effect-rate bit errors;
- vibrato mode and rotary speed being read per panel. Both are program-wide, so panel B's reads are wrong.
- fields that are too narrow:
  - piano timbre: 4 bits;
  - oscillator config: 5 bits;
  - oscillator wave: one 9-bit index;
  - rotary speed: 2 bits;
- an amp EQ offset (stored +60);
- the amp type labels.

**Status.** All of these were first fixed in the hand-built decoder, each with a synthetic-buffer test. The Stage 2 amp type 0 is now labelled "Clean" in `src/lib/ns2/decode.ts`.

**The Stage 3 reader now uses this layout (2026-10-11).** `src/lib/ns3/layout.generated.ts` is generated from the registry offset map by `scripts/gen-fw-program-maps.py` (`stage-3`), and `src/lib/ns3/decode.ts` reads it through the shared block-chain reader (`src/lib/clavia/block-chain.ts`), like the Grand, Piano 6, Electro 7 and Organ 3:

- 19 blocks, a 548-byte body (592-byte file), 175 distinct parameters, plus the morph deltas of the 41 morphable ones. That closes the "about 200 parameters" gap. Slot B and Organ Preset II repeat parameters, so they are counted once.
- Every byte-level test of the earlier decoder passes unchanged against the generated layout, on a body framed the way the firmware writes it.
- Checked on real files: ns3-program-viewer's public test corpus (kept local, not committed). All 842 NSM-era `.ns3f` are 592 bytes and open with `00 00 01 30 11` (one with `00 00 01 2F 11`, version 303), and their chains walk the layout's 19 block lengths to the end of the file. So do the one `.ns3l` and, from 0x18, the five legacy 574-byte files (3.00–3.02). On all of them the panels read the same values as the earlier decoder, apart from the relabelled vibrato modes, and the morph deltas agree with the corpus's asserted morph targets.
- The typed panel shape the app uses (`Ns3Panel`) is now built from the layout's values. The labels come from the firmware's tables where it has one: the vibrato/chorus mode is stored as the selector position (V1 C1 V2 C2 V3 C3) and named per organ model (Vox V1/V2/V3 = Less/More/Original, Farfisa V1/V2/C2/C3 = Light/Heavy × Slow/Fast, Pipe C1), synth vibrato 6 is "After Touch", and the Clav timbres use the firmware's abbreviations.
- Version handling:
  - 3.00–3.04 read natively;
  - parameters added in 3.03 and 3.04 get their defaults in older files, as the firmware does;
  - a 2.0x body has other slot-block sizes, so it opens header-only with a warning;
  - a file whose chain doesn't match the layout also opens header-only with a warning;
  - a legacy (formatType 0) header is 0x14 bytes shorter, so its body is read from 0x18. The file ends with the 2-byte CRC-16 trailer of the legacy Clavia files (`clavia/crc16.ts`), which the body stops before.
- Not applied: the 3.00 delay-rate rescale and the pre-3.02 Dual-KB style fix-up, whose computations aren't known.
- The `.ns3y` synth preset's Synth block is field for field the program's Synth block (the corpus's 102-byte `.ns3y` files are version 300 plus one 53-byte block). `.ns3y` and `.ns3l` files are not routed to the reader yet.

Still to do: check the amp-type label order and the meaning of rotary speed 3.

**Stage 4.** The Stage 4 image carries the same registry framework. Its program body walks as 24 length-prefixed blocks that end exactly at the end of the file.

### Stage 2

**Stage 2 (medium).** The Stage 2 does **not** use the registry scheme:

- Its body is flat, with no per-section length bytes.
- It shares only the descriptor-driven MSB-first packing with inline morphs.
- Its synth record matches `src/lib/ns2/decode.ts` field for field.

**Consequence.** A Stage 2 decode needs its own map. It is not a delta off the Stage 3. This corrects the plan in `MULTI-MODEL.md`.

**The Stage 2 map (2026-10-11).** The Stage 2 program uses the descriptor-container scheme of the Electro 4 (`FIRMWARE-LINE.md` §6), in a variant with 24-byte descriptors: +0x10 is a per-parameter morph-source mask (3 sources), +0x12 = 1 marks a stored parameter.

- **Containers (high).** One flat list of 22 container types (`FUN_300325FA`): 7 global ones, then 15 per slot, written for slot A and then for slot B. The names come from the firmware's own labels.
  - Global: program common (slot select, dual, pitch stick, …), organ model, B3 / Vox / Farfisa common (vibrato type, percussion settings), piano slot detune, and the global effects (reverb, compressor, rotary speaker).
  - Per slot: levels, zones, octaves, pedals and outputs; the three organ preset selects; B3 / Vox / Farfisa Preset I and II; piano; arpeggiator and LFO; synth; extern; effects (Effect 1/2, delay, Amp/EQ).
- **Record (high).** A u16 record version, then 519 bytes of data: 21 global bytes, then 2 × 249 (the slot stride the earlier decoder used). The data starts at file **0x2E** behind the NSM-era header and at **0x1A** behind the legacy header. Writer `FUN_30032F1A`, reader `FUN_30032CCE`.
- **Morphs (high).** Each morphable parameter is preceded by one delta per source in its mask (Wheel, After Touch, Ctrl Pedal), one bit wider than the parameter. The reader sign-extends them (two's complement, `FUN_301EDBE6`) and keeps them within ±max. 73 parameters per slot are morphable; none of the global ones.
- **Versions (medium-high).** The current record version is 7. The load path converts versions 1–6 up to 7 in place (the size doesn't change); OpenNord reads them with the version 7 layout and doesn't apply the conversions.

**Checked against the earlier decoder (high).** Computed from the descriptors alone, the layout lands on every field the earlier `ns2/decode.ts` (from ns3-program-viewer) read, with these exceptions:

- slot detune (file `o+0x3B`) and the rotary speaker are program-wide, but the decoder read them again for slot B, 249 bytes later (slot A's Amp/EQ drive and effects padding);
- partial reads: the three outputs (2 of 3 bits), the Vox and Farfisa vibrato type (2 of 3), the arpeggiator rate (7 of 8) and the Clavinet model (2 of a 7-bit field);
- long release and string resonance are the two bits of one 2-bit "Acoustic" field.

**Status.** `src/lib/ns2/decode.ts` now reads `.ns2p` (Stage 2 and Stage 2 EX) through this layout (`src/lib/ns2/layout.generated.ts`, generated by `scripts/gen-fw-program-maps.py` `stage-2`, read by `src/lib/clavia/legacy-record.ts`). It reads every stored parameter and its morph deltas, and the fixes above are in. Still to do: confirm the record version position behind the NSM-era header (0x2C) on a real file, and label the parameters the earlier decoder didn't read (extern, synth shape and detune, …).

### Display names (high, from the firmware's label tables)

| | Stage 3 | Stage 2 |
|---|---|---|
| Organ | B3, Vox, Farfisa, Pipe1, Pipe2 (no B3 Bass) | B3, Vox, Farfisa |
| Organ vib/chorus | B3: V1 C1 V2 C2 V3 C3<br>Vox: Less / More / Original<br>Farfisa: Light/Heavy × Slow/Fast<br>Pipe: C1 | B3 V1–C3, Vox, Farfisa |
| Effect 1 | Panning, Tremolo, Ring Mod, Wah-Wah, Auto-Wah 1, Auto-Wah 2 | same six |
| Effect 2 | Phaser 1, Phaser 2, Flanger, Vibe, Chorus 1, Chorus 2 | same six |
| Amp/EQ | Clean, Twin, JC, Small, LP24, HP24 | Clean, Small, JC, Twin |
| Reverb | Room 1/2, Stage 1/2, Hall 1/2, and a Bright switch | Room/Stage/Hall |
| Synth filter | LP12, LP24, Mini Moog, LP+HP, BP24, HP24 | LP12, LP24, HP, Notch, BP |
| LFO | Triangle, Saw, Neg Saw, Square, S/H | Square, Saw, Triangle, S&H |
| Morph sources | Wheel, After Touch, Ctrl Pedal | — |

## 4. Pianos and samples

### Pianos (high)

**One piano code base.** All three models run the same piano code: the Stage 2 on its ColdFire, the Stage 3 and 4 on ARM. Each builds its piano manager with **engine generation 5 and 120 slots**:

- Stage 4: `0xC0249AC4`.
- Stage 3: `0xC0113814`.
- Stage 2: `0x30170C2E`.

**Accepted versions.**

- Only CNSP **0x450 (v5) and 0x464 (v6)** load.
- 0x423–0x440 answer "Unsupported version".
- OpenNord's v6 writer therefore produces files all three models accept.

**What NSM offers.** NSM only offers the V6 piano partition on Stage 2 OS ≥ 2.29 and Stage 3 OS ≥ 1.61. Older systems get V5.

**Shared reading.** The directory, the 0x76-byte records, the v5 record conversion and the v5 table halving are the same on all three models.

**Limits the firmware enforces (high).**

| Limit | Value | What the Nord shows |
|---|---|---|
| Strokes per piano | at most 0x149F (5,279) | "Piano is too big" |
| Shared voice table | 0x4000 entries on Stage 2; 0x6000 on Stage 3/4 | "Piano is too big" |
| Name length | at most 32 characters | "Piano name error" |
| Layers per root, per stroke type | 30 slots; Stage 2 doesn't check the bound | — |

**Where the audio is decoded.**

- **Stage 3 (high):** on a DSP. Its piano DSP image runs the same decoder as the Stage 4's DSP 4: the same block header, page table and predictor table address. `NSP-FORMAT.md` and `PIANO-ENGINE.md` §1 apply as written.
- **Stage 2 (medium):** on one of its 24-bit DSPs. The ColdFire only parses the container and packs the voice parameters into 24-bit fields.

### Samples (high)

| Model | Loads | Notes |
|---|---|---|
| Stage 2 | `.nsmp` with an NWS v8 or v11 body | 1000 slots per partition |
| Stage 3 | NSMP generation 3 only (`.nsmp3`) | NSM converts `.nsmp`; `.nsmp4` is refused |
| Stage 4 | `.nsmp3` and `.nsmp4` | |

## 5. Sound engines

### Stage 3 organ and rotary

**Organ (high).** The Stage 3 organ is the Stage 4's. Its host-side B3 tables are byte-identical to the Stage 4's:

- drawbar law;
- per-key contact levels;
- foldback;
- contact timing;
- crosstalk;
- percussion key levels;
- master tune.

The Stage 3 organ runs on its DSP 0 (medium).

**Rotary (high).** Speeds and accelerations are identical, in the same order:

- horn 0.80 → 7.0 Hz;
- drum 0.73 → 6.4 Hz;
- the same Low/High alternatives.

So OpenNord's B3 engine and the planned rotary serve the Stage 3 unchanged.

**What the Stage 3 adds:**

- rotary speed Stop/Slow/Fast;
- rotary speaker 122 / 122 Close;
- click Low/Normal/High;
- key trigger Low/High.

### Stage 3 effects

**Menus (high).**

- FX1 and FX2 have six types each.
- There are six amp types.
- Reverb is Room/Stage/Hall plus Bright.
- The delay has no feedback effects.

**Routing (high).**

- Effects are routed per panel.
- Rotary, FX1, FX2, Delay and Amp each take one **Src**: Organ, Piano or Synth.
- Reverb and Comp apply to the whole panel.

**Tunings: unverified.** None of the Stage 4's effect DSP code appears in the Stage 3 images. Mapping the Stage 3 menus onto the Stage 4 algorithms is reasonable, but the tunings stay unverified.

### Stage 3 synth

The Stage 3 synth is a different engine:

- **Oscillators:** Classic, Wave, Formant, Super and Sample banks. The 400 waves come from the synth partition.
- **Shared with the Stage 4:** the six filter types, the five LFO shapes and the LFO-rate table.

### Stage 2

The Stage 2 shares three things with the Stage 4 organ:

- the drawbar law;
- the leakage matrix;
- the master tune.

Its key-contact model differs. Its rotary speeds weren't found.

## 6. Open questions for hardware

**USB:**

1. Read the partition list on a Stage 3. Expect 12 partitions, with Program at 7.
2. Reproduce the 18 on a Stage 3 or 4:
   - start a session on 13 → expect 2;
   - then start one on 7 → expect 18 before PR #38, 0 after it.
3. On a Stage 2, does unplugging clear a stuck session lock, or only a session end?
4. Do Stage 2 OS versions before 3.00 lack the user pedal partition, putting Program at 5?

**Pianos:**

5. Does an OpenNord v6 test piano (`npm run hw:test-piano`) load and play on a Stage 2 and on a Stage 3?
6. On those models, are the +20 layer select and the root +4 the same as on the Stage 4?

**Programs:**

7. ~~A real `.ns3f`: are bytes 0x2C–0x30 `00 00 01 30 11` (version 304, first block length 17)?~~ Yes, on every file of ns3-program-viewer's corpus (§3).
8. Is the amp type value order confirmed by a real file?

**Effects:**

9. The Stage 3 effect laws (rates, depths, reverb decays): measure them on hardware audio.
