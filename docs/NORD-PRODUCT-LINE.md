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

| Instrument | NSM handler *(NSM)* | Program tag *(NSM)* | Backup | Sample codec | Gen *(inferred)* |
|---|---|---|---|---|---|
| Nord Stage (Classic/EX) | `CStageBase` | `nsp` / `nspg` | `nsb`, `ns2exb` | — | OG/NWS |
| **Nord Stage 2** | `CStageBase`, `CPartitionProgramNS2` | `ns2p` | `ns2b` | `nsmp` (codec-1) | OG |
| **Nord Stage 3** | `CStageBase` | **`ns3f`** | `ns3b` | `nsmp3` (codec-3) | NW1 v3 |
| **Nord Stage 4** | `CStageBase` | `ns4p` | `ns4b` | `nsmp4` (codec-4) | NW1 v4 |
| Nord Electro 3 / 3 HP | `CElectro3`, `CElectro3HP`, `CElectro3Base`, `CPartitionProgramE3(HP)` | `nepg` | `neb` | `nsmp` | OG |
| Nord Electro 4 | `CElectro4`, `CPartitionProgramE4` | `ne4p` | `ne4b` | `nsmp` | OG |
| Nord Electro 5 | `CElectro5` | `ne5p` | `ne5b` | `nsmp3` | NW1 v3 |
| Nord Electro 6 | `CElectro6` | `ne6p` | `ne6b` | `nsmp3` | NW1 v3 |
| Nord Piano (1) | `CPiano` | `nppg` | `npb` | `nsmp` | OG |
| Nord Piano 2 / 3 | `CPiano2`/`CPiano3`, `CPartitionProgramNP2`/`NP3` | `np2…`/`np3…` | — | `nsmp`/`nsmp3` | OG→NW1 v3 |
| Nord Piano 4 / 5 / 6 | `CPiano4`/`CPiano5`/`CPiano6`, `CPartitionPnoV5`/`V6` | — | — | `nsmp3`/`nsmp4` | NW1 v3/v4 |
| Nord Lead 4 | `CLead4`, `CLead4Base` | `nl4p` | `nl4b` | — | — |
| Nord Lead A1 | `CMini` *(inferred)* | `nlap` | `nlab` | — | — |
| Nord Wave | `CProductBase` | `nws`/`nwp` | `nwb` | `nsmp` | OG |
| Nord Wave 2 | `CGeneric` *(inferred)* | `nw2p` | `nw2b` | `nsmp3` | NW1 v3 |
| Nord C2 / C2D | `CC2`, `CC2D` | `nc2p` | `nc2b` | — | — |
| Nord Organ 3 / C (classic) | `COrgan3` | `no3p` / `ncpg` | `no3b` / `ncb` | — | — |
| Nord Grand | `CGrand` | `ngp` | `ngb` | `nsmp3`/`nsmp4` | NW1 v3/v4 |
| Nord Grand 2 | `CGrand2` | `ng2p` | `ng2b` | `nsmp4` | NW1 v4 |

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
| `s` / `sy` | **Synth Preset** / Sound | per-engine synth sounds |
| `y` | **Synth Preset** (Stage) | Stage uses `…y` (e.g. `ns4y`) |
| `o` / `op` | **Organ Preset** | `nso`, `neop`, `ns4o` |
| `n` | (Stage 4 preset slot) | `ns4n` — preset family, exact kind TBD |
| `t` | **Set List** *(inferred)* | `ns4t`, `ns3t`, `ne5t`… newer models |
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

| Partition | Role | Present on |
|---|---|---|
| `Native (FFS)` / `E2P FFS` | flash filesystem | most |
| `Piano (Native)` | factory pianos | piano-capable (Stage, Piano, Electro, Grand) |
| `Pedal (Native)` / `Piano Pedal (Native)` | factory pedal-noise/pads | Piano, Electro 6, Grand, Stage |
| `Samp Lib (Native)` | factory sample library | sample-capable |
| **`Program` (+ `Program Bundle`)** | user programs (bundle = program + deps by name) | all |
| `Live` | live buffer | all |
| `Synth Preset` / `Organ Preset` | per-engine presets | Stage/Wave (synth), Electro/C2 (organ) |
| `Set List` *(inferred, `…t` tag)* | set lists | Stage 3/4, Electro 6, Piano 6, Grand 2 |
| `Settings` | global settings | all |

**Extracted layouts** *(NSM, static; order ≈ `Add()` order — exact indices are
HW-validated only for Stage 4)*:

| Model | Program tag | Ordered partition set (Native → user) |
|---|---|---|
| **Stage 4** *(HW-validated, PROTOCOL-RE)* | `ns4p` | Piano N, Piano, Pedal N, Pedal, SampLib N, SampLib, **Program(6)**, Organ, Piano Preset, Synth Preset (`ns4y`), Live (`ns4l`), Settings — **12 partitions** |
| **Stage (base; NS2/NS3 via SCaps)** | `ns2p`/`ns3f` | Backup, Native FFS, Program, Synth (`…s`), Live, Settings — variant fourcc by SCaps |
| **Electro 4** *(OG)* | `ne4p` | Piano N, SampLib N, Program (+`ne4pb`), Live (`ne4l`), Settings (`ne4s`); Backup `ne4b`/`ne4db` |
| **Electro 6** *(v3)* | `ne6p` | Piano N, Pedal N, SampLib N, Program (+bundle), Live (`ne6l`), Set List (`ne6t`), Settings; FFS |
| **Piano 3** *(v3)* | `np3p` | Piano N, Piano Pedal N, SampLib N, Program (+bundle), Live (`np3l`), Settings (`np3s`) |
| **Piano 6** *(v4)* | `np6p` | Piano N, Pedal N, SampLib N, Program (+bundle), Live (`np6l`), Set List (`np6t`), Settings; FFS |
| **Grand 2** *(v4)* | `ng2p` | Piano N, Pedal N, SampLib N, Program (+bundle), Live (`ng2l`), Set List (`ng2t`), Settings; FFS |
| **Wave 2** *(v3)* | `nw2p` | SampLib N, Program (+bundle), Live (`nw2l`), Synth (`nw2s`), Settings; FFS |

Takeaway: **the partition model is uniform across the line** — same partition
*kinds* in the same relative order, model-to-model differences are which optional
partitions exist (Pedal, Organ vs Synth, Set List) and the fourcc generation. A
single `{ partitions: PartitionSpec[] }` per model in OpenNord's `clavia` registry
captures all of it. Exact numeric indices for non-Stage-4 models still want a
one-line hardware `CQryPartList` to confirm `Add()` order, but the **set** is known.

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

- **Exact product IDs per model.** NSM gates on vendor only, so the PID→model map
  lives in its `clavia.xml` resource (in the full `.app` bundle, **not** in our
  arm64 slice). Stage 4 = `0x002E` is HW-validated; others are unknown but **not
  required** for a vendor-only filter.
- **Per-model partition order.** The `CPartitionProgram*` classes confirm layouts
  differ; the actual indices need disassembly of each class or a hardware
  `CQryPartList` probe.
- **OG/NW1-v3 protocol-version deltas.** The protocol family is shared; whether an
  older `FileTransfer` *version* has identical opcode payloads needs one read-only
  enumerate against real ns2/ns3 hardware.
- **Codec-per-model beyond ns2/3/4** in the table above is *inferred* from era and
  needs a sample file to confirm.

---

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
