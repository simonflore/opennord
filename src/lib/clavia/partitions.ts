/**
 * Full-line Nord partition registry — data only, behind the `clavia` model seam.
 * Each model's memory is a list of partitions (the FileTransfer protocol addresses
 * them by index); this records the kind/label/fourcc per partition, recovered from
 * the NSM binary (docs/NORD-PRODUCT-LINE.md). Stage 4 indices are hardware-validated
 * (docs/PROTOCOL-RE.md); others carry the statically-recovered set (index omitted
 * until a hardware CQryPartList confirms order).
 *
 * `NordModelId` is a superset of clavia/model.ts `ClaviaModel` (which stays the
 * decode-capable subset) — this file never imports concrete codecs.
 */

export type NordModelId =
  | 'stage-classic' | 'stage-ex' | 'stage-2' | 'stage-3' | 'stage-4'
  | 'electro-3' | 'electro-3-hp' | 'electro-4' | 'electro-5' | 'electro-6'
  | 'piano-1' | 'piano-2' | 'piano-3' | 'piano-4' | 'piano-5' | 'piano-6'
  | 'lead-4' | 'lead-a1' | 'wave' | 'wave-2' | 'c2' | 'c2d'
  | 'grand' | 'grand-2' | 'organ-3';

export type PartitionKind =
  | 'ffs' | 'piano-native' | 'pedal-native' | 'samplib-native'
  | 'piano' | 'pedal' | 'samplib'
  | 'program' | 'live' | 'synth-preset' | 'organ-preset' | 'piano-preset'
  | 'setlist' | 'settings';

export interface PartitionSpec {
  kind: PartitionKind;
  label: string;    // musician-facing
  native: boolean;  // read-only factory content
  fourcc?: string;
  index?: number;   // protocol index — set only when hardware-confirmed
}

export type SampleCodec = 'og' | 'codec3' | 'codec4' | null;

export interface ModelInfo {
  id: NordModelId;
  name: string;
  generation: 'OG' | 'NW1-v3' | 'NW1-v4';
  programTag: string | null;
  sampleCodec: SampleCodec;
  partitions: PartitionSpec[]; // ordered Native → user
}

const P = (kind: PartitionKind, label: string, native: boolean, fourcc?: string, index?: number): PartitionSpec =>
  ({ kind, label, native, fourcc, index });

/** Baseline for models whose full partition order wasn't disassembled — concrete
 *  and refinable as hardware/Ghidra confirms (docs/NORD-PRODUCT-LINE.md). */
const baseline = (tag: string, sampleCapable: boolean): PartitionSpec[] => [
  ...(sampleCapable ? [P('samplib-native', 'Sample Library (factory)', true)] : []),
  P('program', 'Programs', false, tag),
  P('live', 'Live', false),
  P('settings', 'Settings', false),
];

export const MODELS: Record<NordModelId, ModelInfo> = {
  'stage-4': {
    id: 'stage-4', name: 'Nord Stage 4', generation: 'NW1-v4', programTag: 'ns4p', sampleCodec: 'codec4',
    partitions: [ // PROTOCOL-RE.md — hardware-validated indices
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
      P('settings', 'Settings', false, undefined, 11),
    ],
  },
  'stage-3': {
    id: 'stage-3', name: 'Nord Stage 3', generation: 'NW1-v3', programTag: 'ns3f', sampleCodec: 'codec3',
    partitions: [
      P('piano-native', 'Piano (factory)', true),
      P('pedal-native', 'Pedal (factory)', true),
      P('samplib-native', 'Sample Library (factory)', true),
      P('program', 'Programs', false, 'ns3f'),
      P('synth-preset', 'Synth Presets', false, 'ns3y'),
      P('live', 'Live', false, 'ns3l'),
      P('setlist', 'Set Lists', false, 'ns3t'),
      P('settings', 'Settings', false),
    ],
  },
  'stage-2': {
    id: 'stage-2', name: 'Nord Stage 2', generation: 'OG', programTag: 'ns2p', sampleCodec: 'og',
    partitions: [
      P('piano-native', 'Piano (factory)', true),
      P('samplib-native', 'Sample Library (factory)', true),
      P('program', 'Programs', false, 'ns2p'),
      P('synth-preset', 'Synth Presets', false, 'ns2y'),
      P('live', 'Live', false, 'ns2l'),
      P('settings', 'Settings', false),
    ],
  },
  'electro-4': {
    id: 'electro-4', name: 'Nord Electro 4', generation: 'OG', programTag: 'ne4p', sampleCodec: 'og',
    partitions: [
      P('piano-native', 'Piano (factory)', true),
      P('samplib-native', 'Sample Library (factory)', true),
      P('program', 'Programs', false, 'ne4p'),
      P('live', 'Live', false, 'ne4l'),
      P('settings', 'Settings', false),
    ],
  },
  'electro-6': {
    id: 'electro-6', name: 'Nord Electro 6', generation: 'NW1-v3', programTag: 'ne6p', sampleCodec: 'codec3',
    partitions: [
      P('piano-native', 'Piano (factory)', true),
      P('pedal-native', 'Pedal (factory)', true),
      P('samplib-native', 'Sample Library (factory)', true),
      P('program', 'Programs', false, 'ne6p'),
      P('live', 'Live', false, 'ne6l'),
      P('setlist', 'Set Lists', false, 'ne6t'),
      P('settings', 'Settings', false),
    ],
  },
  'piano-3': {
    id: 'piano-3', name: 'Nord Piano 3', generation: 'NW1-v3', programTag: 'np3p', sampleCodec: 'codec3',
    partitions: [
      P('piano-native', 'Piano (factory)', true),
      P('pedal-native', 'Piano Pedal (factory)', true),
      P('samplib-native', 'Sample Library (factory)', true),
      P('program', 'Programs', false, 'np3p'),
      P('live', 'Live', false, 'np3l'),
      P('settings', 'Settings', false),
    ],
  },
  'piano-6': {
    id: 'piano-6', name: 'Nord Piano 6', generation: 'NW1-v4', programTag: 'np6p', sampleCodec: 'codec4',
    partitions: [
      P('piano-native', 'Piano (factory)', true),
      P('pedal-native', 'Pedal (factory)', true),
      P('samplib-native', 'Sample Library (factory)', true),
      P('program', 'Programs', false, 'np6p'),
      P('live', 'Live', false, 'np6l'),
      P('setlist', 'Set Lists', false, 'np6t'),
      P('settings', 'Settings', false),
    ],
  },
  'grand-2': {
    id: 'grand-2', name: 'Nord Grand 2', generation: 'NW1-v4', programTag: 'ng2p', sampleCodec: 'codec4',
    partitions: [
      P('piano-native', 'Piano (factory)', true),
      P('pedal-native', 'Pedal (factory)', true),
      P('samplib-native', 'Sample Library (factory)', true),
      P('program', 'Programs', false, 'ng2p'),
      P('live', 'Live', false, 'ng2l'),
      P('setlist', 'Set Lists', false, 'ng2t'),
      P('settings', 'Settings', false),
    ],
  },
  'wave-2': {
    // CWave2::CWave2 @0x100033a7c — constructor Add() order:
    //   SPartitionNative "Samp Lib (Native)"         → samplib-native (factory)
    //   SPartitionSampLibV3                          → samplib (user)
    //   (conditional SPartitionROMFlash "Transient"  → OG-mode only, NW1-v3 devices skip)
    //   SPartitionUserE2P "Program" (tag "nw2p")     → program
    //   SPartitionLive    (tag "nw2l")               → live
    //   SPartitionSettings "Settings" (tag "nw2s")   → settings  (NOT synth-preset)
    //   SPartitionNative "E2P FFS"                   → ffs (native, housekeeping partition)
    //
    // Backup extension: "nw2b" (from wxString::wxString(...,"nw2b") in ctor).
    // Validated vs 26 real .nw2p fixtures; not HW-tested.
    id: 'wave-2', name: 'Nord Wave 2', generation: 'NW1-v3', programTag: 'nw2p', sampleCodec: 'codec3',
    partitions: [
      P('samplib-native', 'Sample Library (factory)', true),
      P('samplib',        'Sample Library',           false),
      P('program',        'Programs',                 false, 'nw2p'),
      P('live',           'Live',                     false, 'nw2l'),
      P('settings',       'Settings',                 false, 'nw2s'),
      P('ffs',            'E2P FFS',                  true),
    ],
  },
  // Remaining models — baseline layout from their fourcc family (NORD-PRODUCT-LINE.md).
  'stage-classic': { id: 'stage-classic', name: 'Nord Stage Classic', generation: 'OG', programTag: 'nsp', sampleCodec: null, partitions: baseline('nsp', false) },
  'stage-ex': { id: 'stage-ex', name: 'Nord Stage EX', generation: 'OG', programTag: 'ns2p', sampleCodec: 'og', partitions: baseline('ns2p', true) },
  'electro-3': { id: 'electro-3', name: 'Nord Electro 3', generation: 'OG', programTag: 'nepg', sampleCodec: 'og', partitions: baseline('nepg', true) },
  'electro-3-hp': { id: 'electro-3-hp', name: 'Nord Electro 3 HP', generation: 'OG', programTag: 'nepg', sampleCodec: 'og', partitions: baseline('nepg', true) },
  'electro-5': {
    // CElectro5::CElectro5 @0x0000000100194838 — partition Add() order in constructor:
    //   SPartitionNative "Piano (Native)"  →  piano-native (factory)
    //   SPartitionPianoV5/V6              →  piano (user; V5 if firmware < 0x91, else V6)
    //   SPartitionNative "Samp Lib (Native)" → samplib-native (factory)
    //   SPartitionSampLibV2               →  samplib (user)
    //   SPartitionProgram  "ne5p"         →  program
    //   SPartitionUserE2P  "ne5t"         →  setlist (label="Set List", type="song")
    //   SPartitionLive     "ne5l"         →  live
    //   SPartitionSettings "ne5s"         →  settings
    //
    // Note: `generation: 'NW1-v3'` refers to the SAMPLE codec generation (codec3 / .nsmp).
    // The Electro 5 program file uses a legacy `formatType 0` CBIN header — confirmed from
    // fixtures — not the NW1-v4 formatType used by Stage 4/Piano 6/Grand 2.
    id: 'electro-5', name: 'Nord Electro 5', generation: 'NW1-v3', programTag: 'ne5p', sampleCodec: 'codec3',
    partitions: [
      P('piano-native', 'Piano (factory)', true),
      P('piano', 'Piano', false),
      P('samplib-native', 'Sample Library (factory)', true),
      P('samplib', 'Sample Library', false),
      P('program', 'Programs', false, 'ne5p'),
      P('setlist', 'Set Lists', false, 'ne5t'),
      P('live', 'Live', false, 'ne5l'),
      P('settings', 'Settings', false, 'ne5s'),
    ],
  },
  'piano-1': { id: 'piano-1', name: 'Nord Piano', generation: 'OG', programTag: 'nppg', sampleCodec: 'og', partitions: baseline('nppg', true) },
  'piano-2': { id: 'piano-2', name: 'Nord Piano 2', generation: 'OG', programTag: 'np2p', sampleCodec: 'og', partitions: baseline('np2p', true) },
  'piano-4': { id: 'piano-4', name: 'Nord Piano 4', generation: 'NW1-v3', programTag: 'np4p', sampleCodec: 'codec3', partitions: baseline('np4p', true) },
  'piano-5': { id: 'piano-5', name: 'Nord Piano 5', generation: 'NW1-v4', programTag: 'np5p', sampleCodec: 'codec4', partitions: baseline('np5p', true) },
  'lead-4': {
    // CLead4Base::CLead4Base @0x00000001000dd364 — constructor Add() order:
    //   SPartitionUserE2P  "Performance" (CFileSpec from CFileType(this+0x118)="nl4p") → program
    //   SPartitionProgram  (CFileSpec from CFileType "nl4s")                           → synth-preset
    //   SPartitionSettings "Settings"   (CFileSpec from CFileType "nl4t")              → settings
    // No piano, no samples, no live, no setlist — purely synth: program + preset + settings.
    id: 'lead-4', name: 'Nord Lead 4', generation: 'OG', programTag: 'nl4p', sampleCodec: null,
    partitions: [
      P('program',      'Performances', false, 'nl4p'),
      P('synth-preset', 'Programs',     false, 'nl4s'),
      P('settings',     'Settings',     false, 'nl4t'),
    ],
  },
  'lead-a1': { id: 'lead-a1', name: 'Nord Lead A1', generation: 'OG', programTag: 'nlap', sampleCodec: null, partitions: baseline('nlap', false) },
  'wave': { id: 'wave', name: 'Nord Wave', generation: 'OG', programTag: 'nwp', sampleCodec: 'og', partitions: baseline('nwp', true) },
  'c2': { id: 'c2', name: 'Nord C2', generation: 'OG', programTag: 'nc2p', sampleCodec: null, partitions: baseline('nc2p', false) },
  'c2d': { id: 'c2d', name: 'Nord C2D', generation: 'OG', programTag: 'nc2p', sampleCodec: null, partitions: baseline('nc2p', false) },
  'grand': { id: 'grand', name: 'Nord Grand', generation: 'NW1-v3', programTag: 'ngp', sampleCodec: 'codec3', partitions: baseline('ngp', true) },
  'organ-3': { id: 'organ-3', name: 'Nord Organ 3', generation: 'OG', programTag: 'no3p', sampleCodec: null, partitions: baseline('no3p', false) },
};

export const ALL_MODELS: ModelInfo[] = Object.values(MODELS);

export function modelById(id: NordModelId): ModelInfo | undefined {
  return MODELS[id];
}

/**
 * First registry model whose `programTag` equals `tag`. Tags can be shared across
 * models (e.g. `ns2p` = Stage 2 & Stage EX, `nc2p` = C2 & C2D), so this returns the
 * canonical/anchor model for the tag. The single source of truth for tag → model.
 */
export function modelByTag(tag: string | undefined): ModelInfo | undefined {
  if (!tag) return undefined;
  return ALL_MODELS.find((m) => m.programTag === tag);
}
