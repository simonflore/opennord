# Reverse-engineering the Nord USB protocol

Decoding `.ns4p` files is solved (100% parameter coverage). Generating a valid
checksum is in progress (`docs/CHECKSUM.md`). The remaining frontier is **direct
device transfer**: reading a program off the Stage 4 and writing one back over
USB, without Nord Sound Manager in the loop.

This is legitimate interoperability reverse-engineering of hardware you own. The
goal is an open client that speaks the same protocol — not redistributing
Clavia's software. Keep captures and notes for the protocol; don't republish
their binaries.

There are **two layers**. Attack the cheap one first.

> **Update (binary teardown) — it's Layer 2.** Static analysis of Nord Sound
> Manager 9.03 (`docs/NSM-TEARDOWN.md`) shows the official client transfers
> programs over a **raw USB / IOKit vendor bulk protocol** (`Ymer::USB::CUSBMan`,
> `Ymer::Protocol::FileTransfer`), with **no CoreMIDI** and no SysEx program-dump
> path. Do the Layer-1 listen once to confirm on real hardware, then expect to
> live in Layer 2. The recovered command set is the protocol's shape — see the
> "known command vocabulary" note under Layer 2 below.

---

## Layer 1 — USB-MIDI SysEx (try this first)

Nords are MIDI-native, and patch-transfer-over-SysEx is proven on older Clavia
hardware (the Nord Lead 3 librarian). If the Stage 4 dumps programs as SysEx you
never touch raw USB — you monitor at the MIDI layer, which is far easier.
See `docs/SYSEX-SPIKE.md` for the focused experiment; `src/lib/midi/sysex.ts`
has the listener + Clavia `0x33` envelope helpers.

- Clavia manufacturer id is `0x33`: a Nord SysEx message is `F0 33 … F7`.
- Tools: Snoize **SysEx Librarian** + **MIDI Monitor** (macOS), or a Web MIDI
  page with `requestMIDIAccess({ sysex: true })` (any Chromium).
- **Size tell:** an `.ns4p` is 868 bytes, but a SysEx dump is *larger* — MIDI
  data bytes are 7-bit only, so binary is 7-to-8 or nibble encoded. Traffic
  roughly 1.14× (7→8) or 2× (nibble) the file size is your program. If you see
  that, Layer 2 is moot.

Win condition: receive a dump, send it back, confirm the program loads intact.

---

## Layer 2 — Raw USB capture (if it's a vendor bulk protocol)

If Sound Manager uses a vendor-specific interface instead of MIDI, use the
standard capture-and-differential playbook below. It's the same differential
method that cracked the file layout: **change one variable, capture, diff.**

> **Known command vocabulary (from `docs/NSM-TEARDOWN.md`).** The client's own
> `Ymer::ProtocolManager` request classes name the operations you'll see on the
> wire — use them to label captures: `Download` / `DownloadBank`, `Upload` /
> `UploadBank` / `UploadStream`, `Copy`, `Move`, `Swap`, `Delete`, `Erase`,
> `Format`, `Convert`, `Get/SetDependency` (sample links), `Get/SetFocus`,
> `PartList`, `PartStates`, `PartitionState`, `QryContentVersion`,
> `SetFileProps`. Async replies: `NotifyStarted/Progress/Completed/State`. Storage
> model is **partition → bank → location/slot**. Start by capturing a single
> `Download` (read one program) — it's read-only and the simplest framing.

> **RESULT — protocol recovered statically from the binary (2026-06).** Ghidra
> decompilation of `Zevs::Port` + `Zevs::Protocol::FileTransfer` gives the full
> wire format without any capture. Each message (all fields **big-endian**):
>
> ```
> [u32 length]      total message size in bytes, incl. this field + CRC16
> [u32 protocolId]  0x0000000C  = FileTransfer  (MIDIX/InstrCtrl have other ids)
> [u32 version]     protocol EVersion
> [u32 msgId]       opcode (table below)
> [ payload ]       msgId-specific, a sequence of big-endian u32 words
> [u16 CRC16]       CRC-16 over everything above (NB: file CRC is CRC-32 — different)
> ```
>
> Built by `CPortUSBBase::MsgProlog` (writes the 3 header u32s after reserving the
> length word) + `MsgEpilog` (back-fills length, appends CRC16). Sent by
> `CPortUSB::Send` → `USB::CStreamDuplex::WriteSync(buffer, len)` on bulk OUT
> `0x03`; replies (`CAck*`) arrive on `0x82`, async `CFTNotify*` on interrupt `0x81`.
>
> **Opcode table** (from each message's `Write`; `CReq*` = command, `CAck*` =
> reply, `CQry*` = query). Payload words are big-endian u32:
>
> | msgId | message | payload |
> |---|---|---|
> | `0x00` | `CQryPartList` | — |
> | `0x04` | `CReqBegin` | 1 (session) |
> | `0x06` | `CReqEnd` | — |
> | `0x08` | `CQryPartState` | 1 (partition) |
> | `0x0A` | `CReqFileCreate` | 7 (spec + sizes) |
> | `0x0C` | `CReqFileOpen` | 2 (file address) |
> | `0x0E` | `CReqFileClose` | 2 |
> | `0x12` | `CReqFileRead` | 4 (address + offset + length) |
> | `0x1E` | `CQryFileInfo` | 2 |
> | `0x3D` | `CQryContentVersion` | — |
>
> **Read-one-program sequence:** `CReqBegin(0x04)` → `CReqFileOpen(0x0C, addr)` →
> `CReqFileRead(0x12, addr, offset, length)` (data streams back on `0x82`) →
> `CReqFileClose(0x0E)` → `CReqEnd(0x06)`. Read-only — safe to attempt first.
>
> **The address (`SFileSpec`)** is the two u32 words in `CReqFile::Wr` — almost
> certainly the partition/bank/slot triple packed into them; pin the exact packing
> by reading `SFileSpec` construction (one more decompile) or by diffing two opens.
>
> **Transport-agnostic — and this reopens iOS.** The identical message rides over
> **MIDI SysEx** via `CPortMIDIBase::MsgProlog`:
> `F0 33 7F <dev> <protoId> <version> <msgId> …payload (7-bit encoded)… F7`
> (`0x33` = Clavia, exactly the `docs/SYSEX-SPIKE.md` envelope). So the protocol is
> **not** intrinsically USB-only — NSM just chose USB. **If the Stage 4 firmware
> accepts FileTransfer over its MIDI port, program transfer works over CoreMIDI on
> iOS.** That's now the single highest-value unknown — see `docs/SYSEX-SPIKE.md`.
>
> **Now pinned (decompiled):** protocol **version byte = `0x0A`** (`CFileTransferBase(port, 10)`);
> **CRC-16 = CCITT/XMODEM family — poly `0x1021`, init `0xFFFF`**, MSB-first,
> table-driven (`CRC::CCRC16::CalcBuffer`, `Reset` sets `0xFFFF`). Still open: the
> `SFileSpec` u32 packing, and the MIDI epilog's exact CRC 7-bit encoding.
>
> **Hardware test result (2026-06, NS4 fw 3.40, MIDI port).** Sent a Universal
> Identity Request *and* hand-framed FileTransfer `CQryContentVersion`/`CQryPartList`
> SysEx (several dev/CRC variants) to the Nord's USB-MIDI in; **the Nord replied to
> none of them.** The receive path is proven good (a CoreMIDI loopback note-on was
> captured fine), so this is real silence, not a tooling fault. Interpretation: the
> NS4 does **not** service SysEx on its MIDI port as configured — most likely its
> Global **SysEx RX is disabled** (default on many Nords; needs front-panel access
> to enable), or the firmware only accepts FileTransfer over the **vendor USB**
> interface. **Conclusion: program transfer over MIDI/SysEx is unconfirmed and
> currently looks USB-only — so iOS-via-CoreMIDI transfer is not viable on this unit
> without first enabling SysEx on the keyboard.** Retest once SysEx RX is on; tools:
> `sendmidi`/`receivemidi`.

> **✅ VALIDATED ON HARDWARE (2026-06, NS4 fw 3.40) — the protocol works.**
> With NSM quit, `scripts/nordprobe.c` (libusb) claimed vendor interface 0 and ran
> the framing above **read-only**. Both queries got correct, well-formed replies:
>
> - `CQryContentVersion` (TX `00000012 0000000C 0000000A 0000003D` + CRC `e238`) →
>   RX `00000016 0000000C 0000000A 0000003E 00000000` + CRC — i.e. **reply msgId =
>   request + 1** (`0x3D`→`0x3E`), content version `0`.
> - `CQryPartList` (msgId `0x00`) → reply msgId `0x01`, 543 bytes: the **partition
>   table**, each entry a u32-length-prefixed name + fields. Names read straight out:
>   *Piano (Native), Piano, Pedal (Native), Piano Pedal, Samp Lib (Native), Samp
>   Lib, Program, Organ Preset, Piano Preset, Synth Preset, Live, Settings*
>   (`(Native)` = factory/read-only areas).
>
> This confirms **everything**: endpoints, big-endian framing, protocol id `0x0C`,
> version `0x0A`, opcodes, *and the CRC-16* (the device accepted our CRC → the
> CCITT poly/init are right). **Reply opcode = request opcode | 1.**
>
> **✅✅ FULL FILE READ VALIDATED (2026-06).** A complete read sequence pulled a real
> file off the keyboard, read-only:
> `CReqBegin{0}` (→ status 0, session open) → `CReqFileOpen{part, loc}` (→ status 0)
> → `CReqFileRead{part, loc, offset, length}` → reply `0x13` carrying the file
> bytes. Reading `{partition 0 (Piano Native), location 1}` returned the file magic
> **`CNSP`** + strings *"Vibraphone#YV3710"* — i.e. the actual on-device sample
> file. So **read transfer works end to end.**
>
> **Addressing & semantics (validated):**
> - `CQryFileInfo` / `CReqFileOpen` / `CReqFileRead` take **`{partition, flat
>   1-based location}`** (2 u32; Read appends `offset, length`). `CQryFileIterate`
>   takes **`{partition, bank, slot}`** (3 u32, 1-based).
> - **Partition layout** (from `CQryBankList`): Program (6) = banks *A–H* × 64 =
>   512 slots (matches the `X:YY` file slot); Piano Native (0) = one *"Bank 1"* ×
>   1200. Flat location = `(bank-1)*bankSize + slot`.
> - **Status** (reply payload word 0): `0` = OK/file present, `1` = empty slot,
>   `2` = error / no `Begin` session.
> - `CQryFileInfo` reply (status 0): `{status, part, loc, …, 4-char type tag
>   (e.g. "npno"), …, u32 nameLen, name, …size}`.
> - `CReqFileRead` reply: protocol header + read-ack header (status, …, u32 data
>   length) + the raw file bytes (native container: `CBIN` for programs, `CNSP`
>   for samples) + CRC16.
>
> **Session/partition rule (important).** `CReqBegin{partition}` sets the
> **session partition** — all subsequent ops act on it. Querying a *different*
> partition than the one you `Begin`'d returns status `1` (looks empty). With the
> matching `Begin`, flat location works per-partition: e.g. `Begin(6)` then
> `FileInfo(6, 0/1/2)` returns real programs. Flat location = `bank*64 + slot`
> within the partition (Program = banks A–H × 64).
>
> **✅✅✅ READ VALIDATED ON REAL USER PROGRAMS.** `Begin(6) → FileInfo(6,n)` returned
> the user's own `ns4p` programs (e.g. "Synth Orchestra", "Sine-Saw Plk Whl",
> "12dB Sweep"), and `Begin(6) → FileOpen(6,0) → FileRead(6,0,0,824)` returned the
> **824-byte program parameter body** off the device. The device transfers the
> *body only*; the 44-byte `CBIN` header is reconstructed from `FileInfo` metadata
> (`{u32 size, fourcc type ("ns4p"), u32 ?, u32 fileCRC, u32 category, u32 nameLen,
> name, …}`). `fileType` id = the **extension fourcc** (`Ext2Type` packs 4 chars
> big-endian; `ns4p` = `0x6E733470`).
>
> **Write addressing caveat (before any write).** `CReqFileCreate` payload is
> `{bank, entry, size, fileType(fourcc), 0xFFFFFFFF, category, nameLen, name}` — it
> carries **no partition** (uses the `Begin` session) and addresses by **bank+entry**,
> whereas Info/Read/Write use `{partition, flat-location}`. The exact field
> alignment (is offset 0x10 partition-from-ctor or bank?) and bank index base must
> be pinned before writing, or a create could collide with an occupied slot in
> banks A–C and overwrite a real program (restorable from backup, but avoid).
> Target only a slot provably empty under every interpretation.
>
> **✅✅✅✅ WRITE VALIDATED ON HARDWARE (2026-06).** A full round-trip wrote a real,
> playable program to the device: read program index 0's 824-byte body, then
> created a copy at **C:88** that appeared in NSM and plays on the Stage 4. The
> validated write sequence (all replies status 0):
> ```
> Begin(partition)                              // session; sets partition context
> FileOpen(partition, srcIndex)  / FileRead / FileClose   // (to copy an existing body)
> FileCreate{bank, entry, size, fileType(fourcc), 0xFFFFFFFF, category, name}
> FileWrite{bank, entry, offset, dataLen} + data
> FileClose{bank, entry}                        // REQUIRED — commits the file
> End
> ```
> Gotchas that cost real debugging: **(1)** `Begin` partition must match what you
> query/write (cross-partition = status 1 "empty"); **(2)** `FileRead` needs a
> prior `FileOpen` (else status 3); **(3)** the destination `FileClose` is what
> **commits** the write — without it the device ACKs everything (status 0) but
> discards the file; **(4)** read/open/close address by `{partition, fileIndex}`,
> while create/write/close-dest address by `{bank(0-based), entry(raw slot)}` in
> the `Begin` session. `FileDelete` (msgId `0x14`) = `{bank, entry}`.
>
> **Full-partition enumeration — the `FileIterate` cursor walk (validated).**
> `FileInfo` only sees the *focused* bank, so to list a whole partition use the
> iterator (`CFileTransfer::GetFileListAsync` → `FileIterateNext` → `OnReply`):
> ```
> bank=0, cursor=0xFFFFFFFF
> loop: send  CQryFileIterate{bank, cursor, 0}   (msgId 0x20)
>       reply CRpyFileIterate{code, bank, slot}  (msgId 0x21)
>         code 0 -> file at (bank, slot); record; cursor = slot   (next: slot>cursor, wraps)
>         code 1 -> bank exhausted; bank = bank+1; cursor = 0xFFFFFFFF
>         else   -> done
> ```
> `FileInfo{bank, slot}` then names each (session partition implied). Verified
> live: walked all 8 banks of Program (6) and got **356 files** = the user's 355 +
> the "OPENNORD TEST" we wrote at C:88 (per-bank A=64 B=64 C=25 D=37 E=0 F=40
> G=63 H=63), names matching NSM exactly. Tool: `scripts/nordcorpus2.c`.
>
> **Notes:** drain the IN endpoint between separate runs (replies queue). Quit NSM
> to claim interface 0. Tools: `scripts/nordprobe.c` (sequencer), `nordcopy.c`
> (read→write round-trip), `nordcreate.c` (gated create), `nordcorpus2.c` (full
> partition enumeration). The transfer protocol is fully proven **both directions**.

> **Write path (decompiled — untested until validated).** Symmetric with read:
> - `CReqFileCreate` (msgId `0x0A`): payload `{partition, location, +4 u32
>   (type/size/flags), u32 nameLen, name bytes}` → ack `CAckFileCreate` (`0x0B`).
> - `CReqFileWrite` (`0x10`): payload `{partition, location, offset, dataLen}` +
>   `dataLen` raw bytes → ack `CAckFileWrite` (`0x11`).
> - `CReqEraseBlock` (`0x14`) clears a block; `CReqFileDelete` removes a file.
> - Sequence: `Begin(0x04) → FileCreate → FileWrite×N (chunked) → End(0x06)`.
>
> **Validation plan (safe, with a full instrument backup):** round-trip into the
> *empty* Program partition — `FileCreate` an empty slot, `FileWrite` a known
> `.ns4p`'s bytes, then `FileRead` it back and assert byte-identical, then
> `FileDelete`. Worst case is one clobbered slot, restorable from backup. The 4
> middle `FileCreate` u32 (type tag / size / flags) should be mirrored from a
> `FileInfo`/read of a real file of the same type before the first write.

### Step 1 — Descriptor recon: what is the device?

```bash
# Linux
lsusb                       # find the Clavia/Nord vendor:product id
lsusb -v -d <vid>:<pid>     # full descriptors
```
(Windows: **USB Device Tree Viewer**. macOS: **System Information → USB**.)

Read the interface descriptors:
- `bInterfaceClass 0x01` / `bInterfaceSubClass 0x03` → **USB-MIDI**. Go back to
  Layer 1; the transfer almost certainly rides on SysEx.
- `bInterfaceClass 0xFF` (vendor-specific) with **bulk IN/OUT endpoints** → a
  custom protocol. Continue below.

Record the endpoint addresses (e.g. `0x01` OUT, `0x81` IN) and max packet sizes.

> **DONE — confirmed on real hardware (2026-06).** Captured passively via libusb
> (`scripts/nordusb.c` — reads the cached config descriptor, no interface claim,
> no conflict with a running NSM):
>
> - **Device:** VID `0x0FFC` (Clavia DMI AB), PID `0x002E` (Nord Stage 4),
>   bcdDevice `0x0154` (firmware 3.40), 1 configuration, 3 interfaces.
> - **Interface 0 — vendor-specific** (`class/sub/proto = 0xFF/0xFF/0xFF`), 3 EPs
>   — **this is the NSM transfer channel** (`Ymer::USB` / `CFTReq*`):
>
>   | EP | Type | Dir | MaxPkt | Role |
>   |---|---|---|---|---|
>   | `0x03` | BULK | OUT | 64 | host→device commands (`CFTReq*`) |
>   | `0x82` | BULK | IN | 64 | device→host data (Download payloads) |
>   | `0x81` | INTERRUPT | IN | 16 | async notifications (`CFTNotify*`) |
>
> - **Interface 1** — Audio control (class 1/1), 0 EPs.
> - **Interface 2** — USB-**MIDI** streaming (class 1/3): bulk `0x04` OUT, `0x84`
>   IN. This is the class-compliant MIDI path (CC/NRPN/SysEx) — *separate* from the
>   vendor transfer interface, confirming program transfer is **not** MIDI.
>
> **Constraint:** while NSM runs it holds interface 0 **exclusively**
> (`UsbExclusiveOwner = "Nord Sound Manager"`, two live IOKit user-clients). To
> *claim* the interface for active replay you must quit NSM first; to *sniff* NSM's
> own traffic you need a USB capture stack (see Step 2 — not trivial on macOS).

### Step 2 — Passive capture: the Rosetta Stone

Sniff Sound Manager ↔ Nord performing one known operation.

| Platform | Tool |
|---|---|
| Linux | `sudo modprobe usbmon` → Wireshark on `usbmonX` (best signal/noise) |
| Windows | **USBPcap** → Wireshark |
| macOS | Apple **USB** capture (`AppleUSBHostPacketFilter`, from Additional Tools for Xcode) → Wireshark |

Capture filter tip: isolate by bus/device address so you only see the Nord.

> **macOS reality check (tested).** There is no `usbmon`. Homebrew Wireshark does
> **not** capture USB on macOS by itself — you need Apple's `AppleUSBHostPacketFilter`
> (Additional Tools for Xcode → system-extension approval → reboot; SIP friction on
> Apple Silicon). `brew install` alone is insufficient.
>
> **VM passthrough caveat.** To sniff the *official* client you must run NSM where
> the capture is — and **NSM has no Linux build**, so a Linux VM (or OrbStack,
> which can't pass USB through at all — it's on Apple Virtualization.framework)
> does **not** help here. A **Windows** VM with real USB passthrough (UTM /
> Parallels / VMware — not OrbStack) + **USBPcap** + the Windows NSM build is the
> only VM route that captures the real client.
>
> **Most practical on this Mac:** skip sniffing and do **active replay** (Step 5):
> quit NSM, claim interface 0 with libusb/node-usb, and probe `0x03`/`0x82`
> directly — read-only `Download` first.

### Step 3 — Differential analysis: provoke one thing at a time

This is the core technique. Each capture pins down one field.

1. Request program at slot **H:13**, then **H:14**. Diff the outgoing packets →
   that delta is the **address/slot field**.
2. Back up program X, then back up X again after moving **one** knob → diff the
   inbound data → isolates payload layout and shows whether the **same 32-bit
   checksum** from the file rides in the transfer.
3. Repeat for: request-dump vs. send-dump, single program vs. bank, name change.

Build a request/response table as you go. Keep every capture (see the log
template below) so findings are reproducible by other contributors.

### Step 4 — Structural analysis

In the framed bytes, hunt for:
- a fixed **command header / opcode** (first bytes constant across same-type ops);
- a **length field** (value tracks payload size);
- the **address/slot** (found in step 3.1);
- the **32-bit checksum** (likely the one from `docs/CHECKSUM.md` — confirm by
  matching bytes 24–27 of a known file against the transfer);
- **7-bit encoding** (only if it turns out to be MIDI after all).

### Step 5 — Replay & probe

Send a captured **read** request back to the device and confirm an identical
response. Replay proves the framing before you synthesize new commands.

```js
// node-usb sketch (desktop/Electron); WebUSB is the browser equivalent.
// Real values from the hardware recon in Step 1 (quit NSM first — it holds
// interface 0 exclusively).
const { usb } = require('usb');
const dev = usb.findByIds(0x0ffc, 0x002e); // Clavia : Nord Stage 4
dev.open();
const iface = dev.interface(0);            // vendor-specific 0xFF interface
if (iface.isKernelDriverActive()) iface.detachKernelDriver();
iface.claim();
const out  = iface.endpoint(0x03);         // BULK OUT — CFTReq commands
const inn  = iface.endpoint(0x82);         // BULK IN  — Download payloads
const note = iface.endpoint(0x81);         // INTERRUPT IN — CFTNotify progress
note.startPoll(1, 16);
note.on('data', (d) => { /* CFTNotify* started/progress/completed */ });
out.transfer(cftReqDownloadBytes, () => inn.transfer(4096, (e, data) => {
  /* compare data to the program body / file */
}));
```

### Step 6 — Reimplement

- Vendor bulk: `node-usb` (Electron desktop) or **WebUSB** (Chromium).
- SysEx after all: **CoreMIDI** (iOS) / **Web MIDI** (`sysex: true`).

---

## Safety

- **Read is safe; write can brick a slot.** Do Layer 1 and steps 1–5 entirely
  read-only first. Replaying *read* requests cannot harm the keyboard.
- Only attempt **writes** once framing + checksum are solid, and only to a
  throwaway program slot. Firmware is rarely at risk, a single slot is.
- Back up the full instrument with Sound Manager before any write experiment.

## Realistic odds

- **Best case (SysEx):** a weekend.
- **Worst case (sealed/obfuscated bulk):** large, possibly indefinite. Even a
  documented "it's a bulk protocol, here's the evidence" is a real result.
- **Leverage the community:** check the Nord User Forum for existing descriptors
  or captures before starting cold.

---

## Capture log template

Record every capture identically so they compose. One file per capture under
`docs/captures/` (gitignore the raw `.pcap`/`.syx` if large; commit the notes).

```
## capture NNNN
date:        2026-06-12
platform:    Linux usbmon2 / Windows USBPcap / macOS PacketLogger
device:      Nord Stage 4, firmware x.yy, VID:PID 0xXXXX:0xXXXX
client:      Nord Sound Manager v?.?
action:      single deliberate operation (e.g. "backup program H:13")
variable:    what changed vs the previous capture (e.g. "slot H:13 → H:14")
file:        captures/NNNN.pcapng (sha256: …)
observations:
  - opcode bytes:      …
  - length field at:   …
  - address field at:  …
  - checksum present:  yes/no, offset …
  - notes:             …
```
