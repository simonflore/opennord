/**
 * Full-line Nord partition registry — data only, behind the `clavia` model seam.
 * Each model's memory is a list of partitions (the FileTransfer protocol addresses
 * them by index); this records the kind/label/fourcc per partition. Stage 4
 * indices are hardware-validated; every other model carries
 * its statically-recovered order as `staticIndex` until a hardware CQryPartList
 * confirms it.
 *
 * Partition ORDER: the protocol index is the order in which the instrument's own
 * firmware registers each partition with its file-transfer code — that is what
 * CQryPartList reports. Every model's firmware has been read statically
 *, so that order is the
 * ground truth; NSM's
 * product-constructor `Add()` order is a weaker proxy and often disagrees with it.
 *
 * `NordModelId` is a superset of clavia/model.ts `ClaviaModel` (which stays the
 * decode-capable subset) — this file never imports concrete codecs.
 */

export type NordModelId =
  | 'stage-classic' | 'stage-ex' | 'stage-2' | 'stage-2-ex' | 'stage-3' | 'stage-4'
  | 'electro-3' | 'electro-3-hp' | 'electro-4' | 'electro-5' | 'electro-6' | 'electro-7'
  | 'piano-1' | 'piano-2' | 'piano-3' | 'piano-4' | 'piano-5' | 'piano-6'
  | 'lead-4' | 'lead-a1' | 'wave' | 'wave-2' | 'c1' | 'c2' | 'c2d'
  | 'grand' | 'grand-2' | 'organ-3';

export type PartitionKind =
  | 'piano-native' | 'pedal-native' | 'samplib-native'
  | 'piano' | 'pedal' | 'samplib'
  | 'program' | 'live' | 'synth-preset' | 'organ-preset' | 'piano-preset'
  | 'setlist' | 'settings'
  /** Synth-wave ROM flash (Stage 3, Wave): NSM-managed content, never written by OpenNord. */
  | 'swave'
  /** C2D pipe-organ sound partitions (factory + NSM's "Pipe" ROMFlash). Read-only for OpenNord. */
  | 'pipe-native' | 'pipe'
  /** Wave RAM file system partition: unknown content, treated read-only. */
  | 'ramfs';

export interface PartitionSpec {
  kind: PartitionKind;
  label: string;    // musician-facing
  native: boolean;  // read-only factory content
  fourcc?: string;
  index?: number;   // protocol index — set only when hardware-confirmed
  /**
   * Protocol index known ahead of hardware — from the instrument's own
   * partition-registration order where that has been read (every model whose
   * OS has been mapped, the maintainers’ notes), else from NSM's
   * partition list (the partition's ordinal in its
   * `Add()` sequence). Medium-high confidence — the ordinal==protocol-index
   * equivalence is the documented assumption,
   * hardware-validated only for Stage 4 (and Stage 2 on OS 3.00).
   * `index` (hardware-confirmed) always takes precedence; a device probe
   * promotes `staticIndex` → `index` once it agrees. Strictly better than the
   * Stage-4 default for non-Stage-4 models whose real index differs.
   */
  staticIndex?: number;
}

/**
 * Sample-library codec a model loads. One value per model: where the firmware
 * accepts more than one (Piano 5/6, Grand 2 take `.nsmp3` and `.nsmp4`), the
 * newest accepted codec is recorded and the entry's comment names the others.
 */

export type SampleCodec = 'og' | 'codec3' | 'codec4' | null;

export interface ModelInfo {
  id: NordModelId;
  name: string;
  generation: 'OG' | 'NW1-v3' | 'NW1-v4';
  programTag: string | null;
  sampleCodec: SampleCodec;
  partitions: PartitionSpec[]; // ordered Native → user
  /** USB product id (Clavia vendor 0x0FFC) — set only when hardware-confirmed. */
  productId?: number;
  /**
   * USB product id recovered statically from Nord Sound Manager 9.22. NSM uses
   * the PID directly as its instrument id (its device-spec lookup
   * returns the stored instrument ids) and dispatches on it in
   * its product factory. Medium-high
   * confidence, not hardware-validated — `productId` always takes precedence
   * and `modelByProductId` deliberately ignores this field. Connect still uses it
   * (via `identifyModelByProductId`) to name the device and pick the program tag
   * the read-only probe looks for; writes need that probe to succeed.
   */
  staticProductId?: number;
  /**
   * OS versions NSM 9.22 gates this model on, in NSM's encoding (version × 100,
   * so 90 = v0.90). From `CProductBase` +0x48 (`GetVersion_Min`) and +0x4C
   * (`GetVersion_Recommended`), set in each product constructor. For models NSM
   * splits into OS-ranged classes (Stage/EX/Electro 3 `*_PreNPNOv5`/`PreV400`,
   * Lead 4 FTv7/FTv8) `min` is the oldest supported class's floor and
   * `recommended` the current class's — mirroring `GetVersionMinAndRecommended`.
   */
  os?: { min: number; recommended: number };
  /**
   * The partition layout differs between OS versions, so even a hardware-
   * confirmed `index` must be checked on the device (the connect probe) before
   * anything is written. Stage 2: NSM 9.22's `CStage2` adds the user Pedal
   * partition only on newer OS (a conditional `Add()`, the maintainers’ notes),
   * so on older OS every later partition — Program included — sits one lower.
   */
  layoutVariesByOs?: boolean;
  /**
   * FileTransfer protocol version the instrument's firmware speaks — the u32
   * `version` every frame header carries. Recovered statically from each OS
   * image (the transfer service's constructor argument; the maintainers’ notes,
   * the maintainers’ notes). The firmware drops frames whose version is outside
   * 3..this value without replying, so a v4/v6/v7/v8 device never answers the
   * Stage 4 default (10). Connect still negotiates (protocol 0x07) and adopts
   * whatever the device advertises; this is the version used until then, and
   * when the device doesn't answer. Omitted only for the C1 (no USB transfer).
   */
  fileTransferVersion?: number;
  /**
   * `false` when the instrument has no USB file transfer at all (C1: no USB
   * device descriptor and no FileTransfer code in its OS). Omitted = present.
   * It has no program tag and no partitions, so device code never targets it.
   */
  deviceTransfer?: false;
}

const P = (kind: PartitionKind, label: string, native: boolean, fourcc?: string, index?: number): PartitionSpec =>
  ({ kind, label, native, fourcc, index });
/** Partitions in the firmware's registration order: each spec's `staticIndex`
 *  is its position in the list (see `PartitionSpec.staticIndex`). */
const firmwareOrder = (...specs: PartitionSpec[]): PartitionSpec[] =>
  specs.map((spec, i) => ({ ...spec, staticIndex: i }));

/** The 9 partitions the ColdFire Piano 2 / Piano 3 register: user Piano Pedal
 *  before the factory one, as on the Stage 2. No E2P FFS. Live and Settings
 *  tags from NSM 9.22 (`CPiano2` / `CPiano3`). */
const coldfirePianoLine = (program: string, live: string, settings: string): PartitionSpec[] => firmwareOrder(
  P('piano-native', 'Piano (factory)', true),
  P('piano', 'Piano', false),
  P('pedal', 'Piano Pedal', false),
  P('pedal-native', 'Pedal (factory)', true),
  P('samplib-native', 'Sample Library (factory)', true),
  P('samplib', 'Sample Library', false),
  P('program', 'Programs', false, program),
  P('live', 'Live', false, live),
  P('settings', 'Settings', false, settings),
);

/** The 9 partitions every ARM piano (Piano 4/5/6, Grand, Grand 2) registers —
 *  identical on all five (storage order 1,0,3,2,5,4,6,7,8; high). No Set List
 *  and no E2P FFS on the wire; the `…t` file is Settings. */
const armPianoLine = (program: string, live: string, settings: string): PartitionSpec[] => firmwareOrder(
  P('piano-native', 'Piano (factory)', true),
  P('piano', 'Piano', false),
  P('pedal-native', 'Pedal (factory)', true),
  P('pedal', 'Piano Pedal', false),
  P('samplib-native', 'Sample Library (factory)', true),
  P('samplib', 'Sample Library', false),
  P('program', 'Programs', false, program),
  P('live', 'Live', false, live),
  P('settings', 'Settings', false, settings),
);

/** The 8 partitions the ColdFire Electro 3 / 3 HP register. Live `neli` and
 *  Settings `nesy` from NSM 9.22's `CElectro3Base` / `CElectro3HP`. */
const electro3Line = (): PartitionSpec[] => firmwareOrder(
  P('piano-native', 'Piano (factory)', true),
  P('samplib-native', 'Sample Library (factory)', true),
  P('piano', 'Piano', false),
  P('samplib', 'Sample Library', false),
  P('program', 'Programs', false, 'nepg'),
  P('live', 'Live', false, 'neli'),
  P('settings', 'Settings', false, 'nesy'), // firmware name "System"
  // Organ Presets `neop`: NSM 9.22 registers it in `CElectro3Base` (both the
  // E3 and the E3 HP), and the firmware registers it on both.
  P('organ-preset', 'Organ Presets', false, 'neop'),
);

/** Lead 4 / Lead A1: 3 partitions, no factory partitions. The firmware's
 *  "Program" partition holds single sounds (`nl4s`/`nlas`) and its
 *  "Performance" partition the 4-slot performances (`nl4p`/`nlap`). OpenNord's
 *  `programTag` stays the performance tag (the decoders and the connect probe
 *  key on it), so the performance partition carries the `program` kind and the
 *  sound partition the `synth-preset` kind. */
const leadLine = (sound: string, performance: string, settings: string): PartitionSpec[] => firmwareOrder(
  P('synth-preset', 'Programs', false, sound),
  P('program', 'Performances', false, performance),
  P('settings', 'Settings', false, settings),
);

export const MODELS: Record<NordModelId, ModelInfo> = {
  'stage-4': {
    id: 'stage-4', name: 'Nord Stage 4', generation: 'NW1-v4', programTag: 'ns4p', sampleCodec: 'codec4', productId: 0x002e,
    os: { min: 90, recommended: 100 }, fileTransferVersion: 10, // OS 1.66; the maintainers’ notes "Accepted frame versions"
    partitions: [ // the maintainers’ notes — hardware-validated indices
      P('piano-native', 'Piano (factory)', true, undefined, 0),
      P('piano', 'Piano', false, undefined, 1),
      P('pedal-native', 'Pedal (factory)', true, undefined, 2),
      P('pedal', 'Pedal', false, undefined, 3),
      P('samplib-native', 'Sample Library (factory)', true, undefined, 4),
      P('samplib', 'Sample Library', false, undefined, 5),
      P('program', 'Programs', false, 'ns4p', 6),
      P('organ-preset', 'Organ Presets', false, 'ns4o', 7),
      P('piano-preset', 'Piano Presets', false, 'ns4n', 8),
      P('synth-preset', 'Synth Presets', false, 'ns4y', 9),
      P('live', 'Live', false, 'ns4l', 10),
      P('settings', 'Settings', false, 'ns4t', 11), // tag from NSM 9.22
    ],
  },
  'stage-3': {
    id: 'stage-3', name: 'Nord Stage 3', generation: 'NW1-v3', programTag: 'ns3f', sampleCodec: 'codec3', productId: 0x0026,
    os: { min: 250, recommended: 254 }, fileTransferVersion: 10, // OS 2.64; the maintainers’ notes
    // Firmware registration order (= CQryPartList order), recovered statically
    // from Stage 3 OS 2.64; 12 partitions, no "E2P FFS" on the
    // wire. NSM 9.22's Stage 3 partition order agrees on
    // 0-7 (6 SWave, 7 Program) and 10-11, but its constructor adds Song before
    // Synth and appends an "E2P FFS" (12); the firmware registers Synth (8)
    // before Song (9) and reports no 12th. The device's order is what NSM binds
    // positionally when it lists partitions, so the firmware
    // order wins. Not hardware-confirmed: every index is `staticIndex` (a connect
    // probe still checks Program before anything is written).
    // Library partitions hold npno (1) / npdl (3) / nsmp (5) files; like the
    // Stage 4 entry they carry no fourcc (library files are mapped by extension).
    // 6 SWave is synth-wave ROM flash managed by NSM: the firmware likely accepts
    // writes there, but OpenNord treats it as read-only (`native`).
    partitions: firmwareOrder(
      P('piano-native', 'Piano (factory)', true),
      P('piano', 'Piano', false),
      P('pedal-native', 'Pedal (factory)', true),
      P('pedal', 'Piano Pedal', false),
      P('samplib-native', 'Sample Library (factory)', true),
      P('samplib', 'Sample Library', false),
      P('swave', 'Synth Waves (factory)', true),
      P('program', 'Programs', false, 'ns3f'),
      P('synth-preset', 'Synth Presets', false, 'ns3y'),
      P('setlist', 'Songs', false, 'ns3s'),
      P('live', 'Live', false, 'ns3l'),
      P('settings', 'Settings', false, 'ns3t'),
    ),
  },
  'stage-2': {
    // Hardware-validated indices from a live CQryPartList probe on a Nord Stage 2
    // (fw 3.00), contributed in issue #31 (independent interop notes). count = 10;
    // Program partition index = 6 (same as NS4). NS2 swaps indices 2/3 (user Piano
    // Pedal ↔ native Pedal) relative to the NS4, and — unlike the NS4 — has no
    // separate Organ/Piano/Synth *Preset* partitions. See the maintainers’ notes.
    // These indices hold for that OS; older Stage 2 OS versions lack the gated
    // user Pedal partition, so `layoutVariesByOs` makes connect probe first.
    // Fourccs per the partition registration (Stage 2 OS 3.00
    //, same order as the issue #31 capture): Synth is `ns2s`,
    // Settings is `ns2y`. OS 3.00 registers the user Pedal unconditionally; the
    // pedal gate is NSM's rule for older OS (no pre-3.00 image checked).
    id: 'stage-2', name: 'Nord Stage 2', generation: 'OG', programTag: 'ns2p', sampleCodec: 'og', productId: 0x0021,
    os: { min: 100, recommended: 300 }, layoutVariesByOs: true,
    fileTransferVersion: 8, // OS 3.00: issue #31 negotiation capture; the maintainers’ notes "Accepted frame versions"
    partitions: [
      P('piano-native', 'Piano (factory)', true, undefined, 0),
      P('piano', 'Piano', false, undefined, 1),
      P('pedal', 'Piano Pedal', false, undefined, 2),
      P('pedal-native', 'Pedal (factory)', true, undefined, 3),
      P('samplib-native', 'Sample Library (factory)', true, undefined, 4),
      P('samplib', 'Sample Library', false, undefined, 5),
      P('program', 'Programs', false, 'ns2p', 6),
      P('synth-preset', 'Synth', false, 'ns2s', 7),
      P('live', 'Live', false, 'ns2l', 8),
      P('settings', 'Settings', false, 'ns2y', 9),
    ],
  },
  'stage-2-ex': {
    // Nord Stage 2 EX = Nord Stage 2 with extended memory. Same ns2p program body
    // codec and same partition structure as Stage 2 (mirrors the hardware-validated
    // NS2 map from issue #31); stage-2 stays the ns2p anchor (defined first). The
    // "EX" is a hardware capacity bump, not a format change — so Stage 2 EX program
    // files read/render through the Stage 2 path unchanged.
    id: 'stage-2-ex', name: 'Nord Stage 2 EX', generation: 'OG', programTag: 'ns2p', sampleCodec: 'og',
    staticProductId: 0x0021, os: { min: 100, recommended: 300 }, layoutVariesByOs: true,
    fileTransferVersion: 8, // same CStage2 class and OS as Stage 2
    partitions: [
      P('piano-native', 'Piano (factory)', true, undefined, 0),
      P('piano', 'Piano', false, undefined, 1),
      P('pedal', 'Piano Pedal', false, undefined, 2),
      P('pedal-native', 'Pedal (factory)', true, undefined, 3),
      P('samplib-native', 'Sample Library (factory)', true, undefined, 4),
      P('samplib', 'Sample Library', false, undefined, 5),
      P('program', 'Programs', false, 'ns2p', 6),
      P('synth-preset', 'Synth', false, 'ns2s', 7),
      P('live', 'Live', false, 'ns2l', 8),
      P('settings', 'Settings', false, 'ns2y', 9),
    ],
  },
  // ── First-generation Stage (ColdFire). Firmware registration order from the
  //    instrument's OS. Both register 4 partitions — no Live,
  //    no Settings — and write the same `nspg` program record (the Stage EX's
  //    descriptors equal the Classic's), so `modelByTag('nspg')` answers the
  //    Stage Classic (the anchor, as the Stage 2 is for `ns2p`). Pianos: CNSP
  //    0x423–0x42F, 0x430, 0x440 and 0x450 (no v6); no sample library.
  'stage-classic': {
    // Stage Classic OS 5.08: FileTransfer version 3 — frames of exactly
    // version 3 — and no session lock (begin never answers 18).
    id: 'stage-classic', name: 'Nord Stage Classic', generation: 'OG', programTag: 'nspg', sampleCodec: null,
    staticProductId: 0x0003, os: { min: 312, recommended: 508 }, fileTransferVersion: 3,
    partitions: firmwareOrder(
      P('piano-native', 'Piano (factory)', true), // firmware name "Native"
      P('piano', 'Piano', false),
      P('program', 'Programs', false, 'nspg'),
      P('synth-preset', 'Synth', false, 'nss'),
    ),
  },
  // First-generation Nord Stage EX (extended sibling of Stage Classic), NOT Stage 2 EX.
  'stage-ex': {
    // Stage EX OS 6.08: FileTransfer version 4 (frames 3..4), no session lock.
    // Partition 0 is named "Native (FFS)" in this firmware.
    id: 'stage-ex', name: 'Nord Stage EX', generation: 'OG', programTag: 'nspg', sampleCodec: null,
    staticProductId: 0x0008, os: { min: 400, recommended: 608 }, fileTransferVersion: 4,
    partitions: firmwareOrder(
      P('piano-native', 'Piano (factory)', true), // firmware name "Native (FFS)"
      P('piano', 'Piano', false),
      P('program', 'Programs', false, 'nspg'),
      P('synth-preset', 'Synth', false, 'nss'),
    ),
  },

  // ── ColdFire generation (Stage 2 era). Firmware registration order from the
  //    instrument's OS (the maintainers’ notes, 2026-10-11). Every index is `staticIndex`.
  'electro-3': {
    // Electro 3 OS 3.14: registration; FileTransfer ctor →
    // base(…,4), frames 3..4, no session lock (begin).
    // Samples: `.nsmp` NWS v8/v11 only. NSM's `CElectro3_PreNPNOv5`
    // covers OS 1.00–2.06; no pre-3.x image was read.
    id: 'electro-3', name: 'Nord Electro 3', generation: 'OG', programTag: 'nepg', sampleCodec: 'og',
    staticProductId: 0x0007, os: { min: 100, recommended: 314 }, fileTransferVersion: 4,
    partitions: electro3Line(),
  },
  'electro-3-hp': {
    // Electro 3 HP OS 3.16: registration; base ctor(…,4),
    // frames 3..4, no session lock (begin). Samples NWS v8/v11.
    id: 'electro-3-hp', name: 'Nord Electro 3 HP', generation: 'OG', programTag: 'nepg', sampleCodec: 'og',
    staticProductId: 0x000b, os: { min: 100, recommended: 314 }, fileTransferVersion: 4,
    partitions: electro3Line(),
  },
  'electro-4': {
    // Electro 4 OS 1.22: registration; FileTransfer ctor(…,7),
    // frames 3..7, Stage 2 session code (lock → 18). Samples NWS v8/v11.
    // NSM's Add() order skipped the user Piano (2) and Samp Lib (3); Program 4 agrees.
    id: 'electro-4', name: 'Nord Electro 4', generation: 'OG', programTag: 'ne4p', sampleCodec: 'og',
    staticProductId: 0x0023, os: { min: 100, recommended: 120 }, fileTransferVersion: 7,
    partitions: firmwareOrder(
      P('piano-native', 'Piano (factory)', true),
      P('samplib-native', 'Sample Library (factory)', true),
      P('piano', 'Piano', false),
      P('samplib', 'Sample Library', false),
      P('program', 'Programs', false, 'ne4p'),
      P('live', 'Live', false, 'ne4l'),
      P('settings', 'Settings', false, 'ne4s'), // tag from NSM 9.22 `CElectro4`
    ),
  },
  'electro-5': {
    // Electro 5 OS 2.04: registration — same order as NSM's
    // partition list. FileTransfer ctor
    //(…,1,10), frames 3..10, Stage 2 session code.
    // ColdFire, Stage 2 generation (legacy formatType-0 program header), so
    // `generation` is OG. Samples: `.nsmp` NWS v8/v11 only — the loader
    // accepts generations 1–2 and refuses `.nsmp3`
    // although its version table knows v30. Pianos: CNSP v5 and v6.
    id: 'electro-5', name: 'Nord Electro 5', generation: 'OG', programTag: 'ne5p', sampleCodec: 'og',
    staticProductId: 0x0027, os: { min: 100, recommended: 140 }, fileTransferVersion: 10,
    partitions: firmwareOrder(
      P('piano-native', 'Piano (factory)', true),
      P('piano', 'Piano', false),
      P('samplib-native', 'Sample Library (factory)', true),
      P('samplib', 'Sample Library', false),
      P('program', 'Programs', false, 'ne5p'),
      P('setlist', 'Set Lists', false, 'ne5t'),
      P('live', 'Live', false, 'ne5l'),
      P('settings', 'Settings', false, 'ne5s'),
    ),
  },
  'piano-1': {
    // Nord Piano OS 1.50: registration; base ctor(…,4),
    // frames 3..4, no session lock (begin). NSM has Piano at 1 and
    // Pedal (Native) at 2; the firmware registers them the other way round.
    // No sample library and no sample code at all → sampleCodec null.
    // Pianos: CNSP v5 only (loader).
    id: 'piano-1', name: 'Nord Piano', generation: 'OG', programTag: 'nppg', sampleCodec: null,
    staticProductId: 0x0020, os: { min: 100, recommended: 148 }, fileTransferVersion: 4,
    partitions: firmwareOrder(
      P('piano-native', 'Piano (factory)', true),
      P('pedal-native', 'Pedal (factory)', true),
      P('piano', 'Piano', false),
      P('program', 'Programs', false, 'nppg'),
      P('live', 'Live', false, 'npli'), // tags from NSM 9.22 `CPiano`
      P('settings', 'Settings', false, 'npsy'), // firmware name "System"
    ),
  },
  'piano-2': {
    // Piano 2 OS 1.22: registration; base ctor(…,6),
    // frames 3..6, Stage 2 session code. Samples NWS v8/v11.
    // Pianos: CNSP v5 only.
    id: 'piano-2', name: 'Nord Piano 2', generation: 'OG', programTag: 'np2p', sampleCodec: 'og',
    staticProductId: 0x0022, os: { min: 100, recommended: 120 }, fileTransferVersion: 6,
    partitions: coldfirePianoLine('np2p', 'np2l', 'np2s'),
  },
  'piano-3': {
    // Piano 3 OS 2.04: registration; FileTransfer ctor
    //(…,1,10), frames 3..10, Stage 2 session code. ColdFire, Stage 2
    // generation → `generation` OG (the old NW1-v3 label was a guess). Samples:
    // `.nsmp` NWS v8/v11 only (version table maps only
    // 8 and 11). Pianos: CNSP v5 and v6. NSM's list lacked the user Piano,
    // Piano Pedal and Samp Lib partitions; Program 6 agrees.
    id: 'piano-3', name: 'Nord Piano 3', generation: 'OG', programTag: 'np3p', sampleCodec: 'og',
    staticProductId: 0x0028, os: { min: 100, recommended: 122 }, fileTransferVersion: 10,
    partitions: coldfirePianoLine('np3p', 'np3l', 'np3s'),
  },
  'wave': {
    // Nord Wave OS 2.14: registration (the constructors pass their
    // index explicitly); base ctor(…,4), frames 3..4, no session lock
    // (begin). No factory sample library and no Live partition.
    // SWave and RAMFS hold unknown content: OpenNord treats both as read-only.
    // Samples NWS v8/v11 (also `nwi` entries).
    id: 'wave', name: 'Nord Wave', generation: 'OG', programTag: 'nwp', sampleCodec: 'og',
    staticProductId: 0x0005, os: { min: 200, recommended: 214 }, fileTransferVersion: 4,
    partitions: firmwareOrder(
      P('samplib', 'Sample Library', false), // NSM: `nwi` files
      P('program', 'Programs', false, 'nwp'),
      P('swave', 'Synth Waves', true, 'nws'), // tags from NSM 9.22 `CWave`
      P('ramfs', 'RAM file system', true, 'nwr'),
      P('settings', 'Settings', false, 'nwsy'), // firmware name "System"
    ),
  },
  'c1': {
    // Nord C1 OS 1.12: no USB device descriptor, no FileTransfer code (byte
    // signature search finds none) and no transfer strings — the instrument
    // has no USB file transfer. NSM has no class for it either.
    id: 'c1', name: 'Nord C1', generation: 'OG', programTag: null, sampleCodec: null,
    deviceTransfer: false, partitions: [],
  },
  'c2': {
    // C2 OS 2.00: FileTransfer version 4 (frames 3..4), no session lock. Its
    // own program tag is `ncpg` (NSM's CC2 tag set ncb/ncpg/ncli/ncsy), not the
    // C2D's `nc2p`. Unlike the C2D it registers a Live partition. Pipe (index
    // 1) is read-only for OpenNord, as on the C2D.
    id: 'c2', name: 'Nord C2', generation: 'OG', programTag: 'ncpg', sampleCodec: null,
    staticProductId: 0x0009, os: { min: 100, recommended: 200 }, fileTransferVersion: 4,
    partitions: firmwareOrder(
      P('pipe-native', 'Pipe Organ (factory)', true), // firmware name "Pipe (Native)"
      P('pipe', 'Pipe Organ', true),
      P('program', 'Programs', false, 'ncpg'), // 1 × 126
      P('live', 'Live', false, 'ncli'), // 1 × 2; tags from NSM 9.22 `CC2`
      P('settings', 'Settings', false, 'ncsy'), // firmware name "System"
    ),
  },
  'c2d': {
    // C2D OS 1.12: registration; base ctor(…,4), frames
    // 3..4, no session lock (begin). Only 4 partitions — no Live
    // (NSM's CC2D lists 5). Pipe (index 1) is NSM's "Pipe" ROMFlash: OpenNord
    // treats it as read-only. The Pipe loader takes an embedded
    // CNSP at 0x440 only.
    id: 'c2d', name: 'Nord C2D', generation: 'OG', programTag: 'nc2p', sampleCodec: null,
    staticProductId: 0x000c, os: { min: 100, recommended: 112 }, fileTransferVersion: 4,
    partitions: firmwareOrder(
      P('pipe-native', 'Pipe Organ (factory)', true),
      P('pipe', 'Pipe Organ', true),
      P('program', 'Programs', false, 'nc2p'),
      P('settings', 'Settings', false, 'nc2s'), // firmware name "System"; tag from NSM 9.22 `CC2D`
    ),
  },

  // ── ARM, Stage 3 / Stage 4 generation. Firmware registration order from the
  //    instrument's OS (the maintainers’ notes, 2026-10-10/11). FileTransfer
  //    10 (frames 3..10) unless noted. Every index is `staticIndex`.
  'electro-6': {
    // Electro 6 OS 2.66: registration (array);
    // FileTransfer(…,1,10), frames 3..10; Stage 3
    // begin handler (18). No Pedal partitions (their constructors
    // are never called), no Set List: `ne6t` is Settings. Program is 4, not
    // NSM's 6. Samples: Stage 3 version map → `.nsmp3` (medium).
    id: 'electro-6', name: 'Nord Electro 6', generation: 'NW1-v3', programTag: 'ne6p', sampleCodec: 'codec3',
    staticProductId: 0x0029, os: { min: 250, recommended: 250 }, fileTransferVersion: 10,
    partitions: firmwareOrder(
      P('piano-native', 'Piano (factory)', true),
      P('piano', 'Piano', false),
      P('samplib-native', 'Sample Library (factory)', true),
      P('samplib', 'Sample Library', false),
      P('program', 'Programs', false, 'ne6p'),
      P('live', 'Live', false, 'ne6l'),
      P('settings', 'Settings', false, 'ne6t'),
    ),
  },
  'electro-7': {
    // Electro 7 OS 1.30: registration (array);
    // transfer object version 10, frames 3..10. 10 partitions,
    // nothing past 9: NSM's extra Native/Raw partitions and its Song partition
    // `ne7s` (NSM 9.22 `CElectro7`: 'Song', with a `ne7sbundle`; the firmware's
    // archive code knows the tag) are not on the wire.
    // Stage 4 registry generation (medium). PID 0x3B from NSM 9.22 `CElectro7`
    // (the firmware fills its descriptor PID at runtime). Pianos: CNSP v5/v6.
    // Sample generation not located: a {8,11,30,40} version map exists
    //, so `codec4` is a guess (low).
    id: 'electro-7', name: 'Nord Electro 7', generation: 'NW1-v4', programTag: 'ne7p', sampleCodec: 'codec4',
    staticProductId: 0x003b, os: { min: 100, recommended: 100 }, fileTransferVersion: 10,
    partitions: firmwareOrder(
      P('piano-native', 'Piano (factory)', true),
      P('piano', 'Piano', false),
      P('pedal-native', 'Pedal (factory)', true),
      P('pedal', 'Piano Pedal', false),
      P('samplib-native', 'Sample Library (factory)', true),
      P('samplib', 'Sample Library', false),
      P('program', 'Programs', false, 'ne7p'),
      P('live', 'Live', false, 'ne7l'),
      P('settings', 'Settings', false, 'ne7t'),
      P('synth-preset', 'Synth Presets', false, 'ne7r'),
    ),
  },
  'organ-3': {
    // Organ 3 OS 1.00: registration; transfer object version 10,
    // frames 3..10. Only 3 partitions, Program at 0 — no Native or
    // "Pipe" ROMFlash partitions (NSM's COrgan3 had Program at 2). Stage 4
    // registry generation, so NW1-v4 (medium).
    id: 'organ-3', name: 'Nord Organ 3', generation: 'NW1-v4', programTag: 'no3p', sampleCodec: null,
    staticProductId: 0x003a, os: { min: 100, recommended: 112 }, fileTransferVersion: 10,
    partitions: firmwareOrder(
      P('program', 'Programs', false, 'no3p'),
      P('live', 'Live', false, 'no3l'),
      P('settings', 'Settings', false, 'no3t'),
    ),
  },
  'wave-2': {
    // Wave 2 OS 1.24: registered inside; transfer object version
    // 10, frames 3..10. 5 partitions: no "E2P FFS" and no
    // "Transient" partition (NSM's Wave 2 list has both).
    // Program 2 agrees with NSM; the Program partition also lists `nlxp`.
    // Backup extension `nw2b`. Samples: generation check not located (NSM
    // treats Wave 2 as `nsmp3`; low).
    id: 'wave-2', name: 'Nord Wave 2', generation: 'NW1-v3', programTag: 'nw2p', sampleCodec: 'codec3',
    staticProductId: 0x002c, os: { min: 80, recommended: 100 }, fileTransferVersion: 10,
    partitions: firmwareOrder(
      P('samplib-native', 'Sample Library (factory)', true),
      P('samplib', 'Sample Library', false),
      P('program', 'Programs', false, 'nw2p'),
      P('live', 'Live', false, 'nw2l'),
      P('settings', 'Settings', false, 'nw2s'),
    ),
  },
  // Pianos: 9 partitions each (armPianoLine). Piano manager generation 5, 120
  // slots; CNSP v5 and v6 load on all five.
  'piano-4': {
    // Piano 4 OS 2.66: registration;(…,0,10), frames
    // 3..10; Stage 3 begin. Samples: `.nsmp3` only
    // (generation-3 check,).
    id: 'piano-4', name: 'Nord Piano 4', generation: 'NW1-v3', programTag: 'np4p', sampleCodec: 'codec3',
    staticProductId: 0x002a, os: { min: 250, recommended: 250 }, fileTransferVersion: 10,
    partitions: armPianoLine('np4p', 'np4l', 'np4t'),
  },
  'piano-5': {
    // Piano 5 OS 1.34: registration; FileTransfer 10/0, frames
    // 3..10. Samples: `.nsmp3` and `.nsmp4` (generation 3–4 check
    //) — the newest, codec4, is recorded.
    id: 'piano-5', name: 'Nord Piano 5', generation: 'NW1-v4', programTag: 'np5p', sampleCodec: 'codec4',
    staticProductId: 0x002d, os: { min: 100, recommended: 100 }, fileTransferVersion: 10,
    partitions: armPianoLine('np5p', 'np5l', 'np5t'),
  },
  'piano-6': {
    // Piano 6 OS 1.20: registration; FileTransfer 10/0, frames
    // 3..10; Stage 4 begin. `np6t` is Settings, not a
    // Set List. Samples: `.nsmp3` and `.nsmp4` — codec4 recorded.
    id: 'piano-6', name: 'Nord Piano 6', generation: 'NW1-v4', programTag: 'np6p', sampleCodec: 'codec4',
    staticProductId: 0x0039, os: { min: 100, recommended: 100 }, fileTransferVersion: 10,
    partitions: armPianoLine('np6p', 'np6l', 'np6t'),
  },
  'lead-4': {
    // Lead 4 OS 1.32: registration (a plain counter,).
    // FileTransfer service ctor (1, 8); frames 3..8 —
    // a version-10 frame is dropped. Stage-style begin, lock → 18.
    // NSM lists Performance first;
    // the firmware registers Program (`nl4s`) first. NSM's `CLead4_FTv7`
    // suggests OS ≤ 1.12 spoke version 7 (no old image read).
    id: 'lead-4', name: 'Nord Lead 4', generation: 'OG', programTag: 'nl4p', sampleCodec: null,
    staticProductId: 0x0024, os: { min: 100, recommended: 130 }, fileTransferVersion: 8,
    partitions: leadLine('nl4s', 'nl4p', 'nl4t'),
  },
  'lead-a1': {
    // Lead A1 OS 1.36: same code as the Lead 4 — registration,
    // service ctor (1, 8), frames 3..8, begin
    //. FileTransfer is present: SysEx is an additional path, not
    // the only one. PID 0x25: NSM 9.22's `CMini` class is the "Nord Lead A1"
    // (product name and its nlab / nlap / nlas / nlat tags, CMini).
    id: 'lead-a1', name: 'Nord Lead A1', generation: 'OG', programTag: 'nlap', sampleCodec: null,
    staticProductId: 0x0025, fileTransferVersion: 8,
    partitions: leadLine('nlas', 'nlap', 'nlat'),
  },
  'grand': {
    // Grand OS 1.68: registration; FileTransfer 10/0
    //, frames 3..10. Samples: `.nsmp3` only
    // (generation-3 check,).
    id: 'grand', name: 'Nord Grand', generation: 'NW1-v3', programTag: 'ngp', sampleCodec: 'codec3',
    staticProductId: 0x002b, os: { min: 150, recommended: 150 }, fileTransferVersion: 10,
    partitions: armPianoLine('ngp', 'ngl', 'ngs'),
  },
  'grand-2': {
    // Grand 2 OS 1.22: registration; FileTransfer 10/0, frames
    // 3..10. `ng2t` is Settings, not a Set List. Samples: `.nsmp3`
    // and `.nsmp4` — codec4 recorded.
    id: 'grand-2', name: 'Nord Grand 2', generation: 'NW1-v4', programTag: 'ng2p', sampleCodec: 'codec4',
    staticProductId: 0x0038, os: { min: 100, recommended: 100 }, fileTransferVersion: 10,
    partitions: armPianoLine('ng2p', 'ng2l', 'ng2t'),
  },
};

export const ALL_MODELS: ModelInfo[] = Object.values(MODELS);

export function modelById(id: NordModelId): ModelInfo | undefined {
  return MODELS[id];
}

/**
 * First registry model whose `programTag` equals `tag`. Tags can be shared across
 * models (e.g. `ns2p` = Stage 2 & Stage 2 EX, `nc2p` = C2 & C2D), so this returns the
 * canonical/anchor model for the tag. The single source of truth for tag → model.
 */
export function modelByTag(tag: string | undefined): ModelInfo | undefined {
  if (!tag) return undefined;
  return ALL_MODELS.find((m) => m.programTag === tag);
}

/** Model for a USB product id, or undefined if that PID isn't hardware-confirmed. */
export function modelByProductId(productId: number | undefined): ModelInfo | undefined {
  if (productId === undefined) return undefined;
  return ALL_MODELS.find((m) => m.productId === productId);
}

/**
 * Best-known model for a USB product id: a hardware-confirmed match first, else
 * the NSM-recovered `staticProductId`. For identifying a connected device (naming
 * it, checking its OS, and choosing the program tag + partition guess the
 * read-only connect probe checks). It never grants a write on its own: a model
 * found only this way connects read-only unless the probe confirms its Program
 * partition (`resolveDeviceAccess`, device/connect-probe.ts). Shared PIDs
 * resolve to the anchor model (0x21 → Stage 2; NSM builds Stage 2 EX from the
 * same `CStage2` class).
 */
export function identifyModelByProductId(productId: number | undefined): ModelInfo | undefined {
  if (productId === undefined) return undefined;
  return modelByProductId(productId) ?? ALL_MODELS.find((m) => m.staticProductId === productId);
}

/**
 * The protocol partition index of a model's user Programs, or undefined when the
 * model's partition layout isn't hardware-confirmed (index left unset). Callers
 * needing a value should fall back deliberately (see `resolveModelProgramPartition`),
 * never silently assume the Stage-4 index.
 */
export function programPartitionIndex(model: ModelInfo | undefined): number | undefined {
  return model?.partitions.find((p) => p.kind === 'program')?.index;
}

/**
 * The statically-recovered program partition index (firmware registration
 * order, else NSM's partition list; not yet hardware-validated), or undefined when
 * no static evidence exists. Below `programPartitionIndex` in trust — see
 * `PartitionSpec.staticIndex`.
 */
export function programPartitionStaticIndex(model: ModelInfo | undefined): number | undefined {
  return model?.partitions.find((p) => p.kind === 'program')?.staticIndex;
}
