/**
 * Stage 4 → the shared effects panel. Every piano / synth layer has its own
 * chain (Mod 1, Mod 2, Amp/EQ, Comp, Delay, Reverb); the organ has one chain
 * for both layers, ending in the rotary. Each unit carries every decoded
 * setting, not a one-line summary.
 */
import { parseHz } from '../clavia/curves';
import { fxFill, fxKnobs } from '../clavia/fw-present';
import { mergeEqualChains, type FxGroupView, type FxPanelView, type FxParamView, type FxUnitView } from '../clavia/fx-view';
import { fxTypeName, noteValueName } from './fx-names';
import type { Morphable, NS4Layer, NS4Program, Ns4FxMod, Ns4OrganFx } from './types';
import { activeLayers, engineKindName, morphMarks } from './view';

type Amp = NS4Layer['ampSimEq'];
type Comp = NS4Layer['comp'];
type Delay = NS4Layer['delay'];
type Reverb = NS4Layer['reverb'];

/** Knob position of a plain 0–10 panel value ("3.8" → 38); undefined for anything else ("1/8", "484 ms"). */
function fill10(v: string | undefined): number | undefined {
  if (v === undefined || !/^\d+(\.\d+)?$/.test(v.trim())) return undefined;
  return fxFill(parseFloat(v), 0, 10);
}

/** A readout from a plain string; undefined when the field is not decoded or reads "none" / "off" (nothing is set). */
function sp(label: string, v: string | undefined): FxParamView | undefined {
  if (v === undefined || v === '' || v === 'none' || v === 'off') return undefined;
  return { label, value: v, fill: fill10(v) };
}

/** A readout from a morphable value; `text` overrides what is printed (a note value in words). */
function mp(label: string, m: Morphable<string> | undefined, text?: string): FxParamView | undefined {
  if (!m || m.value === undefined || m.value === '') return undefined;
  return { label, value: text ?? m.value, fill: fill10(m.value), morph: morphMarks(m) };
}

const db = (s?: string) => parseFloat(s ?? '') || 0;

function modUnit(key: string, label: string, m: Ns4FxMod | undefined): FxUnitView {
  return {
    key, label, on: !!m?.on, type: fxTypeName(m?.mode),
    params: fxKnobs(mp('Rate', m?.rate, noteValueName(m?.rate?.value)), mp('Amount', m?.amount)),
    switches: [{ label: 'Mst Clk', on: !!m?.masterClock }],
  };
}

function ampUnit(key: string, a: Amp): FxUnitView {
  // Amp model "off" leaves the slot as an EQ: say that instead of printing "off" on a lit effect.
  const eqOnly = a?.mode === 'off';
  const midHz = parseHz(a?.freq?.value);
  return {
    key, label: 'Amp/EQ', on: !!a?.on, type: eqOnly ? 'EQ only' : fxTypeName(a?.mode),
    params: fxKnobs(
      eqOnly ? undefined : mp('Drive', a?.drive),
      sp('Bass', a?.bass), sp('Mid', a?.mid), mp('Mid Freq', a?.freq), sp('Treble', a?.treb),
    ),
    eq: a && midHz !== undefined ? { bassDb: db(a.bass), midDb: db(a.mid), trebDb: db(a.treb), midHz } : undefined,
  };
}

function compUnit(key: string, c: Comp): FxUnitView {
  return { key, label: 'Comp', on: !!c?.on, params: fxKnobs(sp('Amount', c?.amount), sp('Response', c?.response)) };
}

function delayUnit(key: string, d: Delay): FxUnitView {
  return {
    key, label: 'Delay', on: !!d?.on,
    params: fxKnobs(
      mp('Tempo', d?.tempo, noteValueName(d?.tempo?.value)), mp('Mix', d?.mix), mp('Feedback', d?.feedback),
      sp('Filter', d?.filterType), sp('FB FX', d?.effects),
    ),
    switches: [
      { label: 'Ping Pong', on: !!d?.pingPong }, { label: 'Analog', on: !!d?.analog }, { label: 'Mst Clk', on: !!d?.masterClock },
    ],
  };
}

function reverbUnit(key: string, r: Reverb): FxUnitView {
  return { key, label: 'Reverb', on: !!r?.on, type: fxTypeName(r?.type), params: fxKnobs(mp('Amount', r?.amount), sp('Tone', r?.tone)) };
}

/** The rotary speaker: its speed as the type, drive, and where the rotor parks. */
export function rotaryUnit(r: Ns4OrganFx['rotary']): FxUnitView {
  return {
    // "stop" is the stop mode switch (parse.ts: "rotary spkr stop on/off"): it swaps
    // the slow speed for a parked rotor. A fast rotor spins either way.
    key: 'org-rotary', label: 'Rotary', on: !!r?.on, type: r?.fast ? 'Fast' : r?.stop ? 'Stop' : 'Slow',
    params: fxKnobs(sp('Drive', r?.drive), sp('Stop Pos', r?.stopPosition)),
    switches: [{ label: 'Stop Mode', on: !!r?.stop }],
  };
}

/** The six slots of a chain in signal order, on or off. A layer and the organ's shared chain store the same six. */
function chain(tag: string, c: {
  mod1?: Ns4FxMod; mod2?: Ns4FxMod; ampSimEq?: Amp; comp?: Comp; delay?: Delay; reverb?: Reverb;
}): FxUnitView[] {
  return [
    modUnit(`${tag}-mod1`, 'Mod 1', c.mod1),
    modUnit(`${tag}-mod2`, 'Mod 2', c.mod2),
    ampUnit(`${tag}-amp`, c.ampSimEq),
    compUnit(`${tag}-comp`, c.comp),
    delayUnit(`${tag}-delay`, c.delay),
    reverbUnit(`${tag}-reverb`, c.reverb),
  ];
}

/** A piano / synth layer's whole chain in signal order, on or off. */
export function layerFxUnits(l: NS4Layer): FxUnitView[] {
  return chain(`${l.kind ?? 'x'}${l.id}`, { ...l, mod1: l.fxMod1, mod2: l.fxMod2 });
}

/** The organ's one chain, shared by both organ layers: the same six slots as a layer. */
export function organFxUnits(o: Ns4OrganFx): FxUnitView[] {
  return chain('org', o);
}

/** A piano / synth layer whose Amp/EQ is on and set to "To rotary" plays through the organ's rotary. */
const sentToRotary = (l: NS4Layer) => !!l.ampSimEq?.on && l.ampSimEq.mode === 'TO ROTARY';

/**
 * The program's effect rows for one scene: when an organ layer plays, the
 * organ's chain and then the rotary on a row of its own (so every chain has the
 * same six columns); then a row per playing piano / synth layer. With no organ
 * playing, the rotary still gets its row when a layer is sent into it
 * (the maintainers’ notes, Amp type "To Rotary").
 */
export function fxGroups(p: NS4Program, scene?: 'I' | 'II'): FxGroupView[] {
  const layers = activeLayers(p, scene);
  const perLayer: FxGroupView[] = layers.filter((l) => l.kind === 'piano' || l.kind === 'synth').map((l) => ({
    key: `${l.kind}${l.id}`,
    label: `${engineKindName(l)} ${l.id}`,
    kind: l.kind as 'piano' | 'synth',
    units: layerFxUnits(l),
  }));
  if (!p.organFx) return perLayer;
  const rotary: FxGroupView = { key: 'rotary', label: 'Rotary', kind: 'organ', units: [rotaryUnit(p.organFx.rotary)] };
  if (layers.some((l) => l.kind === 'organ')) {
    return [{ key: 'organ', label: 'Organ', kind: 'organ', units: organFxUnits(p.organFx) }, rotary, ...perLayer];
  }
  return layers.some(sentToRotary) ? [...perLayer, rotary] : perLayer;
}

/** The program's effects as the panel draws them: {@link fxGroups} with equal neighbouring chains merged. */
export function fxPanel(p: NS4Program, scene?: 'I' | 'II'): FxPanelView {
  return { groups: mergeEqualChains(fxGroups(p, scene)) };
}
