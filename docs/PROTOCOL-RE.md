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
| `0x02` | `CQryBankList` | `partition` |
| `0x04` | `CReqBegin` | `partition` |
| `0x06` | `CReqEnd` | — |
| `0x08` | `CQryPartState` | `partition` |
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

The protocol is **transport-agnostic** — `CPortMIDIBase` wraps the same messages
in a Clavia SysEx envelope (`F0 33 7F <dev> <protoId> <version> <msgId> …7-bit… F7`).
**But** the Stage 4 answered **none** of our SysEx probes on its MIDI port — not
even a Universal Identity Request (receive path proven via CoreMIDI loopback). So
SysEx-RX is almost certainly **disabled in the Nord's Global settings** (front
panel), or the firmware only services FileTransfer over vendor USB. **Net:
transfer is USB/desktop-only**; iOS-via-CoreMIDI is unconfirmed until SysEx-RX is
enabled and re-tested (`sendmidi`/`receivemidi`, `docs/SYSEX-SPIKE.md`).

## Device facts (validated)

- **Settings are readable** over USB: `Begin(11)` → the Settings partition holds a
  single file at `{bank 0, slot 0}`, type **`ns4t`**, ~80 bytes, name "Settings"
  (`scripts/nordsettings.c`). The blob is **bit-packed parameter data** (same
  style as a program body), holding the device global config (MIDI channel, local
  control, SysEx-RX, transpose, …). Isolating a specific field (e.g. the
  **SysEx-RX flag** that gates iOS transfer) needs a **differential** — toggle the
  setting on the front panel, re-read, diff — because there's no settings
  parameter-map. Note: that front-panel toggle is itself the iOS-transfer unblock,
  so enabling SysEx-RX + re-testing transfer-over-MIDI is the path, not decoding
  the bit.
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
  read/write each file); there is no separate bank-level protocol primitive.

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

Build: `clang scripts/nordX.c -I"$(brew --prefix libusb)/include" -L"$(brew --prefix libusb)/lib" -lusb-1.0 -o /tmp/nordX`.

## Safety

Reads are safe. Writes can overwrite a program slot — back up the instrument
first and target a known-empty slot. Firmware is not touched by this protocol;
worst case is one clobbered program, restorable from a backup.
