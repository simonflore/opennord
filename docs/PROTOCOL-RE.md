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

### Step 2 — Passive capture: the Rosetta Stone

Sniff Sound Manager ↔ Nord performing one known operation.

| Platform | Tool |
|---|---|
| Linux | `sudo modprobe usbmon` → Wireshark on `usbmonX` (best signal/noise) |
| Windows | **USBPcap** → Wireshark |
| macOS | Apple **USB** PacketLogger profile; or run Sound Manager in a Linux VM with USB passthrough and use usbmon |

Capture filter tip: isolate by bus/device address so you only see the Nord.

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
// node-usb sketch (desktop/Electron); WebUSB is the browser equivalent
const { usb } = require('usb');
const dev = usb.findByIds(VID, PID); dev.open();
const iface = dev.interface(N); iface.claim();
const out = iface.endpoint(0x01); // bulk OUT from step 1
const inn = iface.endpoint(0x81); // bulk IN
out.transfer(capturedRequestBytes, () => inn.transfer(4096, (e, data) => {
  /* compare data to the captured response */
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
