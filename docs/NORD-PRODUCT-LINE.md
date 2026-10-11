# Nord product line — reference for multi-model expansion

A catalogue of the Nord instruments **Nord Sound Manager (NSM) 9.03** knows how to
talk to, what file types each uses, and which parts of OpenNord's Stage 4 work
generalise to them. The goal: a map for expanding OpenNord beyond the Stage 4 —
both **file reading** (hardware-free) and **device transfer** (USB).

**Sources & confidence.** Everything tagged *(NSM)* is recovered from the NSM
arm64 binary (`nsm/nsm-arm64`) via RTTI/symbol names, embedded strings, and
targeted disassembly — it is **fact about the official client**, the legitimate
interop result (see `docs/LEGAL.md`; do not redistribute the binary). Things
tagged *(inferred)* are reasoned from naming/era and **need a file or hardware to
confirm**. This complements `docs/NSM-TEARDOWN.md` (binary teardown),
`docs/PROTOCOL-RE.md` (the Stage 4 USB protocol), and `docs/MULTI-MODEL.md` (the
file-reading plan).

---

## TL;DR — the strategic finding

1. **NSM drives the entire Nord line over ONE physical transport: vendor USB.**
   There is no MIDI/SysEx transfer path anywhere in the binary (the teardown
   already noted *no CoreMIDI linkage*). The realtime `MIDIX` protocol and the
   `FileTransfer` protocol are two *logical* protocols multiplexed over the same
   USB pipe (`Ymer::USB::CUSBMan` → `CStreamDuplex`). *(NSM)*

2. **The USB layer gates on vendor only, not product ID.**
   `Ymer::USB::CUSBHandleMac::QueryDeviceCapabilities` does exactly one check —
   `cmp w0, #0xffc; b.ne <reject>` (vendor `0x0FFC` = Clavia DMI AB) — then reads
   the product name/capabilities dynamically. Any Nord that enumerates as `0x0FFC`
   is accepted; the product ID only selects which *instrument profile* to apply
   afterward. *(NSM)*

3. **Therefore ns2/ns3 transfer is NOT a different protocol.** It's the **same
   vendor-USB `FileTransfer` family**, version-negotiated per instrument
   (`"FileTransfer protocol v%d (or minimum V%d) is required, v%d was found"`).
   This **corrects** the "NS3 most likely uses a different transfer protocol
   (SysEx)" framing in `docs/MULTI-MODEL.md` §"Out of scope". Transfer can stay
   out of scope for *effort/hardware* reasons, but the *technical premise* was
   wrong. *(NSM)*

4. **What differs by model is application-layer, not transport:** the partition
   layout (`Ymer::Product::CPartitionProgram*` — one class per model), the file
   formats, and the protocol version. *(NSM)*

---

## Supported instruments

Every model below appears in the NSM binary with a `Ymer::Product::` handler
class and/or a fourcc tag family. Generation maps to the program-body codec era
(the parameter bit-map container): **OG/NWS** (Stage 2 era) → **NW1 v3** (Stage 3
era) → **NW1 v4** (Stage 4). Sample-library codec: `nsmp` (codec-1/OG), `nsmp3`
(codec-3), `nsmp4` (codec-4) — see `docs/NSMP-CODEC.md`.

The **Sample codec** column is what each model's own firmware loads (static,
`docs/FIRMWARE-LINE.md` §5) where its OS image was read; "NWS v8/v11" means `.nsmp`
with a codec-1/2 body only, so `.nsmp3`/`.nsmp4` must be converted down. **Gen** is
from the firmware's platform and program-format family where read (§1, §6 there),
else inferred.

| Instrument | NSM handler *(NSM)* | Program tag *(NSM)* | Backup | Sample codec | Gen |
|---|---|---|---|---|---|
| Nord Stage (Classic/EX) | `CStageBase` | `nsp` / `nspg` | `nsb`, `ns2exb` | — | OG/NWS *(inferred)* |
| **Nord Stage 2** | `CStageBase`, `CPartitionProgramNS2` | `ns2p` | `ns2b` | `nsmp` (codec-1) | OG |
| **Nord Stage 2 EX** | `CStageBase` | `ns2p` *(shared w/ Stage 2)* | `ns2exb` | `nsmp` (codec-1) | OG |
| **Nord Stage 3** | `CStageBase` | **`ns3f`** | `ns3b` | `nsmp3` (codec-3) | NW1 v3 |
| **Nord Stage 4** | `CStageBase` | `ns4p` | `ns4b` | `nsmp4` (codec-4) | NW1 v4 |
| Nord Electro 3 / 3 HP | `CElectro3`, `CElectro3HP`, `CElectro3Base`, `CPartitionProgramE3(HP)` | `nepg` | `neb` | `nsmp` NWS v8/v11 | OG (ColdFire) |
| Nord Electro 4 | `CElectro4`, `CPartitionProgramE4` | `ne4p` | `ne4b` | `nsmp` NWS v8/v11 | OG (ColdFire) |
| Nord Electro 5 | `CElectro5` | `ne5p` | `ne5b` | `nsmp` NWS v8/v11 — refuses `nsmp3` | OG (ColdFire) |
| Nord Electro 6 | `CElectro6` | `ne6p` | `ne6b` | `nsmp3` *(medium)* | NW1 v3 |
| Nord Electro 7 | `CElectro7` | `ne7p` | — | not located (`nsmp4`? low) | NW1 v4 |
| Nord Piano (1) | `CPiano` | `nppg` | `npb` | — (no sample library) | OG (ColdFire) |
| Nord Piano 2 / 3 | `CPiano2`/`CPiano3`, `CPartitionProgramNP2`/`NP3` | `np2p`/`np3p` | — | `nsmp` NWS v8/v11 | OG (ColdFire) |
| Nord Piano 4 / 5 / 6 | `CPiano4`/`CPiano5`/`CPiano6`, `CPartitionPnoV5`/`V6` | `np4p`/`np5p`/`np6p` | — | P4 `nsmp3`; P5/P6 `nsmp3` + `nsmp4` | NW1 v3/v4 |
| Nord Lead 4 | `CLead4`, `CLead4Base` | `nl4p` | `nl4b` | — | Lead descriptor |
| Nord Lead A1 | `CMini` *(inferred)* | `nlap` | `nlab` | — | Lead descriptor |
| Nord Wave | `CProductBase` | `nws`/`nwp` | `nwb` | `nsmp` NWS v8/v11 | OG (ColdFire) |
| Nord Wave 2 | `CGeneric` *(inferred)* | `nw2p` | `nw2b` | `nsmp3` (NSM; firmware check not located) | NW1 v3 |
| Nord C1 | — (no USB transfer in its OS) | — | — | — | (ColdFire) |
| Nord C2 / C2D | `CC2`, `CC2D` | `nc2p` | `nc2b` | — | OG (C2D ColdFire) |
| Nord Organ 3 / C (classic) | `COrgan3` | `no3p` / `ncpg` | `no3b` / `ncb` | — | Organ 3: NW1 v4 |
| Nord Grand | `CGrand` | `ngp` | `ngb` | `nsmp3` only | NW1 v3 |
| Nord Grand 2 | `CGrand2` | `ng2p` | `ng2b` | `nsmp3` + `nsmp4` | NW1 v4 |

> ⚠️ **`ns3f`, not `ns3p`.** The Stage 3 *program* file tag is `ns3f` (Stage 3
> calls them differently); there is **no `ns3p`** in the binary. Anything in
> OpenNord that assumes `.ns3p` should use `.ns3f`. Stage 2 is `ns2p`, Stage 4 is
> `ns4p`. *(NSM)*

---

## File-type taxonomy

Within a model, each file type is one fourcc `n<model><type>`. The **type suffix**
is consistent across the line (newer models use a 1-letter suffix; pre-2011
models use a 2-letter one):

| Suffix | Category *(label seen in NSM)* | Notes |
|---|---|---|
| `p` / `pg` | **Program** | the main patch; what `lib/ns4/parse.ts` decodes |
| `l` / `li` | **Live** | Live-buffer programs |
| `s` / `sy` | **Synth Preset** / Sound — read per model | `ns2s` Stage 2 Synth; `nl4s`/`nlas` the Lead's single-sound **Program** partition; `nw2s` and `ne5s` are **Settings**; `ne7s` is the Electro 7's standalone synth-preset archive (a file tag, not a partition) |
| `y` | **Synth Preset** (Stage 3/4) | `ns4y`, `ns3y`; but `ns2y` is Stage 2 **Settings** |
| `r` | **Synth Preset** partition (Electro 7) | `ne7r` — 32 banks × 100 (firmware, `docs/FIRMWARE-LINE.md`) |
| `o` / `op` | **Organ Preset** | `nso`, `neop`, `ns4o` |
| `n` | (Stage 4 preset slot) | `ns4n` — preset family, exact kind TBD |
| `t` | **Settings** almost everywhere; **Set List** only on Electro 5 | Settings: `ns4t`, `ns3t` (Stage), `ne6t`, `ne7t` (Electro 6/7), `np4t`/`np5t`/`np6t`, `ng2t` (pianos), `no3t`, `nl4t`/`nlat` — firmware registration, `docs/FIRMWARE-LINE.md` §3 (and hardware for `ns4t`, `docs/PROTOCOL-RE.md`). `ne5t` is a Set List (`CElectro5`, firmware agrees). Read the suffix per model |
| `g` | (Stage 4) | `ns4g` — kind TBD |
| `b` | **Backup** | a ZIP archive (`ns4b`/`ns3b`/`ns2b`); manifest carries `product_id`, `product_version`, `backup_format_version` |
| `…bundle` / `…pb` | **Bundle / Pack** | program + its dependencies (pianos/samples) by name — the NSM 6 "Bundle" feature |
| `nsmp` / `nsmp3` / `nsmp4` | **Sample (Samp Lib)** | codec-1 / codec-3 / codec-4 |

**Partition / category names** seen verbatim *(NSM)*: `Program`, `Live`, `Song`,
`Performance`, `Set List`, `Organ Preset`, `Synth Preset`, `Pedal` (+ `Native`),
`Samp Lib` (+ `Native`), `Native (Piano)`, `Native (FFS)`, `Settings`. The Stage
4 partition map (12 partitions, Program = 6) is in `docs/PROTOCOL-RE.md`; other
models reorder/subset these via their `CPartitionProgram*` class.

---

## The transport layer (shared across the line)

From `docs/PROTOCOL-RE.md` + binary symbols, all model-agnostic:

- **Vendor USB, interface 0** (`0xFF/0xFF/0xFF`): bulk OUT `0x03`, bulk IN `0x82`,
  interrupt IN `0x81`. Vendor `0x0FFC`. *(NSM + HW-validated on Stage 4)*
- **Message framing:** `[u32 len][u32 protocolId=0x0C][u32 version][u32 msgId]
  [payload][u16 CRC-16/CCITT]`, big-endian. *(HW-validated on Stage 4)*
- **Protocols multiplexed over the pipe** *(NSM symbols)*:
  `Zevs/Ymer::Protocol::FileTransfer` (programs/samples — `CQryPartList`,
  `CReqFileOpen/Read/Write/Close/Create/Delete`, `CQryFileGetDependency`),
  `MIDIX` (realtime control), `UI`, `InstrCtrl` (`SendTune`/`SendLevel`).
- **Probe / connect flow** *(NSM)*: `CProbe::OnUSBPortOpened` (USB-only) →
  `CManager::Product_OnConnect(CDeviceCapExt)` → `Init_CreateProtocolManagers`,
  parameterized by `Zevs::EInstrumentId`. Device specs are built as
  `CDeviceSpec(EInstrumentId, EInterfaceType)`.
- **Version & OS gating** *(NSM)*: per-instrument minimums
  (`Ymer::Product::GetVersionMinAndRecommended(EInstrumentId, …)`); NSM rejects an
  instrument whose reported `FileTransfer`/OS version is below its minimum
  (`"The OS version of the connected %s is not supported"`).

### What transfers from the Stage 4 work

| Layer | Reusable for ns2/ns3? | Why |
|---|---|---|
| USB transport, framing, CRC-16 | ✅ identical | one `CUSBMan`/`CStreamDuplex`, vendor-gated |
| Opcodes (`CQry*`/`CReq*`, reply = req\|1) | ✅ likely identical | same `FileTransfer` family; **version-validate** |
| Partition/bank/slot addressing | ⚠️ same shape, different map | per-model `CPartitionProgram*` |
| Product ID filter | 🔧 widen | `{vendorId:0x0ffc}` (drop `productId`), as NSM does |
| Program body decode | ⚠️ partly | NW1 v3 (ns3) ≈ v4 (ns4); OG (ns2) differs — `docs/NSMP-CODEC.md` |
| Sample decode/encode | ✅ done | codec-1/3/4 already in `lib/ns4/nsmp*.ts` |
| File CRC (body) | ⚠️ verify | CRC-32 for NW1; CRC-16 for OG — `docs/CHECKSUM.md` |

---

## Per-model partition layouts

A device's memory is a list of **partitions**; the `FileTransfer` protocol
addresses them by index (`CReqBegin{partition}`, `CQryBankList{partition}` — see
`docs/PROTOCOL-RE.md`). NSM builds each model's list in its **product constructor**
(`Ymer::Product::C<Model>::C<Model>(SCaps)`) as an ordered sequence of
`CProductBase::Add(SPartition*)` calls; each `SPartition` carries a
`CFileSpec(extension, fileType)` — the fourcc + category. Recovered by resolving
the constructors' string references (recipe in the appendix). *(NSM)*

**Canonical layout.** Every model is a subset/superset of one scheme. *Native*
partitions hold read-only factory content; the rest are user-writable. The
`…b` backup is a whole-device ZIP, not a live partition.

| Partition | Role | Present on (firmware, where read) |
|---|---|---|
| `Native (FFS)` / `E2P FFS` | flash filesystem | NSM lists it on several models; **no firmware read so far registers it** on the wire |
| `Piano (Native)` | factory pianos | Stage, Electro 3–7, Piano 1–6, Grand, Grand 2 |
| `Pedal (Native)` / `Piano Pedal (Native)` | factory pedal-noise/pads | Stage 2–4, Electro 7, Piano 1–6, Grand, Grand 2 (**not** Electro 6) |
| `Samp Lib (Native)` | factory sample library | sample-capable, except the Wave (user Samp Lib only) |
| **`Program` (+ `Program Bundle`)** | user programs (bundle = program + deps by name) | all with USB transfer |
| `Live` | live buffer | all but the Wave, C2D and the Leads |
| `Synth Preset` / `Organ Preset` | per-engine presets | Stage 2–4, Electro 7 (synth); Stage 4, Electro 3 / 3 HP (organ) |
| `Set List` / `Song` | set lists | Electro 5 (`ne5t`), Stage 3 (Songs, `ns3s`) only |
| `Settings` | global settings | all with USB transfer |

**NSM-recovered layouts** *(static, `Add()` order)* were the first map of the
non-Stage models. Every model whose OS image has since been read is superseded by
its firmware registration order (the table in *Partition order* below, and
`docs/FIRMWARE-LINE.md` §3); the NSM lists were wrong on most of them (an E2P FFS
no device registers, `…t` read as a Set List, missing user partitions, Electro 6's
Program at 6 instead of 4). Only Stage Classic/EX and C2 still rely on NSM.

Takeaway: **the partition model is uniform across the line** — the same partition
*kinds*, model-to-model differences being which optional partitions exist (Pedal,
Organ vs Synth, Set List) and the fourcc generation. A single
`{ partitions: PartitionSpec[] }` per model in OpenNord's `clavia` registry
captures all of it. Exact numeric indices for non-Stage-4 models are still static
(`staticIndex`) until a hardware `CQryPartList` confirms them.

## Where OpenNord plugs models in

The parallel multi-model work (#22) already built the seam:

- `src/lib/clavia/` — the shared **CBIN container** (`cbin.ts`, `nord-file.ts`,
  `checksum.ts`, `slot.ts`, `name.ts`), model-agnostic.
- `src/lib/clavia/model.ts` — `ModelCodec` interface + `ClaviaModel` union
  (`'ns4' | 'ns3' | 'ns2' | 'unknown'`).
- `src/lib/formats.ts` — `parseClaviaFile()` composition root; add a model's body
  codec to the `CODECS` list, one line.
- `src/lib/ns3/` — Stage 3 body decode in progress.

**For device transfer expansion** (a separate, hardware-gated track):
1. Widen the WebUSB filter `{ vendorId: 0x0ffc, productId: 0x002e }` →
   `{ vendorId: 0x0ffc }` (the only two sites: `src/components/device/ConnectPanel.tsx`,
   `src/lib/device/authorized.test.ts`).
2. On connect, read the reported `FileTransfer` protocol version and branch
   partition specs by model (mirror NSM's `CPartitionProgram*`).
3. Keep `lib/device/{protocol,session,transfer}.ts` as-is — already model-agnostic.

---

## Open unknowns (need a file or hardware)

- ~~**Exact product IDs per model.**~~ **Resolved statically (NSM 9.22)** — see
  *USB product ids & OS gates* below. There is no `clavia.xml` resource in the
  full 9.22 `.app` bundle (`/clavia.xml` is only a runtime path string); the PID
  *is* NSM's `Zevs::EInstrumentId`. Stage 4 / 3 / 2 are HW-validated; the rest
  are `staticProductId` in `src/lib/clavia/partitions.ts` until a device confirms.
- **Per-model partition order.** Recovered statically from each model's firmware
  (Stage Classic/EX and C2: NSM only) — see *Partition order* below and
  `docs/FIRMWARE-LINE.md` §3. Still static until a hardware `CQryPartList` probe.
- **Protocol-version deltas.** The FileTransfer version per model is now known
  statically (4, 6, 7, 8 or 10 — `docs/PROTOCOL-RE.md`, "Accepted frame
  versions"), and the v4 group has no session lock. Whether an older version has
  identical opcode payloads, and whether the v4–v7 models answer the `0x07`
  version query, still need one read-only enumerate against real hardware.
- **Codec-per-model beyond ns2/3/4** in the table above now comes from each
  model's firmware loader where it was found (`docs/FIRMWARE-LINE.md` §5); the
  Electro 6, Electro 7 and Wave 2 rows are still medium/low and want a sample
  file loaded on the instrument to confirm.

---

## USB product ids & OS gates (NSM 9.22)

Recovered from Nord Sound Manager **v9.22** (macOS, arm64 slice) with Ghidra
12.1.4 (driven through REA) and cross-checked against raw `llvm-objdump`.

- **PID = instrument id.** `Ymer::USB::CDeviceSpec(EInstrumentId, …)` stores the
  instrument id list and `GetProductID(i)` (`0x10003598c`) returns it verbatim;
  `-2` is a wildcard in `IsCompatible`.
- **Dispatch:** `Ymer::Product::CProduct::New(SCaps const&, CProductBase**)`
  (`0x100043e20`) switches on `SCaps+0` (the PID). Sub-dispatchers:
  `CStageBase::New` (`0x1000a7f24`), `CElectro3Base::New` (`0x10009f6c0`),
  `CPiano2::New` (`0x1000a5914`), `CLead4Base::New` (`0x1000ddfd0`).
- **OS gates:** `CProductBase::GetVersion_Min/_Recommended/_Max` read +0x48 /
  +0x4C / +0x50 (`0x100044c08`…`0x100044c18`), stored as version × 100
  (`0xEFFFFFFF` = no max), set in each class's constructor. A device below a
  class's min falls through to an older class or is rejected (rc 2 →
  "The OS version of the connected %s is not supported").

| PID | NSM class | Registry id | OS min → recommended |
|---|---|---|---|
| 0x03 | `CStage` (→ `CStage_PreNPNOv5` 4.00–4.99, `CStagePreV400` 3.12–3.99) | stage-classic | 3.12 → 5.08 |
| 0x05 | `CWave` | wave | 2.00 → 2.14 |
| 0x07 | `CElectro3` (→ `CElectro3_PreNPNOv5` 1.00–2.06) | electro-3 | 1.00 → 3.14 |
| 0x08 | `CStageEX` (→ `CStageEX_PreNPNOv5` 4.00–5.49) | stage-ex | 4.00 → 6.08 |
| 0x09 | `CC2` | c2 | 1.00 → 1.32 |
| 0x0B | `CElectro3HP` | electro-3-hp | 1.00 → 3.14 |
| 0x0C | `CC2D` | c2d | 1.00 → 1.12 |
| 0x20 | `CPiano` | piano-1 | 1.00 → 1.48 |
| 0x21 | `CStage2` (Stage 2 **and** Stage 2 EX) | stage-2 / stage-2-ex | 1.00 → 3.00 |
| 0x22 | `CPiano2` | piano-2 | 1.00 → 1.20 |
| 0x23 | `CElectro4` (only for `SCaps+0x10` model 1–3) | electro-4 | 1.00 → 1.20 |
| 0x24 | `CLead4_FTv7` if FileTransfer ver < 8 (OS 1.00–1.12), else `CLead4_FTv8` (1.13+) | lead-4 | 1.00 → 1.30 |
| 0x25 | `CMini` | probably lead-a1 (unconfirmed, not set) | 1.00 → 1.34 |
| 0x26 | `CStage3` (`S_IsModelSupported` → always) | stage-3 | 2.50 → 2.54 |
| 0x27 | `CElectro5` | electro-5 | 1.00 → 1.40 |
| 0x28 | `CPiano3` | piano-3 | 1.00 → 1.22 |
| 0x29 | `CElectro6` | electro-6 | 2.50 → 2.50 |
| 0x2A | `CPiano4` | piano-4 | 2.50 → 2.50 |
| 0x2B | `CGrand` | grand | 1.50 → 1.50 |
| 0x2C | `CWave2` | wave-2 | 0.80 → 1.00 |
| 0x2D | `CPiano5` | piano-5 | 1.00 → 1.00 |
| 0x2E | `CStage4` (`S_IsModelSupported(model)` → model < 3) | stage-4 | 0.90 → 1.00 |
| 0x38 | `CGrand2` | grand-2 | 1.00 → 1.00 |
| 0x39 | `CPiano6` | piano-6 | 1.00 → 1.00 |
| 0x3A | `COrgan3` | organ-3 | 1.00 → 1.12 |
| 0x3B | `CElectro7` | electro-7 | 1.00 → 1.00 |
| other | `CGeneric` only when generic is allowed, else rejected | — | — |

### Partition order (firmware registration vs NSM 9.22 constructors)

**NSM binds the device's partition list positionally.**
`CFileManager::OnPartitionList(EResult, CPartInfo const*, int, …)` (`0x1000e9620`)
loops `i = 0..count` and calls `GetPartition(i)->SetInfo(info[i])`;
`CPartition::SetInfo` (`0x1000fc260`) only copies — no name match
(`CProductBase::GetPartitionByName` exists but isn't on this path). So NSM
itself assumes the device reports partitions in the product constructor's
`CProductBase::Add()` order, which supports the registry's
"Add-ordinal == protocol index" assumption — **but it doesn't always hold.** On
the Stage 4, NSM adds the presets as Synth (7) · Organ (8) · Piano (9), while the
hardware-validated order in `PROTOCOL-RE.md` is Organ (7) · Piano (8) · Synth (9).
So an Add-ordinal (`staticIndex`) is a guess: OpenNord uses it to start the
read-only connect probe, and writes to a model's Program partition only once
the probe has found that model's program files there (or the index is
hardware-confirmed for a layout that doesn't move between OS versions — today
only the Stage 4). When the probe finds Program exactly at a hardware-confirmed
model's hardware index (a Stage 2 on a current OS), its user sample and piano
libraries become writable too; its preset, Live and Settings partitions never do
this way. The probe checks the expected index, then one lower, and only then
scans the partitions the device reports, with every reply time-bounded. See
`resolveDeviceAccess` in `src/lib/device/connect-probe.ts`.

**The instrument's own registration order is the ground truth, not NSM's.** A
partition's protocol index is the order in which the instrument firmware
registers it with its file-transfer code — that is the list `CQryPartList`
returns. Static analysis of the instruments' OS images recovered it for the Stage
line (Stage 4 OS 1.66 `FUN_c023a5b8`, Stage 3 OS 2.64 `FUN_c001ace0`, Stage 2
OS 3.00 `FUN_3007046c`; `docs/STAGE2-3-FIRMWARE.md`) and for every other model
except Stage Classic/EX and C2 (`docs/FIRMWARE-LINE.md` §3). It matches the
hardware-validated Stage 4 list in `PROTOCOL-RE.md` and the Stage 2 capture from
issue #31 exactly. NSM's product-constructor `Add()` order is only a proxy: it
disagrees on the Stage 4 presets, the Stage 3 Synth/Song pair, and on most other
models, and it appends an "E2P FFS" that no firmware registers. The rows below
are the firmware order. Firmware-recovered indices are still *static*
(`staticIndex`) until a hardware probe confirms them; the connect probe checks
Program on the device either way.

Recovered order (firmware registration order; the registration function and OS
are cited per row, the rest of the evidence is in `docs/FIRMWARE-LINE.md`):

| Model | Order (index: partition [tag]) |
|---|---|
| Stage 4 | 0 Piano(N) · 1 Piano [npno] · 2 Pedal(N) · 3 Piano Pedal [npdl] · 4 SampLib(N) · 5 SampLib [nsmp] · **6 Program [ns4p]** · 7 Organ Preset [ns4o] · 8 Piano Preset [ns4n] · 9 Synth Preset [ns4y] · 10 Live [ns4l] · 11 Settings [ns4t] — 12 partitions (hardware-validated; firmware `FUN_c023a5b8` agrees). NSM adds Synth · Organ · Piano at 7–9 and a 12 E2P FFS |
| Stage 3 | 0 Piano(N) · 1 Piano [npno] · 2 Pedal(N) · 3 Piano Pedal [npdl] · 4 SampLib(N) · 5 SampLib [nsmp] · 6 **SWave** (100 entries; NSM-managed, treated read-only) · **7 Program [ns3f]** · 8 Synth [ns3y] · 9 Song [ns3s] · 10 Live [ns3l] · 11 Settings [ns3t] — 12 partitions, no E2P FFS (firmware `FUN_c001ace0`, static). NSM's `CStage3` adds Song (8) before Synth (9) and a 12 E2P FFS |
| Stage 2 | 0 Piano(N) · 1 Piano · 2 Piano Pedal (user) · 3 Pedal(N) · 4 SampLib(N) · 5 SampLib · **6 Program [ns2p]** · 7 Synth [ns2s] · 8 Live [ns2l] · 9 Settings [ns2y] — 10 partitions (issue #31 capture; firmware OS 3.00 `FUN_3007046c` agrees, and registers the user pedal unconditionally). NSM's `CStage2` adds native Pedal first and gates the user Pedal on OS |
| Electro 3 / 3 HP | 0 Piano(N) · 1 SampLib(N) · 2 Piano · 3 SampLib · **4 Program [nepg]** · 5 Live · 6 System · 7 Organ Presets [neop] — 8 partitions on both (OS 3.14 `0x3004FF12`, OS 3.16 `0x3005043E`); NSM gives Organ Presets only to the HP |
| Electro 4 | 0 Piano(N) · 1 SampLib(N) · 2 Piano · 3 SampLib · **4 Program [ne4p]** · 5 Live [ne4l] · 6 Settings — 7 (OS 1.22 `0x30057F46`) |
| Electro 5 | 0 Piano(N) · 1 Piano · 2 SampLib(N) · 3 SampLib · **4 Program [ne5p]** · 5 Set List [ne5t] · 6 Live [ne5l] · 7 Settings [ne5s] — 8 (OS 2.04 `0x3004EF18`; NSM agrees) |
| Electro 6 | 0 Piano(N) · 1 Piano [npno] · 2 SampLib(N) · 3 SampLib [nsmp] · **4 Program [ne6p]** · 5 Live [ne6l] · 6 Settings [ne6t] — 7 (OS 2.66 `FUN_c00180c0`). No pedals, no Set List; NSM had Program at 6 |
| Electro 7 | 0 Piano(N) · 1 Piano [npno] · 2 Pedal(N) · 3 Piano Pedal [npdl] · 4 SampLib(N) · 5 SampLib [nsmp] · **6 Program [ne7p]** · 7 Live [ne7l] · 8 Settings [ne7t] · 9 Synth Preset [ne7r] — 10 (OS 1.30 `FUN_c0011420`). NSM's 8 [ne7s], 10–11 Native, 13 Raw are not on the wire; `ne7s` is the synth-preset archive file tag |
| Piano (1st gen) | 0 Piano(N) · 1 Pedal(N) · 2 Piano · **3 Program [nppg]** · 4 Live · 5 System — 6 (OS 1.50 `0x30035ED6`); NSM had Piano 1 / Pedal(N) 2; no sample library |
| Piano 2 / Piano 3 | 0 Piano(N) · 1 Piano · 2 Piano Pedal (user) · 3 Pedal(N) · 4 SampLib(N) · 5 SampLib · **6 Program [np2p / np3p]** · 7 Live · 8 Settings — 9 (OS 1.22 `0x30021880`, OS 2.04 `0x30024E5E`) |
| Piano 4 / 5 / 6, Grand, Grand 2 | 0 Piano(N) · 1 Piano [npno] · 2 Pedal(N) · 3 Piano Pedal [npdl] · 4 SampLib(N) · 5 SampLib [nsmp] · **6 Program** · 7 Live · 8 Settings [np4t / np5t / np6t / ngs / ng2t] — 9 on all five (P4 OS 2.66 `FUN_c001755c`, P5 1.34 `FUN_c0122f8c`, P6 1.20 `FUN_c016bb68`, Grand 1.68 `FUN_c0019f28`, G2 1.22 `FUN_c016bc30`); no Set List, no E2P FFS |
| Organ 3 | **0 Program [no3p]** · 1 Live [no3l] · 2 Settings [no3t] — 3 (OS 1.00 `FUN_c0002e9c`); no Native or "Pipe" partitions |
| C2D | 0 Pipe(N) · 1 Pipe (NSM: ROMFlash) · **2 Program [nc2p]** · 3 System — 4 (OS 1.12 `0x3004ED82`); no Live |
| C2 | *(no OS image read — NSM)* 0 Native · 1 "Pipe" ROMFlash · **2 Program [nc2p]** · 3 Live · 4 Settings |
| Wave | 0 SampLib (user) · **1 Program [nwp]** · 2 SWave · 3 RAMFS · 4 System — 5 (OS 2.14 `0x3004F2B2`); no native sample library, no Live |
| Wave 2 | 0 SampLib(N) · 1 SampLib [nsmp] · **2 Program [nw2p]** · 3 Live [nw2l] · 4 Settings [nw2s] — 5 (OS 1.24, in `FUN_c0161afc`); no "Transient", no E2P FFS |
| Lead 4 / Lead A1 | 0 Program [nl4s / nlas] (single sounds) · **1 Performance [nl4p / nlap]** · 2 Settings [nl4t / nlat] — 3 (Lead 4 OS 1.32 `FUN_c000bf58`, A1 OS 1.36 `FUN_c0013728`). NSM's `CLead4Base` adds Performance first; `nlab` is the A1 backup tag, not a partition |
| C1 | none — no USB transfer in OS 1.12 |

**Conflicts, and what settled them:**
- **Stage 4 presets — settled.** NSM adds Synth (7) · Organ (8) · Piano (9);
  `PROTOCOL-RE.md` lists Organ 7 · Piano 8 · Synth 9, and the firmware's own
  registration (`FUN_c023a5b8`) has the same Organ 7 · Piano 8 · Synth 9. The
  registry (`clavia/partitions.ts`) and the code that addresses 7–9 —
  `device/presets.ts` (preset browsing/pull), `library/PresetsContext.tsx`
  (enumerates the presets on every connect) and `device/ns4b.ts` (backup folders
  + restore targets) — already use that order. See `docs/STAGE4-COVERAGE.md`.
- **Stage 3 Synth/Song — firmware order adopted.** The firmware registers Synth
  [ns3y] at 8 and Song [ns3s] at 9 (NSM's constructor has them the other way
  round), and the device reports 12 partitions, not NSM's 13. Program (7) and
  SWave (6) agree. Still static: the registry carries every Stage 3 index as
  `staticIndex`, and a Stage 3 connection writes only the Program partition the
  probe finds — never SWave (6) or the factory partitions (0, 2, 4).
- **Stage 2 pedals and fourccs.** The issue #31 capture has user Piano Pedal at
  2 and native Pedal at 3, and so does the OS 3.00 firmware; NSM's `CStage2` adds
  native first. Program (6) agrees. The firmware names the Synth partition
  `ns2s` and Settings `ns2y` (an `.ns2y` file is Stage 2 Settings, not a synth
  preset). Older Stage 2 OS versions that skip the gated user Pedal (an NSM-side
  rule; no pre-3.00 image was checked) would shift Program to 5, so the registry
  marks Stage 2 `layoutVariesByOs` and connect probes it instead of trusting
  index 6.
- **The rest of the line — firmware order adopted.** NSM's constructors were
  wrong on Electro 4 (missing user Piano/Samp Lib), Electro 6 (Pedal and Set List
  that don't exist; Program 4 not 6), Electro 7 (partitions past 9), Nord Piano
  (Piano/Pedal swapped), Piano 2/3 (missing user partitions), Piano 6 / Grand 2
  (`…t` is Settings, no FFS), Organ 3 (Program 0 not 2), C2D (no Live), Wave
  (no Live, no native Samp Lib), Wave 2 (no Transient/FFS) and the Leads (Program
  before Performance). The registry carries the firmware order as `staticIndex`
  for all of them; see `docs/FIRMWARE-LINE.md` §3 for the full list.
- **Tag naming:** NSM gives `CC2` (PID 0x09) the `ncb`/`ncpg`/`ncli`/`ncsy`
  tags and `CC2D` (0x0C) `nc2*`; the table above files `ncpg` under
  "Organ 3 / C (classic)" and gives C2 `nc2p`. Left as-is until a file confirms.

Lead A1: NSM has no case named for it, but the A1 firmware (OS 1.36) runs the
Lead 4's FileTransfer code (version 8, 3 partitions), so it *is* manageable over
vendor USB; NSM's `CMini` (PID 0x25) is probably the A1 — unconfirmed until a
device reports that PID. The C1 is the one model with no USB transfer (no device
descriptor, no FileTransfer code in OS 1.12). Cross-check: the Stage 2
unit that validated the NS2 partition map (issue #31) ran OS 3.00, NSM's
recommended value. **Open:** `docs/PROTOCOL-RE.md` records the validating Stage 4
as "firmware 3.40", but NSM's Stage 4 floor is 0.90 and Nord's public Stage 4 OS
is v1.66 — 3.40 is likely a different reported counter; check on next hardware
session.

## Appendix — reproducing the recon

```bash
BIN=nsm/nsm-arm64
# Model names + handler classes
strings -n 4 "$BIN" | grep -E '^Nord (Stage|Electro|Piano|Lead|Wave|C[0-9]|Grand)'
nm -arch arm64 "$BIN" | c++filt | grep -oE 'Ymer::Product::C[A-Za-z0-9]+' | sort -u
# fourcc file-type tags
strings -n 3 "$BIN" | grep -E '^n[a-z0-9]{2,6}$' | sort -u
# The vendor-only USB gate (the key finding)
otool -arch arm64 -tV "$BIN" | grep -n -A2 'GetVendorIDEv'   # → cmp w0, #0xffc
# Transport + protocol classes
strings -n 6 "$BIN" | grep -E 'CUSBMan|CStreamDuplex|FileTransfer|MIDIX|protocol v%d'
```

**Per-model partition layout** — resolve a product constructor's string refs (the
`Add(SPartition)` operands). Find the ctor range with `nm`, then:

```bash
nm -arch arm64 nsm/nsm-arm64 | c++filt | grep -E 'CElectro4::CElectro4\('  # → start/end addrs
otool -arch arm64 -tV nsm/nsm-arm64 > /tmp/d.txt    # one-time
awk 'index($0,"<START>"){f=1} f{print} index($0,"<END>"){exit}' /tmp/d.txt > /tmp/ctor.txt
# pair adrp(page)+add(off) per register, read the cstring (fileoff = vmaddr - 0x100000000)
perl -ne 'if(/adrp\s+(x\d+),\s+\d+\s+;\s+(0x[0-9a-f]+)/){$p{$1}=hex($2)}
  if(/\badd\s+(x\d+),\s+(x\d+),\s+#(0x[0-9a-f]+)/&&$1 eq $2&&$p{$2}){print $p{$2}+hex($3),"\n"}' /tmp/ctor.txt |
while read a; do dd if=nsm/nsm-arm64 bs=1 skip=$((a-0x100000000)) count=44 2>/dev/null|tr '\0' '\n'|head -1; echo; done
```

The output is the model's partition names + fourccs in (approximately) `Add()`
order. For exact protocol indices, pair each string to its `bl CProductBase::Add`
call, or run a read-only `CQryPartList` against the hardware.
