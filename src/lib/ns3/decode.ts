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

const u8 = (b: Uint8Array, o: number): number => b[o] ?? 0;
const u16 = (b: Uint8Array, o: number): number => ((b[o] ?? 0) << 8) | (b[o + 1] ?? 0);
const lut = (table: string[], v: number): string => table[v] ?? `#${v}`;

export interface Ns3Panel {
  id: 'A' | 'B';
  organ: { on: boolean; type: string };
  piano: { on: boolean; type: string };
  synth: { on: boolean; osc: string; filter: string };
}

export interface Ns3Program {
  /** The active panels (A and/or B), per the 0x31 panel-enable flag. */
  panels: Ns3Panel[];
}

function readPanel(b: Uint8Array, id: 'A' | 'B', base: number): Ns3Panel {
  return {
    id,
    // piano enable @0x43.b7; type @0x48.b5-3
    piano: { on: (u16(b, base + 0x43) & 0x8000) !== 0, type: lut(PIANO_TYPE, (u8(b, base + 0x48) & 0x38) >>> 3) },
    // organ enable @0xB6.b7; type @0xBB.b6-4
    organ: { on: (u16(b, base + 0xb6) & 0x8000) !== 0, type: lut(ORGAN_TYPE, (u8(b, base + 0xbb) & 0x70) >>> 4) },
    // synth enable @0x52.b7; osc type @0x8D.b1-0+0x8E.b7; filter type @0x98.b4-2
    synth: {
      on: (u16(b, base + 0x52) & 0x8000) !== 0,
      osc: lut(SYNTH_OSC, (u16(b, base + 0x8d) & 0x0380) >>> 7),
      filter: lut(SYNTH_FILTER, (u8(b, base + 0x98) & 0x1c) >>> 2),
    },
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
