/**
 * Nord Stage 3 (`.ns3f`) program decoder — Tier 2 of multi-model support (#22).
 *
 * NS3 stores a flat, bit-packed body with two panels (A then B); a panel-enable
 * flag at 0x31 says which are active, and Panel B's fields repeat Panel A's
 * shifted by `PANEL_STRIDE`. All offsets/masks below are transcribed **from
 * ns3-program-viewer's source** (the oracle named in docs/MULTI-MODEL.md) —
 * `src/server/ns3/program/ns3-{panel,piano,organ,synth,synth-filter}.js` — and
 * cross-checked against real `.ns3f` files. Credit: Chris55 (ATTRIBUTION.md).
 *
 * v1 decodes the headline per-panel state — which engines are on, and each one's
 * model/type. Fuller parameter decode (drawbars, levels, FX) is incremental.
 */
const PANEL_STRIDE = 263; // Panel B = Panel A + 0x107

// Type tables — identical to ns3-program-viewer's ns3-mapping.js maps.
const PIANO_TYPE = ['Grand', 'Upright', 'Electric', 'Clav', 'Digital', 'Misc'];
const ORGAN_TYPE = ['B3', 'Vox', 'Farfisa', 'Pipe1', 'Pipe2'];
const SYNTH_OSC = ['Classic', 'Wave', 'Formant', 'Super', 'Sample'];
const SYNTH_FILTER = ['LP12', 'LP24', 'Mini Moog', 'LP+HP', 'BP24', 'HP24'];
const REVERB_TYPE = ['Room 1', 'Room 2', 'Stage 1', 'Stage 2', 'Hall 1', 'Hall 2'];
const EFFECT1_TYPE = ['Panning', 'Tremolo', 'Ring Mod', 'Wah-Wah', 'Auto-Wah 1', 'Auto-Wah 2'];
const EFFECT2_TYPE = ['Phaser 1', 'Phaser 2', 'Flanger', 'Vibe', 'Chorus 1', 'Chorus 2'];
const VIB_CHORUS = ['V1', 'C1', 'V2', 'C2', 'V3', 'C3'];

import { NORD_DB } from './volume';
import { NS3_FILTER_FREQ } from './filter-freq';

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;
const u16 = (b: Uint8Array, o: number): number => ((b[o] ?? 0) << 8) | (b[o + 1] ?? 0);
// 64-bit big-endian read as BigInt — sampleId hashes span a 64-bit field.
const u64 = (b: Uint8Array, o: number): bigint => {
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[o + i] ?? 0);
  return v;
};
const lut = (table: readonly string[], v: number): string => table[v] ?? `#${v}`;
// Engine volume shares the enable word: bits 10-4 are the 7-bit level → dB.
const vol = (b: Uint8Array, o: number): string => NORD_DB[(u16(b, o) & 0x07f0) >>> 4] ?? '?';

export interface Ns3Fx { name: string; type?: string }

/**
 * The 9 organ drawbar positions (0-8) of preset 1. Each is a 3-4 bit field at a
 * fixed offset from the drawbar base (0xBE on panel A) — masks per ns3-organ.js
 * `getDrawbars`. (B3 reads them straight; Vox/Farfisa relabel for display.)
 */
function readDrawbars(b: Uint8Array, base: number): number[] {
  const o = base + 0xbe;
  return [
    (u8(b, o) & 0xf0) >>> 4,         // 0xBE
    (u8(b, o + 2) & 0x1e) >>> 1,     // 0xC0
    (u16(b, o + 4) & 0x03c0) >>> 6,  // 0xC2
    (u8(b, o + 7) & 0x78) >>> 3,     // 0xC5
    u8(b, o + 9) & 0x0f,             // 0xC7
    (u16(b, o + 11) & 0x01e0) >>> 5, // 0xC9
    (u8(b, o + 14) & 0x3c) >>> 2,    // 0xCC
    (u16(b, o + 16) & 0x0780) >>> 7, // 0xCE
    (u8(b, o + 19) & 0xf0) >>> 4,    // 0xD1
  ];
}

export interface Ns3Panel {
  id: 'A' | 'B';
  organ: {
    on: boolean; type: string; volume: string; drawbars: number[];
    /** Vibrato/Chorus (B3): on + mode (V1/C1/V2/…). */
    vibChorus: { on: boolean; mode: string };
    /** Percussion (B3): on + 3rd-harmonic / fast-decay / soft-volume flags. */
    percussion: { on: boolean; third: boolean; fast: boolean; soft: boolean };
  };
  piano: {
    on: boolean; type: string; volume: string;
    /** Factory sample reference: 32-bit hash + clavinet/harpsichord variant. Resolve via library/service. */
    sampleId: number; sampleVariation: number;
  };
  synth: {
    on: boolean; osc: string; filter: string; cutoff: string; volume: string;
    /** Factory sample reference (only meaningful when osc === 'Sample'). */
    sampleId: number;
  };
  /** Effects switched on in this panel, in signal order. */
  fx: Ns3Fx[];
}

/** The effects this panel has switched on, with type where the effect has one. */
function readFx(b: Uint8Array, base: number): Ns3Fx[] {
  const fx: Ns3Fx[] = [];
  if ((u8(b, base + 0x10b) & 0x10) !== 0) fx.push({ name: 'Effect 1', type: lut(EFFECT1_TYPE, (u16(b, base + 0x10b) & 0x0380) >>> 7) });
  if ((u8(b, base + 0x114) & 0x80) !== 0) fx.push({ name: 'Effect 2', type: lut(EFFECT2_TYPE, (u8(b, base + 0x114) & 0x1c) >>> 2) });
  if ((u8(b, base + 0x129) & 0x04) !== 0) fx.push({ name: 'Amp/EQ' });
  if ((u8(b, base + 0x139) & 0x20) !== 0) fx.push({ name: 'Comp' });
  if ((u8(b, base + 0x119) & 0x08) !== 0) fx.push({ name: 'Delay' });
  if ((u8(b, base + 0x134) & 0x02) !== 0) fx.push({ name: 'Reverb', type: lut(REVERB_TYPE, (u16(b, base + 0x134) & 0x01c0) >>> 6) });
  return fx;
}

export interface Ns3Program {
  /** The active panels (A and/or B), per the 0x31 panel-enable flag. */
  panels: Ns3Panel[];
}

function readPanel(b: Uint8Array, id: 'A' | 'B', base: number): Ns3Panel {
  return {
    id,
    // piano enable @0x43.b7; type @0x48.b5-3; volume @0x43; sampleId = u64@0x49 bits 59-28; variation @0x49.b5-4
    piano: {
      on: (u16(b, base + 0x43) & 0x8000) !== 0,
      type: lut(PIANO_TYPE, (u8(b, base + 0x48) & 0x38) >>> 3),
      volume: vol(b, base + 0x43),
      sampleId: Number((u64(b, base + 0x49) & 0x0ffffffff0000000n) >> 28n),
      sampleVariation: (u8(b, base + 0x49) & 0x30) >>> 4,
    },
    // organ enable @0xB6.b7; type @0xBB.b6-4; volume @0xB6
    organ: {
      on: (u16(b, base + 0xb6) & 0x8000) !== 0,
      type: lut(ORGAN_TYPE, (u8(b, base + 0xbb) & 0x70) >>> 4),
      volume: vol(b, base + 0xb6),
      drawbars: readDrawbars(b, base),
      // Vib/Chorus mode @0x34.b3-1, on @0xD3.b4; percussion on/flags @0xD3.b3-0.
      // We read preset 1 (the active one when preset 2 @0xBB.b2 is off — the common
      // case). Preset 2's block (0xEE) isn't surfaced yet. TODO when a file needs it.
      vibChorus: { on: (u8(b, base + 0xd3) & 0x10) !== 0, mode: lut(VIB_CHORUS, (u8(b, base + 0x34) & 0x0e) >>> 1) },
      percussion: {
        on: (u8(b, base + 0xd3) & 0x08) !== 0,
        third: (u8(b, base + 0xd3) & 0x04) !== 0,
        fast: (u8(b, base + 0xd3) & 0x02) !== 0,
        soft: (u8(b, base + 0xd3) & 0x01) !== 0,
      },
    },
    // synth enable @0x52.b7; osc type @0x8D.b1-0+0x8E.b7; filter type @0x98.b4-2; volume @0x52
    synth: {
      on: (u16(b, base + 0x52) & 0x8000) !== 0,
      osc: lut(SYNTH_OSC, (u16(b, base + 0x8d) & 0x0380) >>> 7),
      filter: lut(SYNTH_FILTER, (u8(b, base + 0x98) & 0x1c) >>> 2),
      // cutoff frequency @0x98.b1-0 + 0x99.b7-3 (7-bit) → Hz
      cutoff: lut(NS3_FILTER_FREQ, (u16(b, base + 0x98) & 0x03f8) >>> 3),
      volume: vol(b, base + 0x52),
      // sample-osc id = u64@0xA5 bits 38-3 (used when osc === 'Sample')
      sampleId: Number((u64(b, base + 0xa5) & 0x07fffffff8n) >> 3n),
    },
    fx: readFx(b, base),
  };
}

/** Decode a Stage 3 `.ns3f` into its active panel(s). */
export function decodeNs3(bytes: Uint8Array): Ns3Program {
  // versionOffset shifts the whole map for pre-NSM (header type 0) exports; the
  // common NSM-era files (our .ns3f, format-type 1) use 0. (-20 for older — TODO.)
  const versionOffset = 0;
  // 0x31 bits 6-5: 0 = panel A only, 1 = panel B only, 2 = both.
  const flag = (u8(bytes, 0x31 + versionOffset) & 0x60) >>> 5;
  const panels: Ns3Panel[] = [];
  if (flag === 0 || flag === 2) panels.push(readPanel(bytes, 'A', 0 * PANEL_STRIDE + versionOffset));
  if (flag === 1 || flag === 2) panels.push(readPanel(bytes, 'B', 1 * PANEL_STRIDE + versionOffset));
  return { panels };
}
