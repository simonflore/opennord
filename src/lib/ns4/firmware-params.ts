/**
 * Nord Stage 4 — what the firmware layout adds to the parameter map.
 *
 * `offset-map.generated.ts` (the ns4decode port) carries the ids every value table
 * is keyed on, so it stays the base of the map. The firmware layout
 * (`layout.generated.ts`, Stage 4 OS 1.66 registry FUN_c01a44c4) is the authority
 * on where a parameter sits. This file joins the two:
 *
 *  - {@link ns4FirmwareFixes}: parameters the port reads at the wrong place or width.
 *  - {@link ns4FirmwareParams}: parameters the port never claimed, derived from
 *    the layout so they can't drift from it.
 *
 * Both are built on first use, not at import: this module sits on the parse path.
 * See docs/STAGE4-COVERAGE.md ("Program body: fully accounted for").
 */
import { CBIN_BODY_OFFSET } from '../clavia/cbin';
import { fieldBodyBit, fieldValue, type FwField, type FwLayout } from '../clavia/block-chain';
import { hexId } from '../clavia/fw-present';
import { bitToLoc } from './bits';
import { NS4_LAYOUT } from './layout.generated';
import { NS4_OFFSET_MAP } from './offset-map.generated';
import { NS4_EXTRA_PARAMS } from './extra-params';
import type { Ns4Group, Param, ParamLayer } from './maps';

/** File bits of a layout field (the map counts bits from the file start). */
function fileBits(layout: FwLayout, f: FwField): ParamLayer {
  const begBit = CBIN_BODY_OFFSET * 8 + fieldBodyBit(layout, f);
  return { begBit, endBit: begBit + f.width - 1 };
}

// ── Corrections ──────────────────────────────────────────────────────────────
// The delay tempo is one 14-bit parameter (Edt_Effects_kDlyRateClkDiv) followed by
// three 15-bit morph deltas, stored as delta + 16383. The port reads the tempo as
// its top 7 bits and each morph as 8 bits. For the wheel that is the top 8 bits of
// the first delta, which drops morphs smaller than one tempo step; the After Touch
// and Ctrl Pedal rows it placed 8 and 16 bits after the wheel's instead of 15 and
// 30, so they read across delta boundaries ("20 ms" on every program without such a
// morph). All three rows read their whole delta here (`morphOf`).
const DELAY_TEMPO: Array<{ blocks: string[]; tempo: string; wheel: string; at: string; pedal: string }> = [
  { blocks: ['organFx'], tempo: '204-3', wheel: '206-1', at: '207-1', pedal: '208-1' },
  { blocks: ['pianoAFx', 'pianoBFx'], tempo: '296-3', wheel: '298-1', at: '299-1', pedal: '300-1' },
  { blocks: ['synthAFx', 'synthBFx', 'synthCFx'], tempo: '734-3', wheel: '736-1', at: '737-1', pedal: '738-1' },
];
const DELAY_TEMPO_KEY = 'dlyRateClkDiv';

export type Ns4ParamFix = Pick<Param, 'layers' | 'morphOf'>;

function buildFirmwareFixes(layout: FwLayout): Record<string, Ns4ParamFix> {
  const byKey = new Map(layout.fields.map((f) => [f.key, f]));
  const fixes: Record<string, Ns4ParamFix> = {};
  for (const { blocks, tempo, wheel, at, pedal } of DELAY_TEMPO) {
    const base = blocks.map((b) => byKey.get(`${b}.${DELAY_TEMPO_KEY}`));
    for (const [id, source] of [[wheel, 'morphWheel'], [at, 'morphAfterTouch'], [pedal, 'morphCtrlPedal']]) {
      const deltas = blocks.map((b) => byKey.get(`${b}.${DELAY_TEMPO_KEY}.${source}`));
      // A layout without these keys keeps the port's reading (firmware-params.test.ts pins that they exist).
      if ([...base, ...deltas].some((f) => !f)) continue;
      fixes[id] = {
        layers: deltas.map((f) => fileBits(layout, f!)),
        morphOf: { baseId: tempo, base: base.map((f) => fileBits(layout, f!)), span: base[0]!.max - base[0]!.min, shift: 7 },
      };
    }
  }
  return fixes;
}

// ── Parameters the port never claimed ────────────────────────────────────────

type SettingKind = 'switch' | 'number' | 'bpm' | 'optional';
interface Setting {
  name: string;
  /**
   * How the value reads, or the firmware's own value labels in value order.
   * 'optional': 0 shows "--" and any other value shows as the number below it.
   */
  kind: SettingKind | readonly string[];
  since?: number;
}

/**
 * Program output buses, from the Output Routing menu. The firmware writes "Sub" and one of
 * the font glyphs 0xB0–0xB2, which draw as the Roman numerals I, II and III. Layers B and C
 * and the rotary have one more value, glyph 0x85, a left-pointing arrow: the layer shares
 * the output of the entry before it. The routing code (OS 1.66, the function at 0xc010b124)
 * resolves the seven outputs in the order organ, rotary, piano A, piano B, synth A, synth B,
 * synth C, and for the arrow value keeps what it resolved for the previous one. So the
 * rotary follows the organ, piano B follows piano A, synth B follows synth A, and synth C
 * follows synth B (and through it synth A, when B also follows).
 * These apply when the instrument's Output Routing Mode is Per Program, a system setting
 * that is not in the program file, so each row's name says which routing it is.
 */
const BUSES = ['Main', 'Sub I', 'Sub II', 'Sub III'] as const;
const sharedWith = (entry: string) => [...BUSES, `same as ${entry}`] as const;

/**
 * The firmware parameters a player sets, by layout key (`block.parameter`, or the
 * parameter alone where the block doesn't matter): the name shown, how the value
 * reads, and the format version that introduced it where the corpus shows one.
 * Everything else the layout holds outside the port stays in the map as `internal`:
 * identified (the decode inspector lists it), but either editor state, a link the
 * instrument resolves (preset positions and name hashes), or a value whose labels
 * have not been read from the firmware yet.
 *
 * Value labels are the firmware's own, read from OS 1.66. The menu builders (FUN_c0154278
 * for the system / sound menus, FUN_c01956c8 for the organ menu) construct each item with
 * its label, parameter id and an array of value strings (FUN_c00dde4c): Aux Keyboard
 * Layers (ids 357, 337, 249), Keyboard Curve (229), KBS (151), Rotary Type (224), the
 * output buses (88–94) and the Polyphonic Percussion switch (225). The Extern pages draw
 * their own text: Keyboard Velocity (384) indexes a Soft / Medium / Hard table
 * (FUN_c0123df8), and Program Change MSB / LSB (389, 388) print "--" for 0 and the value
 * minus one otherwise (FUN_c0123f24). The two glyphs in the bus values were read from the
 * 13-pixel menu font's own bitmaps (font header 0xc029e0ac: one u32 per pixel column).
 *
 * Traced and deliberately left internal:
 *  - the rotary rotor and horn angle (ids 221, 222) are not settings. When a program is
 *    stored the firmware copies the running rotary's rotor and horn position into them
 *    (the function at 0xc010127c), and on load it hands them back to the rotary only while
 *    the rotary is stopped (0xc010e214 → FUN_c02098a4, which shifts the 7-bit value into a
 *    32-bit phase: 128 steps per turn). They say where the speaker stood, not what the
 *    player chose; the stop position the player does choose is the port's own row.
 *  - `Edt_Syn_kLibName` (251) is registered and stored, but no code in OS 1.66 loads its
 *    id, and it is 0 in all 365 real files.
 *
 * `since`: over 365 real files, Aux keyboard is never set through format 3.09 and is
 * set in 47 of 155 files at 3.13; Layer Scene on the pedal is never set through 3.08.
 * Before that version the bits were reserved zeros, so the parameter is not shown.
 */
export const NS4_FIRMWARE_SETTINGS: Record<string, Setting> = {
  masterClockRate: { name: 'master clock tempo', kind: 'bpm' },
  masterClockKbdSync: { name: 'master clock keyboard sync', kind: ['Off', 'Soft', 'Hard'] },
  pdlTapEnable: { name: 'pedal tap tempo', kind: 'switch' },
  pdlLayerSceneEnable: { name: 'pedal layer scene', kind: 'switch', since: 309 },
  auxKbdEnable: { name: 'aux keyboard', kind: 'switch', since: 310 },
  auxKbdVelCurve: { name: 'aux keyboard curve', kind: ['Soft', 'Medium', 'Hard'] },
  'organ.auxKbdControl': { name: 'aux keyboard layers', kind: ['--', 'A-', '-B', 'AB'], since: 310 },
  'piano.auxKbdControl': { name: 'aux keyboard layers', kind: ['--', 'A-', '-B', 'AB'], since: 310 },
  'synth.auxKbdControl': {
    name: 'aux keyboard layers', kind: ['---', 'A--', '-B-', '--C', 'AB-', 'A-C', '-BC', 'ABC'], since: 310,
  },
  audioRoutingBusOrg: { name: 'organ output (per-program routing)', kind: BUSES },
  audioRoutingBusLeslie: { name: 'rotary output (per-program routing)', kind: [...sharedWith('organ'), 'Auto'] },
  audioRoutingBusPnoA: { name: 'piano A output (per-program routing)', kind: BUSES },
  audioRoutingBusPnoB: { name: 'piano B output (per-program routing)', kind: sharedWith('piano A') },
  audioRoutingBusSynA: { name: 'synth A output (per-program routing)', kind: BUSES },
  audioRoutingBusSynB: { name: 'synth B output (per-program routing)', kind: sharedWith('synth A') },
  audioRoutingBusSynC: { name: 'synth C output (per-program routing)', kind: sharedWith('synth B') },
  leslieMicDistance: { name: 'rotary type', kind: ['Ambient', 'Close'] },
  polyPercEnable: { name: 'polyphonic percussion', kind: 'switch' },
  multiLayerFlt: { name: 'multi-layer filter', kind: 'switch' },
  multiLayerLFO: { name: 'multi-layer LFO', kind: 'switch' },
  externVelCurve: { name: 'extern keyboard velocity', kind: ['Soft', 'Medium', 'Hard'] },
  externBCValue_MSB: { name: 'extern program change MSB', kind: 'optional' },
  externBCValue_LSB: { name: 'extern program change LSB', kind: 'optional' },
  externModWheelEnable: { name: 'extern mod wheel', kind: 'switch' },
  externAftertouchEnable: { name: 'extern aftertouch', kind: 'switch' },
  externCtrlPedalEnable: { name: 'extern control pedal', kind: 'switch' },
  externSwellPedalEnable: { name: 'extern swell pedal', kind: 'switch' },
  externVolPedalEnable: { name: 'extern volume pedal', kind: 'switch' },
  externSendOnLoad: { name: 'extern send on load', kind: 'switch' },
  externCCNumber1: { name: 'extern CC number 1', kind: 'number' },
  externCCNumber2: { name: 'extern CC number 2', kind: 'number' },
};

/** A layout block → the map's group, the layer it stands for, its part of the engine, and a name prefix. */
function placeOf(blockKey: string): { group: Ns4Group; layer: number; part: string; prefix: string } {
  const m = /^(organ|piano|synth)([ABC])(.*)$/.exec(blockKey);
  if (m) {
    const group = ({ organ: 'o', piano: 'p', synth: 'y' } as const)[m[1] as 'organ' | 'piano' | 'synth'];
    return { group, layer: 'ABC'.indexOf(m[2]), part: m[3], prefix: m[3] === 'Fx' ? 'FX ' : '' };
  }
  const prefix = ({ organ: 'organ ', organFx: 'organ FX ', piano: 'piano ', synth: 'synth ' } as
    Record<string, string>)[blockKey] ?? '';
  return { group: 'm', layer: 0, part: '', prefix };
}

/** The registry's abbreviations, spelled out (names of `internal` parameters, for the inspector). */
const WORDS: Record<string, string> = {
  org: 'organ', pno: 'piano', syn: 'synth', kbd: 'keyboard', cnt: 'count', vel: 'velocity',
  leslie: 'rotary', perc: 'percussion', vol: 'volume',
};

/** 'externBCValue_LSB' → 'extern BC value LSB', 'pnoPresetLayerCntA' → 'piano preset layer count A'. */
function humanize(k: string): string {
  return k
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\b[A-Za-z][a-z]+\b/g, (w) => WORDS[w.toLowerCase()] ?? w.toLowerCase());
}

function displayOf(f: FwField, kind: Setting['kind'] | undefined): (raw: number) => string {
  if (typeof kind === 'object') return (raw) => kind[fieldValue(raw, f)] ?? String(fieldValue(raw, f));
  if (kind === 'switch') return (raw) => (raw ? 'on' : 'off');
  if (kind === 'bpm') return (raw) => `${fieldValue(raw, f)} bpm`;
  if (kind === 'optional') return (raw) => (raw === 0 ? '--' : String(fieldValue(raw, f) - 1));
  if (f.enc === 'raw') return (raw) => (raw === 0 ? 'none' : hexId(raw));
  return (raw) => String(fieldValue(raw, f));
}

/**
 * Params for the layout fields that overlap nothing in `taken`. Exported for tests;
 * use {@link ns4FirmwareParams}.
 */
export function buildFirmwareParams(layout: FwLayout, taken: readonly ParamLayer[]): Param[] {
  const claimed = new Uint8Array((CBIN_BODY_OFFSET + layout.bodyBytes) * 8);
  for (const l of taken) if (l.begBit >= 0) claimed.fill(1, l.begBit, l.endBit + 1);
  const out = new Map<string, Param>();
  for (const f of layout.fields) {
    const [blockKey, k, morph] = f.key.split('.');
    if (morph) continue;
    const bits = fileBits(layout, f);
    // The map already reads this parameter, or a part of it.
    if (claimed.subarray(bits.begBit, bits.endBit + 1).includes(1)) continue;
    const { group, layer, part, prefix } = placeOf(blockKey);
    const setting = NS4_FIRMWARE_SETTINGS[`${blockKey}.${k}`] ?? NS4_FIRMWARE_SETTINGS[k];
    let name = prefix + (setting?.name ?? humanize(k));
    // Two blocks of one engine layer (a synth layer and its sound, say) can hold a
    // parameter of the same name: keep both, told apart by their part.
    if (out.get(`${group}:${name}`)?.layers[layer]) name += ` (${part ? part.toLowerCase() : 'layer'})`;
    const mapKey = `${group}:${name}`;
    let p = out.get(mapKey);
    if (!p) {
      // The ns4maps id convention: the location of the first layer seen.
      p = { id: bitToLoc(bits.begBit), name, group, layers: [], display: displayOf(f, setting?.kind) };
      if (setting?.since) p.since = setting.since;
      if (!setting) p.internal = true;
      out.set(mapKey, p);
    }
    p.layers[layer] = bits;
  }
  // A layer the port already reads leaves a hole; mark it absent like preset.ts does.
  for (const p of out.values()) {
    for (let i = 0; i < p.layers.length; i++) p.layers[i] ??= { begBit: -1, endBit: -1 };
  }
  return [...out.values()];
}

let _fixes: Record<string, Ns4ParamFix> | undefined;
let _params: Param[] | undefined;

/** Parameter id → what the firmware layout says about it, replacing the port's layers. */
export function ns4FirmwareFixes(): Record<string, Ns4ParamFix> {
  return (_fixes ??= buildFirmwareFixes(NS4_LAYOUT));
}

/** Firmware parameters outside the ns4decode port, in layout order. */
export function ns4FirmwareParams(): Param[] {
  return (_params ??= buildFirmwareParams(NS4_LAYOUT, [...NS4_OFFSET_MAP, ...NS4_EXTRA_PARAMS].flatMap((p) => p.layers)));
}
