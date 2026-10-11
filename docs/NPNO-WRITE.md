# Writing `.npno` pianos — encoder notes and a hardware test recipe

> **Status: hardware-untested.** The encoder in `src/lib/ns4/nsp-write.ts` reproduces all three
> factory pianos we have locally **byte for byte**, and every file it writes passes every check
> we know of from Nord Sound Manager and the Stage 4 firmware (`src/lib/ns4/nsp-check.ts`). No
> file from it has been loaded on an instrument yet. Some header and record fields are copied as
> constants from the factory files; we don't know what they do. Read the test recipe at the end
> before you try a home-made piano on a keyboard.

**For your own recordings only.** Factory pianos are Clavia's audio. Re-encoding one is a local
verification step; the result stays on your machine and is never shared (`docs/LEGAL.md`). The
factory files used here stayed in the scratchpad and nothing derived from their audio is in the
repo. The tables below record only structure and constant header values.

## API

```ts
import { buildNpno, NPNO_PIANO_TYPE } from '@/lib/ns4/nsp-write';
import { checkNpnoAcceptance } from '@/lib/ns4/nsp-check';

const { bytes, fileName, notes } = buildNpno({
  name: 'Home Upright', variant: 'Pleyel', minor: 0, pianoType: NPNO_PIANO_TYPE.upright,
  channels: 2,
  zones: [
    { rootNote: 48, lowNote: 21, highNote: 52, layers: [  // recorded at C3
      { pcm: [left, right], floorDb: 0 },  // hardest hit
      { pcm: [left2, right2], floorDb: 10, loop: { start: 90000, length: 40000 } },  // softer
    ] },
    // …one zone per sampled note
  ],
});
checkNpnoAcceptance(bytes, { deep: true, model: 'stage-3', fileName }); // every check should be ok
```

- `buildNpno(input)` → `{ bytes, fileName, notes, stats }`. It throws a plain-words error on
  input the file can't hold (overlapping or fractional key ranges, a version minor outside 0–9,
  an unknown `pianoType`, a recording too long for the u16 block count) or a Nord won't load
  (more than 5,279 recordings, more than 30 layers in a zone, a name whose file name runs past
  32 characters; see [Limits](#limits)), and on zones whose recorded notes
  don't rise with their keys: the file stores notes by root and the key map by key, so the two
  orders must agree. It then runs `checkNpnoAcceptance` on the result (with its file name) and
  refuses to return a file that fails it.
  Zones are key ranges with a root note
  and dynamic layers, loudest first: each layer's `floorDb` says how far below the hardest hit it
  takes over (the first is 0 dB; the instrument switches halfway between floors, and the Touch
  setting maps velocity to dB). PCM is int16 per channel at
  44.1 kHz (the rate the piano DSP plays), starting at the attack, every channel the same length.
  A layer can have a sustain loop in whole frames: `start ≥ 0`, `length ≥ 4` (the seam copies 4
  frames), `start + length` ≤ the layer's length.
- A looped layer can set `decayDbPerSecond`: how fast a held note fades inside its loop (0 holds
  its level). It is written as the Q23 coefficient at +0x2E, `10^(−dB/(20·22050))` per envelope
  update (`PIANO-ENGINE.md` §1.4). Left out, the layer gets the piano-like default from its root.
- `nsmpToNpno(bytes, { name })` (`src/lib/ns4/nsmp-to-npno.ts`) builds a piano from a Nord Sample
  (`.nsmp`, `.nsmp3`, `.nsmp4`). The piano DSP never plays a recording above its own pitch, so
  each sample zone is resampled to sound at its top key, and keys more than 3 semitones above
  a recording get their own copy, four keys each. Zones with the same top velocity form a
  dynamic layer, with floors that put the layer switch at the velocity that divided them; the
  layers need not split at the same keys. The sample's global detune is applied. A short
  loop is repeated until rounding it to whole frames detunes it by under a third of a cent. A
  recording with no loop that is still sounding at its end gets a half-second fade. Like
  `buildNpno`, hardware-untested.
- A zone's `rootNote` is **the MIDI note the recording sounds at** (60 for a C4 sample), 5–127.
  The instrument plays every stroke 4 semitones above the root it stores (`NSP_ROOT_OFFSET`,
  `NSP-FORMAT.md` "Root offset"), so the file stores `rootNote − 4`: a C4 recording is written as
  root 56 and plays back at C4 on key C4. A stored root of 0 reads as an unused key, hence the
  lower limit of 5.
- `writeNpnoImage(image)` / `readNpnoImage(bytes)`: a lossless model of the whole file (header
  bytes, each stroke's PCM, record bytes and block levels). `writeNpnoImage(readNpnoImage(x))`
  returns `x` unchanged for all three factory files.
- `encodeNpnoStroke(stroke, channels)`: the block encoder on its own.
- `checkNpnoAcceptance(bytes, { deep, model, fileName })`: the checks we found in NSM and the
  Stage 2/3/4 firmware (list below), plus a structural walk and, with `deep`, a full decode.
  `model` (any model id, default `'stage-4'`) sets the piano versions the instrument loads and
  its voice-table size, from `src/lib/clavia/media-compat.ts` (see
  [Which version loads where](#which-version-loads-where)). A file the model doesn't take fails
  `stage4-generation` in plain words ("This Nord loads pianos up to version 5; this file is
  version 6"); a model without a piano section returns the single failed check `model-pianos`.
  `fileName` adds the 32-character name check. The voice-table check can only hold one file to
  an empty instrument (see below).
- `buildNpno({ …, model })` refuses a model that doesn't load version 6 pianos (v5-only models,
  models without pianos) with a plain-words error, and checks its output against that model.
  It doesn't write v5 from scratch: v5 records store the layer floor and level differently.

`readNsp`, `readNspIdentity`, `readNspDirectory`, `decodeNspStroke`, `identifyNsmp` and the folder
classifier all read the output, including a one-zone piano (`readNsp` takes a single zone when
the layers-per-root table agrees with it). With PR #23's `hasChecksum`, a v6 file reports
`hasChecksum: true, checksumValid: true`.

## Encoder

Per block, the encoder tries predictor orders 0–4 and takes the narrowest residual width (1–16
bits) whose block holds every residual of its own frames **plus the 64 overlap frames**.
On ties it takes the lowest order. The codec is lossless and the predictor history is the true
signal, so a greedy choice per block is globally consistent.

On the three factory files, this picks **the same width and order as Nord's encoder on every
block** (17,543 blocks), so the files come out the same size and layout (size ratio 1.0000).
The only difference is the block level byte. Nord measures it before rounding to 16 bits, so
98 of the 17,543 level bytes differ, by 1 dB or on near-silent blocks. `readNpnoImage` keeps
the original level bytes, and with those the re-encoded file is identical.

| Rule | Value | Source |
|---|---|---|
| Block size | 511 words per channel | DSP 4 block addressing (`NSP-FORMAT.md`) |
| Block header | `width \| order << 5 \| level << 8` | decoder |
| Level byte | `round(20·log10(8192 / peak))` over own + overlap frames, 0–100; all-zero block = 100 | matches 210/210 sampled factory blocks; 100 seen on silent blocks |
| Stroke peak | normalized to 7782 (= 0.95 × 8192) | every factory stroke peaks at 7782 or whole dB below it |
| Stroke end | the end of the block that holds the last PCM frame; for a looped stroke, the block that holds frame `loopStart + loopLength` | true of all 247 looped factory strokes (the loop end is always in the last block, 7–2,650 frames before its end) |
| After the loop end | the loop again (`x[n] = x[n − length]`) | factory files |
| Loop seam | the 4 frames before the loop end must equal the 4 before the loop start (the DSP keeps its predictor history across the jump). The encoder copies them if they don't and says so in `notes` | factory files (4–28 equal frames) |
| Unlooped padding | silence (width-1, order-0 blocks) | Wurlitzer release strokes |
| First block | the smallest offset at or after the records with `offset ≡ 830 (mod 1022)` (stereo: an odd multiple of 1022 past 830), counted from the `CNSP` tag | all three factory files; the reason is unknown |

## Every field written

Offsets from the `CNSP` tag, big-endian. "Set" = written by the encoder. "Constant" = copied
from the factory files (structure, not audio), with what they show. Fields read by the Stage 4
ARM loader come from `0xC00B84CC` (header) and `0xC00AB028`/`0xC0020088` (records), see
`NSP-FORMAT.md`.

### Envelope

| Where | v6 (default) | v5 (image only) |
|---|---|---|
| CBIN header | 44 bytes: `CBIN`, format 1 at 0x04, `npno` at 0x08, `FF`×8 at 0x0C, version ×100 (LE) at 0x14, CRC-32 of `bytes[0x2C:]` (LE) at 0x18 | 24 bytes: `CBIN`, format 0, `npno`, `FF`×8, version |
| Trailer | none | CRC-16/CCITT-FALSE of the rest of the file, LE (both v5 factory files) |
| `CNSP` tag | 0x2C | 0x18 |

### Header (CNSP + 0x000 … 0x731)

| Offset | Field | Written |
|---|---|---|
| +0x00 | `CNSP` | set |
| +0x04 | u16 format: 0x464 (v6) | set. NSM and the firmware know 0x423–0x430, 0x440, 0x450, 0x464; the instruments load only 0x450 and 0x464 (piano generation 5, below) |
| +0x06 | u32 byte sum of CNSP+0x16 … end of the CNSP stream | set. NSM rejects a mismatch (`CNSPFileInputStream` ctor) |
| +0x16 | u16 metadata version = format | set (gated like +0x04) |
| +0x18 | piano type: 1 grand, 3 electric, 4 clav seen; 2 upright, 5 digital, 6 misc inferred | set (`pianoType`, default 1) |
| +0x19 | unknown (1/3/2 in the three files; the ARM replaces it at load) | constant 1 |
| +0x1A | version minor digit: NSM's version = format·100 + this·10 (6.1 → 610) | set (`minor`); the CBIN version is set to match |
| +0x1B | unknown, 2 in all files | constant 2 |
| +0x1C | 32 bytes: `name#variant` | set (PR #22's `readNspIdentity` splits it) |
| +0x3C | 32 bytes: name (v6) | set |
| +0x5C | 32 bytes, zero in all files | 0 |
| +0x7C … +0x8A | zero in all files (NSM reads +0x7C as the entry number − 1) | 0 |
| +0x8B | unknown byte: 2 (v6), 0 (v5) | constant 2 |
| +0x8C | key map, 128 bytes: root note per key, `FF` (and `00`) unused. A stroke sounds 4 semitones above its root | set from the zones: `rootNote − 4` |
| +0x10C, +0x18C, +0x28C, +0x30C, +0x38C | per-note tables (128 bytes each), meaning unknown; zero in at least one file, +0x18C signed per note | 0 |
| +0x20C | per-note table: 0x0D in the Clavinet for keys ≤ 108, 0x39 above key 108 in all three files | constant (0x0D / 0x39) |
| +0x40C, +0x40E, +0x40F, +0x410 | single bytes: Clavinet 28, 0D, 6C, 01 (6C/01 in all files; +0x40D is replaced at load) | constant |
| +0x41C | per-note table, 0x80 everywhere in all files | constant |
| +0x49C | byte: 2 (Clavinet), 0 (v5) | constant 2 |
| +0x49D | per-note table, 0x1E everywhere in all files | constant |
| +0x51D | byte, 2 in the Clavinet (not read by the loader) | constant 2 |
| +0x5A2 | per-note table for keys 0–121 (ends at +0x61B, the byte of key 121, which keys 122–127 reuse; Stage 2 `0x301B2416`, Stage 4 `0xC00B84CC`), halved for v5 | 0 |
| +0x61C | directory: u16 format (the gate re-checks it), u16 channels, u16 stroke count | set |
| +0x622 | u16[128]: number of strokes of the zone rooted at each note (the stored root, as in the key map) | set |
| +0x722 … +0x731 | zero | 0 |

### Stroke record (0x76 bytes from CNSP + 0x732 + i·0x76)

| Offset | Field | Written |
|---|---|---|
| +0x00 | u32 first block offset | set |
| +0x04 | flags, bits 0–1: 0 normal, 2 key-release sound | 0 (release sounds not built yet; the image keeps them) |
| +0x05 | attenuation floor, 0.2 dB steps, 0 = hardest hit (v5 files store it /5, in 1 dB) | `floorDb × 5` |
| +0x06 | u32 frames, u16 +0x0A block count | set |
| +0x0C, +0x14 | 4×i16 predictor history per channel, oldest first | set (silence before the attack) |
| +0x1C, +0x20 | u32 loop start, loop length (0 = no loop) | set |
| +0x24, +0x28, +0x2C | first frame of the loop-start block, first frame of the next block, u16 that block's index | set (0 without a loop) |
| +0x2E | u32 Q23 coefficient (24 bits used), `2^23 − 98` … `2^23 − 2782` (`2^23 − 146` … `2^23 − 1593` in the Clavinet), falling with pitch, constant within a zone: the loop-sustain decay (`PIANO-ENGINE.md` §1.4) | default `2^23 − round(146·2^((root − 25)/24))` of the stored root (`rootNote − 4`), through the Clavinet's two end points |
| +0x32 | per-stroke fine tune in cents (`PIANO-ENGINE.md` §2.3); 0 in all files | 0 |
| +0x33 | floor copy | = attenuation floor |
| +0x34 | u16 level word. In the v6 Clavinet, `level + 10·k` is constant within a zone, where `k` is the dB the stroke's PCM peak sits below 7782. Our reading: an attenuation in 0.1 dB that undoes the peak normalization. v5 files are converted at load to `10·level − 2·floor·5` | `125 + 200·log10(normalization gain)`, so the original loudness between strokes is kept (`levelWord` overrides) |
| +0x36 | 14 × u32 Q23 coefficients: 13 × 0x800000 (1.0) then 0 in every v6 record | constant |
| +0x6E | u32; the loader keeps its low 14 bits with the flags. The factory values look like take numbers (89, 90, 91 for one zone) | a unique id per stroke |
| +0x72, +0x73 | damper indices for normal release and Soft Release (`PIANO-ENGINE.md` §3.1): Clavinet 0x0D and 36…28 (falling with pitch) | 0x0D, 33 |
| +0x74 | layer switch point: `floor − trunc((floor − previous layer's floor) / 2)`, 0 for the first (loudest) layer (exact for every v6 record; the loader computes the same for v5) | set |
| +0x75 | 0 | 0 |

## What the instrument and NSM check

**Nord Sound Manager 9.22** (`CNSPFileInputStream`, `SPartitionPianoV6`):

1. The `CNSP` magic.
2. The header format (+0x04) and metadata version (+0x16) are in the accepted sets.
3. The byte-sum checksum at +0x06. A mismatch sets error 3.
4. Version = `GetFormat(BCD(format))`·100 + CNSP+0x1A·10. Only 0x440/0x450/0x464 map, to 4/5/6.
   The Stage 4 piano partition takes `.npno` 500–599 and 600–699.
5. The display name comes from the **file name**, with the version suffix stripped
   (`SPartitionPiano::FormatName`). So `buildNpno` suggests `Name_6.0.npno`.

**Stage 4 OS 1.66** (ARM image):

- `0xC00B92E4` reads 0x16 bytes at file+0xC (the instrument's partition entry puts `CNSP` at
  +0xC). It checks the magic, then the header format, the metadata version (+0x22) and the
  directory version (+0x628, through `0xC00B276C`). Each must be a known format the instrument
  still supports: the gate requires the instrument's piano generation to be below
  3/4/5/6/7 for 0x423–0x42F/0x430/0x440/0x450/0x464. The result codes are 0 accepted,
  1 unsupported generation, 3 not a piano or a read error, 4 unknown version.
- **The generation is 5**, with 120 piano slots: the piano manager is built with {4, 120, 5}
  (`0xC0249AC4`, passed to `0xC00C0A04`). So only **v5 (0x450) and v6 (0x464)** load;
  0x423–0x440 are rejected ("Unsupported version").
- `0xC00B84CC` loads the header tables. `0xC00B47B8` reads the directory (+0x61C, the
  layers-per-root table) and every record. It stops with an error state when the strokes don't
  fit the voice-table space (`0x6000` entries) or the per-piano limit below (`0xC00B5618`).
- Neither the gate nor the loader checks the CNSP byte sum or the CBIN CRC. Whether the
  USB write path does is unknown (the transfer frames carry their own CRC-16).

**Stage 3 OS 2.64 and Stage 2 OS 3.00** run the same piano code (Stage 3 on ARM, Stage 2 on its
ColdFire): the same gate (Stage 3 `0xC011A4EC`, Stage 2 `0x30175C08`), the same thresholds,
directory, 0x76-byte records and v5 conversion. Both build their piano manager with
**generation 5 and 120 slots** too (Stage 3 {4, 0x78, 5} at `0xC0000614` → `0xC0119040`;
Stage 2 `0x30170C2E` → `0x301745DC(obj, 5, 0x78)`), so v5 and v6 load on all three and v4 or
older shows "Unsupported version". A version the gate doesn't know shows "Unsupported version"
on the Stage 3 and "Piano is broken" on the Stage 2. Differences:

- The voice table every loaded piano shares has **0x4000 entries on the Stage 2**
  (`0x301745DC`), 0x6000 on the Stage 3 (`0xC0119040`) and Stage 4.
- Which `.npno` NSM offers depends on the OS: the **V6 piano partition (500–699) needs
  Stage 2 OS ≥ 2.29** (`0x1000A9FA4`) **or Stage 3 OS ≥ 1.61** (`0x1001AFCEC`); older systems
  get the V5 partition (500–599) and refuse v6 files. `buildNpno` writes v6; the v5 envelope
  of `writeNpnoImage` is for those older systems.
- Neither gate checks the CNSP byte sum or either CRC (medium confidence).

### Which version loads where

One row per model, from the instrument firmware (static analysis of Nord's public OS updaters;
knowledge only, `docs/LEGAL.md`). The code copy, with the function behind each row, is
`src/lib/clavia/media-compat.ts`. Confidence: high = seen in code or data, medium = inferred
(pattern match, shared code).

| Model (OS read) | Piano versions loaded | Voice table | Stroke limit | Source | Confidence |
|---|---|---|---|---|---|
| Stage 4 (1.66) | v5, v6 | 0x6000 | 0x149F | gate `0xC00B92E4`, manager `0xC0249AC4`, loader `0xC00B47B8`, limit `0xC00B5618` | high |
| Stage 3 (2.64) | v5, v6 (NSM offers v6 on OS ≥ 1.61) | 0x6000 | 0x149F | gate `0xC011A4EC`, table `0xC0119040`, limit `0xC01170EC` | high |
| Stage 2 (3.00) | v5, v6 (NSM offers v6 on OS ≥ 2.29) | 0x4000 | 0x149F | gate `0x30175C08`, table `0x301745DC`, limit `0x30173736` | high |
| Stage 2 EX | as the Stage 2 (same OS) | 0x4000 | 0x149F | not read separately | medium |
| Electro 5 (2.04) | v5, v6 | 0x4000 | 0x149F | gates `FUN_3011DB4E` / `FUN_3011E9AC`, manager `FUN_3011D590(…, 5, 0x78)` | high |
| Piano 3 (2.04) | v5, v6 | 0x4000 | 0x149F | gates `FUN_3006338E` / `FUN_30063C08`, manager `FUN_30062F08(…, 5, 0x78)` | high |
| Electro 6 (2.66) | v5, v6 | not read | not read | gate `FUN_c00d5828` (Stage 3 ladder), manager {4, 120, 5} at `c00005e8` | high |
| Electro 7 (1.30) | v5, v6 | not read | not read | gate `FUN_c0158fe0`, manager {2, 120, 5} at `c000c794` | medium |
| Piano 4 (2.66) | v5, v6 | 0x6000 | 0x149F | gate `FUN_c00ae1a4` (= Stage 3), limit `FUN_c00aa8e8` | high |
| Piano 6 (1.20) | v5, v6 | 0x6000 | 0x149F | gate `FUN_c0095a64`, limit `FUN_c00a1e5c` | high |
| Grand (1.68), Piano 5 (1.34), Grand 2 (1.22) | v5, v6 | 0x6000 | 0x149F | the same compare pattern (Grand `c00b75fc`, Piano 5 `c0083f6c`, Grand 2 `c0095a04`), not decompiled; limit constants present | medium |
| Electro 3 (3.14) | **v4, v5** | not read | not read | gate `FUN_300422F8` | high |
| Electro 3 HP (3.16) | **v5 only** | not read | not read | gate `FUN_3004283E` | high |
| Electro 4 (1.22) | **v5 only** | not read | not read | gate `FUN_30049D4E` | high |
| Piano 1 (1.50) | **v5 only** (v6 is unknown to the loader, status 4) | not read | not read | loader `FUN_3004C442`, generation 5 via `FUN_30048240` | high |
| Piano 2 (1.22) | **v5 only** (v6: status 4) | not read | not read | loader `FUN_300C376A`, generation 5 via `FUN_300C0E2A` | high |
| C2D (1.12) | none: the Pipe loader `FUN_3003B5A0` takes only an embedded CNSP 0x440 pipe | — | — | | high |
| Wave (2.14), Wave 2 (1.24), Organ 3 (1.00), Lead 4 (1.32), Lead A1 (1.36) | none: no piano code or partition | — | — | | high |
| C1 (1.12) | none: no USB stack at all (not a registry model) | — | — | | high |
| Stage Classic, Stage EX, C2 | not read | — | — | | — |

What this means for OpenNord's files:

- `buildNpno` writes **v6**, which every model in the first group takes. For the models without
  v6 (the v5-only Electro 3 HP, Electro 4, Piano 1 and Piano 2, and the v4/v5 Electro 3) it
  refuses when given the `model`; a v5 file needs the v5 envelope (`writeNpnoImage` with `envelope: 'v5'`, a v5
  header and v5 records), which OpenNord can re-wrap but not yet build from recordings.
- Older Electro 3 systems: NSM's `CElectro3_PreNPNOv5` covers OS 1.00–2.06, which suggests those
  builds predate v5 pianos. Only OS 3.14 was read.
- "Not read" means the firmware pass didn't establish the value. `checkNpnoAcceptance` then
  skips the voice-table check for that model and still holds the file to the 0x149F notes every
  traced loader enforces.
- A model not read at all (Stage Classic/EX, C2) is checked against the Stage 4's rules, and the
  result says so (`model-pianos`, passed, with that caveat).

### Limits

| Limit | Value | What the instrument does | Source |
|---|---|---|---|
| Notes (strokes) per piano | ≤ 0x149F = **5,279** (and ≤ the free voice-table entries) | "Piano is too big" (status 5) | Stage 4 `0xC00B5618`, Stage 3 `0xC01170EC`, Stage 2 `0x30173736`/`0x30173568`; Piano 4 `FUN_c00aa8e8`, Piano 6 `FUN_c00a1e5c`; the same on Electro 5 and Piano 3 |
| Voice table, shared by every loaded piano | 0x4000 (Stage 2, Electro 5, Piano 3), 0x6000 (Stage 3/4, Piano 4/5/6, Grand, Grand 2); other models in the table above | "Piano is too big" | Stage 2 `0x301745DC`, Stage 3 `0xC0119040`, Stage 4 `0xC00B47B8`; the rest in the table above |
| Name of the piano's partition entry | ≤ **32 characters** (whether the `.npno` extension counts is unknown; OpenNord counts it) | "Piano name error" (status 6) | Stage 2 `0x30174084`; Stage 3 the same |
| Layers per root note, per stroke type | **30** slots (dynamic layers and key-release sounds each have their own) | Stage 2 has no bound check, so a 31st corrupts memory | Stage 4 `0xC00A3988`; Stage 3 inferred; Stage 2 `0x301B3FEC` (inferred) |
| Pianos | 120 slots across both piano partitions (Stage line, Electro 5/6/7, Piano 3/4/5/6, Grand, Grand 2) | — | the piano manager constructors above |

No byte-size limit appears in the firmware: "Piano is too big" counts notes, not bytes. The
Stage 2 display shows the header's `name#variant` split at `#`, at most 16 characters of the name
and 17 of the variant (`0x30172966`).

`checkNpnoAcceptance` re-implements these, plus the CBIN CRC (the header's format byte must
match the `CNSP` position, as `readNsp` requires) and a structural walk: the header, metadata
and directory versions are each held to the loadable generations (v5/v6), and the key map's
zones must match the notes' roots in the same order. It checks the limits above: at most 5,279
notes (`piano-size`), at most 30 layers per zone and stroke type (`layers-per-zone`), and, given
a `fileName`, at most 32 characters (`name-length`). The voice table is shared: the free space
is the model's table (`model`) minus the entries the pianos already on the instrument use, so
the `voice-table` check only proves the file fits an otherwise empty instrument. Whether it fits
next to your other pianos is something only the instrument can tell.

## Hardware test recipe (Stage 4)

Nobody has run this yet. Please report what happens (an issue with the OS version, the file and
what the display showed).

The hardware test kit builds the files for steps 2 and 5 and a way to measure the results:
`npm run hw:test-piano` writes four tiny synthetic test pianos (one zone without and with a loop,
two touch layers, two zones), each passing `checkNpnoAcceptance(bytes, { deep: true })`, and
`npm run hw:compare` measures a recording of what the Nord plays. The whole session, with the
expected pitches and what to write down, is group B of
[`HARDWARE-TEST-PLAN.md`](HARDWARE-TEST-PLAN.md#b-loading-a-written-piano-25-min).

1. **Back up first.** Make a full backup with Nord Sound Manager (or OpenNord's backup). Note the
   OS version (the recipe was written against OS 1.66). OpenNord's backup skips pianos (they are
   library content), so make sure you can download again any factory piano you might delete to
   make room.
2. **Start with the smallest possible test.** One zone, one layer, a few seconds of stereo
   audio, no loop. The first file should check the container, not the voicing.
   `checkNpnoAcceptance(bytes, { deep: true })` must report every check ok.
3. **Optional control file.** Re-encode one of your own factory pianos with
   `writeNpnoImage(readNpnoImage(bytes))`. It comes back byte-identical, so loading it proves
   nothing new. Instead, drop the kept level bytes (`levels = undefined`, so only some level
   bytes change) and rename it in the file name. If that version plays like the original, our
   block encoder and level bytes are fine on hardware.
4. **Load it into a spare slot.** In Nord Sound Manager, open the **Piano** tab and check the
   free space. Drag the `.npno` in, into an empty location. Don't replace anything. Note any
   error NSM shows: "unsupported", "corrupt" or a version message tells us which check failed.
5. **What to look for on the keyboard.**
   - Does the piano appear in the Piano section's list under its type (from `pianoType`), with
     the file name or the `name#variant` from the header?
   - Does each key in the zone play at the right pitch? A wrong pitch means the rate or root
     note is wrong.
   - Dynamics: does the soft layer play when you play softly and the loud one when you hit hard?
     The instrument plays one layer at a time (no crossfade), so expect a change of timbre at the
     switch while loudness keeps following your touch.
   - Overall level compared with a factory piano. The +0x34 level word is a hypothesis: if the
     piano is far too loud or too quiet, report roughly how many dB, so the formula can be fixed.
   - Sustain and release: how fast does a held note fade once it is inside its loop (the +0x2E
     coefficient), and how fast does it die after key-up (the +0x72 damper index)? Hold a loop
     and listen for clicks at the loop point.
   - Repeated notes, sustain pedal, and playing many notes at once (voice stealing uses the block
     levels).
6. **Remove it.** In NSM's Piano tab, select the piano and delete it. If the instrument acts up
   (no sound in the piano section, an error at boot), delete the piano from NSM first, then
   restore the backup if anything else changed. Nothing written here touches programs or
   settings.
7. If NSM refuses the file with no clear message, the same file can go through OpenNord's
   device layer (`pushFile` to partition 1, the Piano partition, at a free slot). It strips the
   44-byte CBIN header, which is what the instrument stores for v6 files. Enumerate the
   partition afterwards to see whether the entry is listed.

## Open questions

- The meaning of the per-note tables and the byte at +0x19. `PIANO-ENGINE.md` §3.2 reads
  +0x8B/+0x49C as the soft and normal release modes (medium confidence). Our defaults copy the one
  v6 file we have (a stereo Clavinet). A **mono v6** file has not been seen. If the +0x8B/+0x49C
  bytes also depend on the channel layout, a mono build may need 0 there.
- The +0x34 level word (sign and unit) and the +0x2E coefficient were inferred from patterns.
  `PIANO-ENGINE.md` has since traced how the firmware uses them (§2.2, §1.4); the encoder's
  defaults for them are still fitted to the factory files.
- Why the first block sits on the `830 mod 1022` grid. We copy it rather than guess.
- Key-release strokes (flag 2) are kept by the image writer but not built by `buildNpno` yet.
- ~~The firmware's view of the generation number for each model (`param_1[3]` in the gate).~~
  Resolved: generation 5 with 120 slots on the Stage 2, 3 and 4 (see "What the instrument and NSM
  check"), so v5 and v6 load on all three.
- Which name the 32-character rule measures: with or without the `.npno` extension, and whether
  it is the name `pushFile` and NSM send. OpenNord counts the extension until hardware says.
