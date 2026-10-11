/**
 * The curated capability-validation matrix — the source of truth the compatibility
 * view renders against. Each cell records how confident we are that a capability
 * works for a model: hardware-validated, reverse-engineered (untested), inferred
 * from a sibling, unsupported, or unknown ("needs a tester"). The live probe
 * (lib/device/probe.ts) lets owners contribute evidence that flips a cell to
 * `validated` via a GitHub PR.
 *
 * The non-Stage-4 rows are a reverse-engineering assessment (not hardware-tested):
 * the whole line shares ONE vendor-USB FileTransfer transport.
 * Where the model's own OS is mapped (the maintainers’ notes: FileTransfer version,
 * partition order, file formats) a cell is `re` — every model with USB transfer now; a
 * cell assumed from a sibling stays `inferred`. The C1's firmware has no USB
 * transfer at all. Only Stage 4 is `validated`; real owners running the read-only probe
 * upgrade cells to `validated`.
 */
import type { NordModelId } from './partitions';

export type Capability =
  | 'file-read' | 'enumerate' | 'pull' | 'push' | 'delete' | 'backup' | 'samples';

export const CAPABILITIES: readonly Capability[] =
  ['file-read', 'enumerate', 'pull', 'push', 'delete', 'backup', 'samples'];

/** The capability columns shown in the compatibility matrix, in display order.
 *  A musician-facing subset of {@link CAPABILITIES}: `file-read` is folded into
 *  the decoded-parameter ("Program Parameters") column (0 params ≈ can't open it),
 *  and `enumerate` is implied by `pull` (Copy from Nord). The full set stays in
 *  CAPABILITIES / VALIDATION — this only changes what the matrix renders. */
export const MATRIX_COLUMNS: readonly Capability[] = ['samples', 'pull', 'push', 'delete', 'backup'];

export const CAPABILITY_LABEL: Record<Capability, string> = {
  'file-read': 'Open files', enumerate: 'List patches', pull: 'Copy from Nord',
  push: 'Copy to Nord', delete: 'Delete on Nord', backup: 'Back up', samples: 'Samples',
};

export type ValidationStatus = 'validated' | 're' | 'inferred' | 'unsupported' | 'unknown';

export interface CapabilityStatus { status: ValidationStatus; note?: string; }

export const VALIDATION: Partial<Record<NordModelId, Partial<Record<Capability, CapabilityStatus>>>> = {
  'stage-classic': {
    'file-read': { status: 're', note: "nspg program record read through the OS 5.08 firmware's own descriptors (lib/ns1: u8 version 10 + 399 bytes of common, panel A, panel B = 400 bytes; 101 morphable parameters with 3 signed deltas each), placed by the CBIN framing rule NSM applies to every model (record at 0x2C behind an NSM-era header, 0x18 behind a legacy one: 444 / 426-byte files). Alignment a candidate until a real file confirms it; not HW-tested" },
    enumerate: { status: 're', note: "FileTransfer v3 in the OS 5.08 firmware (frames of exactly version 3, no session lock); 4 partitions: 0 Native, 1 Piano, 2 Program nspg, 3 Synth nss — no Live, no Settings (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v3 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v3 (firmware); WRITE \u2014 untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v3 (firmware); WRITE \u2014 untested-write risk" },
    backup: { status: 're', note: "ZIP of the user partitions, from the 4-partition list the OS 5.08 firmware registers, pulled over FileTransfer v3; untested on HW" },
    samples: { status: 'unsupported', note: "no sample library in the OS 5.08 firmware (sampleCodec null); pianos CNSP up to v5" },
  },
  'stage-ex': {
    // First-gen Nord Stage EX (sibling of Stage Classic), tag 'nspg' \u2014 NOT Stage 2 EX.
    'file-read': { status: 're', note: "nspg program record read through the OS 6.08 firmware's own descriptors — identical to the Stage Classic's (lib/ns1, 400 bytes), placed by the CBIN framing rule. Alignment a candidate until a real file confirms it; not HW-tested" },
    enumerate: { status: 're', note: "FileTransfer v4 in the OS 6.08 firmware (frames 3..4, no session lock); 4 partitions: 0 Native (FFS), 1 Piano, 2 Program nspg, 3 Synth nss — no Live, no Settings (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v4 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v4 (firmware); WRITE \u2014 untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v4 (firmware); WRITE \u2014 untested-write risk" },
    backup: { status: 're', note: "ZIP of the user partitions, from the 4-partition list the OS 6.08 firmware registers, pulled over FileTransfer v4; untested on HW" },
    samples: { status: 'unsupported', note: "no sample library in the OS 6.08 firmware (sampleCodec null); pianos CNSP up to v5" },
  },
  'stage-2-ex': {
    // Nord Stage 2 EX = Stage 2 + extended memory; shares the ns2p body + OG transport.
    'file-read': { status: 're', note: "same ns2p program format as the Stage 2 (EX = extended memory), read by the same firmware-layout reader (lib/ns2); not HW-tested on EX" },
    enumerate: { status: 're', note: "same OG vendor-USB FileTransfer as Stage 2; read-only, not HW-tested" },
    pull: { status: 're', note: "FileTransfer Download RE'd (shared with Stage 2); read-only, no EX HW test" },
    push: { status: 're', note: "FileTransfer Upload RE'd (shared with Stage 2); WRITE \u2014 untested-write risk" },
    delete: { status: 're', note: "FileTransfer Delete RE'd (shared with Stage 2); WRITE \u2014 untested-write risk" },
    backup: { status: 're', note: "ns2exb ZIP (extended sibling of ns2b); mechanism RE'd, untested" },
    samples: { status: 're', note: "same OS as Stage 2: loads .nsmp with an NWS v8/v11 body only; OpenNord converts other formats. Untested on HW" },
  },
  'stage-2': {
    'file-read': { status: 're', note: "ns2p read-only reader (lib/ns2) generated from the Stage 2 OS 3.00 firmware's parameter descriptors (container list): a u16 record version + 519 bytes (21 global, then slots A and B of 249), every stored parameter plus its Wheel/After Touch/Ctrl Pedal morph deltas; record versions 0-6 converted to 7 as the OS 3.00 load path does; data at 0x2E behind the NSM-era header, 0x1A behind the legacy one. Framing, values and morph deltas checked against ns3-program-viewer's public corpus of real files (489 .ns2p, NSM-era and legacy); not HW-tested" },
    enumerate: { status: 're', note: "protocol confirmed on a Stage 2 (OS 3.00) by a community capture (issue #31; FileTransfer v8, partition list); OpenNord itself not yet run on one. On Windows the browser often can't claim it (UsbDk needed)" },
    pull: { status: 're', note: "programs pulled byte-identical in the community capture (issue #31); OpenNord's client not yet run on a Stage 2" },
    push: { status: 're', note: "FileTransfer Upload RE'd; WRITE op, untested-write risk on HW" },
    delete: { status: 're', note: "FileTransfer Delete RE'd; WRITE op, untested-write risk on HW" },
    backup: { status: 're', note: "ns2b ZIP of flat programs; mechanism RE'd, untested" },
    samples: { status: 're', note: "firmware loads .nsmp with an NWS v8/v11 body only; OpenNord converts other formats (convertNsmp). Untested on HW" },
  },
  'stage-3': {
    'file-read': { status: 're', note: "ns3f read-only body reader (lib/ns3) generated from the Stage 3 OS 2.64 firmware registry: u32 format version + 19 length-prefixed blocks, 175 parameters plus their morph deltas. Framing and values checked against ns3-program-viewer's public corpus of real files (848 .ns3f/.ns3l, NSM-era and legacy). Formats 3.00–3.04 (older 3.x values fixed up on read as the firmware does; a 3.00 free-running delay time shown on its old scale); 2.0x bodies open header-only. Not HW-tested" },
    enumerate: { status: 're', note: "same transfer code as Stage 4 (firmware); partition order per the firmware, Program = 7. A Stage 3 Compact on an older build got 'status 18' (session lock left held); fixed in #38, not retested on HW" },
    pull: { status: 're', note: "FileTransfer Download RE'd; read-only, no Stage 3 HW test" },
    push: { status: 're', note: "FileTransfer Upload RE'd; WRITE only to the Program partition the connect probe confirms; untested on HW" },
    delete: { status: 're', note: "FileTransfer Delete RE'd; WRITE only to the probe-confirmed Program partition; untested on HW" },
    backup: { status: 're', note: "ns3b ZIP backup; mechanism RE'd, untested on HW" },
    samples: { status: 're', note: "firmware loads .nsmp3 (NSMP v30) only; OpenNord converts other formats (convertNsmp). Untested on HW" },
  },
  'stage-4': {
    'file-read': { status: 'validated', note: "ns4p decoded 0-mismatch vs ns4decode against real HW fixture" },
    enumerate: { status: 'validated', note: "CQryPartList HW-validated, VID 0x0FFC/PID 0x002E, fw 3.40 (PROTOCOL-RE)" },
    pull: { status: 'validated', note: "FileTransfer Download HW-validated on real Stage 4" },
    push: { status: 'validated', note: "FileTransfer Upload/write HW-validated on real Stage 4" },
    delete: { status: 'validated', note: "FileTransfer Delete HW-validated on real Stage 4" },
    backup: { status: 'validated', note: "ns4b backup flow HW-validated on real Stage 4" },
    samples: { status: 'validated', note: "sampleCodec 'codec4' (nsmp4) decoded + validated on HW" },
  },
  // ── Models below: firmware read statically. Transfer
  //    notes cite the model's own FileTransfer version and partition order; the
  //    connect probe still confirms Program on the device before any write.
  'electro-3': {
    'file-read': { status: 're', note: "nepg legacy formatType-0 record read through the OS 3.14 firmware descriptor layout (lib/ne3): u16 record version 101 at file 0x18 (100 upgraded on load), 108 data bytes from 0x1A (136-byte file); organ model + Preset I/II drawbars and tabs, piano type and model, effect switches. Alignment medium — no real E3 file checked yet" },
    enumerate: { status: 're', note: "FileTransfer v4 in the OS 3.14 firmware (frames 3..4, no session lock); 8 partitions, Program at 4 (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v4 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v4 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v4 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "neb ZIP of the user partitions, from the 8-partition list the OS 3.14 firmware registers, pulled over FileTransfer v4; untested on HW" },
    samples: { status: 're', note: "sampleCodec 'og': firmware loads .nsmp with NWS v8/v11 only (codec 1/2); not HW-tested on E3" },
  },
  'electro-3-hp': {
    'file-read': { status: 're', note: "nepg (same tag, version and size as the E3) read through the OS 3.16 firmware descriptor layout (lib/ne3): the E3 record plus 5 parameters in its reserved space, which also tell an HP file apart when non-zero. Alignment medium — no real HP file checked yet" },
    enumerate: { status: 're', note: "FileTransfer v4 in the OS 3.16 firmware (frames 3..4, no session lock); 8 partitions, Program at 4 (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v4 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v4 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v4 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "neb ZIP of the user partitions, from the 8-partition list the OS 3.16 firmware registers, pulled over FileTransfer v4; untested on HW" },
    samples: { status: 're', note: "sampleCodec 'og': firmware loads .nsmp with NWS v8/v11 only; not HW-tested on E3 HP" },
  },
  'electro-4': {
    'file-read': { status: 're', note: "ne4p legacy formatType-0 header (shared category table 0x0e resolved); not HW-tested. Body read from file 0x1A through the OS 1.22 firmware descriptor layout (lib/ne4: B3/Vox/Farfisa presets, piano/sample, effects); reproduces the drawbar and sample-reference bytes pinned on real .ne4p fixtures; 23 real files read with every value in range and write back byte-identical" },
    enumerate: { status: 're', note: "FileTransfer v7 in the OS 1.22 firmware (frames 3..7); 7 partitions, Program at 4 (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v7 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v7 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v7 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "ne4b/ne4db ZIP of the user partitions, from the 7-partition list the OS 1.22 firmware registers, pulled over FileTransfer v7; untested on HW" },
    samples: { status: 're', note: "sampleCodec 'og': firmware loads .nsmp with NWS v8/v11 only; not HW-tested on E4" },
  },
  'electro-5': {
    'file-read': { status: 're', note: "ne5p legacy formatType-0 header (bank categories, 8-partition spec); sequential 1-based slot display (programs use the base sequential scheme). Body read from file 0x1A through the OS 2.04 firmware's own parameter containers (lib/ne5: u16 version 4 + 119 bytes, 173 parameters — piano, Sample Synth, B3/Vox/Farfisa/Church presets, effects; version 3 read with a warning, 1–2 refused); reproduces the drawbar and sample-reference bytes pinned on real .ne5p fixtures; not HW-tested" },
    enumerate: { status: 're', note: "FileTransfer v10 in the OS 2.04 (ColdFire) firmware; 8 partitions, Program at 4 (firmware agrees with NSM); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v10 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v10 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v10 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "ne5t/ne5l/ne5s backup tags + partition set, matching the 8 partitions the OS 2.04 firmware registers; validated vs real .ne5p fixtures, not HW-tested" },
    samples: { status: 're', note: "sampleCodec 'og': the OS 2.04 loader accepts .nsmp NWS v8/v11 only and refuses .nsmp3 (convert down); not HW-tested on E5" },
  },
  'electro-6': {
    'file-read': { status: 're', note: "ne6p NW1-v3 header + 211-byte body read through the OS 2.66 firmware registry layout (lib/ne6;, 14 blocks, two's-complement negatives): piano, synth, organ manuals A/B (Preset I/II drawbars) and effects. Reproduces the bytes pinned on real .ne6p fixtures; not HW-tested" },
    enumerate: { status: 're', note: "FileTransfer v10 in the OS 2.66 firmware (Stage 3 begin handler, lock → 18); 7 partitions, Program at 4 (NSM said 6), ne6t = Settings; read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v10 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v10 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v10 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "ne6b ZIP of the user partitions, from the 7-partition list the OS 2.66 firmware registers, pulled over FileTransfer v10; untested on HW" },
    samples: { status: 're', note: "sampleCodec 'codec3' (Stage 3 sample version map in the firmware; generation check not located); not HW-tested on E6" },
  },
  'electro-7': {
    'file-read': { status: 're', note: "ne7p read-only body reader (lib/ne7) generated from the OS 1.30 firmware registry: Stage 4 registry generation, a new format (per-section Fx, embedded synth preset), predicted 397-byte file. Block order from the archive tree (medium) — provisional until a real file confirms it" },
    enumerate: { status: 're', note: "FileTransfer v10 in the OS 1.30 firmware; 10 partitions, Program at 6 (static); USB PID 0x3B from NSM (CElectro7); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v10 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v10 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v10 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "ne7b ZIP of the user partitions, from the 10-partition list the OS 1.30 firmware registers, pulled over FileTransfer v10; untested on HW" },
    samples: { status: 're', note: "firmware accepts .nsmp3 and .nsmp4 (the Stage 4 generation 3–4 check); sampleCodec records codec4; not HW-tested" },
  },
  'piano-1': {
    'file-read': { status: 're', note: "nppg read-only reader (lib/np1) generated from the OS 1.50 firmware's own parameter descriptors: a 20-byte record (piano, effects; 29 parameters) with no version and no converter. Where the record starts in a .nppg file is a guess (0x1A, low) — values are provisional until a real file confirms it; not HW-tested" },
    enumerate: { status: 're', note: "FileTransfer v4 in the OS 1.50 firmware (frames 3..4, no session lock); 6 partitions, Program at 3 (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v4 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v4 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v4 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "npb ZIP of the user partitions, from the 6-partition list the OS 1.50 firmware registers, pulled over FileTransfer v4; untested on HW" },
    samples: { status: 'unsupported', note: "no sample library and no sample code in the OS 1.50 firmware (sampleCodec null)" },
  },
  'piano-2': {
    'file-read': { status: 're', note: "np2p read-only reader (lib/np2) generated from the OS 1.22 firmware's own parameter descriptors: u16 version 2 + 42 bytes (common, piano, synth, effects; 52 parameters; versions 0-1 converted as the firmware does (Keyboard Touch remap)), data taken at file 0x1A (70-byte file). Names mostly from matching MIDI controllers with the Piano 3 (medium). No real .np2p checked yet; not HW-tested" },
    enumerate: { status: 're', note: "FileTransfer v6 in the OS 1.22 firmware (frames 3..6); 9 partitions, Program at 6 (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v6 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v6 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v6 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "ZIP of the user partitions, from the 9-partition list the OS 1.22 firmware registers, pulled over FileTransfer v6; untested on HW" },
    samples: { status: 're', note: "sampleCodec 'og': firmware loads .nsmp with NWS v8/v11 only; not HW-tested" },
  },
  'piano-3': {
    'file-read': { status: 're', note: "np3p read-only reader (lib/np3) generated from the OS 2.04 firmware's own parameter containers: u16 version 4 + 53 bytes (common, piano, synth, effects; 76 parameters; version 3 read as 4, its converter touches nothing in the record), data taken at file 0x1A (81-byte file, medium). No real .np3p checked yet; not HW-tested" },
    enumerate: { status: 're', note: "FileTransfer v10 in the OS 2.04 (ColdFire) firmware; 9 partitions, Program at 6 (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v10 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v10 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v10 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "ZIP of the user partitions, from the 9-partition list the OS 2.04 firmware registers, pulled over FileTransfer v10; untested on HW" },
    samples: { status: 're', note: "sampleCodec 'og': the OS 2.04 loader takes .nsmp NWS v8/v11 only (not .nsmp3); not HW-tested" },
  },
  'piano-4': {
    'file-read': { status: 're', note: "np4p read-only body reader (lib/np4) from the OS 2.66 firmware registry: 90-byte body, 4 blocks, whose block lengths and bundle piano references match real .np4p fixtures; not HW-tested" },
    enumerate: { status: 're', note: "FileTransfer v10 in the OS 2.66 firmware (Stage 3 begin, lock → 18); 9 partitions, Program at 6 (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v10 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v10 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v10 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "ZIP of the user partitions, from the 9-partition list the OS 2.66 firmware registers, pulled over FileTransfer v10; untested on HW" },
    samples: { status: 're', note: "sampleCodec 'codec3': the OS 2.66 firmware requires generation 3 (.nsmp3 only); not HW-tested" },
  },
  'piano-5': {
    'file-read': { status: 're', note: "np5p read-only body reader (lib/np5) from the OS 1.34 firmware registry: 237-byte body, 6 blocks with one global effects block, whose block lengths and piano hashes match real .np5p fixtures; not HW-tested" },
    enumerate: { status: 're', note: "FileTransfer v10 in the OS 1.34 firmware; 9 partitions, Program at 6 (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v10 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v10 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v10 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "ZIP of the user partitions, from the 9-partition list the OS 1.34 firmware registers, pulled over FileTransfer v10; untested on HW" },
    samples: { status: 're', note: "firmware accepts .nsmp3 and .nsmp4 (generation 3–4 check); sampleCodec records codec4; not HW-tested" },
  },
  'piano-6': {
    'file-read': { status: 're', note: "np6p is the Grand 2 layout (OS 1.20 firmware registry), not an ns4 sibling: Stage 3 framing, 185-byte body. Read-only body reader (lib/np6) generated from that map; no real .np6p tested yet" },
    enumerate: { status: 're', note: "FileTransfer v10 in the OS 1.20 firmware (Stage 4 begin, lock → 18); 9 partitions, Program at 6, np6t = Settings; read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v10 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v10 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v10 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "np6b ZIP of the user partitions, from the 9-partition list the OS 1.20 firmware registers, pulled over FileTransfer v10; untested on HW" },
    samples: { status: 're', note: "firmware accepts .nsmp3 and .nsmp4; sampleCodec records codec4; not HW-tested" },
  },
  'lead-4': {
    'file-read': { status: 're', note: "nl4p CBIN header: 2-bank/50-slot display; header validated vs real .nl4p + .nl4s fixtures, not HW-tested. Body read from file 0x1A through the OS 1.32 firmware descriptor layout (lib/nl4: slot + FX sets, sparse morph lists, performance common; the earlier corpus reader read 18 bytes late)" },
    enumerate: { status: 're', note: "FileTransfer v8 in the OS 1.32 firmware (frames 3..8 — a v10 frame is dropped); 3 partitions: 0 Program nl4s, 1 Performance nl4p, 2 Settings nl4t; read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v8 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v8 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v8 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "nl4b ZIP backup; validated vs real .nl4p fixtures, not HW-tested" },
    samples: { status: 'unsupported', note: "sampleCodec null in partitions.ts; no sample engine on Lead 4" },
  },
  'lead-a1': {
    'file-read': { status: 're', note: "CBIN container identify validated against 52 real .nlap/.nlas fixtures; not HW-tested. Body read from file 0x1A through the OS 1.36 firmware descriptor layout (lib/nla: slot + FX sets, inline morph deltas); parameters named by CC only; 50 real .nlas and 1 .nlap read with every value in range (.nlap slot A at data byte 19, after 7 common + 12 unnamed bytes)" },
    enumerate: { status: 're', note: "FileTransfer present in the OS 1.36 firmware — the Lead 4's code (registration, frames 3..8, begin); version 8; 3 partitions: 0 Program nlas, 1 Performance nlap, 2 Settings nlat. SysEx is an extra path, not the only one. Untested on HW; USB PID 0x25 from NSM 9.22 (its CMini class is the Nord Lead A1, tags nlab/nlap/nlas/nlat)" },
    pull: { status: 're', note: "FileTransfer Download in the A1 firmware (same code as Lead 4, v8); read-only, untested on HW" },
    push: { status: 're', note: "FileTransfer Upload in the A1 firmware (same code as Lead 4, v8); WRITE — untested-write risk" },
    delete: { status: 're', note: "FileTransfer Delete in the A1 firmware (same code as Lead 4, v8); WRITE — untested-write risk" },
    backup: { status: 're', note: "nlab ZIP via FileTransfer; transfer code present in the firmware, backup layout untested" },
    samples: { status: 'unsupported', note: "sampleCodec null in partitions.ts; no sample engine on Lead A1" },
  },
  'wave': {
    'file-read': { status: 're', note: "nwp legacy formatType-0 record read through the OS 2.14 firmware descriptor layout (lib/nw1): u8 record version 8 at file 0x18 (6-7 converted on read as the firmware does), 321 data bytes from 0x19 (global, slot A, slot B at +140, common, inline morph deltas), 2 pad bytes, CRC-16 trailer = the 350-byte .nwp the 1018-file corpus shows. all 1018 corpus files read with every value in range and write back byte-identical (v8); not HW-tested" },
    enumerate: { status: 're', note: "FileTransfer v4 in the OS 2.14 firmware (frames 3..4, no session lock); 5 partitions, Program at 1, SWave/RAMFS read-only (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v4 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v4 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v4 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "nwb ZIP of the user partitions, from the 5-partition list the OS 2.14 firmware registers (SWave/RAMFS read-only), pulled over FileTransfer v4; untested on HW" },
    samples: { status: 're', note: "sampleCodec 'og': firmware loads .nsmp NWS v8/v11 (and nwi entries); not HW-tested" },
  },
  'wave-2': {
    'file-read': { status: 're', note: "nw2p NSM-era (formatType 1) header: NSMP-only slot display (programs → unhandled → formatSlot grid display), 19 program categories; body read through the OS 1.24 firmware registry layout (lib/nw2;, MultiCommon then four slots at body 68 + 244k, two's-complement negatives, morph buffers 1-5 = Impulse target, Wheel / Pedal / After Touch / Velocity deltas); reproduces the slot sources pinned on 26 real .nw2p fixtures and their bundle meta.xml; not HW-tested" },
    enumerate: { status: 're', note: "FileTransfer v10 in the OS 1.24 firmware; 5 partitions (no E2P FFS), Program at 2 (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v10 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v10 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v10 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "nw2b ZIP backup (backup ext 'nw2b'); partition set nw2p+nw2l+nw2s+samplib per the OS 1.24 firmware; validated vs 26 real .nw2p fixtures, not HW-tested" },
    samples: { status: 're', note: "sampleCodec 'codec3' decoded in lib/ns4/nsmp*.ts (NSM treats Wave 2 as nsmp3; firmware generation check not located); not HW-tested" },
  },
  'c1': {
    // Nord C1 OS 1.12: no USB device descriptor and no FileTransfer code.
    'file-read': { status: 'unsupported', note: "no file format reachable: the C1 has no USB file transfer and NSM doesn't manage it" },
    enumerate: { status: 'unsupported', note: "no USB device descriptor and no FileTransfer code in the OS 1.12 firmware" },
    pull: { status: 'unsupported', note: "no USB file transfer (OS 1.12 firmware)" },
    push: { status: 'unsupported', note: "no USB file transfer (OS 1.12 firmware)" },
    delete: { status: 'unsupported', note: "no USB file transfer (OS 1.12 firmware)" },
    backup: { status: 'unsupported', note: "no USB file transfer (OS 1.12 firmware)" },
    samples: { status: 'unsupported', note: "no sample engine" },
  },
  'c2': {
    'file-read': { status: 're', note: "ncpg read-only reader (lib/nc) generated from the C2 OS 2.00 firmware's own parameter containers: u16 version 100 (the only one read) + 269 bytes, 66 containers (B3 drawbar sets and percussion, Vox, Farfisa, pipe presets and couplers, bass modes, effects). Record alignment in the file (data at 0x1A, 297-byte file) unconfirmed; block names medium; not HW-tested" },
    enumerate: { status: 're', note: "FileTransfer v4 in the OS 2.00 firmware (frames 3..4, no session lock); 5 partitions: 0 Pipe (Native), 1 Pipe, 2 Program ncpg, 3 Live, 4 System — Pipe partitions read-only (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v4 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v4 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v4 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "ZIP of the user partitions, from the 5-partition list the OS 2.00 firmware registers, pulled over FileTransfer v4; untested on HW" },
    samples: { status: 'unsupported', note: "sampleCodec null in partitions.ts; C2 has no sample engine" },
  },
  'c2d': {
    'file-read': { status: 're', note: "nc2p legacy formatType-0 record read through the OS 1.12 firmware descriptor layout (lib/nc2; container list, 115 instances, repeated containers overwrite their first copy): u16 record version 100 at file 0x18, 345 data bytes from 0x1A (373-byte file). Block names medium-low, alignment medium — no real C2D file checked yet" },
    enumerate: { status: 're', note: "FileTransfer v4 in the OS 1.12 firmware (frames 3..4, no session lock); 4 partitions (no Live), Program at 2, Pipe partitions read-only (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v4 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v4 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v4 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "nc2b ZIP of the user partitions, from the 4-partition list the OS 1.12 firmware registers, pulled over FileTransfer v4; untested on HW" },
    samples: { status: 'unsupported', note: "sampleCodec null in partitions.ts; C2D has no sample engine" },
  },
  'grand': {
    'file-read': { status: 're', note: "ngp is the Piano 4 layout bit for bit plus one MultiCommon field (OS 1.68 firmware registry). Read-only body reader (lib/ng) generated from that map; no real .ngp tested yet" },
    enumerate: { status: 're', note: "FileTransfer v10 in the OS 1.68 firmware; 9 partitions, Program at 6, ngs = Settings (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v10 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v10 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v10 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "ngb ZIP of the user partitions, from the 9-partition list the OS 1.68 firmware registers, pulled over FileTransfer v10; untested on HW" },
    samples: { status: 're', note: "sampleCodec 'codec3': the OS 1.68 firmware requires generation 3 (.nsmp3 only, not .nsmp4); not HW-tested" },
  },
  'grand-2': {
    'file-read': { status: 're', note: "ng2p read-only body reader (lib/ng2) from the OS 1.22 firmware registry: 185-byte body, 11 blocks, whose block lengths and piano hashes match real .ng2p fixtures; not HW-tested" },
    enumerate: { status: 're', note: "FileTransfer v10 in the OS 1.22 firmware; 9 partitions, Program at 6, ng2t = Settings (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v10 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v10 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v10 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "ng2b ZIP of the user partitions, from the 9-partition list the OS 1.22 firmware registers, pulled over FileTransfer v10; untested on HW" },
    samples: { status: 're', note: "firmware accepts .nsmp3 and .nsmp4; sampleCodec records codec4; not HW-tested" },
  },
  'organ-3': {
    'file-read': { status: 're', note: "no3p is a Stage 4 registry-generation format (OS 1.00 firmware,; predicted 204-byte body). Read-only body reader (lib/no3) generated from that map; block order assumed from insertion order (medium) — provisional until a real file confirms it" },
    enumerate: { status: 're', note: "FileTransfer v10 in the OS 1.00 firmware; 3 partitions, Program at 0 (static); read-only, untested" },
    pull: { status: 're', note: "shared FileTransfer Download at v10 (firmware); read-only, untested" },
    push: { status: 're', note: "shared FileTransfer Upload at v10 (firmware); WRITE — untested-write risk" },
    delete: { status: 're', note: "shared FileTransfer Delete at v10 (firmware); WRITE — untested-write risk" },
    backup: { status: 're', note: "no3b ZIP of the 3 partitions the OS 1.00 firmware registers, pulled over FileTransfer v10; untested on HW" },
    samples: { status: 'unsupported', note: "no piano or sample partitions in the OS 1.00 firmware" },
  },
};

export function statusFor(id: NordModelId, cap: Capability): CapabilityStatus {
  return VALIDATION[id]?.[cap] ?? { status: 'unknown' };
}
