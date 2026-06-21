# The Nord Stage 4 USB transfer protocol

Status: **fully reverse-engineered and hardware-validated** — enumerate, read,
*and* write, both directions, proven on a real Nord Stage 4 (firmware 3.40). The
protocol was recovered by decompiling Nord Sound Manager (`docs/NSM-TEARDOWN.md`)
and confirmed live with the `scripts/nord*.c` tools.

This is legitimate interoperability work on hardware you own: an open client that
speaks the same protocol. Don't redistribute Clavia's binaries (`docs/LEGAL.md`).

---

## Device

| | |
|---|---|
| VID : PID | `0x0FFC` (Clavia DMI AB) : `0x002E` (Nord Stage 4) |
| Transfer interface | **0** — vendor-specific (`0xFF/0xFF/0xFF`) |
| Bulk OUT `0x03` | host → device commands |
| Bulk IN `0x82` | device → host replies / file data |
| Interrupt IN `0x81` (16 B) | async notifications (`CFTNotify*`) |
| Interface 2 | standard USB-MIDI (CC/NRPN) — *separate* from transfer |

NSM holds interface 0 **exclusively**; quit NSM before claiming it (libusb /
WebUSB / node-usb). Recon: `scripts/nordusb.c` (passive, reads cached descriptor).

## Message framing

Every message, all fields **big-endian**:

```
[u32 length]      total bytes incl. this field + the trailing CRC16
[u32 protocolId]  0x0000000C = FileTransfer  (MIDIX / InstrCtrl have other ids)
[u32 version]     0x0000000A
[u32 msgId]       opcode (table below)
[ payload ]       msgId-specific, big-endian u32 words (+ trailing bytes for some)
[u16 CRC16]       CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) over all preceding bytes
```

Note the transport CRC is **CRC-16**; the `.ns4p` *file* checksum is a different
CRC-32 (`docs/CHECKSUM.md`). A reply's opcode is always **`request | 1`**
(`CReqFileOpen 0x0C` → ack `0x0D`). Reply payload word 0 is a **status**: `0` =
OK, `1` = empty/not-found, `2` = no session, `3` = not open.

## Opcodes

| msgId | message | payload (big-endian u32, unless noted) |
|---|---|---|
| `0x00` | `CQryPartList` | — |
| `0x02` | `CQryBankList` | `partition` (→ `0x03`: per-bank slot capacity — see *Partition capacity*) |
| `0x04` | `CReqBegin` | `partition` |
| `0x06` | `CReqEnd` | — |
| `0x08` | `CQryPartState` | `partition` (→ `0x09`: file count + free space — see *Partition capacity*) |
| `0x22` | `CReqEraseBlock` | `blockCount` (→ `0x23` ack; free room before a write — see *Partition capacity*) |
| `0x0A` | `CReqFileCreate` | `bank, slot, size, fourccType, 0xFFFFFFFF, category, u32 nameLen, name…` |
| `0x0C` | `CReqFileOpen` | `bank, slot` |
| `0x0E` | `CReqFileClose` | `bank, slot` |
| `0x10` | `CReqFileWrite` | `bank, slot, offset, dataLen` + `dataLen` raw bytes |
| `0x12` | `CReqFileRead` | `bank, slot, offset, length` |
| `0x14` | `CReqFileDelete` | `bank, slot` |
| `0x1E` | `CQryFileInfo` | `bank, slot` |
| `0x20` | `CQryFileIterate` | `bank, cursor, 0` |
| `0x28` | `CQryFileGetDependency` | `bank, slot` (→ `0x29` reply: the file's sample dependency list) |
| `0x2F` | `CReqFileSetFocus` | `bank, slot` |
| `0x31` | `CQryFileGetFocus` | — |
| `0x3D` | `CQryContentVersion` | — |

`fourccType` = the extension packed big-endian (`Ext2Type`): `ns4p` = `0x6E733470`.

## Addressing — one model

`CReqBegin{partition}` opens a **session on a partition**; every file op then
addresses **`{bank, slot}`** within it:

- **partition** — index into `CQryPartList` (order): `0` Piano (Native), `1`
  Piano, `2` Pedal (Native), `3` Piano Pedal, `4` Samp Lib (Native), `5` Samp
  Lib, **`6` Program**, `7` Organ Preset, `8` Piano Preset, `9` Synth Preset,
  `10` Live, `11` Settings.
- **bank** — 0-based within the partition. Program has 8 banks (A–H); Piano
  (Native) has one bank of 1200. `CQryBankList{partition}` lists them.
- **slot** — 0-based raw index within the bank (0–63 for Program). The Nord's
  `X:YY` display maps as `X = 'A'+bank`, `YY = (slot/8 + 1)(slot%8 + 1)` (digits
  1–8). e.g. bank 6, slot 0 = **G:11**; bank 2, slot 63 = **C:88**.

> Earlier notes called this `{partition, index}`; that was a misread — the value
> happened to equal a bank number (passing `6` to `FileInfo` after `Begin(6)` is
> bank `6` = G, not "partition 6"). It is always `{bank, slot}`.

## Operations (all hardware-validated)

**Enumerate a whole partition** — `FileInfo` only sees the *focused* bank, so walk
with the cursor iterator (`GetFileListAsync` → `FileIterateNext` → `OnReply`):

```
Begin(partition); bank = 0; cursor = 0xFFFFFFFF
loop: send  CQryFileIterate{bank, cursor, 0}        (0x20)
      reply CRpyFileIterate{code, bank, slot}       (0x21)
        code 0 → file at (bank, slot); record; cursor = slot   (cursor wraps: next slot > cursor)
        code 1 → bank exhausted; bank += 1; cursor = 0xFFFFFFFF
        else   → done
End
CQryFileInfo{bank, slot} names each: reply = {status, …, size, fourccType, version×100, fileCRC, category, u32 nameLen, name}
```

Validated: walked Program → **356 files** across banks A–H (the 355 user programs
+ the "OPENNORD TEST" we wrote at C:88), names matching NSM exactly. Tool:
`scripts/nordcorpus.c`.

**Read a file** (read-only, safe):
```
Begin(partition) → FileOpen{bank,slot} → FileRead{bank,slot,offset,length} → FileClose{bank,slot} → End
```
The read reply (`0x13`) is: protocol header + read-ack header (`status, …, u32
dataLen`) + the **parameter body** + CRC16. The device returns the *body only*;
the 44-byte `CBIN` file header is reconstructed from `FileInfo` metadata. Tools:
`scripts/nordprobe.c`, `scripts/nordcopy.c`.

**Write a file** (validated by writing a playable program to C:88):
```
Begin(partition)
FileCreate{bank,slot,size,fourccType,0xFFFFFFFF,category,name}
FileWrite{bank,slot,offset,dataLen} + body
FileClose{bank,slot}     ← REQUIRED: this commits the file
End
```
Gotchas learned the hard way: **(1)** `FileRead` needs a prior `FileOpen` (else
status 3). **(2)** the `FileClose` after writing is what **commits** — without it
the device ACKs every step (status 0) then silently discards the file. **(3)**
drain the IN endpoint between separate program runs (replies queue).
`FileDelete{bank,slot}` removes a file.

## MIDI / SysEx transport (and iOS)

The protocol is **transport-agnostic in the code** — `CPortMIDIBase` wraps the
same messages in a Clavia SysEx envelope (`F0 33 7F …`) — but that path is **dead
on the NS4**. The Stage 4 answered **none** of our SysEx probes (including a
framing-independent Universal Identity Request; receive path proven via CoreMIDI
loopback), and there is **no SysEx-RX setting** on the instrument (confirmed —
every front-panel menu + manuals/forum). The SysEx framing is just Clavia's shared
protocol library, not active here. **Settled: the NS4 does not do program transfer
over SysEx.**

**→ Program transfer rides the vendor USB interface.** Reachable from **desktop**
(WebUSB / node-usb / libusb) and from a **native iPad app (iPadOS, M1+) via a
`USBDriverKit` DEXT** — Apple permits vendor-class (`0xFF`) access; needs the
`com.apple.developer.driverkit` distribution entitlement. **Not** reachable from
**iPhone**, nor from any **PWA/browser** on Apple devices (no WebUSB/Web MIDI),
nor via SysEx. So: transfer = desktop or native iPad; PWA/iPhone get
read/share/AI + live MIDI only. Full breakdown + sources: `docs/SYSEX-SPIKE.md`.

## Device facts (validated)

- **Settings are readable** over USB: `Begin(11)` → the Settings partition holds a
  single file at `{bank 0, slot 0}`, type **`ns4t`**, ~80 bytes, name "Settings"
  (`scripts/nordsettings.c`). The blob is **bit-packed parameter data** (same
  style as a program body), holding the device global config (MIDI channel, local
  control, transpose, …). Isolating a specific field would need a **differential**
  (change one setting, re-read, diff) since there's no settings parameter-map.
  (There is **no** SysEx-RX setting on the NS4 — see above; transfer-over-SysEx
  isn't a thing on this device, so there's no flag to find.)
- **Dependency** (`CQryFileGetDependency 0x28` → `0x29`) returns a program's
  **sample dependency list** — the "you need these factory samples" data. Reply:
  `{status, bank, slot, u32 count, count × entry}`. Each entry (protocol
  version ≥ 9, the NS4 case — `CDepBase::Deps_Read`) is
  `{u8 found, u32 id0, u32 id1, u32 id2, u32 nameLen, char name[nameLen], u32 ×3}`
  — i.e. **29 + nameLen** bytes (the 3 trailing u32 are the ≥9 addition; the
  legacy <9 format omits them). `found=1` = sample present/loaded; `found=0` + a
  name = referenced but **absent** (the "you're missing this sample" case);
  empty = unused slot. `id2` is the sample's unique id; `name` the factory
  name+version. Verified live — e.g. A:01 "Dont look back" → *Royal Grand 3D XL
  6.1*, *3 Violins Mellotron_MKII 4.1*, *White Grand XL 6.3 (absent)*. All 5
  slots/program decode cleanly. Tool: `scripts/nordeps.c`.
- **Notifications** (`CFTNotify*` on interrupt `0x81`) only fire during long
  transfers (progress); nothing arrives at idle. A transfer UI polls `0x81` for
  progress while a download/upload runs.
- **Decoder validated at scale:** 12 real programs pulled off the device decode
  cleanly through `parseNs4Program` (7 layers, 0 warnings each) — not just the
  fixture. The full **program-category enum** (54 entries) is ported in
  `src/lib/ns4/categories.ts` (e.g. 6 = Lead, 7 = Organ, 45 = Synth Classic).
- **Backup/restore** is orchestration over the per-file ops above (enumerate →
  read/write each file). The *transfer* needs no bank-level primitive, but a
  safe write **should** first check the partition has room — see
  *Partition capacity* below.

## Partition capacity / free-space — pre-write fit check

NSM checks that a download *fits* before transferring; OpenNord does not yet.
`pushFile()` (`src/lib/device/transfer.ts`) goes straight to `FileCreate` and
relies on the device to reject — surfacing only a raw `status N`. The data to do
better rides opcodes we list above but **don't implement** (`CQryPartState`
`0x08`, `CQryBankList` `0x02`, plus the `CReqEraseBlock` pair below).

Schemas + semantics below were recovered by **Ghidra decompilation** of NSM
(`scripts/nsm-decompile.sh`; `nsm_decomp/*.c`, gitignored) and then **confirmed
live on a Nord Stage 4 (firmware 3.40)** via `scripts/nordprobe.c` — read-only
queries, no writes. `Read`/`Write` agree byte-for-byte in the decomp, and the
captured replies match the model.

**Reply schemas:**

- `CQryPartState{partition}` `0x08` → `CRpyPartState` `0x09`
  (`CRpyPartState::Read` NSM arm64 `@0x10008ca0c`): `u32 status` then **5 payload
  u32** `[fileCount, used, free, reserved, E]`. (Earlier "6 u32" note was
  off-by-one: the first u32 is the status, not a data field.) `OnReply`
  (`@0x10007bbc8`) caches the 5 into `CFileTransfer + idx*0xb70 + 0xc90…0xca0`,
  thence into a `CPartInfo` and `CPartition::GetInfo()` (`+0xb5c`=used,
  `+0xb60`=free/headroom, `+0xb64`=reserved). **All counts are erase blocks**,
  except `fileCount`. Live capture (Program partition, `08:6`):
  `status=0, fileCount=356, used=3552, free=4632, reserved=0, E=4` — the
  **356 exactly matches** the 356 enumerated Program files (above), nailing word 1
  as the file count. `word5/E` (4 for Program, 8 for Piano/Sample) is unresolved —
  plausibly a block-size class; not needed for the fit check.
  - **Native vs user partitions share one physical region.** `08:0` (Piano-Native)
    returned byte-identical to `08:1` (Piano-user), and `08:4`==`08:5`
    (SampLib-Native/user). `used`/`free` report the **user-writable** portion;
    factory content is not counted in `used`. So `free` is directly "space
    available to the player" (matches NSM's "clearing Sample Library won't free
    Piano"). Captured: Piano `used=48, free=16104, rsv=0`; SampLib
    `used=7, free=15711, rsv=658`.
- `CQryBankList{partition}` `0x02` → `CRpyBankList` `0x03`
  (`CRpyBankList::Read` `@0x10008c414`): `u32 status`, `u32 partitionIndex`,
  `u8 bankCount`, then `bankCount` records at **stride 0x84**, each
  `{ name (u32 len ≤0x7f + bytes, NUL-term), u32 entryCount @+0x80 }`. The per-bank
  u32 is the bank's **slot capacity** (max files the bank holds), not a size. Live
  (Program, `02:6`): **8 banks "Bank A"…"Bank H", each entryCount `0x40`=64** →
  512 program slots. With `fileCount=356` from `CRpyPartState`, that's **156 free
  slots**. (The PartList reply `0x00`→`0x01` carries 12 partitions as
  `u8 count + {u32 nameLen, name, props…}` records — names/order match
  *Addressing* above.)
- `CReqEraseBlock` `0x22` → `CAckEraseBlock` `0x23`
  (`Write @0x10090728`, `Read @0x10090778`): request body is `u32 blockCount`; ack
  is `u32 status`. A write that needs more room first **erases blocks**.

**The fit test — all counts are ERASE BLOCKS, not bytes.**
`CFileManager::CheckDownloadFit_GetRequiredEraseBlockCnt` (NSM arm64 `@0x1000edb88`):

```
required = Σ ceil((fileBytes + perFileOverhead) / blockSize)   // → block count
used     = GetInfo()+0xb5c
usedPlus = used + (GetInfo()+0x26 ? reserved(+0xb64) : 0) + p3
if   free(+0xb60) + usedPlus < required → "…can only contain a maximum of %.1f MB"   // exceeds total (used+free)
elif used < required && usedPlus < required → "…only has %.1f MB of free space"          // not enough free
else  fits;  blocksToErase = required - used → CReqEraseBlock(blocksToErase)
```

`blockSize` and `perFileOverhead` are **device-reported** (arrive in the `CPartInfo`
header → `CPartition::GetProps()+4` / `+8`), *not* hardcoded — there is **no
per-model capacity table** in NSM; capacity is entirely what `CRpyPartState`
returns. Bytes are display-only: `bytes = blocks × blockSize`
(`CPartitionCtrl::GetFreeBytes @0x100132314`); the exact MB divisor (1024² vs 1e6)
feeding the `"%.1f MB"` strings was not pinned and doesn't affect the check.

**A second, independent "full" condition** is the per-bank slot count: a write can
fail because the *bank's entryCount is reached* even when block space is fine →
*"The bank is full."* / *"The partition file list is full."* (the `CRpyBankList`
`entryCount` field above). A correct guard checks **both** capacity and slot count,
and translates to musician language — never a raw `status N` / slot code
(`docs/LEGAL.md` / design rules).

**Block size → real megabytes (Sample/Piano).** The device reports counts in
erase blocks, not bytes; the block size isn't transmitted. It's recovered from the
**documented partition capacities** — official NS4 specs: **2 GB Piano / 1 GB
Sample Library** — over the measured block totals, which land on clean powers of
two: a `≈16384`-block (2¹⁴) partition ⇒ **128 KiB/block (Piano)** and **64 KiB/block
(Sample)**. Live cross-check (this device, factory content absent): Sample
`free 15711 × 64 KiB ≈ 982 MB`, Piano `free 16104 × 128 KiB ≈ 1.97 GB`; totals
(`used+free+reserved`) ≈ 1 GiB / 2 GiB (the few missing blocks = system reserve).
Documented stock free space (≈33 MB sample, ≈11 MB piano with factory banks of
945 MB / 1.6 GB loaded) is consistent. So free MB = `freeBlocks × blockSize`, with
`blockSize` from a small per-partition table (`src/lib/device/capacity.ts`
`PARTITION_BLOCK_BYTES`); Program stays slot-bound. Sources: nordkeyboards.com NS4
specs; norduserforum capacity threads.

**Status — hardware-validated (read side).** The query/reply schemas and field
meanings above are confirmed live (NS4 fw 3.40). For **program** writes the
binding limit is slots — fully known — so a guard can ship now:
- read `CQryBankList{6}` → Σ entryCount = total slots; `CQryPartState{6}` word 1 =
  used → free slots = total − used. Block headroom (`free` word) is a secondary
  check.
- wire `checkDownloadFit()` into `pushFile()` + `backup.ts` restore; translate the
  two failure modes ("no free slot" / "not enough space") to musician language.
- a delete-differential (write/erase a slot, re-query) would further confirm the
  block-accounting deltas, but is destructive — skipped here (read-only capture).

## Tools (`scripts/`, libusb — read-only unless noted)

| tool | purpose |
|---|---|
| `nordusb.c` | passive USB descriptor recon |
| `nordprobe.c` | generic message sequencer (`msgId:payload…`) |
| `nordcorpus.c` | full-partition enumeration (FileIterate walk) |
| `nordpull.c` | partition list + partition probe |
| `nordcopy.c` | read→write round-trip (**writes**) |
| `nordcreate.c` | gated `FileCreate` (**writes**) |
| `nordel.c` | `FileDelete` a slot (**writes**) |
| `nordsettings.c` | read the Settings partition (`Begin(11)`) |
| `nordeps.c` | `GetDependency` — a program's sample list |

Build: `clang scripts/nordX.c -I"$(brew --prefix libusb)/include" -L"$(brew --prefix libusb)/lib" -lusb-1.0 -o /tmp/nordX`.

> The C tools were the RE/validation harness; the protocol is now implemented in
> **TypeScript** for the app under `src/lib/device/` (`transport`/`webusb`,
> `protocol`, `opcodes`, `session`, `transfer`, `backup`) — the WebUSB client that
> ships these operations.

## Safety

Reads are safe. Writes can overwrite a program slot — back up the instrument
first and target a known-empty slot. Firmware is not touched by this protocol;
worst case is one clobbered program, restorable from a backup.
