/**
 * Nord Stage 4 parameter offset map.
 *
 * Ported from ns4decode's `ns4maps.py` by Randy (MIT — see THIRD_PARTY_LICENSES.md
 * and bits.ts). Each parameter is a name + a bit range per layer. This is the
 * knowledge that makes a `.ns4p` decodable; the Decode Inspector overlays it on
 * the raw file to show what's known vs. still a gap.
 *
 * Ported so far: master (validated against the regression fixture), piano, and
 * the shared per-layer FX block. Organ and synth are mechanical transcriptions
 * of `makeMapOrgan()` / `makeMapSynth()` still to add — the Inspector itself is
 * the tool to verify each addition (diff a one-knob-apart pair, watch the bits).
 */

import { locToBit, bitToLoc } from './bits';

export type Ns4Group = 'm' | 'o' | 'p' | 'y';

export interface ParamLayer {
  begBit: number;
  endBit: number;
}

export interface Param {
  /** Stable id = layer-A location string (ns4maps convention). */
  id: string;
  name: string;
  group: Ns4Group;
  layers: ParamLayer[];
}

function numLayers(group: Ns4Group): number {
  if (group === 'o' || group === 'p') return 2;
  if (group === 'y') return 3;
  return 1;
}

/** Builder mirroring ns4maps.addParam(). Mutates `out`. */
function addParam(
  out: Param[],
  group: Ns4Group,
  groupOffset: number,
  layerOffset: number,
  beg: string,
  end: string,
  name: string,
): void {
  // ns4maps: organ FX is shared across both organ layers, so it's filed under
  // the single-layer master group.
  let g = group;
  let nm = name;
  if (group === 'o' && name.startsWith('FX')) {
    nm = `organ ${name}`;
    g = 'm';
  }

  const begBit0 = locToBit(beg);
  const id = bitToLoc(begBit0 + groupOffset);
  const endStr = end.trim() === '' ? beg : end;
  const n = numLayers(g);

  const layers: ParamLayer[] = [];
  for (let k = 0; k < n; k++) {
    const offset = k * layerOffset + groupOffset;
    layers.push({ begBit: begBit0 + offset, endBit: locToBit(endStr) + offset });
  }
  out.push({ id, name: nm, group: g, layers });
}

// bitsOffsetFX from ns4maps.py
const FX_OFFSET: Record<'o' | 'p' | 'y', number> = {
  o: -530 * 8,
  p: -438 * 8,
  y: 0,
};

/** The shared per-layer FX block (ns4maps.addParamsFX). */
function addParamsFX(out: Param[], grp: Ns4Group, go: number): void {
  const lo = 55 * 8;
  const fx: Array<[string, string, string]> = [
    ['705-1', '     ', 'FX mod 1 on/off'],
    ['705-2', '     ', 'FX mod 1 MST CLK on/off'],
    ['705-3', '706-1', 'FX mod 1 rate'],
    ['709-2', '709-8', 'FX mod 1 amount'],
    ['713-1', '713-4', 'FX mod 1 mode'],
    ['713-5', '     ', 'FX mod 2 on/off'],
    ['713-6', '714-4', 'FX mod 2 rate'],
    ['717-5', '718-3', 'FX mod 2 amount'],
    ['721-4', '721-7', 'FX mod 2 mode'],
    ['721-8', '     ', 'FX amp sim/EQ on/off'],
    ['722-1', '722-7', 'FX amp sim/EQ treb'],
    ['722-8', '723-6', 'FX amp sim/EQ mid'],
    ['723-7', '724-5', 'FX amp sim/EQ bass'],
    ['724-6', '725-4', 'FX amp sim/EQ freq'],
    ['728-5', '729-3', 'FX amp sim/EQ drive'],
    ['755-6', '756-1', 'FX amp sim/EQ mode'],
    ['732-8', '     ', 'FX comp on/off'],
    ['733-1', '733-7', 'FX comp amount'],
    ['733-8', '     ', 'FX comp response'],
    ['734-1', '     ', 'FX delay on/off'],
    ['734-3', '735-1', 'FX delay tempo'],
    ['741-6', '742-4', 'FX delay mix'],
    ['745-6', '     ', 'FX delay ping pong on/off'],
    ['746-1', '746-7', 'FX delay feedback'],
    ['749-8', '750-3', 'FX delay effects'],
    ['750-4', '     ', 'FX reverb on/off'],
    ['750-5', '751-3', 'FX reverb amount'],
    ['754-4', '754-5', 'FX reverb dark/bright'],
    ['754-6', '755-1', 'FX reverb type'],
  ];
  for (const [beg, end, name] of fx) addParam(out, grp, go, lo, beg, end, name);
}

/** ns4maps.makeMapMaster() — validated against the regression fixture. */
function makeMapMaster(out: Param[]): void {
  const g: Ns4Group = 'm';
  const go = 0;
  const lo = 0;
  const m: Array<[string, string, string]> = [
    ['009-1', '012-8', 'file type'],
    ['021-1', '021-8', 'file version'],
    ['013-6', '013-8', 'bank'],
    ['015-3', '015-8', 'location in bank'],
    ['025-1', '028-8', 'checksum'],
    ['050-1', '     ', 'split on/off'],
    ['050-2', '     ', 'KB zones 1-2 split point on/off'],
    ['050-3', '     ', 'KB zones 2-3 split point on/off'],
    ['050-4', '     ', 'KB zones 3-4 split point on/off'],
    ['050-5', '050-8', 'KB zones 1-2 split point'],
    ['051-1', '051-4', 'KB zones 2-3 split point'],
    ['051-5', '051-8', 'KB zones 3-4 split point'],
    ['052-8', '053-3', 'program transpose amount'],
    ['054-8', '     ', 'FX comp global on/off'],
    ['055-1', '     ', 'FX delay global on/off'],
    ['055-2', '     ', 'FX reverb global on/off'],
    ['084-5', '     ', 'organ section on/off'],
    ['084-6', '     ', 'piano section on/off'],
    ['084-7', '     ', 'synth section on/off'],
    ['085-3', '     ', 'which layer scene is active'],
    ['088-4', '     ', 'FX on/off'],
    ['104-1', '     ', 'organ rotary spkr on/off'],
    ['105-5', '106-3', 'rotary spkr drive'],
    ['110-3', '111-1', 'organ vib/chorus type'],
  ];
  for (const [beg, end, name] of m) addParam(out, g, go, lo, beg, end, name);
}

/** ns4maps.makeMapPiano() (subset) + shared FX. */
function makeMapPiano(out: Param[]): void {
  const g: Ns4Group = 'p';
  const go = 0;
  // layer on/off block (layerOffset -1)
  addParam(out, g, go, -1, '230-3', '     ', 'layer on/off');
  addParam(out, g, go, -1, '230-6', '     ', 'layer on/off (scene II)');
  // volume block (layerOffset 31)
  addParam(out, g, go, 31, '230-7', '231-5', 'volume');
  // main piano block (layerOffset 12*8)
  const lo = 12 * 8;
  const p: Array<[string, string, string]> = [
    ['243-1', '243-4', 'KB zones'],
    ['243-5', '243-8', 'octave shift'],
    ['244-3', '244-5', 'piano type'],
    ['244-6', '245-2', 'piano model slot'],
    ['245-5', '249-4', 'piano model ID/name'],
    ['249-8', '250-1', 'touch'],
    ['250-2', '250-3', 'unison level'],
    ['250-7', '251-1', 'timbre'],
  ];
  for (const [beg, end, name] of p) addParam(out, g, go, lo, beg, end, name);
  addParamsFX(out, g, FX_OFFSET.p);
}

/** Build the full (currently partial) parameter map. */
export function buildParamMap(): Param[] {
  const out: Param[] = [];
  makeMapMaster(out);
  makeMapPiano(out);
  // TODO(port): makeMapOrgan(), makeMapSynth() — mechanical transcription from
  // ns4maps.py. Until then organ/synth bits show as gaps in the Inspector,
  // which is exactly the to-do list.
  return out;
}
