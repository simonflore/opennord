/**
 * Nord Stage 2 / 2EX (`.ns2p`) program decoder — Tier 2 of multi-model support (#22).
 *
 * NS2 stores two **slots** (A then B); slot B repeats slot A's fields shifted by
 * `SLOT_STRIDE` (the 0xf9 = 249 magic). A header-type byte at 0x04 distinguishes
 * the NSM-era layout (1) from the older **legacy** layout (anything else), which
 * lacks a 20-byte CRC block — so every body offset shifts back by `versionOffset`
 * (-20). All offsets/masks are transcribed **from ns3-program-viewer's source**
 * (the oracle in docs/MULTI-MODEL.md) — `src/server/ns2/program/ns2-{program,slot,
 * organ,piano,synth}.js` — and cross-checked against real `.ns2p` files.
 * Credit: Chris55 (ATTRIBUTION.md).
 *
 * v1 decodes the headline per-slot state — which slots are active, and each slot's
 * active engines + model/type. Fuller decode (levels, drawbars, FX, names) follows.
 */
const SLOT_STRIDE = 249; // slot B = slot A + 0xf9

// Type tables — identical to ns3-program-viewer's ns2-mapping.js maps.
const PIANO_TYPE = ['Grand', 'Upright', 'E Piano 1', 'E Piano 2', 'Clavinet', 'Harpsi'];
const ORGAN_TYPE = ['B3', 'Vox', 'Farfisa'];
const SYNTH_OSC = ['TRI', 'SAW', 'SQR', 'SAMPLE', 'FM', 'WAVE'];
const EFFECT1_TYPE = ['Panning', 'Tremolo', 'Ring Mod', 'Wah-Wah', 'Auto-Wah 1', 'Auto-Wah 2'];
const EFFECT2_TYPE = ['Phaser 1', 'Phaser 2', 'Flanger', 'Vibe', 'Chorus 1', 'Chorus 2'];
const AMP_TYPE = ['Off', 'Small', 'JC', 'Twin'];

import { NORD_DB } from '../clavia/volume';

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;
const u16 = (b: Uint8Array, o: number): number => ((b[o] ?? 0) << 8) | (b[o + 1] ?? 0);
const lut = (table: readonly string[], v: number): string => table[v] ?? `#${v}`;
// Engine volume: a 7-bit MIDI value through the shared Nord dB curve.
const db = (midi: number): string => NORD_DB[midi] ?? '?';

/**
 * Organ preset-1 drawbars (each 0-8) for B3/Vox, whose values are 4-bit fields
 * spread from base 0x5F — masks per ns2-organ.js `getDrawbars` (4-bit branch).
 * (Farfisa uses a 1-bit on/off encoding elsewhere; not read here.)
 */
function readDrawbars(b: Uint8Array, o: number): number[] {
  const d = o + 0x5f;
  return [
    (u16(b, d + 1) & 0x01e0) >>> 5,  // 0x60
    (u16(b, d + 3) & 0x003c) >>> 2,  // 0x62
    (u16(b, d + 6) & 0x0780) >>> 7,  // 0x65
    (u16(b, d + 8) & 0x00f0) >>> 4,  // 0x67
    (u16(b, d + 10) & 0x001e) >>> 1, // 0x69
    (u16(b, d + 13) & 0x03c0) >>> 6, // 0x6c
    (u16(b, d + 15) & 0x0078) >>> 3, // 0x6e
    u16(b, d + 17) & 0x000f,         // 0x70
    (u16(b, d + 20) & 0x01e0) >>> 5, // 0x73
  ];
}

export interface Ns2Fx { name: string; type?: string }

/** The per-slot effects switched on, with type where the effect has one. */
function readFx(b: Uint8Array, o: number): Ns2Fx[] {
  const fx: Ns2Fx[] = [];
  if ((u8(b, o + 0x10f) & 0x20) !== 0) fx.push({ name: 'Effect 1', type: lut(EFFECT1_TYPE, u8(b, o + 0x10f) & 0x07) });
  if ((u8(b, o + 0x11a) & 0x20) !== 0) fx.push({ name: 'Effect 2', type: lut(EFFECT2_TYPE, u8(b, o + 0x11a) & 0x07) });
  if ((u8(b, o + 0x133) & 0x10) !== 0) {
    const t = lut(AMP_TYPE, u8(b, o + 0x133) & 0x03);
    fx.push({ name: 'Amp/EQ', type: t !== 'Off' ? t : undefined });
  }
  if ((u8(b, o + 0x125) & 0x20) !== 0) fx.push({ name: 'Delay' });
  if ((u8(b, o + 0x3f) & 0x10) !== 0) fx.push({ name: 'Rotary' });
  return fx;
}

export interface Ns2Slot {
  id: 'A' | 'B';
  /** Slot plays in this program (per the 0x2E slot-enable flag). */
  active: boolean;
  organ: { on: boolean; type: string; volume: string; drawbars: number[] };
  piano: { on: boolean; type: string; volume: string };
  synth: { on: boolean; osc: string; volume: string };
  /** Per-slot effects switched on, in signal order. */
  fx: Ns2Fx[];
}

export interface Ns2Program {
  slots: Ns2Slot[];
}

function readSlot(b: Uint8Array, id: 'A' | 'B', vo: number, active: boolean): Ns2Slot {
  const o = (id === 'B' ? SLOT_STRIDE : 0) + vo; // slot base, incl. legacy shift
  return {
    id,
    active,
    // organ on @0x43.b7; type @0x34.b7-6 (B3/Vox/Farfisa); volume @0x46.b6-0
    organ: { on: (u8(b, o + 0x43) & 0x80) !== 0, type: lut(ORGAN_TYPE, (u8(b, o + 0x34) & 0xc0) >>> 6), volume: db(u8(b, o + 0x46) & 0x7f), drawbars: readDrawbars(b, o) },
    // piano on @0x48.b7; type @0xCD.b7-5; volume @0x4B.b6-0
    piano: { on: (u8(b, o + 0x48) & 0x80) !== 0, type: lut(PIANO_TYPE, (u8(b, o + 0xcd) & 0xe0) >>> 5), volume: db(u8(b, o + 0x4b) & 0x7f) },
    // synth on @0x4D.b6; osc type @0xE1.b9-7; volume @0x50.b13-7
    synth: { on: (u8(b, o + 0x4d) & 0x40) !== 0, osc: lut(SYNTH_OSC, (u16(b, o + 0xe1) & 0x0380) >>> 7), volume: db((u16(b, o + 0x50) & 0x3f80) >>> 7) },
    fx: readFx(b, o),
  };
}

/** Decode a Stage 2 `.ns2p` into its active slot(s). */
export function decodeNs2(bytes: Uint8Array): Ns2Program {
  // Header type @0x04: 1 = NSM-era layout, else legacy (missing the 0x18-0x2B block).
  const versionOffset = u8(bytes, 0x04) === 1 ? 0 : -20;
  // 0x2E b7-6: 0 = A only, 1 = B only, 2/3 = both (focus A/B); b5 = dual keyboard → both.
  const flag = (u8(bytes, 0x2e + versionOffset) & 0xc0) >>> 6;
  const dual = (u8(bytes, 0x2e + versionOffset) & 0x20) !== 0;
  const aActive = dual || flag !== 1;
  const bActive = dual || flag !== 0;

  const a = readSlot(bytes, 'A', versionOffset, aActive);
  const b = readSlot(bytes, 'B', versionOffset, bActive);
  // Organ type is a hardware-global (shared from slot A) — mirror the oracle.
  b.organ.type = a.organ.type;

  return { slots: [a, b].filter((s) => s.active) };
}
